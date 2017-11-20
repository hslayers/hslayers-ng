#!/bin/sh
cd ../../ && zip -r hslayers.wgt ./components ./css ./extensions ./img ./po ./hslayers.html hslayers-logo.png ./LICENSE ./node_modules/angular/ ./node_modules/angular-gettext/dist/ ./node_modules/angular-loader/ ./node_modules/angular-mocks/ ./node_modules/angular-route/ node_modules/angular-sanitize/ ./node_modules/bootstrap/dist/ ./node_modules/crossfilter/crossfilter.min.js ./node_modules/d3/d3.min.js ./node_modules/jquery/dist/jquery.min.js ./node_modules/ol3/build/ ./node_modules/ol3/css/ol.css node_modules/requirejs/require.js ./node_modules/xml2json/xml2json.js
cd examples/wirecloud/
zip -g ../../hslayers.wgt config.xml hslayers.js app.js index.html
mv ../../hslayers.wgt ./