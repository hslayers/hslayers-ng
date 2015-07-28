#!/bin/sh
cd ../../ && zip -r hslayers.wgt * -x node_modules/\* -x examples/\* 
cd examples/wirecloud/
zip -g ../../hslayers.wgt config.xml hslayers.js app.js index.html
mv ../../hslayers.wgt ./