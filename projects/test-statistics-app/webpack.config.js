const { shareAll, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');

module.exports = withModuleFederationPlugin({
  name: 'statistics',

  exposes: {
    './HsStatisticsPanelComponent': './projects/test-statistics-app/src/lib/statistics-panel.component.ts',
  },

  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
  },

  sharedMappings: ['hslayers-ng'],

});