import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.shacomputec.gihmhis',
  appName: 'GIHM-HIS',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // Live reload: uncomment and set to your machine's LAN IP for on-device dev.
    // Find it with: ipconfig (Windows) or ifconfig (macOS/Linux)
    // url: 'http://192.168.x.x:5173',
    // cleartext: true,
  },
  plugins: {
    Camera: {
      androidPermissions: ['android.permission.CAMERA'],
      iosPermissions: ['NSCameraUsageDescription'],
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#DC2626',
    },
    Filesystem: {},
    Network: {},
    Share: {},
    SplashScreen: {
      launchAutoHide: true,
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      backgroundColor: '#12203a',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#12203a',
    },
  },
  android: {
    allowMixedContent: true,
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
  },
  ios: {
    contentInset: 'automatic',
    scheme: 'GIHM-HIS',
  },
};

export default config;
