## Installation

```
npm install hslayers-cesium-app
```

Create empty html page and include `<hslayers-cesium-app></hslayers-cesium-app>` Where you want the map to appear (See [example](https://github.com/hslayers/examples/blob/master/cesium/index_external.html)).

Include HSLayers-NG styles in page `<head>`:
```
<link rel="stylesheet" href="node_modules/hslayers-cesium-app/styles.css">
```

Include hslayers-cesium-app bundle scripts after `<hslayers-cesium-app>`:
```
<script src="node_modules/hslayers-cesium-app/runtime.js"></script>
<script src="node_modules/hslayers-cesium-app/polyfills-es5.js"></script>
<script src="node_modules/hslayers-cesium-app/polyfills.js"></script>
<script src="node_modules/hslayers-cesium-app/vendor.js"></script><!-- Must be included since 4.x -->
<script src="node_modules/hslayers-cesium-app/main.js"></script>
```

## Configuration

A global hslayersNgConfig function and cesium specific hslayersCesiumConfig, which return a configuration objects, NEED TO BE CREATED BEFORE loading the main.js script. Functions return a JSON objects that describes the application's look, behavior and data to display. See [Hslayers configuration options](https://github.com/hslayers/hslayers-ng/wiki/Config-parameters) and [Cesium configuration options](https://github.com/hslayers/hslayers-ng/wiki/Cesium-config-parameters) for the list of available config options. HSLayers-ng exposes OpenLayers as global 'ol' variable, which is used in defining layers and configuration. [Example](https://github.com/hslayers/examples/blob/master/cesium/appexternal.js)

```
<script>
    function hslayersNgConfig(ol) {
      return {
        assetsPath: 'node_modules/hslayers-cesium-app/assets/',
        default_layers: [],

        default_view: new ol.View({
          center: ol.proj.fromLonLat([17.474129, 52.574000]),
          zoom: 4,
        })
      }
    } 

    function hslayersCesiumConfig() {
        return {
          cesiumBase: 'node_modules/hslayers-cesium-app/assets/cesium/',
        };
      }
  </script>
  ```