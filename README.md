# Hslayers-ng mapping library

Hslayers-ng is a library which extends OpenLayers 3 functionality by providing a foundation to build map GUI and extra components such as layer manager, permalink generating, styling of vector features, including OpenGIS® Web Map Service Interface Standard (WMS) layers to the map in a user friendly way etc.  

Check out the examples to get an idea:  
http://ng.hslayers.org/examples/
http://opentransportnet.eu/create-maps
http://sdi4apps.eu/spoi/

## Getting Started

npm install hslayers-ng


Include the bundle file

```<script src="node_modules/hslayers-ng/dist/hslayers-ng.js"></script>```

### Configure the application

A global hslayersNgConfig function, which returns a configuration object, needs to be created before loading the hslayers-ng.js script. It returns a json object to configure applications looks, behaviour and data. See [Configuration options](Config-parameters) for the available options.

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
<div hs ng-app="hs" ng-controller="Main" style="position: relative;"></div>
```

To have more customization optionas which require programming you can also write your own entry module which in this example is named app.js, but can have any other file name. 
App.js file is where you specify which hslayers modules will be loaded for your speciffic 
application, which map layers will be displayed and other configuration parameters. 
You can also write some startup code here to load a map service, open some initial panels etc.

Some example html files are provided in https://github.com/hslayers/examples repository. The template app.js uses 
some png files for layer groups which are included in https://github.com/hslayers/examples/tree/master/full directory.

A truncated example app.js with explanations is provided below:

```
define([ /* List of js files to be loaded. They are both hslayers and third-party components and the paths are specified in hslayers.js and Core.js files */
        'ol',
        'sidebar',
        'layermanager',
        ...
    ],
    /* The order of function parameters must match the array of file names above */
    function(ol) {
        var module = angular.module('hs', [
            'hs.layermanager',
            'hs.query',
            'hs.print',
            ...
            //**  List of Hslayers components
        ]);

        /* Here goes code to modify the UI for extra functionality */
        module.directive(
            'hs', [
                'config', 'Core',
                function(config, Core) {
                    return {
                        /* A different layout of the application can be achieved by changing the main template*/
                        template: require('hslayers.html'),
                        link: function(scope, element) {
                            Core.fullScreenMap(element);
                        }
                    };
                }
            ]);
        
        /* Here goes configuration of layers, viewport and HsLayers components */
        module.value('config', {
            /* Here goes layer definitions which can be ordinary OL layers with extra parameters which are interpreted by HsLayers or some special layer types which are unique to HsLayers */
            default_layers: [
                new ol.layer.Tile({
                    source: new ol.source.OSM(),
                    title: "Base layer",
                    base: true,
                    path: 'Roads/Additional Cycling routes'
                })
            ],
            default_view: new ol.View({
                center: ol.proj.transform([6.1319, 49.6116], 'EPSG:4326', 'EPSG:3857'), //Latitude longitude    to Spherical Mercator
                zoom: 13,
                units: "m"
            })
        });
        
        /* The main code which does extra things apart from HsLayers componets is locatet in the controller function below*/
        module.controller('Main', ['$scope', 'Core', '$compile', 'hs.map.service', 'hs.compositions.service_parser', '$timeout',
            /* The order of function parameters must match the array of component names above */
            function($scope, Core, $compile, hsmap, composition_parser, $timeout) {
                $scope.hsl_path = config.hsl_path; //Get this from hslayers.js file
                /* Core component is responsible for bootstrapping the application and managing top level interface such as panels and toolbar */
                $scope.Core = Core;

                /* We can listen to event emited by components such as layer manager and hide a layer which was added by code or by user for example*/
                $scope.$on('layermanager.updated', function(data, layer) {
                    if (layer.get('base') != true && layer.get('always_visible') != true) {
                       layer.setVisible(true);
                    }
                });

                /* To hide certain panels even if they are loaded as a dependency to other component use panelEnabled function */
                Core.panelEnabled('compositions', false);
                Core.panelEnabled('permalink', false);

            }
        ]);

        return module;
    });
