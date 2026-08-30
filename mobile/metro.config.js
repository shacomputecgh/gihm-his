/**
 * Metro configuration for GES-School-MIS Mobile
 *
 * @type {import('metro-config').MetroConfig}
 */
module.exports = {
  watchFolders: [__dirname],
  resolver: {
    extraNodeModules: {
      // Prevent duplicate React instances
      react: require.resolve("react"),
    },
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};
