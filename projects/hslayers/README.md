# HSLayers-NG

HSLayers-NG is a library which extends OpenLayers 6 functionality by providing a foundation to build map GUI and extra components such as layer manager, permalink generating, styling of vector features, including OpenGIS® Web Map Service Interface Standard (WMS) layers to the map in a user friendly way etc.


| Hslayers version | Angular version     | Bootstrap   |
| ---------------- | -----------------   |------------ |
| 1                | 1.7                 | 4.5.3       |
| 2                | 1.7 + 9.1.x (hybrid)| >=4.4       |
| 3                | 9.x                 | 4.x         |
| 4                | 10.x                | 4.x         |
| 5                | 11.x                | 4.x         |
| 6                | 12.x                | 4.x         |
| 7                | 12.x                | 5.x         |

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

Add peer dependencies:
`npm i bootstrap@^5.0.0 ol@^6.0.0 @angular/cdk@^12 @angular/common@^12 @angular/core@^12 @angular/forms@^12.0.0 @ngx-translate/core@^13 @ngx-translate/http-loader@^6.0.0 deepmerge@^4.0.0 dayjs@^1.0.0 @ng-bootstrap/ng-bootstrap@^10.0.0 ol-popup@^4.0.0 proj4@^2.6.0 share-api-polyfill@^1.0.0 @angular/compiler@^12.0.0 @angular/platform-browser@^12.0.0 @angular/platform-browser-dynamic@^12.0.0 @angular/localize@^12.0.0 rxjs@^6.0.0 zone.js@^0.11.3 xml-js@^1.0.0 ngx-cookie-service@^12.0.0 geostyler-style@^5 geostyler-sld-parser@^3 geostyler-openlayers-parser@^3 geostyler-legend@>=3 ngx-color@^7 queue resumablejs d3 geostyler-qgis-parser@^1 jszip polygon-splitter polygon-clipping`

For using hslayers-ng prebuilt bundle including angular, bootstrap etc. dependencies by loading it through `<script>` tags see: [Hslayers-ng application](https://github.com/hslayers/hslayers-ng/tree/develop/projects/hslayers-app)

## Configuration

Configuring hslayers-ng is described in more depth in [wiki](https://github.com/hslayers/hslayers-ng/wiki) 

### HsConfig service
Use HsConfig service injected in your component to set applications layers, looks and behavior. See full list of [config options](https://github.com/hslayers/hslayers-ng/wiki/Config-parameters)
```
  import {Vector as VectorSource} from 'ol/source';
  import VectorLayer from 'ol/layer/Vector';
  import {HsConfig} from 'hslayers-ng';
  ...
 constructor(private HsConfig: HsConfig) {
    this.HsConfig.update({
      default_layers: [
        new VectorLayer({
          title: 'Bookmarks',
          path: 'User generated',
          source: new VectorSource({features}),
        }),
      ],
      default_view: new View({
        center: transform([17.474129, 52.574], 'EPSG:4326', 'EPSG:3857'), //Latitude longitude    to Spherical Mercator
        zoom: 4,
      })
    })
```        
### Proxy
We provide a Node.js based server application [hslayers-server](https://www.npmjs.com/package/hslayers-server) for proxy based on [cors-anywhere](https://github.com/Rob--W/cors-anywhere) that you can install by:
```
npm i hslayers-server
```
To run:
`./node_modules/.bin/hslayers-server`

To use this proxy in HSLayers-NG application, you have to set the proxyPrefix parameter in the config 
which specifies the proxy url, eg.

```
 proxyPrefix: window.location.hostname.includes('localhost')
        ? `${window.location.protocol}//${window.location.hostname}:8085/`
        : '/proxy/'
```
This will check if the hslayers-ng based application is running in development mode i.e on http://localhost:4200 and use proxy server address http://localhost:8085 in that case OR in production with the same domain but different directory for porxy application. You can configure the proxy URL to your setup (ports, domains, paths) of course. 

# Library development 

## Library build

Run `ng build hslayers` to build the project. The build artifacts will be stored in the `dist/` directory. You can use `npm link` for linking it to your project and rebuild the library continuously by `ng build hslayers --watch`

## Running unit tests

Run `ng test hslayers` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Further help

To get more help write raitisbe@gmail.com

