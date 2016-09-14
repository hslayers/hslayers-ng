# Hslayers-ng mapping library

Hslayers-ng is a library which extends OpenLayers 3 functionality by providing a foundation to build map GUI and extra components such as layer manager, permalink generating, styling of vector features, including OpenGIS® Web Map Service Interface Standard (WMS) layers to the map in a user friendly way etc.  

Check out the examples to get an idea:  http://ng.hslayers.org/examples/

## Getting Started

To get you started you can simply clone the hslayers-ng repository and install the dependencies:

### Prerequisites

You need git to clone the hslayers-ng repository. You can get it from
[http://git-scm.com/](http://git-scm.com/).

Hslayers-ng has a number of node.js tools to initialize and test itself. You must have node.js and
its package manager (npm) installed.  You can get them from [http://nodejs.org/](http://nodejs.org/).


### Clone hslayers-ng

Clone the repository where your webserver can access it using [git][git]:

```
git clone git@github.com:hslayers/hslayers-ng.git
cd hslayers-ng/
```

### Install Dependencies

We have two kinds of dependencies in this project: tools and angular framework code.  The tools help
us manage and test the application.

We have preconfigured `npm` to automatically run `bower` so we can simply do:

```
npm install
```

Behind the scenes this will also call `bower install`.  You should find that you have two new
folders in your project.

* `node_modules` - contains the npm packages for the tools we need
* `bower_components` - contains the angular framework files

### Configure the application

Copy the application configuration (template) files to the actual files. 

```
cp app.js.template app.js
cp hslayers.js.template hslayers.js
```

Hslayers.js file contains the paths for the different modules and is the starting 
point of the js application.
Set the hsl_path variable on top of the file to your hslayers-ng directory. 
The path should be relative to your www root or the html file where you load hslayers.js file.

App.js file is where you specify which hslayers modules will be loaded for your speciffic 
application, which map layers will be displayed and other configuration parameters. 
You can also write some startup code here to load some map service or open some initial panels etc.

Include in your html file, where the map should appear. Check the paths to the js files.

```
<div hs ng-app="hs" ng-controller="Main" style="position: relative;"></div>
<script src="bower_components/jquery/dist/jquery.min.js"></script>
<script src="lib/require.js"></script>    
<script src="hslayers.js"></script> 
```

Some example html files are provided in the `examples` directory. The template app.js uses 
some png files for layer groups which are also included in the `examples/armenia` directory.

For providing proxy functionality we use a simple cgi script, which you have to copy from `lib/hsproxy.cgi` 
to your cgi-bin directory. It might be located in /usr/lib/ if you use apache.

```
cp lib/hsproxy.cgi /usr/lib/cgi-bin/hsproxy.cgi
```

To enable cgi on ubuntu, use

```
sudo a2enmod cgi
sudo service apache2 restart
```

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


## Updating Angular

You can update the tool dependencies by running:

```
npm update
```

This will find the latest versions that match the version ranges specified in the `package.json` file.

You can update the dependencies by running:

```
bower update
```

This will find the latest versions that match the version ranges specified in the `bower.json` file.

## Contact

raitisbe@gmail.com
