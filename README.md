# HSLayers-NG monorepo

This is a monorepo for developing HSLayers-NG [Angular](https://angular.io/guide/creating-libraries) library. 

| Hslayers version | Angular version     | Bootstrap   | OpenLayers
| ---------------- | -----------------   |------------ |-----------
| 1                | 1.7                 | 4.5.3       |
| 2                | 1.7 + 9.1.x (hybrid)| >=4.4       |
| 3                | 9.x                 | 4.x         |
| 4                | 10.x                | 4.x         |
| 5                | 11.x                | 4.x         |
| 6                | 12.x                | 4.x         |
| 7                | 12.x                | 5.x         |
| 8                | 13.x                | 5.x         |
| 9                | 13.x                | 5.x         | ^6.14.1
| 10               | 14.x                | 5.x         | ^6.14.1, ^7.0.0
| 11               | 15.x                | 5.x         | 7.x
| 12               | 16.x                | 5.3         | 7.x
| 13               | 17.x                | 5.3         | ^8.2
| 14               | 17.x                | 5.2         | ^9.0

It contains source code of libraries which need to be used in an existing Angular based container project:
+ [hslayers](./projects/hslayers) - core components and services for map application based on OpenLayers + Angular + [Bootstrap](https://getbootstrap.com/),
+ [hslayers-cesium](./projects/hslayers-cesium) - Angular components for running HSLayers-NG UI with [Cesium](https://cesium.com/cesiumjs/) 3D map renderer,
+ [hslayers-sensors](./projects/hslayers-sensors) - Angular components for visualizing data from [Senslog](https://www.senslog.org/) server using [Vega](https://vega.github.io/vega/) charts.


Source code for ready to use application bundles which can be included in html files through `<script>` tags:
+ [hslayers-app](./projects/hslayers-app) - ready-to-use application built on HSLayers-NG,
+ [hslayers-cesium-app](./projects/hslayers-cesium-app) - ready-to-use application built on HSLayers-NG and Cesium.

Configuration for these applications can be provided through global `hslayersNgConfig` function which exposes an object containing a subset of most common [OpenLayers](https://openlayers.org/en/latest/apidoc/) classes through an `ol` parameter. In return the function must provide a JSON object conforming to [HsConfig](./projects/hslayers/src/config.service.ts) type. [See](https://github.com/hslayers/hslayers-ng/wiki/App-config-parameters) example and config parameter descriptions. 


## Back-end
HSLayers-NG can be used as a client-only single-page-application without any need for additional server components. But incorporating at least some unlocks some great features of HSLayers-NG. Here is the list of recommended server-side components:

+ **[hslayers-server](./projects/hslayers-server)** - a simple [cors-anywhere](https://www.npmjs.com/package/cors-anywhere) based proxy server which can be used to overcome [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) restrictions, fill API keys for services such as [Geonames](https://www.geonames.org/) used for search and other tasks. Copying and modifying the .env file to preserve secrets and not expose them for everyone and all kinds of requests will be necessary.
+ [Layman](https://github.com/LayerManager/layman) - geospatial data catalogue, map composition catalogue
+ [Micka](https://github.com/hsrs-cz/Micka) - metadata catalogue

## Integration
HSLayers-NG can be integrated into larger systems.
See [crx-hslayers](https://github.com/hslayers/crx-hslayers) for an actively maintained widget for Wagtail/CodeRed CMS. Check [hub4everybody.com](https://hub4everybody.com/) to see, what you can achieve with this integration.

## Development
### Development server

Run `ng serve` for a dev server which displays a simple hslayers based map portal with almost no map layers. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files. It's based on hslayers-app project contained in this repository.

### Build

Run `ng build` to build the HSLayers-NG library. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

### Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

### Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Cypress](https://docs.cypress.io/guides/tooling/IDE-integration).
