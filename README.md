# HSLayers-NG mapping library

HSLayers-NG is a library which extends OpenLayers 6 functionality by providing a foundation to build map GUI and extra components such as layer manager, permalink generating, styling of vector features, including OpenGIS® Web Map Service Interface Standard (WMS) layers to the map in a user friendly way etc.  

Check out the examples to get an idea:  
* http://ng.hslayers.org/examples/
* http://opentransportnet.eu/create-maps
* http://sdi4apps.eu/spoi/

## Before You Start
**This page describes how to create a HSLayers-NG based application with hslayers-ng 2.0 and newer. For a guide for older, but still supported version 1.x see [[Getting started (for HSLayers NG 1.x)]]. If you are looking for an upgrade guide then check [[Upgrading from version 1.x]].**  

HSLayers-NG is built on top of two major things: [OpenLayers](openlayers.org) library and [AngularJS](angularjs.org) framework. So in order to work with HSLayers you should have some understanding of both.
OpenLayers has a nice [tutorial workshop](https://openlayers.org/workshop/) to start with.  

## Getting Started

After successfully installing [Node](https://nodejs.org/en/) along with [npm](https://www.npmjs.com/), run the following in terminal:

`npm install hslayers-ng`


Include the bundle file

```<script src="https://ng.hslayers.org/bundles/latest/hslayers-ng.main.js"></script>```

### Configure the application

A global hslayersNgConfig function, which returns a configuration object, NEEDS TO BE CREATED BEFORE loading the hslayers-ng.js script (insert it before the bundle script in the html head section).
It returns a JSON object that describes the application's looks, behaviour and data it displays. See [Configuration options](Config-parameters) for the list of available config options.

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
          center: ol.proj.transform([17.474129, 52.574000], 'EPSG:4326', 'EPSG:3857'), //Latitude longitude    to Spherical Mercator
          zoom: 4,
          units: "m"
        })
      }
    } 
  </script>
  ```

Include in your html file, where the map should appear. 

```
<hs ng-controller="Main" style="position: relative;"></hs>
```

To have more customization options which require programming you can also write your own entry module which in this example is named app.js, but can have any other file name. 
app-js.ts file is where you specify which hslayers modules will be loaded for your specific 
application, which map layers will be displayed and other configuration parameters. 
You can also write some startup code here to load a map service, open some initial panels etc.

Some example html files are provided in https://github.com/hslayers/examples repository. The template app.js uses 
png icons for layer groups which are included in https://github.com/hslayers/examples/tree/master/full directory.


For webpack bundling instructions see [Building with webpack](https://github.com/hslayers/hslayers-ng/wiki/Building-with-webpack)

### Proxy
To overcome CORS issues when adding external datasources, querying feature info or searching, we use a proxy. 
Hslayers-ng bundles two proxy solutions inside its lib directory. We recommend Nodejs based solution which is based on [cors-anywhere](https://github.com/Rob--W/cors-anywhere).
To start it run: 

```npm explore hslayers-ng -- npm run start-hsl-proxy```

You might want to change the proxy code and not use the bundled one to include API keys and other secrets in your requests to map service, geonames search queries etc.
### Run the Application

If you dont plan to develop hslayers-ng, don't want to run tests and and server files through npm managed 
http server, then you can skip all the following `npm` related steps.

We have preconfigured the project with a simple development web server, but you can always use a different web server.  
The simplest way to start this server is:

```
npm start
```

Now browse to the app at `http://localhost:8000/`.


### Running Unit Tests

See [Testing](https://github.com/hslayers/hslayers-ng/wiki/Testing).

## Contact

raitisbe@gmail.com
