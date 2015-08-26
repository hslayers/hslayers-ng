#!/bin/sh
cd ../../ && zip -r hslayers.wgt ./components ./css ./extensions ./img ./po ./hslayers.html hslayers-logo.png ./LICENSE ./bower_components/angular/ ./bower_components/angular-gettext/dist/ ./bower_components/angular-loader/ ./bower_components/angular-mocks/ ./bower_components/angular-route/ bower_components/angular-sanitize/ ./bower_components/bootstrap/dist/ ./bower_components/crossfilter/crossfilter.min.js ./bower_components/d3/d3.min.js ./bower_components/jquery/dist/jquery.min.js ./bower_components/ol3/build/ ./bower_components/ol3/css/ol.css bower_components/requirejs/require.js ./bower_components/xml2json/xml2json.js
cd examples/wirecloud/
zip -g ../../hslayers.wgt config.xml hslayers.js app.js index.html
mv ../../hslayers.wgt ./