import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

// Keep the splash screen visible while we initialise
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Hide splash once the layout is mounted
    SplashScreen.hideAsync();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#12203a" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#12203a" },
          animation: "fade",
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#12203a",
  },
});
