# HSLayers-NG monorepo

This is a monorepo for developing HSLayers-NG [Angular](https://angular.io/guide/creating-libraries) library. 

| Hslayers version | Angular version     | Bootstrap   |
| ---------------- | -----------------   |------------ |
| 1                | 1.7                 | 4.5.3       |
| 2                | 1.7 + 9.1.x (hybrid)| >=4.4       |
| 3                | 9.x                 | 4.x         |
| 4                | 10.x                | 4.x         |
| 5                | 11.x                | 4.x         |
| 6                | 12.x                | 4.x         |
| 7                | 12.x                | 5.x         |

It contains source code of libraries which need to be used in an existing Angular based container project:
+ [hslayers](./projects/hslayers) - core components and services for map application based on OpenLayers 6 + Angular + [Bootstrap](https://getbootstrap.com/)
+ [hslayers-cesium](./projects/hslayers-cesium) - Angular components for running HSLayers-NG UI with [Cesium](https://cesium.com/cesiumjs/) 3D map renderer
+ [hslayers-sensors](./projects/hslayers-sensors) - Angular components for visualizing data from [Senslog](https://www.senslog.org/) server using [Vega](https://vega.github.io/vega/) charts.


Source code for ready to use application bundles which can be included in html files through `<script>` tags:
+ [hslayers-app](./projects/hslayers-app)
+ [hslayers-cesium-app](./projects/hslayers-cesium-app) - Ready application built on HSLayers-NG and Cesium.

Configuration for these applications can be provided through global `hslayersNgConfig` function which exposes an object containing a subset of most common [OpenLayers](https://openlayers.org/en/latest/apidoc/) classes through ol parameter. In return the function must provide a JSON object conforming to [HsConfig](./projects/hslayers/src/config.service.ts) type. [See](https://github.com/hslayers/hslayers-ng/wiki/Config-parameters) example and config parameter descriptions. 


Server components:
+ [hslayers-server](./projects/hslayers-server) - a simple [cors-anywhere](https://www.npmjs.com/package/cors-anywhere) based proxy server which can be used to overcome [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) restrictions, fill API keys for services such as [geonames](https://www.geonames.org/) used for search and other tasks. Forking and modifying it to preserve secrets and not expose the proxy for everyone and all kinds of requests will be necessary.


## Development server

Run `ng serve` for a dev server which displays a simple hslayers based map portal with almost no map layers. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files. It's based on hslayers-app project contained in this repository.

## Build

Run `ng build` to build the HSLayers-NG library. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

Run `ng build`

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).
