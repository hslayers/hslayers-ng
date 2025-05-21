build-all:
	npm run build && npm run build-app && npm run build-cesium && npm run build-cesium-app && cd dist/hslayers && sudo npm link && cd ../hslayers-app && sudo npm link && cd ../hslayers-cesium-app && sudo npm link && cd ../hslayers-cesium-app && sudo npm link 
	
update-ng:
	npm run ng update @angular/common @angular/compiler @angular/core @angular/forms @angular/localize @angular/cdk @angular/platform-browser @angular/platform-browser-dynamic @angular/compiler-cli  @angular/cli @angular-builders/custom-webpack ng-packagr

update-eslint:
	npm run ng update angular-eslint typescript-eslint eslint-import-resolver-typescript eslint-plugin-import eslint-plugin-tsdoc
