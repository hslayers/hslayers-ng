## Installation

```
npm install hslayers-ng-app
```

Create empty html page and include `<hslayers-app></hslayers-app>` Where you want the map to appear.

Include hslayers styles in page `<head>`:
`<link rel="stylesheet" href="node_modules/hslayers-ng-app/styles.css">`

Include hslayers-app bundle scripts after `<hslayers-app>`:
```
<script src="node_modules/hslayers-ng-app/runtime.js" defer></script><script src="node_modules/hslayers-ng-app/polyfills-es5.js" nomodule defer></script><script src="node_modules/hslayers-ng-app/polyfills.js" defer></script><script src="node_modules/hslayers-ng-app/main.js" defer></script>
```

## Configuration

A global hslayersNgConfig function, which returns a configuration object, NEEDS TO BE CREATED BEFORE loading the hslayers-ng.js script (insert it before the bundle script in the html). It returns a JSON object that describes the application's looks, behavior and data to display. See [Configuration options](https://github.com/hslayers/hslayers-ng/wiki/Config-parameters) for the list of available config options. HSLayers exposes OpenLayers as global 'ol' variable, which is used in defining layers and configuration.

```
<script>
    function hslayersNgConfig(ol) {
      return {
        default_layers: [
          new ol.layer.Tile({
            source: new ol.source.OSM(),
            title: "OpenStreetMap",
            base: true,
            visible: true,
            removable: false
          })
        ],

        default_view: new ol.View({
          center: ol.proj.fromLonLat([17.474129, 52.574000]),
          zoom: 4,
          units: "m"
        })
      }
    } 
  </script>
  ```