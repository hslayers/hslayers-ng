#!/bin/sh

# Get the current working directory path
cwd=$(pwd)

# Collect inputs
echo "Which applications/libraries?"
select app in "all" "hslayers-ng" "hslayers-ng-app" "hslayers-cesium" "hslayers-cesium-app"; do
    break;
done

echo "What kind of a release?"
select yn in "patch" "minor" "major" "premajor" "prerelease"; do
    case $yn in
        patch ) type="patch"; break;;
        minor ) type="minor"; break;;
        major ) type="major"; break;;
        premajor ) type="premajor --preid=next"; break;;
        prerelease ) type="prerelease --preid=next --tag next"; break;;
    esac
done

# Bump versions
if [ "$app" = "all" ] || [ "$app" = "hslayers-ng" ]; then
    cd $cwd
    cd ../projects/hslayers
    npm version $type
    standard-changelog
fi;
if [ "$app" = "all" ] || [ "$app" = "hslayers-ng-app" ]; then
    cd $cwd
    cd ../projects/hslayers-app
    npm version $type
fi;
if [ "$app" = "all" ] || [ "$app" = "hslayers-cesium" ]; then
    cd $cwd
    cd ../projects/hslayers-cesium
    npm version $type
fi;
if [ "$app" = "all" ] || [ "$app" = "hslayers-cesium-app" ]; then
    cd $cwd
    cd ../projects/hslayers-cesium-app
    npm version $type
fi;

# Build libs/apps
cd $cwd
cd ..
make build-all
# Second round of building needed because app building 
# generates unnecessary ngcc files in hslayers-ng / hslayers-cesium lib directories
npm run build
npm run build-cesium
