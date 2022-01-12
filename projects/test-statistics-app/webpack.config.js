const ModuleFederationPlugin = require("webpack/lib/container/ModuleFederationPlugin");
const mf = require("@angular-architects/module-federation/webpack");
const path = require("path");
const share = mf.share;

const sharedMappings = new mf.SharedMappings();
sharedMappings.register(
  path.join(__dirname, './tsconfig.app.json'),
  []);

  console.log(sharedMappings.getAliases());
module.exports = {
  output: {
    uniqueName: "statistics",
    publicPath: "auto"
  },
  optimization: {
    runtimeChunk: false
  },   
  resolve: {
    alias: {
      ...sharedMappings.getAliases(),
    }
  },
  experiments: {
    outputModule: true
  },
  plugins: [
    new ModuleFederationPlugin({
        library: { type: "module" },

        // For remotes (please adjust)
        name: "statistics",
        filename: "remoteEntry.js",
        exposes: {
            './HsStatisticsPanelComponent': './projects/test-statistics-app/src/lib/statistics-panel.component.ts',
        },        

        shared: share({
          "@angular/core": { singleton: true, strictVersion: true, requiredVersion: 'auto' }, 
          "@angular/common": { singleton: true, strictVersion: true, requiredVersion: 'auto' }, 
          "@angular/forms": { singleton: true, strictVersion: true, requiredVersion: 'auto' }, 
          "@angular/common/http": { singleton: true, strictVersion: true, requiredVersion: 'auto' }, 
          "@ngx-translate/core": { singleton: true, strictVersion: true , requiredVersion: '^14.0.0'},
          "rxjs": { singleton: true }, 
          "hslayers-ng": { singleton: true }, 
          "ol": { singleton: true }, 
          ...sharedMappings.getDescriptors()
        })
        
    }),
    sharedMappings.getPlugin()
  ],
};
