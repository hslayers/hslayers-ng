# HSLayers-NG

HSLayers-NG is a library which extends OpenLayers 6 functionality by providing a foundation to build map GUI and extra components such as layer manager, permalink generating, styling of vector features, including OpenGIS® Web Map Service Interface Standard (WMS) layers to the map in a user friendly way etc.

## Demo

Check out the examples to get an idea:  
* http://ng.hslayers.org/examples/
* http://opentransportnet.eu/create-maps
* http://sdi4apps.eu/spoi

## Installation

We strongly recommend using Angular CLI for setting up a new project. If you have an Angular ≥ 9 CLI project, you could simply use our schematics to add hslayers-ng library to it.

Just run the following:

`ng add hslayers-ng`
It will install hslayers-ng for the default application specified in your angular.json. If you have multiple projects and you want to target a specific application, you could specify the --project option:

`ng add hslayers-ng --project myProject`

Add peer dependecies:
`npm i bootstrap@^4.0.0 ol@^6.0.0 @angular/common@^9.0.0 @angular/core@^9.0.0 @angular/forms@^9.0.0 @ngx-translate/http-loader@^5.0.0 deepmerge@^4.0.0 moment@^2.24.0 moment-interval@^0.2.1 @ng-bootstrap/ng-bootstrap@^6.0.0 ol-popup@^4.0.0 proj4@^2.6.0 share-api-polyfill@^1.0.0 @angular/compiler@^9.0.0 @angular/platform-browser@^9.0.0 @angular/platform-browser-dynamic@^9.0.0 zone.js@^0.10.3`

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
        units: 'm',
      })
    })
```        
### Node.js proxy
First option is to use Node.js proxy (based on [cors-anywhere](https://github.com/Rob--W/cors-anywhere)) that you can find in `lib/proxy.js` file. Simply run it as any other Node.js script in terminal by 

`node proxy.js`

or deploy it as a service for production use. To use this proxy in HSLayers-NG application, you have to set the proxyPrefix parameter in the config 
which specifies the proxy url, eg.

```
proxyPrefix: '/proxy/'
```

# Library development 

## Library build

Run `ng build hslayers` to build the project. The build artifacts will be stored in the `dist/` directory. You can use `npm link` for linking it to your project and rebuild the library continuously by `ng build hslayers --watch`

## Running unit tests

Run `ng test hslayers` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Further help

To get more help write raitisbe@gmail.com

