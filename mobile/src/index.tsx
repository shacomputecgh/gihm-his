import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import * as Network from "expo-network";
import * as SecureStore from "expo-secure-store";
import * as FileSystem from "expo-file-system";
import Constants from "expo-constants";

// ── Configuration ──────────────────────────────────────────────

const CONFIG = {
  /** Production API base URL — swap to your server */
  apiUrl:
    (Constants.expoConfig?.extra as Record<string, string>)?.apiUrl ||
    "https://gihm.vercel.app",

  /** Offline cache TTL in seconds (default 24 hours) */
  offlineCacheTtl:
    Number((Constants.expoConfig?.extra as Record<string, string>)?.offlineCacheTtl) ||
    86400,

  /** Maximum retry attempts for the offline mutation queue */
  maxRetries: 3,

  /** Key used to persist the mutation queue in SecureStore */
  mutationQueueKey: "ges-mis-mutation-queue",

  /** Key for storing the last-sync timestamp */
  lastSyncKey: "ges-mis-last-sync",
};

// ── Types ──────────────────────────────────────────────────────

interface PendingMutation {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  timestamp: number;
  retries: number;
}

// ── Offline Cache (TTL-based) ─────────────────────────────────

async function getCachedPage(url: string): Promise<string | null> {
  try {
    const cacheKey = `cache-${btoa(url)}`;
    const cached = await FileSystem.readAsStringAsync(
      `${FileSystem.cacheDirectory}${cacheKey}.json`
    );
    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;
    if (age < CONFIG.offlineCacheTtl * 1000) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

async function setCachedPage(url: string, html: string): Promise<void> {
  try {
    const cacheKey = `cache-${btoa(url)}`;
    await FileSystem.writeAsStringAsync(
      `${FileSystem.cacheDirectory}${cacheKey}.json`,
      JSON.stringify({ data: html, timestamp: Date.now() })
    );
  } catch {
    // Silently fail — cache is best-effort
  }
}

// ── Mutation Queue ─────────────────────────────────────────────

async function loadMutationQueue(): Promise<PendingMutation[]> {
  try {
    const raw = await SecureStore.getItemAsync(CONFIG.mutationQueueKey);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveMutationQueue(queue: PendingMutation[]): Promise<void> {
  await SecureStore.setItemAsync(CONFIG.mutationQueueKey, JSON.stringify(queue));
}

async function enqueueMutation(mutation: Omit<PendingMutation, "id" | "timestamp" | "retries">) {
  const queue = await loadMutationQueue();
  queue.push({
    ...mutation,
    id: `mut-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    retries: 0,
  });
  await saveMutationQueue(queue);
}

async function replayMutuations(): Promise<number> {
  const queue = await loadMutationQueue();
  const failed: PendingMutation[] = [];
  let successCount = 0;

  for (const mut of queue) {
    try {
      const response = await fetch(mut.url, {
        method: mut.method,
        headers: { "Content-Type": "application/json", ...mut.headers },
        body: mut.body,
      });
      if (response.ok) {
        successCount++;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch {
      mut.retries++;
      if (mut.retries < CONFIG.maxRetries) {
        failed.push(mut);
      }
      // else: drop after max retries
    }
  }

  await saveMutationQueue(failed);
  return successCount;
}

// ── Main Component ─────────────────────────────────────────────

export default function WebViewScreen() {
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Network status
  useEffect(() => {
    const checkNetwork = async () => {
      const status = await Network.getNetworkStateAsync();
      setIsConnected(status.isConnected ?? true);
    };
    checkNetwork();
    const interval = setInterval(checkNetwork, 10000);
    return () => clearInterval(interval);
  }, []);

  // Replay mutation queue when back online
  useEffect(() => {
    if (isConnected) {
      replayMutuations().then((count) => {
        if (count > 0) {
          console.log(`[GES-MIS] Replayed ${count} queued mutations`);
        }
      });
    }
  }, [isConnected]);

  // Android back button
  useEffect(() => {
    const handler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (webViewRef.current?.canGoBack) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    });
    return () => handler.remove();
  }, []);

  // Handle messages from the web app
  const onMessage = useCallback(async (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      switch (data.type) {
        case "MUTATION":
          // Queue write operations for offline replay
          await enqueueMutation({
            url: data.url,
            method: data.method || "POST",
            headers: data.headers || {},
            body: data.body || "",
          });
          break;

        case "CACHE_PAGE":
          // Cache a page for offline reading
          if (data.url && data.html) {
            await setCachedPage(data.url, data.html);
          }
          break;

        case "GET_CACHED_PAGE":
          // Return cached page to the web app
          if (data.url) {
            const cached = await getCachedPage(data.url);
            webViewRef.current?.postMessage(
              JSON.stringify({ type: "CACHED_PAGE", url: data.url, html: cached })
            );
          }
          break;
      }
    } catch (err) {
      console.warn("[GES-MIS] Message handler error:", err);
    }
  }, []);

  // Inject offline support bridge JS
  const injectedJavaScript = `
    (function() {
      // Override fetch to intercept write operations for offline queue
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        const [url, options] = args;
        if (options && options.method && !['GET','HEAD'].includes(options.method.toUpperCase())) {
          // Post mutation to React Native for queuing
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'MUTATION',
            url: typeof url === 'string' ? url : url.url,
            method: options.method,
            headers: options.headers || {},
            body: options.body || ''
          }));
        }
        return originalFetch.apply(this, args);
      };

      // Expose offline cache bridge
      window.GESOffline = {
        getCachedPage: function(url) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'GET_CACHED_PAGE', url
          }));
        },
        cachePage: function(url, html) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'CACHE_PAGE', url, html
          }));
        }
      };

      console.log('[GES-MIS] Offline bridge injected');
    })();
    true;
  `;

  const handleLoadStart = () => setIsLoading(true);
  const handleLoadEnd = () => {
    setIsLoading(false);
    setLoadError(null);
  };
  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    setLoadError(nativeEvent?.description || "Failed to load");
  };

  const handleRetry = () => {
    setLoadError(null);
    webViewRef.current?.reload();
  };

  const source = { uri: CONFIG.apiUrl };

  return (
    <View style={styles.container}>
      {/* Network indicator */}
      {!isConnected && (
        <View style={styles.offlineBar}>
          <Text style={styles.offlineText}>
            ⚡ Offline Mode — Changes will sync when connected
          </Text>
        </View>
      )}

      {/* Error state */}
      {loadError && !isConnected ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>📡</Text>
          <Text style={styles.errorTitle}>No Internet Connection</Text>
          <Text style={styles.errorSubtitle}>
            Please check your network and try again.
          </Text>
          <Text style={styles.retryButton} onPress={handleRetry}>
            Tap to Retry
          </Text>
        </View>
      ) : (
        <WebView
          ref={webViewRef}
          source={source}
          style={styles.webview}
          injectedJavaScript={injectedJavaScript}
          onMessage={onMessage}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#DC2626" />
              <Text style={styles.loadingText}>Loading GIHM-HIS…</Text>
            </View>
          )}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          allowFileAccess={true}
          allowUniversalAccessFromFileURLs={true}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          mixedContentMode="always"
          // WebView settings
          cacheEnabled={true}
          cacheMode="LOAD_DEFAULT"
          allowFileAccessFromFileURLs={true}
          // Android-specific
          onShouldStartLoadWithRequest={(request) => {
            // Open external links in the system browser
            if (!request.url.startsWith(CONFIG.apiUrl) &&
                !request.url.startsWith("http://localhost")) {
              Linking.openURL(request.url);
              return false;
            }
            return true;
          }}
        />
      )}

      {/* Loading bar */}
      {isLoading && !loadError && (
        <View style={styles.loadingBar}>
          <View style={styles.loadingBarInner} />
        </View>
      )}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#12203a",
  },
  webview: {
    flex: 1,
    backgroundColor: "#12203a",
  },
  offlineBar: {
    backgroundColor: "#DC2626",
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  offlineText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#12203a",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#8899aa",
    marginTop: 12,
    fontSize: 14,
  },
  loadingBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "rgba(220,38,38,0.2)",
  },
  loadingBarInner: {
    height: "100%",
    width: "60%",
    backgroundColor: "#DC2626",
    // Simple animation via CSS would be better; this is a static placeholder
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#12203a",
    padding: 40,
  },
  errorEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  errorSubtitle: {
    color: "#8899aa",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    color: "#DC2626",
    fontSize: 16,
    fontWeight: "600",
    padding: 12,
  },
});
