# Hslayers-cesium

This library contains components to to run Hslayers-NG ui interface with Cesium 3D as the map renderer instead of OpenLayers.
See [example](https://github.com/hslayers/examples/tree/master/cesium)

## Installation

```
npm i cesium @types/cesium hslayers-cesium
```

## Usage

Import HsCesiumModule and add it to your AppModules imports:

```
import {HsCesiumModule} from 'hslayers-cesium';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, HslayersModule, HsCesiumModule],

```

In your component attach the HslayersCesiumComponent to HSlayers-NG:

```
 constructor(
    public hsCesiumConfig: HsCesiumConfig,
    private hsLayoutService: HsLayoutService
  ) {
    ...  
ngOnInit(): void {
    this.hsLayoutService.mapSpaceRef.subscribe((mapSpace) => {
      if (mapSpace?.viewContainerRef) {
        mapSpace.viewContainerRef.createComponent(HslayersCesiumComponent);
      }
    });
  }
```

Set path to cesium assets in hsCesiumConfig:

```
    this.hsCesiumConfig.update({
      cesiumBase: 'assets/cesium/',
```

In your angular.json file copy cesium assets to the previously mentioned directory (See [example](https://github.com/hslayers/examples/blob/master/angular.json)):

```
 "assets": [
              {
                "glob": "**/*",
                "input": "./node_modules/hslayers-ng/assets",
                "output": "./assets/hslayers-ng/"
              },    
              {
                "glob": "**/*",
                "input": "./node_modules/cesium/Source/Assets",
                "output": "./assets/cesium/Assets"
              },
              {
                "glob": "**/*",
                "input": "./node_modules/cesium/Source/Widgets",
                "output": "./assets/cesium/Widgets"
              },
              {
                "glob": "**/*",
                "input": "./node_modules/cesium/Source/Workers",
                "output": "./assets/cesium/Workers"
              }
            ],
            "styles": [
              "node_modules/ol/ol.css",
              "node_modules/cesium/Build/Cesium/Widgets/widgets.css"
            ],
```

Use custom-webpack builder which is needed for Cesium

In angular.json

```
  "architect": {
        "build": {
          "builder": "@angular-builders/custom-webpack:browser",
          "options": {
            "customWebpackConfig": {
              "path": "custom-webpack.config.js"
            }
        ...
        "serve": {
          "builder": "@angular-builders/custom-webpack:dev-server",    
```


custom-webpack.config.js contents:

```
module.exports = {
  node: {
    // Resolve node module use of fs
    fs: 'empty',
    Buffer: false,
    http: 'empty',
    https: 'empty',
    zlib: 'empty',
  },
  module: {
    unknownContextCritical: false,
  },
};
```
