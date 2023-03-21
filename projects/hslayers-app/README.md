## Installation

```
npm install hslayers-ng-app
```

Create empty html page and include `<hslayers-app></hslayers-app>` Where you want the map to appear.

Include hslayers-ng styles in page `<head>`:
```
<link rel="stylesheet" href="node_modules/hslayers-ng-app/styles.css">
```

Include hslayers-ng-app bundle scripts:
```
<script src="node_modules/hslayers-ng-app/runtime.js"></script>
<script src="node_modules/hslayers-ng-app/polyfills-es5.js"></script>
<script src="node_modules/hslayers-ng-app/polyfills.js"></script>
<script src="node_modules/hslayers-ng-app/vendor.js"></script><!-- Must be included since 4.x -->
<script src="node_modules/hslayers-ng-app/main.js"></script>
```

## Configuration

A global hslayersNgConfig function, which returns a configuration object, NEEDS TO BE CREATED BEFORE loading the main.js script (insert it before the bundle script in the html). It returns a JSON object that describes the application's looks, behavior and data to display. See [Configuration options](https://github.com/hslayers/hslayers-ng/wiki/Config-parameters) for the list of available config options. HSLayers-ng exposes OpenLayers as global 'ol' variable, which is used in defining layers and configuration.

```
<script>
    function hslayersNgConfig(ol) {
      return {
        assetsPath: 'node_modules/hslayers-ng-app/assets/',
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
        })
      }
    } 
  </script>
  ```

  ### Multiple apps setup

  Bulit-in option for bootstraping multiple app instances can be utilized by simply creating (and styling) desired number of `hslayers-app` elements including with `id`s 
  ```
  <html>
  ...
    <hslayers-app id="app-a"></hslayers-app>
    <hslayers-app id="app-b"></hslayers-app>
  ...
  </html>
  ```
and creating hslayersNgConfig function which name would include corresponding id string such as
```
<script>
    function hslayersNgConfigapp-a(ol) {
      ...
    } 
  </script>
```
In case no exact match between app id and config name was found app tries to call default function eg. hslayersNgConfig
