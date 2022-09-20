#!/bin/sh
echo "What kind of a release?"
select yn in "patch" "minor" "major" "premajor" "prerelease"; do
    case $yn in
        patch ) TYPE="patch"; break;;
        minor ) TYPE="minor"; break;;
        major ) TYPE="major"; break;;
        premajor ) TYPE="premajor --preid=next"; break;;
        prerelease ) TYPE="prerelease --preid=next --tag next"; break;;
    esac
done
cd projects/hslayers
npm version $TYPE
standard-changelog
cd ../hslayers-app
npm version $TYPE
cd ../hslayers-cesium
npm version $TYPE
cd ../hslayers-cesium-app
npm version $TYPE
cd ../../
make build-all
# Second round of building needed because app building 
# generates  unnecessary ngcc files in hslayers-ng / hslayers-cesium lib directories
npm run build
npm run build-cesium