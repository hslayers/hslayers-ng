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

Built-in option for bootstrapping multiple app instances can be utilized by simply creating (and styling) desired number of `hslayers-app` elements including with `id`s

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

In case no exact match between app id and config name is found, the app tries to call default function i.e. `hslayersNgConfig`

## External API and events

After the app has finished initializing, it exposes a small API to the host page and dispatches a CustomEvent so you can hook into the map without touching the Angular app directly.

### `hslayers.app.loaded` event

The app dispatches a `CustomEvent` on `window` when it is ready:

- **Event name:** `hslayers.app.loaded`
- **Detail:**
  - `element` – the host DOM element (`<hslayers-app>`)
  - `api` – an object implementing `HslayersNgExternalApi` (see below)

Example:

```javascript
window.addEventListener("hslayers.app.loaded", function (ev) {
  const { element, api } = ev.detail;
  // e.g. toggle a layer by title
  const layer = api.getLayerByTitle("OpenStreetMap");
  if (layer) api.changeLayerVisibility(layer, false);
});
```

### Global API reference

The same API is also attached to `window` for direct access:

- Single app: `window.hslayersNg`
- Multiple apps (with `id` on `<hslayers-app>`): `window.hslayersNg{id}` (e.g. `window.hslayersNgapp-a`)

### API surface (`HslayersNgExternalApi`)

| Method / property                                 | Description                                            |
| ------------------------------------------------- | ------------------------------------------------------ |
| `changeLayerVisibility(layerDescriptor, visible)` | Show or hide a layer by its descriptor.                |
| `getLayerByTitle(title)`                          | Get a layer descriptor by title, or `undefined`.       |
| `eventBus`                                        | `HsEventBusService` – subscribe to or emit app events. |
| `getMap()`                                        | Returns the OpenLayers `Map` instance.                 |
