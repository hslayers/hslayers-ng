# HSlayers-NG monorepo

This is a monorepo for developing Hslayers-NG Angular library. 

It contains source code of libraries which need to be used in an existing Angular 9 based container project:
+ hslayers - core components and services for map application based on HslayersNG + Angular 9 + Bootstrap
+ hslayers-cesium - Angular components for running Hslayers-ng UI with Cesium 3D map renderer
+ hslayers-sensors - Angular components for visualizing data from Senslog server using Vega charts

Source code for ready to use application bundles which can be included in html files through `<script>` tags:
+ hslayers-app
+ hslayers-cesium-app 

Server components:
+ hslayers-proxy - a simple cors-anywhere based proxy server which can be used to overcome CORS restrictions, fill API keys for requests and other tasks.

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 9.1.12.

## Development server

Run `ng serve` for a dev server which displays a simple hslayers based map portal with almost no map layers. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files. It's based on hslayers-app project contained in this repository.

## Build

Run `ng build` to build the hslayers-ng library. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

Run `ng build`

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).
