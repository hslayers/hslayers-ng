# HSLayers-NG

HSLayers-NG is a library which extends OpenLayers functionality by providing a foundation to build map GUI and extra components such as layer manager, permalink generating, styling of vector features, including OpenGIS® Web Map Service Interface Standard (WMS) layers to the map in a user friendly way etc.


| Hslayers version | Angular version     | Bootstrap   | OpenLayers
| ---------------- | -----------------   |------------ |-----------
| 1                | 1.7                 | 4.5.3       |
| 2                | 1.7 + 9.1.x (hybrid)| >=4.4       |
| 3                | 9.x                 | 4.x         |
| 4                | 10.x                | 4.x         |
| 5                | 11.x                | 4.x         |
| 6                | 12.x                | 4.x         |
| 7                | 12.x                | 5.x         |
| 8                | 14.x                | 5.x         |
| 9                | 14.x                | 5.x         | ^6.14.1
| 10               | 14.x                | 5.x         | ^6.14.1, ^7.0.0
| 11               | 15.x                | 5.x         | 7.x
| 12               | 16.x                | 5.3         | 7.x
| 13               | 17.x                | 5.3         | ^8.2
| 14               | 18.x                | 5.3         | ^9.2.2
| 15               | 19.x                | 5.3         | ^10.4

## Demo

Check out the examples and live projects to get an idea:  
* http://ng.hslayers.org/examples/
* https://groundwater.smartagro.lv/fie/index.html
* https://www.smartafrihub.com/cs/map1/
* http://sdi4apps.eu/spoi
* (Material) https://atlasbestpractices.com/
* (Material) https://app.hslayers.org/agroinfo
* (3D) https://app.hslayers.org/project-agro-climatic/
* (3D) https://app.hslayers.org/project-rostenice/

## Installation

We strongly recommend using Angular CLI for setting up a new project. If you have an Angular ≥ 9 CLI project, you could simply use our schematics to add hslayers-ng library to it.

Just run the following:

`ng add hslayers-ng`
It will install hslayers-ng for the default application specified in your angular.json. If you have multiple projects and you want to target a specific application, you could specify the --project option:

`ng add hslayers-ng --project myProject`

Add peer dependencies if not installed automatically by npm:
`npm i bootstrap@^5.3 ol@^10.4.0 @angular/cdk@^19 @angular/common@^19 @angular/core@^19 @angular/forms@^19 @angular/compiler@^19 @angular/platform-browser@^19 @angular/platform-browser-dynamic@^19 @angular/localize@^19 @ngx-translate/core@^16 @ngx-translate/http-loader@^16 deepmerge@^4.0.0 dayjs@^1.0.0 @ng-bootstrap/ng-bootstrap@^18 ol-popup@^5.0.0 proj4@^2.15.0 share-api-polyfill@^1.0.0 rxjs@^7.8.0 zone.js@~0.15.0 xml-js@^1.6.11 ngx-cookie-service@^19 geostyler-style@^9.2.0 geostyler-sld-parser@^7 geostyler-openlayers-parser@^5 geostyler-legend@5 geostyler-qgis-parser@^4 ngx-color@^10 queue@^7 resumablejs@^1 d3@^7 jszip@^3 polygon-splitter@^0.0.11 polygon-clipping@^0.15.3 @popperjs/core@^2 ol-ext@^4 big.js@^6.2.1 hammerjs@2`

For using hslayers-ng prebuilt bundle including Angular, Bootstrap and other dependencies by loading it through `<script>` tags see: [Hslayers-ng application](https://github.com/hslayers/hslayers-ng/tree/develop/projects/hslayers-app)

## Configuration

Configuring hslayers-ng is described in more depth in the [wiki](https://github.com/hslayers/hslayers-ng/wiki)

### HsConfig service
Use HsConfig service injected in your component to set applications layers, looks and behavior. See full list of [config options](https://github.com/hslayers/hslayers-ng/wiki/App-config-parameters)
```
  import {Vector as VectorSource} from 'ol/source';
  import {Vector as VectorLayer} from 'ol/layer';
  import {HsConfig} from 'hslayers-ng/config';
  ...
 constructor(private HsConfig: HsConfig) {
    this.hsConfig.update({
      default_layers: [
        new VectorLayer({
          properties: {
            title: 'Bookmarks',
            path: 'User generated',
          }
          source: new VectorSource({features}),
        }),
      ],
      default_view: new View({
        center: transform([17.474129, 52.574], 'EPSG:4326', 'EPSG:3857'), //Latitude longitude    to Spherical Mercator
        zoom: 4,
      })
    })
```

## Back-end
HSLayers-NG can be used as a client-only single-page-application without any need for additional server components. But incorporating at least some server-side components unlocks some great features of HSLayers-NG. Here is a list of recommended server-side components:

+ **[hslayers-server](./projects/hslayers-server)** - a simple [cors-anywhere](https://www.npmjs.com/package/cors-anywhere) based proxy server which can be used to overcome [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) restrictions, fill API keys for services such as [Geonames](https://www.geonames.org/) used for search and other tasks. Copying and modifying the .env file to preserve secrets and not expose them for everyone and all kinds of requests will be necessary.
+ [Layman](https://github.com/LayerManager/layman) - geospatial data catalogue, map composition catalogue
+ [Micka](https://github.com/hsrs-cz/Micka) - metadata catalogue

### Proxy
We provide a Node.js based server application [hslayers-server](https://www.npmjs.com/package/hslayers-server) for proxy based on [cors-anywhere](https://github.com/Rob--W/cors-anywhere) that you can install by:
```
npm i hslayers-server
```
To run:
`./node_modules/.bin/hslayers-server`

To use this proxy in HSLayers-NG application, you have to set the proxyPrefix parameter in the app config 
which specifies the proxy url, eg.

```
 proxyPrefix: window.location.hostname.includes('localhost')
        ? `${window.location.protocol}//${window.location.hostname}:8085/`
        : '/proxy/'
```
This will check if the hslayers-ng based application is running in development mode i.e. on http://localhost:4200 and use proxy server address http://localhost:8085 in that case OR in production with the same domain but different directory for proxy application. You can configure the proxy URL to your setup (ports, domains, paths) of course. 

## Integration
HSLayers-NG can be integrated into larger systems.
See [crx-hslayers](https://github.com/hslayers/crx-hslayers) for an actively maintained widget for Wagtail/CodeRed CMS. Check [hub4everybody.com](https://hub4everybody.com/) to see, what you can achieve with this integration.

# Library development 

## Library build

Run `ng build hslayers` to build the project. The build artifacts will be stored in the `dist/` directory. You can use `npm link` for linking it to your project and rebuild the library continuously by `ng build hslayers --watch`

## Running unit tests

Run `ng test hslayers` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Further help

To get more help write h4e@lesprojekt.cz

