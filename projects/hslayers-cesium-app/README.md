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

A global hslayersNgConfig function, which returns a configuration object, NEEDS TO BE CREATED BEFORE loading the main.js script. It returns a JSON object that describes the application's looks, behavior and data to display. See [Configuration options](https://github.com/hslayers/hslayers-ng/wiki/Config-parameters) for the list of available config options. HSLayers-ng exposes OpenLayers as global 'ol' variable, which is used in defining layers and configuration. [Example](https://github.com/hslayers/examples/blob/master/cesium/appexternal.js)

```
<script>
    function hslayersNgConfig(ol) {
      return {
        assetsPath: 'node_modules/hslayers-cesium-app/assets/',
        cesiumBase: 'node_modules/hslayers-cesium-app/assets/cesium/',
        default_layers: [],

        default_view: new ol.View({
          center: ol.proj.fromLonLat([17.474129, 52.574000]),
          zoom: 4,
          units: "m"
        })
      }
    } 
  </script>
  ```