```

If you are creating your own app.js and not using the provided bundled one, the source will need to be compiled using webpack.
Example webpack configuration files are provided at https://github.com/hslayers/examples/tree/webpack/full

`webpack --config webpack.dev.conf --progress`

### Proxy

For providing proxy functionality we use a simple cgi script, which you have to copy from `lib/hsproxy.cgi` 
to your cgi-bin directory. It might be located in /usr/lib/ if you use Apache.

```
cp lib/hsproxy.cgi /usr/lib/cgi-bin/hsproxy.cgi
```

To enable cgi on ubuntu, use

```
sudo a2enmod cgi
sudo service apache2 restart
```

If you are using nginx, see [HsProxy configuration with uwsgi](Hsproxy-configuration)

### Run the Application

If you dont plan to develop hslayers-ng, dont want to run tests and and server files through npm managed 
http server, then you can skip all the following `npm` related steps.

We have preconfigured the project with a simple development web server, but you can always use a different web server.  
The simplest way to start this server is:

```
npm start
```

Now browse to the app at `http://localhost:8000/`.


## Testing

There are two kinds of tests in the hslayers-ng: Unit tests and End to End tests.

### Running Unit Tests

The hslayers-ng app comes preconfigured with unit tests. These are written in
[Jasmine][jasmine], which we run with the [Karma Test Runner][karma]. We provide a Karma
configuration file to run them.

* the configuration is found at `test/karma.conf.js`
* the unit tests are found in `test/unit/`.

The easiest way to run the unit tests is to use the supplied npm script:

```
npm test
```

This script will start the Karma test runner to execute the unit tests. Moreover, Karma will sit and
watch the source and test files for changes and then re-run the tests whenever any of them change.
This is the recommended strategy; if your unit tests are being run every time you save a file then
you receive instant feedback on any changes that break the expected code functionality.

You can also ask Karma to do a single run of the tests and then exit.  This is useful if you want to
check that a particular version of the code is operating as expected.  The project contains a
predefined script to do this:

```
npm run test-single-run
```

### End to end testing

The hslayers-ng app comes with end-to-end tests, again written in [Jasmine][jasmine]. These tests
are run with the [Protractor][protractor] End-to-End test runner.  It uses native events and has
special features for Angular applications.

* the configuration is found at `test/protractor-conf.js`
* the end-to-end tests are found in `test/e2e/`

Protractor simulates interaction with our web app and verifies that the application responds
correctly. Therefore, our web server needs to be serving up the application, so that Protractor
can interact with it.

```
npm start
```

In addition, since Protractor is built upon WebDriver we need to install this.  The hslayers-ng
project comes with a predefined script to do this:

```
npm run update-webdriver
```

This will download and install the latest version of the stand-alone WebDriver tool.

Once you have ensured that the development web server hosting our application is up and running
and WebDriver is updated, you can run the end-to-end tests using the supplied npm script:

```
npm run protractor
```

This script will execute the end-to-end tests against the application being hosted on the
development server.

## Translating
Run 
```
grunt nggettext_extract
```
from terminal to generate po file template in /po/template.po and for each example eg. examples/pilsen_traffic/template.pot .
Rename it to *.po, translate, generate mo file and compile it.
If you are using specific translations for your app or example merge the global po file into the specific one with msgcat before compiling. 
Compiling is done with 
```
grunt nggettext_compile
```
It will generate components/translations/js/translations.js or examples/pilsen_traffic/translations.js files.

translations.js which contains the strings and also translating functionality is loaded by default like any other angular module from components/translations/js/translations.js in Core module. To have it use your own generated translations.js file override the path in hslayers.js file:
```
translations: hsl_path + 'examples/pilsen_traffic/translations' 
```
## Updating Angular

You can update the dependencies by running:

```
npm update
```

## Contact

raitisbe@gmail.com
