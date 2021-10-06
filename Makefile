build-all:
	npm run build && npm run build-app && npm run build-cesium && npm run build-cesium-app && cd dist hslayers && sudo npm link && cd ../hslayers-app && sudo npm link && cd ../hslayers-cesium-app && sudo npm link && cd ../hslayers-cesium-app && sudo npm link 
	