## [7.0.1](https://github.com/hslayers/hslayers-ng/compare/7.0.0...7.0.1) (2021-12-15)


### Bug Fixes

* Query feature ops and reload on wms featureinfo ([#2455](https://github.com/hslayers/hslayers-ng/issues/2455)) ([9f8bc0a](https://github.com/hslayers/hslayers-ng/commit/9f8bc0a22fa55bfb8bc8867c124ed245624a4c4f)), closes [#2454](https://github.com/hslayers/hslayers-ng/issues/2454)



# [7.0.0](https://github.com/hslayers/hslayers-ng/compare/6.1.0...7.0.0) (2021-12-10)


### Bug Fixes

* Add toolbar panel container service to exports ([76b5a24](https://github.com/hslayers/hslayers-ng/commit/76b5a24ecb80653e85177fda2215d49e4914bec9))
* Align layers style attribute to laymans schema ([cc65079](https://github.com/hslayers/hslayers-ng/commit/cc650790d82e042216f070a5ca2870b9830e80fe))
* Change how layer/feat is passeed to popup widget ([4d5c901](https://github.com/hslayers/hslayers-ng/commit/4d5c9015dfea68732a5a7f7abc99e470d0474558))
* Check if layman response includes wfs param ([c8deebb](https://github.com/hslayers/hslayers-ng/commit/c8deebb9521a63b995a121aac227d4072a128c60))
* check if popup displayFunction is defined ([ca7c582](https://github.com/hslayers/hslayers-ng/commit/ca7c58211ceb2ce4f50e73799360f5e2fce68531))
* Check if user is logged in layman ([93cb3c7](https://github.com/hslayers/hslayers-ng/commit/93cb3c7bcc1ca7bc30166c0eb5b587ca6f02df62))
* Check if values are undefined or null ([3aaf985](https://github.com/hslayers/hslayers-ng/commit/3aaf985649a123abae37cb5448eb5285834a0039))
* Check the publication status of the layer ([e3e660f](https://github.com/hslayers/hslayers-ng/commit/e3e660f072dd09d5c2ccbc420919439aa18d623a))
* Deselect edit geometry temp. layer ([b991552](https://github.com/hslayers/hslayers-ng/commit/b99155264e6b8fa9d97ee451d037f01b7e139615))
* Disable selector and modify interactions when drawing edit features ([cd603f6](https://github.com/hslayers/hslayers-ng/commit/cd603f6dc56e635a43fb31008ea2bca6d0adc394))
* Feature geom editor difference can result in multiple features ([f452047](https://github.com/hslayers/hslayers-ng/commit/f4520474fd3e67bb32d645230f2d3f4ba2cf2d41))
* Find the correct layer from wfs service ([e569edd](https://github.com/hslayers/hslayers-ng/commit/e569edd10e831f8253361a9cbcb617f182e07694))
* Fix translations, css and panel widths ([b3191e5](https://github.com/hslayers/hslayers-ng/commit/b3191e54b7070dab033bb0a62c87ab9e7794a4e6))
* Get sld/qml from style url in composition ([729d5f5](https://github.com/hslayers/hslayers-ng/commit/729d5f54b4c3577cb8e91ef4fc261caec8eec785))
* Hide cesium hover popup if not over features ([1ee1242](https://github.com/hslayers/hslayers-ng/commit/1ee124269652937a205c11d6ad60c7d424e28c86))
* Hide cesium hover popup if not over features ([9beff28](https://github.com/hslayers/hslayers-ng/commit/9beff28cca0b0511b60dbaa549011083a3fd773f))
* Layer being loaded by accident ([1be80a5](https://github.com/hslayers/hslayers-ng/commit/1be80a500d3045cfe2b5858b9367e87c31a775e3))
* Load qml style also in styler for editing ([af92f0d](https://github.com/hslayers/hslayers-ng/commit/af92f0df104b0bcf5180091882450b0cbb79e2d7))
* Loading layer after it is added to layman ([8a05673](https://github.com/hslayers/hslayers-ng/commit/8a05673000997de7901a7d63c977999adbff4ce7))
* Micka query strings ([8f70013](https://github.com/hslayers/hslayers-ng/commit/8f70013f7035e91c9b56ac9a30eb801dba6d72d8))
* Move popup style to css file. Add border after layer ([d545126](https://github.com/hslayers/hslayers-ng/commit/d545126d5de1fde500e3d7af61c0f1dc31378b0c))
* Parse style when loading WFS from compositions ([9164b11](https://github.com/hslayers/hslayers-ng/commit/9164b1131e799065df5833ef0ac5e6cbde9942ef)), closes [#2420](https://github.com/hslayers/hslayers-ng/issues/2420)
* Pass event object to layer source change legend generation callback ([77044c4](https://github.com/hslayers/hslayers-ng/commit/77044c4c3d88129c23df80091d3134bd49757a63))
* Provide a zip file name so Layman recognizes it ([414a279](https://github.com/hslayers/hslayers-ng/commit/414a279fe3c50fb8482afc38948b78d02078d3a8))
* Remove all but first features when 'union' operation is executed ([1a6ae5a](https://github.com/hslayers/hslayers-ng/commit/1a6ae5afa4698ecd5ba6dba4a3ffbdbd54a7076c))
* Remove basePath from url only in case of ngRouter ([6e65c02](https://github.com/hslayers/hslayers-ng/commit/6e65c02ea52f4a048b9db012573586c9e8872cba))
* Resolve few UI interaction problems ([f2679a1](https://github.com/hslayers/hslayers-ng/commit/f2679a1984cd8a7b258b4198bf275ece3c7d7b67))
* Send authentication headers when requesting WFS style ([d197d3d](https://github.com/hslayers/hslayers-ng/commit/d197d3d1f7a2bdc1f4d34e1abcbb5906bffed493))
* Set panel data only if it doesnt set itself ([fb472e9](https://github.com/hslayers/hslayers-ng/commit/fb472e9728b998c80f1b7879fd04f31b9d012dcc))
* Show 'Only one split line' info toast only if it already exists ([2e12520](https://github.com/hslayers/hslayers-ng/commit/2e12520748ea5438980c505ee4b769568a49705a))
* style missing from the wfs layer ([a01506f](https://github.com/hslayers/hslayers-ng/commit/a01506fed5d2618b239d334ca57211f7a13e5e24))
* to-map-dialog not loading initial data ([8f83eb6](https://github.com/hslayers/hslayers-ng/commit/8f83eb6191249888f0ddf26216de4c48a3845e93))
* Vega tooltips not visible ([364bea4](https://github.com/hslayers/hslayers-ng/commit/364bea4cbf13d6f8ebb70b8676d72e571ceb4c74))
* **3d:** Align cesium feature picking with 2d ([781d6a1](https://github.com/hslayers/hslayers-ng/commit/781d6a1e01555468becfcd5b68bfa8d8e4ef4172)), closes [#2353](https://github.com/hslayers/hslayers-ng/issues/2353)
* **add-data:** Provide error message ([9e2af04](https://github.com/hslayers/hslayers-ng/commit/9e2af045bfb4956795c810db74ade91d0a8db3a2))
* Add missing cluster widget to layer editor ([6cd3f40](https://github.com/hslayers/hslayers-ng/commit/6cd3f40c525c72a20b5d86819e99c83f20c6415b))
* Change how hslayers bootstrap css is bundled ([b8a98b2](https://github.com/hslayers/hslayers-ng/commit/b8a98b27aa366afd3b8f62313fb0e76adaf20483)), closes [#2223](https://github.com/hslayers/hslayers-ng/issues/2223)
* Disable query in decoupling-test-app and fix dimensions ([d4c2620](https://github.com/hslayers/hslayers-ng/commit/d4c2620d069f77efec7d005c45d9e2bb7ec0df79))
* Don't crash if panelsEnabled undefined in hsl-app ([db4f428](https://github.com/hslayers/hslayers-ng/commit/db4f42878ac2bf5afbfacacbd694b9fe3096a4d3))
* Don't use hardcoded background for popup ([8681ab1](https://github.com/hslayers/hslayers-ng/commit/8681ab11387726db5512833777bda55781311dfb))
* Dont mistaken scale and resolution ([1129d01](https://github.com/hslayers/hslayers-ng/commit/1129d013997614e54b6bb9b7bdc784bb6309b49e))
* Fix bootstrap module imports ([4a2af51](https://github.com/hslayers/hslayers-ng/commit/4a2af5178bbd5ea1a93961eaa42b7aa821dca4ce))
* Hide rectanle around legend ([7197eb7](https://github.com/hslayers/hslayers-ng/commit/7197eb76e342f5de6611fb2b48814f4eb415b842))
* Hover popup without enabled info panel ([a4ffaad](https://github.com/hslayers/hslayers-ng/commit/a4ffaad02f815756e06ac8436d28b1985f94ada2))
* Import bootstrap scss separately by module, some modules outside hsl class to uncover root css varaibles ([2e8e1bb](https://github.com/hslayers/hslayers-ng/commit/2e8e1bb4dfc3da554e3eea18247a149c113d6386))
* Incorrect default panel state ([205b8f1](https://github.com/hslayers/hslayers-ng/commit/205b8f1c6c0b4a418f8ca1a69ff693645567d3c2))
* Link cesium entities to ol features ([b22cb82](https://github.com/hslayers/hslayers-ng/commit/b22cb82c08c819d7719dbaa7e9090c077a2481ce))
* make cesium config checking function optional ([78547d8](https://github.com/hslayers/hslayers-ng/commit/78547d83bcb580f7776c72c7bb3e1d248f70f2ad))
* Make measure panel ON by default ([21fd754](https://github.com/hslayers/hslayers-ng/commit/21fd754ab66adb9f7959f06693eb00acbcce6c2b))
* Migrate to geostyler 3.x ([e3c4ebb](https://github.com/hslayers/hslayers-ng/commit/e3c4ebb1f8cc4101dc657d9ff368b5484639360c))
* Nested sublayers not toggleable ([4979c63](https://github.com/hslayers/hslayers-ng/commit/4979c635a1a30f55754eb2a0d05703be7f63b023))
* Post build script ([#2317](https://github.com/hslayers/hslayers-ng/issues/2317)) ([e8d95f4](https://github.com/hslayers/hslayers-ng/commit/e8d95f4883631f609cde43caf1ddec3dd0cf08f7))
* Prevent circular JSON loops for comp/data extents ([6a3f758](https://github.com/hslayers/hslayers-ng/commit/6a3f7581bd43ff8209334ca07b8111acaf9981b9))
* Reference extent features with ids not objects ([61746a4](https://github.com/hslayers/hslayers-ng/commit/61746a40670d53135291ca70fb56036481b4838e))
* Selected language not highlighted after init ([db202e7](https://github.com/hslayers/hslayers-ng/commit/db202e7e828e5de784b2073b679d6a483d469339))
* Show highlight when hovering search results ([253252b](https://github.com/hslayers/hslayers-ng/commit/253252b21327594c3807a802dd21e66afc615747))
* Toast close button styling on bootstrap 5 ([19953c5](https://github.com/hslayers/hslayers-ng/commit/19953c5c597b194eb057b3e6c2086d100104e00b))
* URL detail table head font color in liferay ([6bd79f9](https://github.com/hslayers/hslayers-ng/commit/6bd79f9ce6c05f4c5f7b8a84d996dea5892be646))
* Url table rows broken in liferay ([8cd723f](https://github.com/hslayers/hslayers-ng/commit/8cd723fdfe111d89867830a8d33d6f9ee3ac5622))
* Use `removable` layer attrib when clearing map ([e933375](https://github.com/hslayers/hslayers-ng/commit/e93337564729998a7d4f20a71c264e1598f34beb))
* Use geostyler-legend lib to generate legends ([7370459](https://github.com/hslayers/hslayers-ng/commit/737045931baa8447bb342130ed627298878644d2)), closes [#2150](https://github.com/hslayers/hslayers-ng/issues/2150)
* Use ngBootstrap to control dropdown menus ([5497cf0](https://github.com/hslayers/hslayers-ng/commit/5497cf0c75ecc8594f869433193d27410282fc7c))
* Wait for hsConfig before loading translations ([3c6c7e5](https://github.com/hslayers/hslayers-ng/commit/3c6c7e5103a66388000efe993493abf766589f8c))
* **attribute-row:** Use tmp string of object ([538b38d](https://github.com/hslayers/hslayers-ng/commit/538b38d6c65e815f42bad4fe3f67eb073d497754))
* Use StyleLike for parsed OL style ([95a7e85](https://github.com/hslayers/hslayers-ng/commit/95a7e85a32799ba58cd2d0595d68d0b3299c5bfe))
* **legend:** Show correct legend for layer-editor window ([c04de22](https://github.com/hslayers/hslayers-ng/commit/c04de2248cc0a42f35a02933308bfa2370e317a3))
* **server:** Support /client/geoserver path for backward compatibility ([2259081](https://github.com/hslayers/hslayers-ng/commit/2259081d7e88fce63b23de4db24f7584abca7731))


### Build System

* Added back missing dependency ([8cbcce8](https://github.com/hslayers/hslayers-ng/commit/8cbcce85bf5f69770cdcbde4d3391f9125957f46))


### chore

* Upgrade to bootstrap 5.1.3 ([0fd2fbb](https://github.com/hslayers/hslayers-ng/commit/0fd2fbb19f4921d5352ea97037d08db35b9ad634))


### deps

* Added geotiff.js library for parsing geotiff data ([fc47d38](https://github.com/hslayers/hslayers-ng/commit/fc47d383d00e895006a0353fe10780421f9e19a3))


### Features

* Ability to collapse table rows with a button ([f9297f4](https://github.com/hslayers/hslayers-ng/commit/f9297f459ee38e09aaeb1fa83a511231c2eac5fc))
* Add csv upload template ([7bc6156](https://github.com/hslayers/hslayers-ng/commit/7bc61564abf2f806d33dc54e80147adaefe2f7a8))
* Add dropdown for location property to map statistics ([dcde2ab](https://github.com/hslayers/hslayers-ng/commit/dcde2ab86afcc25ee95409922d9d16a23a1dde57))
* Add function to find feature by ID in all layers ([78d644d](https://github.com/hslayers/hslayers-ng/commit/78d644d8e2acefb6ed94cfd4844948922857cec4))
* Add multiple linear regression support ([9dd4759](https://github.com/hslayers/hslayers-ng/commit/9dd4759802fa3a158db6dd46e6658642eb433337))
* add prediction chart axis titles ([622a0d0](https://github.com/hslayers/hslayers-ng/commit/622a0d0ebc735f1413861271164b473d620b3b09))
* Add prediction dialog ([13676ad](https://github.com/hslayers/hslayers-ng/commit/13676ad72be0e8fe00da177365168e575802483f))
* Add QML support for layer styles when loading ([b82ee4c](https://github.com/hslayers/hslayers-ng/commit/b82ee4c8eac6d48ca88a9a9355db24952de30dc5)), closes [#2361](https://github.com/hslayers/hslayers-ng/issues/2361)
* Add regression dialog ([b9d2bcb](https://github.com/hslayers/hslayers-ng/commit/b9d2bcb4a835c9c39e722bb8256b00efa0ec85f0))
* Add time series chart dialog ([deaaafd](https://github.com/hslayers/hslayers-ng/commit/deaaafd9f553ef42fedc360f3c705f0ea311ccaa))
* Add tooltips for regression charts ([d661e1d](https://github.com/hslayers/hslayers-ng/commit/d661e1d3aa06ccdcb391cb5b0880cfe382c39676))
* Added file-base.component as a super ([773467b](https://github.com/hslayers/hslayers-ng/commit/773467b2dd5bdd74cb3d56bcd8d8c2118f2665e8))
* Added geotiff component ([cfb723a](https://github.com/hslayers/hslayers-ng/commit/cfb723a80bd21422bac7e5cf9c070319677812ef))
* Added histogram with desc statistics ([05b191d](https://github.com/hslayers/hslayers-ng/commit/05b191d3b8929999dc7d562c93376040127c6e6a))
* Added line data type to histogram ([2d6cc09](https://github.com/hslayers/hslayers-ng/commit/2d6cc09d6b083c21ebf5cf1f8d891a5f963141a4))
* Added new common-file service ([a638080](https://github.com/hslayers/hslayers-ng/commit/a63808044713149b87ac18f9bc69a0a69328a5fd))
* Added tooltips to time-series chart ([2a0b2bb](https://github.com/hslayers/hslayers-ng/commit/2a0b2bb77e825c727e6843a968bb5848d218a6ed))
* Catch errors while parsing  vector layer from composition ([a710b52](https://github.com/hslayers/hslayers-ng/commit/a710b52a6032e5ffefab17ad44a6e2af55e90261))
* Clear all statistics data feature ([b3e801c](https://github.com/hslayers/hslayers-ng/commit/b3e801ca8a2d5ddd5a8a203c0d4b3933e29b0f2b))
* Compile Hslayers+bootstrap+OL to css file ([e254bff](https://github.com/hslayers/hslayers-ng/commit/e254bff601e561f4f671937ce1c2a1c66da87c56))
* Correlation calculation from shifted values by year ([b1adf96](https://github.com/hslayers/hslayers-ng/commit/b1adf961bfd3ab2c83db805d090800f9f6e01f1d))
* Display cesium popup under mouse ([258ea1a](https://github.com/hslayers/hslayers-ng/commit/258ea1a4a66d3d98bca56d84c43b5735405e88c2))
* List variables in statistic panel ([43e7a88](https://github.com/hslayers/hslayers-ng/commit/43e7a88c621b59fd2f86657abcf69ee5ac219ecb))
* Load query popup widgets specified in hsConfig ([61cbb13](https://github.com/hslayers/hslayers-ng/commit/61cbb13bb0d9ad0325ad7c14250a22d46623f3b0))
* Load translations from assets using HttpClient ([3cb1d23](https://github.com/hslayers/hslayers-ng/commit/3cb1d2390f7787be14ea5043a5b4f5bce58ffb2c))
* Meake popup widget list overridable in layer ([a4dc0fa](https://github.com/hslayers/hslayers-ng/commit/a4dc0fa95ce5795c3ebe895204441290565273e8))
* Merge properties when editing features ([e115559](https://github.com/hslayers/hslayers-ng/commit/e115559672cd33048bc156f9dae868ff76f015a3)), closes [#2386](https://github.com/hslayers/hslayers-ng/issues/2386)
* Moved cesium related config to new class ([35fab9c](https://github.com/hslayers/hslayers-ng/commit/35fab9cd49f1ba1fddddfe30f53b8203cd700233))
* Multiple regression charts and coefficient output ([99aad31](https://github.com/hslayers/hslayers-ng/commit/99aad3133c75a0c992657815253721d6da534534))
* New adddata common component ([c1df662](https://github.com/hslayers/hslayers-ng/commit/c1df6621025e0f8e2868861c1212b75f395453fa))
* New query-popup widget feature-info ([e044391](https://github.com/hslayers/hslayers-ng/commit/e044391192c6e9989c6be7796469df1b7f8d9dd3))
* One panel container service for many components ([ebab4ea](https://github.com/hslayers/hslayers-ng/commit/ebab4eaa79dc75099b74a32d3c57d0a084d474da))
* Parse csv and calculate correlations ([8563613](https://github.com/hslayers/hslayers-ng/commit/8563613ec45c9bfc6f88308fc6353d9150ec2c3c))
* Register popup in according service (Cesium or OL) ([498d993](https://github.com/hslayers/hslayers-ng/commit/498d9933e3f9be4e08ebb8c176ed75d1abe9e291))
* Save data corpus on parsing new csv ([1745efe](https://github.com/hslayers/hslayers-ng/commit/1745efe396d852c174e2e00f44ae39ecd75cd937))
* Shadow uses for escaped columns ([7c15742](https://github.com/hslayers/hslayers-ng/commit/7c1574272f66134eccdabceb70e123bcf8c2e99d))
* Store csv table data also ([e501f4d](https://github.com/hslayers/hslayers-ng/commit/e501f4decadd3f9c5eb8157954856d6e0b913f88))
* Temporal input shifting for predictions ([932ca78](https://github.com/hslayers/hslayers-ng/commit/932ca7837f423107aedb3b376852689d3d896dbd))
* Temporal shifting for multiple regression ([b6f1150](https://github.com/hslayers/hslayers-ng/commit/b6f1150a35018236d5c244ee382539b6e07bbb34))
* Time shifting for regression ([2ed01ef](https://github.com/hslayers/hslayers-ng/commit/2ed01efcc39811e56cbb360c67e255ecb8c91453))
* Topologically correct splitting of polygons ([8d86c87](https://github.com/hslayers/hslayers-ng/commit/8d86c879497f3f40bc69411197b89f6c83dd1ad0)), closes [#2386](https://github.com/hslayers/hslayers-ng/issues/2386)
* Upload shape and geotiff files as zip ([60c6c0f](https://github.com/hslayers/hslayers-ng/commit/60c6c0f0038e0af76946f15e96aa2f5c8cd629c4))
* Upload zip files containing files ([9291a47](https://github.com/hslayers/hslayers-ng/commit/9291a47e1fabb11877d0d675ecdd4b2c65d7800e))
* Usability improvements for feature editing ([6cf5ce8](https://github.com/hslayers/hslayers-ng/commit/6cf5ce890c0febbb29a9687740e9aa053574482a))
* Variables can be removed ([c05ac62](https://github.com/hslayers/hslayers-ng/commit/c05ac62d4fd341f3c5f02eeec224f60d3db0382b))
* Visualize statistics variables on map ([12f9af4](https://github.com/hslayers/hslayers-ng/commit/12f9af415cc18435efa0fa2c20ff1626ed5dd96d))
* **3d:** Create popup and picker service for cesium ([f674033](https://github.com/hslayers/hslayers-ng/commit/f67403334073bc382fb245b03fb3437f7ecd8494)), closes [#2353](https://github.com/hslayers/hslayers-ng/issues/2353)
* **config:** Added new queryPopupWidgets and ([e1ec040](https://github.com/hslayers/hslayers-ng/commit/e1ec040784975e293e006a015d5564c4fd33168b))
* **draw:** Create feature geometry editor ([81f3d62](https://github.com/hslayers/hslayers-ng/commit/81f3d626639e0c6aa33c15fe40e3cba2ea154700))
* **query:** new widget layer-name ([82f4e86](https://github.com/hslayers/hslayers-ng/commit/82f4e863e0d131a748b2bfd765bcbfacbd77dd0c))
* **toast:** Allow to add error details to toast message ([8a838d6](https://github.com/hslayers/hslayers-ng/commit/8a838d6097f2e77fe5d5525754e2d97fa3bb35b3))
* Try adding widgets to feature popup ([66fb7cd](https://github.com/hslayers/hslayers-ng/commit/66fb7cd2ea3fc2d144c8e6414609816f90749d6c))
* Use hsconfig.uploadTypes to restrict upload choices ([4f1b9b2](https://github.com/hslayers/hslayers-ng/commit/4f1b9b2528e7dd540f4bf6300fa0c5cdd9e529a0))
* Warn about default_view not set for cesium ([d55ee83](https://github.com/hslayers/hslayers-ng/commit/d55ee837b087d198b61dc9d7e3ed35a358f92815))
* Warn about moved cesium config props ([3634049](https://github.com/hslayers/hslayers-ng/commit/3634049bf6afceb3f97aa17f054fc504ffeab143))
* Widget to generate popup content dynamically ([96fa126](https://github.com/hslayers/hslayers-ng/commit/96fa1265024f8fa8f5ba9db51a22ffe9e0b7fd15)), closes [#2370](https://github.com/hslayers/hslayers-ng/issues/2370)


### Performance Improvements

* Debounce legend event listeners ([b266253](https://github.com/hslayers/hslayers-ng/commit/b26625320d4c2bc129da1d07b109a7367d758b8a))
* Import only ngBootstrap submodules ([ef33ce3](https://github.com/hslayers/hslayers-ng/commit/ef33ce341ff0b9d48a1b1f8d6b20ae80fbe41c1f))
* Remove deprecated legend event listeners from layer and layer source (partialy) ([d93dbc8](https://github.com/hslayers/hslayers-ng/commit/d93dbc85a67a9d49dbcf48b1df65d51004164ccf))
* Unlisten map pointer move event ([764b227](https://github.com/hslayers/hslayers-ng/commit/764b227b4d612ac93e563de440b7b38429addb48))


### Reverts

* Downgrade typescript to 4.3.5 ([c00edf4](https://github.com/hslayers/hslayers-ng/commit/c00edf4cf38ae119ca742d6ff5965c4fb17b9f26))
* Remove redundant destruction of popup widget panels ([7d80820](https://github.com/hslayers/hslayers-ng/commit/7d808208abf85d01bb41a875625afe746fd4184f))
* Return escaping of variable names ([afa945c](https://github.com/hslayers/hslayers-ng/commit/afa945cf122d7741afac44cdf36f5abba1fdfde4))
* Revert experimental nested widget mechanics ([a297372](https://github.com/hslayers/hslayers-ng/commit/a2973720baecc815d74165e50b1d66b24b712216))


### BREAKING CHANGES

* Need to specify HsConfig.ngRouter = true if Angular router is used
* Add polygon-splitter peer dependency `npm i polygon-splitter`
* **draw:** Add new dependencies `npm i polygon-clipping`
* Added jszip and @types/jszip as peerDependecies `npm i
jszip @types/jszip`
* Add geostyler-qgis-parser peerdependency: `npm i geostyler-qgis-parser`
* `npm install geotiff`
* **3d:** 3D features are now picked using left mouse button instead of right.
* To add cesium specific config

parameters, user must use ->

this.HsCesiumConfig.update({
      cesiumBase: 'assets/cesium/',

replacing ->

this.HsConfig.update({
      cesiumBase: 'assets/cesium/',
* Need to include node_modules/hslayers-ng/css/hslayers-ng.css in the container
application. For example in app.scss `@import 'hslayers-ng/css/hslayers-ng'` or in the angular.json's styles property. OL, bootstrap and  WebHostingHub-Glyphs are bundled in hslayers-ng.css
* https://getbootstrap.com/docs/5.0/migration/
* Add geostyler-legend and d3 peer dependencies: `npm i geostyler-legend d3`



# [6.1.0](https://github.com/hslayers/hslayers-ng/compare/6.0.2...6.1.0) (2021-10-11)


### Bug Fixes

* Add feature_table to panelsEnabled structure ([080ddc2](https://github.com/hslayers/hslayers-ng/commit/080ddc2c5233128926d8e500d1fcc66c2761cdad))
* Added missing exports to public-api files ([8c8ee7a](https://github.com/hslayers/hslayers-ng/commit/8c8ee7ab665e875200204aeba78e8087850ea784))
* Check all styles for fill, image or stroke ([082f822](https://github.com/hslayers/hslayers-ng/commit/082f822146e1afb444f47ada8eef3d8e881e166f))
* Clone compoData before unwrapping layer object when saving composition ([f8c4154](https://github.com/hslayers/hslayers-ng/commit/f8c41545f5fa40e811bd4cae3f3cca21a2deb494))
* Close dropdown menus ([d9c43e2](https://github.com/hslayers/hslayers-ng/commit/d9c43e281cb276da93112988031785eda2894824))
* composition metadata dialog if missing some properties ([5e77106](https://github.com/hslayers/hslayers-ng/commit/5e77106f14f1542064495266aaa50e6d62f3126e))
* Context or Author tabs refresh the page ([7ed549c](https://github.com/hslayers/hslayers-ng/commit/7ed549c36b48e66303cd41ec0b343c6dc6a8ea5a))
* De-highlight of compositions by extents under mouse ([fe400b4](https://github.com/hslayers/hslayers-ng/commit/fe400b4a1efccc0590e2902a990c817978a3d39f))
* Don't add panels twice when NgRouter is used  ([#2242](https://github.com/hslayers/hslayers-ng/issues/2242)) ([c9d8670](https://github.com/hslayers/hslayers-ng/commit/c9d867091f0209222ec363372e76b8605824ee55))
* Don't override style for cluster layers ([bd630e7](https://github.com/hslayers/hslayers-ng/commit/bd630e74c1859980e6b4389fd92bbc7cd8002ef2))
* Don't send features when saving title or sld to layman ([e549367](https://github.com/hslayers/hslayers-ng/commit/e549367ca6b7a5448cc1ec5d699a4bf988b3b55c))
* Fix connecting to url for vector types ([55d2b22](https://github.com/hslayers/hslayers-ng/commit/55d2b22e8e91a508c0bb31dd7378e0b27c9c9aed))
* Highlighting of compositions with mouse over ([32b3702](https://github.com/hslayers/hslayers-ng/commit/32b3702a9535e0727c5ff876d42b5d690af6c843))
* Highlighting of datasets with mouse over ([cb22457](https://github.com/hslayers/hslayers-ng/commit/cb2245780d2ec422a45947c40c176cdf3df37539))
* layer sublayer tooltip not visible in layerEditor ([7cc9529](https://github.com/hslayers/hslayers-ng/commit/7cc9529f5b90f68e4c6affa89beecaa529b89fbe))
* Parse SLD only when not qgis style provided ([b087e71](https://github.com/hslayers/hslayers-ng/commit/b087e713be25a101ea39960f65e7ca7011a42917))
* PATCH sld and title for Layman layers ([004bb22](https://github.com/hslayers/hslayers-ng/commit/004bb224560e2c5e4cbc7df887a0d11ab3debee8))
* Prevent query dropdown menus from overlaping ([7bf3bc1](https://github.com/hslayers/hslayers-ng/commit/7bf3bc141225d53cc8da4bdf53d8e757f4930e8e))
* Provide correct params to readFeatures method ([8f0d5fa](https://github.com/hslayers/hslayers-ng/commit/8f0d5fab9da73144357fd82dac4bff1e11003610))
* Read features from composition in EPSG:4326 ([ab78f6e](https://github.com/hslayers/hslayers-ng/commit/ab78f6e315d5b670fc5f6bae287d7cadacc106cd))
* Retry with serialized features if composition saving fails ([92f8781](https://github.com/hslayers/hslayers-ng/commit/92f8781dcad0f41cc277ac461aeccd74f6512bbf)), closes [#2187](https://github.com/hslayers/hslayers-ng/issues/2187)
* Set correct add url vector type ([03592a9](https://github.com/hslayers/hslayers-ng/commit/03592a9c84e29939b4b1d36f49994307afb857ea))
* Successfully saved map composition doesnt return 'saved' property ([0e503c1](https://github.com/hslayers/hslayers-ng/commit/0e503c199df17f7cfd9ff29376dee876df0c4659))
* Treat SUCCESS response without url as PENDING ([3c26f6c](https://github.com/hslayers/hslayers-ng/commit/3c26f6cc16b6b08c6eb6350c5207483fd2ad5ea6))
* Untoggle layer renamer when switching layers ([37d9652](https://github.com/hslayers/hslayers-ng/commit/37d9652daddb9220c81324aefb00c5feb83e7fd6))
* Url history component not saving last used urls for some services ([0fdca21](https://github.com/hslayers/hslayers-ng/commit/0fdca211afb619fa4701197a467bdaea14c2498f))
* Use hex in style colors for SLD instead of rgb ([1e79f5e](https://github.com/hslayers/hslayers-ng/commit/1e79f5e5d90ca035b719f5346beaa6945723df5d))
* **legend:** Legend doesn't refresh ([09dd1a8](https://github.com/hslayers/hslayers-ng/commit/09dd1a82e3554b20d27f2edd51d452754b45e238))
* **sensors:** Type check for multipolygon ([ecb82c4](https://github.com/hslayers/hslayers-ng/commit/ecb82c4a30c844f7d997eb92413920d411470231))
* **styler:** Stop dragging event propagation ([6e0e53b](https://github.com/hslayers/hslayers-ng/commit/6e0e53bddbe82f8986fe427104fc26b8cfbfec16))
* **toast:** Check if identical toast already exists ([61c6514](https://github.com/hslayers/hslayers-ng/commit/61c6514caac01a5b09d465963a25c066feca9745))
* Use credentials for composition DEL request ([c5f3c6a](https://github.com/hslayers/hslayers-ng/commit/c5f3c6a901a54d9b5543bf4e336d74573a82d93c))
* **toast:** add serviceCalledFrom option to toast ([1922392](https://github.com/hslayers/hslayers-ng/commit/1922392be8e1a9927b9759e4feeb71f0fb01b281))


### Features

* Change layer title once after user confirms ([855332e](https://github.com/hslayers/hslayers-ng/commit/855332ec1c015103a622408cc49cc20c238fb008))
* Display extent features for layman data ([c14711f](https://github.com/hslayers/hslayers-ng/commit/c14711f0d704c5039a2e8c1a640ff8b8c619fc84))
* **styler:** Add drag and drop to styler ([edcfd0c](https://github.com/hslayers/hslayers-ng/commit/edcfd0cc144da33ffe6edea8e7693aa27831a5bf))
* Listen for style changes also ([7440440](https://github.com/hslayers/hslayers-ng/commit/74404401f1de924071014fbb706c5dde9a4c5d97))
* Make map overlay panels dynamically added ([29881d7](https://github.com/hslayers/hslayers-ng/commit/29881d78cdb4301bd7cd385986bc341dcaf50065))
* Make toolbar panels dynamic and extendable ([21a8761](https://github.com/hslayers/hslayers-ng/commit/21a8761a7a14aaa7be21d17c5f1b713909873cd2)), closes [#2111](https://github.com/hslayers/hslayers-ng/issues/2111)


### Performance Improvements

* Skip DOMParser intermediary step for WFS ([c0c2f4a](https://github.com/hslayers/hslayers-ng/commit/c0c2f4a7389346480aeb31c3a0b288438bfa761d))



# [6.0.0](https://github.com/hslayers/hslayers-ng/compare/5.1.0...6.0.0) (2021-09-14)


### Bug Fixes

* Assets path in test-app ([522e2a5](https://github.com/hslayers/hslayers-ng/commit/522e2a5a4c309c5d5b6df8a63e3a36767f7383be))
* Box selection triggering layerlist dropdown ([97d4aff](https://github.com/hslayers/hslayers-ng/commit/97d4aff7b253f31aa497d60f865814a4909becf2))
* Change how package version is imported ([88e13c4](https://github.com/hslayers/hslayers-ng/commit/88e13c49708800977e40791cf3fe66862ac9c4f9))
* Clear style using reset style button ([a07e06e](https://github.com/hslayers/hslayers-ng/commit/a07e06eca1e2eeb6178284a9002af75643fa20aa)), closes [#2149](https://github.com/hslayers/hslayers-ng/issues/2149)
* Disable poperjs dynamic flip  for selection dropdown ([b72fe5d](https://github.com/hslayers/hslayers-ng/commit/b72fe5dee3f0db1d7a334b8f698ef21cdda848e4))
* Dont clear all GET params and rename hsl ones ([56216a9](https://github.com/hslayers/hslayers-ng/commit/56216a90d68d008534c8c4608d706903425fdf1c)), closes [#2098](https://github.com/hslayers/hslayers-ng/issues/2098) [#2084](https://github.com/hslayers/hslayers-ng/issues/2084)
* Dont export schema.json ([a716ca1](https://github.com/hslayers/hslayers-ng/commit/a716ca1525361692c445625a1ac7d2636fde8570))
* Draw layer metadata header size ([cb924f4](https://github.com/hslayers/hslayers-ng/commit/cb924f4a8db51f91282f8ad8676127c3b0438c05))
* Make draw type 'selection' button act as a toggle ([5a6d491](https://github.com/hslayers/hslayers-ng/commit/5a6d491a9dba14da511bdb3d9299941b3390d68a))
* **dimensions:** Parse timePoints at all places ([fad6fd3](https://github.com/hslayers/hslayers-ng/commit/fad6fd34d4829d22a92312cd60c86452c228368c)), closes [#2033](https://github.com/hslayers/hslayers-ng/issues/2033)
* Fix opacity read/write in SLD ([b178cd0](https://github.com/hslayers/hslayers-ng/commit/b178cd080610b6ba1b53d7c02f0fbed9a91a8242)), closes [#2081](https://github.com/hslayers/hslayers-ng/issues/2081) [#1956](https://github.com/hslayers/hslayers-ng/issues/1956)
* Gen SLD for default style in layers in HsConfig ([05ccc55](https://github.com/hslayers/hslayers-ng/commit/05ccc5528e07901dd5d715888d2f0256a1072757)), closes [#2052](https://github.com/hslayers/hslayers-ng/issues/2052)
* Limit wms layers shown by default to 100 ([deac56d](https://github.com/hslayers/hslayers-ng/commit/deac56d895e969ec8cd9cdbb54baa587facaf786)), closes [#1870](https://github.com/hslayers/hslayers-ng/issues/1870)
* Repair potential template problems ([93cbb89](https://github.com/hslayers/hslayers-ng/commit/93cbb89263b65ae6c08bc570624cb1a9c1c89b53))
* **add-layers:** Hide time-picker when unsupported ([6f16131](https://github.com/hslayers/hslayers-ng/commit/6f161317f5bcb2378f31cd6898172eb360ee41fd)), closes [#1868](https://github.com/hslayers/hslayers-ng/issues/1868)
* popUp attributes not visible ([73cdab5](https://github.com/hslayers/hslayers-ng/commit/73cdab5c3d29210edc827f9f4ef36cec7cce53f7))
* Properly select and add layer loaded through url param 'wms_layers' ([252bd09](https://github.com/hslayers/hslayers-ng/commit/252bd09cc7bc19ac5d1dd9b9accf2b65b1161da9))
* Support OL 6.6 type mappings ([#2082](https://github.com/hslayers/hslayers-ng/issues/2082)) ([b1a98bf](https://github.com/hslayers/hslayers-ng/commit/b1a98bfe67f249563ef46cb9ea11181b17a5ec35))
* **add-data-vector:** Check is layer clustered before adding features to existing one ([b04e2ef](https://github.com/hslayers/hslayers-ng/commit/b04e2ef13f5f9a2d8658ff82394f5556b1344ca4))
* **add-data-vector:** Enhance loading of shp,gpx and kml features ([83a4c6f](https://github.com/hslayers/hslayers-ng/commit/83a4c6fcf17698afdbef316db697ed0db38621a7))
* **add-data-vector-service:** Allow to add layer from geojson/json without any features ([09ae3fa](https://github.com/hslayers/hslayers-ng/commit/09ae3fa7146e35bef1292e0c04bf07e9a8a45e73))
* **LM:** Add missing icon-move glyph ([6c20447](https://github.com/hslayers/hslayers-ng/commit/6c204478ddba4f2db0eca4834cec6ee09d0c5864))
* **save-map:** Replace incorrect function that serializes layers features ([3104a91](https://github.com/hslayers/hslayers-ng/commit/3104a9162bb16094c3df656a66512725736ffc09))
* **trip-planner:** Check if waypoint.routes exists before anything ([bc35d75](https://github.com/hslayers/hslayers-ng/commit/bc35d75db3179fa015f0ab05a0d2da3685029842))


### Features

* Add queue library to npm peer dependencies ([58954f8](https://github.com/hslayers/hslayers-ng/commit/58954f830597f40c4e3b5c1395729578f59b8818)), closes [#1886](https://github.com/hslayers/hslayers-ng/issues/1886)
* Add selection type menu dropdown to draw-toolbar ([eae4cdb](https://github.com/hslayers/hslayers-ng/commit/eae4cdb0960e1c0ce4610ea359262170b095f328))
* Allow box selection of multiple features and ability to download/remove them at once ([5a1ac95](https://github.com/hslayers/hslayers-ng/commit/5a1ac951a149ce7ca747b44e700f24a086e394cd))
* Allow uploading of geojson features to existing layer ([7175f5b](https://github.com/hslayers/hslayers-ng/commit/7175f5b2d5a10282e4a031633fad5b8dc470e657))
* Allow uploading of kml features to existing layer ([475d073](https://github.com/hslayers/hslayers-ng/commit/475d073c11cb8eef726be658e127a527dbf00a65))
* Cache capabilities between layers from same wms ([d66329a](https://github.com/hslayers/hslayers-ng/commit/d66329a513beaef7c0b2e6ce36b9cfe76660e2e9))
* Create upload and reset of SLD in styler ([9ac5348](https://github.com/hslayers/hslayers-ng/commit/9ac5348deda1f76e64927edcf020071eccd2c42d))
* Export everything ([610bd46](https://github.com/hslayers/hslayers-ng/commit/610bd4675b8a69e65a062692ad9b7aa4c70ba709))
* Load SLD for WFS served by Layman ([7b5d54b](https://github.com/hslayers/hslayers-ng/commit/7b5d54b8ea0a5111b0a86bec49b093ef03c3ff9b)), closes [#2046](https://github.com/hslayers/hslayers-ng/issues/2046)
* Support download of current layers style in SLD ([011f293](https://github.com/hslayers/hslayers-ng/commit/011f2936d64d3ddbbfca68bc88681c7f5ce04a3a)), closes [#2046](https://github.com/hslayers/hslayers-ng/issues/2046)
* Use resumablejs to upload data larger than 2mb in chunks ([801834f](https://github.com/hslayers/hslayers-ng/commit/801834fb10a6002f7e1f56854bfed5ca87882eb8))
* **add-data-url-wms:** Run capabilities/legend requests in queue ([a39ccde](https://github.com/hslayers/hslayers-ng/commit/a39ccdee7392ef026458d9fac1eb2d56ef12e130))
* **add-data-wms:** Set some CRS even when missing ([e8af9db](https://github.com/hslayers/hslayers-ng/commit/e8af9db3b1bc49af4dafa07c372594325c29c5d3))
* **attribute-row:** Stringify complex feature object attribute values for display ([d0ccc79](https://github.com/hslayers/hslayers-ng/commit/d0ccc7933afa77fef9badda3c8eabe77bab6e1d4))
* **layout:** allow percentage values in HsConfig.panelWidths array ([3f4124c](https://github.com/hslayers/hslayers-ng/commit/3f4124c42eca8598586b26fa31f27996f5b3a8ec))
* **material:** extend LayerManagerComponent ([9e57084](https://github.com/hslayers/hslayers-ng/commit/9e570840a529219e2371add31aadb34c1ff33b28))
* **time-editor:** Add "out of range" explanation ([452fc71](https://github.com/hslayers/hslayers-ng/commit/452fc714f587725194b7460d69c273d1667dba43)), closes [#1995](https://github.com/hslayers/hslayers-ng/issues/1995)
* Support downloading of queried feature as GeoJSON ([ac08ac4](https://github.com/hslayers/hslayers-ng/commit/ac08ac40c584a558d97130247dd216fd81011ee0))


### Performance Improvements

* fix HMR and improve recompiling test app ([7cf007d](https://github.com/hslayers/hslayers-ng/commit/7cf007ded7624155efbae4bbf284d046dffb0139))


### Reverts

* Change back proxy port to 8085 ([62c2cfd](https://github.com/hslayers/hslayers-ng/commit/62c2cfd220ef38e57de03ceb11dfc13a4d2811d4))


### BREAKING CHANGES

* Adds resumablejs as a new dependency
* `npm i queue`



# [5.1.0](https://github.com/hslayers/hslayers-ng/compare/5.0.0...5.1.0) (2021-08-03)

This version sets upper bound of OpenLayers peer dependency to ~6.5 which mitigates failing compilation of hslayers-ng using OL 6.6 that could be incorrectly automatically installed with hslayers-ng 5.0 version.

### Bug Fixes

* Move Cesium terrainExaggeration peropery to globe ([7b00cd3](https://github.com/hslayers/hslayers-ng/commit/7b00cd394f8293dc3b0e30a8ef81e3a6eb2770b5))
* **hslayers-app:** Use update() on HsConfig object ([4dc87af](https://github.com/hslayers/hslayers-ng/commit/4dc87afbf347a62cda41c75900321f1a4e25ff4c))
* Load trip planner routes sequentially ([25c7f35](https://github.com/hslayers/hslayers-ng/commit/25c7f355bc0fdcd74180ab840939f8ae4fd97d8e))
* Pass all view options when cloning the view ([5529d15](https://github.com/hslayers/hslayers-ng/commit/5529d158e0a569d97b71b550bfa966ebdbef0175)), closes [#2034](https://github.com/hslayers/hslayers-ng/issues/2034)
* Read SLD style file for shp ([0164a78](https://github.com/hslayers/hslayers-ng/commit/0164a7896d3011f2d17fc1cc3d1a91c3ca4f3e71))
* Trip planner feature serialization bug ([2e42cc5](https://github.com/hslayers/hslayers-ng/commit/2e42cc5c4448a647ece309cdbd76d1d1a6cf46a3)), closes [#2036](https://github.com/hslayers/hslayers-ng/issues/2036)
* Wait for drawables before accessing them ([ccc705c](https://github.com/hslayers/hslayers-ng/commit/ccc705c219be00a450c219b82534142b0b03251f))
* **compositions-parser:** Check if layers exist before looping through them ([58aed58](https://github.com/hslayers/hslayers-ng/commit/58aed58c75c35c163a87a8e6d7c22b0d24d1e25a))
* **deps:** Stick ol to version 6.5 for a while ([06e23fa](https://github.com/hslayers/hslayers-ng/commit/06e23faaf81a7ac281859164eabc310fbf03e4e6))
* **draw:** Get drawables only after map is loaded ([c1f3d00](https://github.com/hslayers/hslayers-ng/commit/c1f3d00d4357b8120690ff879f9a4e7f162fe3f7)), closes [#2030](https://github.com/hslayers/hslayers-ng/issues/2030)
* **layout:** Hide basemapgallery and deafult view button on guiOverlay false ([f12b0cf](https://github.com/hslayers/hslayers-ng/commit/f12b0cfe90ece8b3e4301582461ef0e4b48d5149))
* **layout:** Hide sidebar if HsConfig.pureMap is set to true ([9411940](https://github.com/hslayers/hslayers-ng/commit/9411940e9d24483a5145cbb00c0d7b7e2e7026f2))
* **layout:** Hide toolbar and geolocation button on guiOverlay false ([f744297](https://github.com/hslayers/hslayers-ng/commit/f744297b038855334d4a2819d19ba3b5b4e458f5))
* **LM:** Change 'unknown source' error to warning ([a50eec3](https://github.com/hslayers/hslayers-ng/commit/a50eec37a7d021a27b2bc604eaa00aea3a3587ef))


### Features

* **layer-editor:** Ask confirmation when deleting layer ([3a787a3](https://github.com/hslayers/hslayers-ng/commit/3a787a3d2ded3370f9fa0ff1420c4f1064f1d055)), closes [#2040](https://github.com/hslayers/hslayers-ng/issues/2040)
* Accept only SLD format as Shp style ([d97ab98](https://github.com/hslayers/hslayers-ng/commit/d97ab983c125ce74580277da2b79a23b7cac7b6f))
* Inform user about invalid or missing layman endpoint url ([1f043b9](https://github.com/hslayers/hslayers-ng/commit/1f043b9d9248a3373b46848a4f831b01bd538fe2))
* Make truncated WMS service layer title/abstract expandable ([b292624](https://github.com/hslayers/hslayers-ng/commit/b29262405ddbd6f232e752c292a7f223a562d11e))
* Switch title and name also in nested WMS layers table ([6113f47](https://github.com/hslayers/hslayers-ng/commit/6113f4733d6a7c5a094a7edb27b4f12b5da42e26))



# [5.0.0](https://github.com/hslayers/hslayers-ng/compare/4.0.1...5.0.0) (2021-07-23)


### Bug Fixes

* **draw:** Undefined wfs layer endpoint ([f7fe98b](https://github.com/hslayers/hslayers-ng/commit/f7fe98b492410e5121763c7caccc6844de3c71e3)), closes [#1996](https://github.com/hslayers/hslayers-ng/issues/1996)
* Accept JSON in vectorFileInput ([11c3b5e](https://github.com/hslayers/hslayers-ng/commit/11c3b5e9becbb9ba6f77023c7b0e7834c8755342))
* Apply string function toLowerCase, for uploaded ([46a1245](https://github.com/hslayers/hslayers-ng/commit/46a12455796987ddfa21bcb3693c403e6f2d8411))
* Change default Layman cookie name so the auth doesn't interfere with other apps ([5b67ecf](https://github.com/hslayers/hslayers-ng/commit/5b67ecf5fe6d8cb92fd634cefbafe18d0942b6b7))
* Check either for a feature or coordinate to show feature info panel ([3d4de73](https://github.com/hslayers/hslayers-ng/commit/3d4de73cf19339f128a7673356f7cdc8e9dc0001))
* Check if capabilities_xml is there before reading it for layer metadata ([176477d](https://github.com/hslayers/hslayers-ng/commit/176477d339810a429de4498b0a87f9b2503c106f))
* Correct ng-bootsrap and cookie versions for ng11 ([7862d90](https://github.com/hslayers/hslayers-ng/commit/7862d90f5977b6c119e2f52ca41f685387374193))
* Defer bootstrapping of cesium-app ([003bc8d](https://github.com/hslayers/hslayers-ng/commit/003bc8d84e342f8fb981c776923d20a5abfa1053))
* Differentiate message for routing errors ([54cdf3e](https://github.com/hslayers/hslayers-ng/commit/54cdf3e001b83e6ccd8c02b1b623dc2129bb42ee))
* Don't overwrite a configured legend with info from getCaps ([d3576d4](https://github.com/hslayers/hslayers-ng/commit/d3576d4c7486eab128a94ac16753d77e7f44b94c)), closes [#1860](https://github.com/hslayers/hslayers-ng/issues/1860)
* Don't populate invalid undefined layers if any ([75a6721](https://github.com/hslayers/hslayers-ng/commit/75a6721e7e7f5ca878257790e07ff5d26bf96519))
* Don't show popup if the title is empty ([4501c2d](https://github.com/hslayers/hslayers-ng/commit/4501c2de4b6342aa85547d21e41a76cf1e97c743))
* Find all CRS definitions in a service ([f1d6d07](https://github.com/hslayers/hslayers-ng/commit/f1d6d07dc1d54edd7bb170306541d2c50a83e36b))
* Fix invisiblePopup undefined error ([#1855](https://github.com/hslayers/hslayers-ng/issues/1855)) ([47281fd](https://github.com/hslayers/hslayers-ng/commit/47281fd2be8fbce0ae91b6118a88fb22c2797b96))
* Hide Only mine filter if user is not logged in Layman ([72dc68a](https://github.com/hslayers/hslayers-ng/commit/72dc68ad87b5d3120259da98c4a398b79441176e))
* Load composition data from cookies only if it is anticipated ([f5ba7b2](https://github.com/hslayers/hslayers-ng/commit/f5ba7b23887ed8d76091d815ba9372857cbf84ee))
* Make composition&progress info div smaller ([3c7e9ff](https://github.com/hslayers/hslayers-ng/commit/3c7e9ff0595d80592cc81f6b031a4bbda784822d))
* Make loading progress message disappear on layer load ([ddfe5c0](https://github.com/hslayers/hslayers-ng/commit/ddfe5c05cf10d7f4a0960f3255569e1f1f886887))
* Minor tweaks and linting ([4dc3964](https://github.com/hslayers/hslayers-ng/commit/4dc39645fd2c731cc65704a53cbf512c85352307))
* Remove feature from modify interaction when deleting ([5540671](https://github.com/hslayers/hslayers-ng/commit/5540671ae98e9e1429bb20142feab9d464d87cd8)), closes [#1821](https://github.com/hslayers/hslayers-ng/issues/1821)
* Remove fill-opacity param for mark symbolizer ([a339dbb](https://github.com/hslayers/hslayers-ng/commit/a339dbb4ab3a5f5902a359e27d899aa744f7eb09))
* Remove private to make method optional ([ec1908d](https://github.com/hslayers/hslayers-ng/commit/ec1908da524bd9b7406c4cb0fd71af48b9063d89))
* **auth:** Move duplicit Laymen error notification to common service ([016b43a](https://github.com/hslayers/hslayers-ng/commit/016b43a504cc306d178204da7f9d305b3f4f2b9e))
* **compositions:** Use thumbnail.url ([3ca9a12](https://github.com/hslayers/hslayers-ng/commit/3ca9a12be2bcffb689e67addeff6a641b65f69ef))
* **draw:** Added addedLayersRemoved property to correctly reset draw layerSelected ([e278c11](https://github.com/hslayers/hslayers-ng/commit/e278c11ce0e1da57b5fc2c35f1ed0da09913a43c))
* **draw:** Check if any layer is selected before looking for source ([421b464](https://github.com/hslayers/hslayers-ng/commit/421b46431b420f9c22a90ab3a54d968b4d1e1f2a))
* **draw:** Fill drawable layers on map reset ([082a87c](https://github.com/hslayers/hslayers-ng/commit/082a87c412dec551c44ae4297ca525439b45b823))
* **draw:** Sync tmp features with already existing layman layer ([a407882](https://github.com/hslayers/hslayers-ng/commit/a4078821a0cc866e74178ee81f781773d76f09e9))
* **history-list:** Potential fix - do not  add null or undefined url to history list ([443dd39](https://github.com/hslayers/hslayers-ng/commit/443dd39bd6a3a40d6703c0a7afc1a9eb4a543031))
* **layman:** Throw error if layer description is missing url ([b34528d](https://github.com/hslayers/hslayers-ng/commit/b34528dd3ca5091011a0955eeb15ae9ec95e0e5d))
* Add default line symbolizer for new layers ([535000e](https://github.com/hslayers/hslayers-ng/commit/535000ed1f0ddc2540e16565ccb14bb737de609c))
* Added HsStylerPartBaseComponent to styles module ([8a67b52](https://github.com/hslayers/hslayers-ng/commit/8a67b52942f7c42db71baa6f294592b0a01bfdb8))
* Adding drawing layer fails when auth change ([eae03ad](https://github.com/hslayers/hslayers-ng/commit/eae03ad97aab826b48b4ac725d8f71d741c3098b))
* Async loading of compositions ([cb340a5](https://github.com/hslayers/hslayers-ng/commit/cb340a502f233670393c980e92cccc8c964d0df4))
* Backwards compatibility of custom hsl style serialization ([cb414f6](https://github.com/hslayers/hslayers-ng/commit/cb414f60cf98a609e7158c0af4b085ecd198e154))
* Encode styler colors as rgba instead of hex ([1653e61](https://github.com/hslayers/hslayers-ng/commit/1653e61b8ea98c688e200fc093c93362e80bb73c))
* Error about undefined symbolizer offset ([eac5db2](https://github.com/hslayers/hslayers-ng/commit/eac5db2e734f4957fbab0e8484ab266b2060ab55))
* Feature counts for cluster on enabling cluster ([3c309e4](https://github.com/hslayers/hslayers-ng/commit/3c309e443083b879e6a23a12c30ed18fee95ada1))
* Legend generation for cluster layers with SLD ([e4a61de](https://github.com/hslayers/hslayers-ng/commit/e4a61deacd8a3acf4c7e0da71adbb77fff233c03))
* Make styler controls smaller ([bac25b5](https://github.com/hslayers/hslayers-ng/commit/bac25b59bc109fe6396c43db97f845924ca01e5a))
* Remove declutter option ([1987fd9](https://github.com/hslayers/hslayers-ng/commit/1987fd97aa17a459fe993ca76fc432d5038901ce))
* Update tmp layer properties on authChange ([e48319b](https://github.com/hslayers/hslayers-ng/commit/e48319b236213e86cd480427eaaf00704e2dd916))
* **layer-editor-vector-layer:** Check geometryFunction feature ([1b6d735](https://github.com/hslayers/hslayers-ng/commit/1b6d735001e2567b44023ebd09d3a75eb6fe906e)), closes [#1955](https://github.com/hslayers/hslayers-ng/issues/1955)
* **server:** Change token refresh mechanism, logout when auth fails ([fa8803e](https://github.com/hslayers/hslayers-ng/commit/fa8803e466f690be2870e6e5f901c3c54f2c2b53))
* **Styler:** Refactor symbolizerIcons handling ([7118b44](https://github.com/hslayers/hslayers-ng/commit/7118b4426d0170d7d27d00f41ee60ed4a04d4416))
* **utils:** Safely check instOf for nullish values ([0c7c72d](https://github.com/hslayers/hslayers-ng/commit/0c7c72dcfa640a009e85f4b9bc887796eea4894e))
* Add geojson from url ([a8f51b9](https://github.com/hslayers/hslayers-ng/commit/a8f51b9f41a59315c93e37d328f787a2f9bda1e8)), closes [#1946](https://github.com/hslayers/hslayers-ng/issues/1946)
* Disable individual feature styling in draw panel ([8f8b6ab](https://github.com/hslayers/hslayers-ng/commit/8f8b6ab042cb07361791b793eb038efbe343affd))
* Make style parsing related functions async ([04c86ec](https://github.com/hslayers/hslayers-ng/commit/04c86ec9d923728861ccba61c748a513269f52fc))
* Notify about non-working sld atrributes ([f00c725](https://github.com/hslayers/hslayers-ng/commit/f00c7255273e11376e98b88a8576c5ec90e78e9a))
* Remove most styler icons ([dd74336](https://github.com/hslayers/hslayers-ng/commit/dd74336bc85f5f24b8bf203745616fe71db7d094))
* Removed scss warnings when building the library ([2e001d2](https://github.com/hslayers/hslayers-ng/commit/2e001d246963108a08b4e31286303b46c60e7247))
* Removing of style rules and reset to default ([65e73ca](https://github.com/hslayers/hslayers-ng/commit/65e73cad9facc31467982766ac414e8b30cd2d90))
* Replace 'show' CSS class with [hidden] ([c953b89](https://github.com/hslayers/hslayers-ng/commit/c953b89e9291178a25953a1a0ea86da2c8129fbd))
* Replaced deprecated TestBed .get with .inject function ([9c91fe7](https://github.com/hslayers/hslayers-ng/commit/9c91fe7cf73860fede4cac7e1b79400d7a26a2a5))
* Revert wrong dependencies ([26493e9](https://github.com/hslayers/hslayers-ng/commit/26493e9b73a141ff3b62fb6be0cd108057f8bb71))
* Rework auto cluster style creation ([1bbf058](https://github.com/hslayers/hslayers-ng/commit/1bbf05872bb6e26a5f833931014782bce0dae631))
* Select all layers from url correctly ([d51231e](https://github.com/hslayers/hslayers-ng/commit/d51231efd31dd3c7c616ef9711dc294854110858))
* Send correct access rights parameters to layman ([3e504f0](https://github.com/hslayers/hslayers-ng/commit/3e504f0d19140835e1ac8cd49010ad6c6ae67137)), closes [#1842](https://github.com/hslayers/hslayers-ng/issues/1842)
* Set correct return type for layermanager getLayerByTitle function ([67d1f2e](https://github.com/hslayers/hslayers-ng/commit/67d1f2e79267a44972ad76bb70c969ab33bc0a7b))
* Set default cesiumBase path if not already set by the user ([06f8879](https://github.com/hslayers/hslayers-ng/commit/06f8879763303b28e266c186ce76df701a2011c5))
* Set file type filter in open files dialog ([ef085e1](https://github.com/hslayers/hslayers-ng/commit/ef085e12f658d00526bde01ce967656b3a66948d)), closes [#1797](https://github.com/hslayers/hslayers-ng/issues/1797)
* Set matched results to length of array when x-total-count head is missing for compositions ([e4189ea](https://github.com/hslayers/hslayers-ng/commit/e4189ea75f599691dea876b4856ff4ea8cf3c206))
* Show feature info panel after drawing new geometries ([1e29100](https://github.com/hslayers/hslayers-ng/commit/1e291007999b0ca2da4c2764741c7e3b94176bc8))
* Show only last 5 toast error messages ([59d0375](https://github.com/hslayers/hslayers-ng/commit/59d0375c6b672a1ff1600f922f3540c66ae6f7d6)), closes [#1869](https://github.com/hslayers/hslayers-ng/issues/1869)
* Simplify styling based on geometry types ([5b73640](https://github.com/hslayers/hslayers-ng/commit/5b73640a20547b60202fa6ffa04cb45eadecc845))
* Styler color unreadable for dark colors ([f15d4f3](https://github.com/hslayers/hslayers-ng/commit/f15d4f3f13bec98169abbf01d88d76fa9873515e)), closes [#1959](https://github.com/hslayers/hslayers-ng/issues/1959)
* Toast message width ([81a053a](https://github.com/hslayers/hslayers-ng/commit/81a053a50c28dcc06a3f0d75cfba7419853c2ffe))
* Unreachable side-buttons on small screens ([08f5808](https://github.com/hslayers/hslayers-ng/commit/08f5808b6d60be64f28131da696d45757e54f3bf))
* Updating style on filter change ([1ab2c19](https://github.com/hslayers/hslayers-ng/commit/1ab2c19ed99d477a24bf064efcbadb19c067d770))
* **layman:** select proper layer bbox ([4364dcc](https://github.com/hslayers/hslayers-ng/commit/4364dcc3fb606c13f4fd78161101b6ee3eec74df)), closes [#1862](https://github.com/hslayers/hslayers-ng/issues/1862)
* **routing:** Don't add waypoints on draw and measure ([c84df50](https://github.com/hslayers/hslayers-ng/commit/c84df501c0251ee731e979dfa392ea8f3d1841a8))
* Trim external source url before data request ([402133a](https://github.com/hslayers/hslayers-ng/commit/402133ad4944da0f11d69595f159bb7a3d52b05d))
* Unsubscribe all component subs onDestroy ([00eaa2e](https://github.com/hslayers/hslayers-ng/commit/00eaa2e8d2a9bd2a80331793c9b5c16e4f627734))
* Update checked file extensions when adding vector url ([4117a36](https://github.com/hslayers/hslayers-ng/commit/4117a36d043e220002b7ca702fe5e94043727425))
* Use the wms legend from selected style instead of hardcoded first one in add-data panel ([244aa62](https://github.com/hslayers/hslayers-ng/commit/244aa626683a096e5617d1abec6c3f4902c1b725)), closes [#1860](https://github.com/hslayers/hslayers-ng/issues/1860)


### Build System

* Add geostyler-style and geostyler-sld-parser dependencies ([04fc82a](https://github.com/hslayers/hslayers-ng/commit/04fc82a987c98d4b61aba6a3e8e5df77a849995d)), closes [#1822](https://github.com/hslayers/hslayers-ng/issues/1822)
* Add ngx-color dependency ([5b701ac](https://github.com/hslayers/hslayers-ng/commit/5b701ac37b33d26ed6232422772ce7e5e9f864a4))
* Upgrade to Angular 11 ([9dedc4f](https://github.com/hslayers/hslayers-ng/commit/9dedc4f2ff9a4defd30d300ba00f7cb9d3fa4c4e)), closes [#1803](https://github.com/hslayers/hslayers-ng/issues/1803)


### Code Refactoring

* Rename newLayerStyleSet event subject to onSet ([96290a3](https://github.com/hslayers/hslayers-ng/commit/96290a382d1ea70554d240af3b104732bfe07803))


### Features

* **LayerManager:** Expose layer source type & URL ([13cc39e](https://github.com/hslayers/hslayers-ng/commit/13cc39e850d8f7187eaf38ef26e373c3e83e47d8))
* **styler:** Add warning to unsupported sliders ([46b6806](https://github.com/hslayers/hslayers-ng/commit/46b6806d14ed7ffee1291830fba85d961fcfc004))
* Ability to cancel url request from add data ([638e845](https://github.com/hslayers/hslayers-ng/commit/638e845b5724df7ed4adb18af4c77ccc552ef4e2))
* Add a hack to style cluster layers using SLD ([13e38dd](https://github.com/hslayers/hslayers-ng/commit/13e38ddeaeab27b2167268b48a20534ec71d26a9))
* Add graphicsFill and graphicStroke sub-symbolizers ([9f98718](https://github.com/hslayers/hslayers-ng/commit/9f98718db4193869886e1ee4a5cba75bf87b6c4e))
* Add line symbolizer for SLD and minor tweaks ([cf21dcb](https://github.com/hslayers/hslayers-ng/commit/cf21dcb9bce56bfd5f0240ab13e95e3d11cd2663))
* Add selectors for tripplanner route/waypoint layer ([c9de558](https://github.com/hslayers/hslayers-ng/commit/c9de5586c307caf3301e4579a5e1a54686c30622)), closes [#1927](https://github.com/hslayers/hslayers-ng/issues/1927) [#1925](https://github.com/hslayers/hslayers-ng/issues/1925)
* Add support for scale denominators in SLD editor ([2e2935b](https://github.com/hslayers/hslayers-ng/commit/2e2935b0a1010915bf6f54984b7b4422b28c6ccf))
* Add support for SLD filters by attribute values ([e5780ff](https://github.com/hslayers/hslayers-ng/commit/e5780ff66669a5db44c1b4a723acff14dabbf1bd)), closes [#1822](https://github.com/hslayers/hslayers-ng/issues/1822)
* Add test application project ([3af6c57](https://github.com/hslayers/hslayers-ng/commit/3af6c57ac662ca4b25d1531410f0d8604dce5705))
* Allow save/overwrite compositon opitons ([2ea4eeb](https://github.com/hslayers/hslayers-ng/commit/2ea4eeb064152084572480077ae50b506ebf07ba)), closes [#1907](https://github.com/hslayers/hslayers-ng/issues/1907)
* Allow to disable automatic legend ([fb43ecd](https://github.com/hslayers/hslayers-ng/commit/fb43ecd604abf7850d84af0e795110a45ea3f818))
* Allow to snap to layer features on selection mode ([2d0e030](https://github.com/hslayers/hslayers-ng/commit/2d0e03045f238f10a1cc5bb40aa9fa6cfafc7aaa))
* Create layman access-rights component ([18d4993](https://github.com/hslayers/hslayers-ng/commit/18d499336ed637e2b6a61cb6a636b8b30a7daabd))
* Disable snapping when using selection mode in draw panel ([d3af2b7](https://github.com/hslayers/hslayers-ng/commit/d3af2b783933ecb619891863127a28236b2f6f87)), closes [#1820](https://github.com/hslayers/hslayers-ng/issues/1820)
* Generate SLD from OL style. Improve cluster style ([43403ab](https://github.com/hslayers/hslayers-ng/commit/43403ab5ff3aadf838a6ae9e6fe35f84d86fa052))
* Provide dash pattern for line symbolizer ([4159c35](https://github.com/hslayers/hslayers-ng/commit/4159c35278f90e29182f33945db0609ac273fded))
* Provide default style for new layers in SLD ([95eab68](https://github.com/hslayers/hslayers-ng/commit/95eab68df7f7c351ae87aff20ad65e759a38e23b))
* **styler:** Add dialog to select icon for iconSymbolizer ([6db1622](https://github.com/hslayers/hslayers-ng/commit/6db1622aa8e1b88d6f5250c78c3bb1065896aad0))
* **test-app:** Add symbolizer icons ([5663a63](https://github.com/hslayers/hslayers-ng/commit/5663a6308a7fe4440fcc1f161f02ece2514ba40a))
* Add workspace layer property to composition schema ([a640a3c](https://github.com/hslayers/hslayers-ng/commit/a640a3ce98fffc47d1c42ea05fd37dbad5f1fbf7))
* Parse and fill SLD style for editing ([8508ec5](https://github.com/hslayers/hslayers-ng/commit/8508ec56525da1d4c7a56afe87993dd81f562075))
* Save external WFS service to composition under hs.format.externalWFS vector format ([c5d6146](https://github.com/hslayers/hslayers-ng/commit/c5d6146ecc32cd58efc344cc6e2e14cdec01e668))
* Support renaming of SLD rules ([ee0c108](https://github.com/hslayers/hslayers-ng/commit/ee0c108643405bb5edd2fdd826662f525411b440))
* Support SLD rule and symbolizer editing and serialization ([d71bee9](https://github.com/hslayers/hslayers-ng/commit/d71bee965233cf3a77662e972e78bec297773ddd)), closes [#1822](https://github.com/hslayers/hslayers-ng/issues/1822)
* Turn off drawing if selected drawing layer turned off ([0afa80d](https://github.com/hslayers/hslayers-ng/commit/0afa80d64000caf45488148d9e74f0ace7cf090f))
* **layermanager:** Cdk drag and drop for physical list ([20123b3](https://github.com/hslayers/hslayers-ng/commit/20123b3ac66bdf68bd6472cd20899acc3e80c233)), closes [#1906](https://github.com/hslayers/hslayers-ng/issues/1906)
* **routing:** Change routing provider to OpenRoutingService ([bd98ffd](https://github.com/hslayers/hslayers-ng/commit/bd98ffd62a82517ae4cde91ae26b9effa5254928)), closes [#1904](https://github.com/hslayers/hslayers-ng/issues/1904)
* **server:** Provide env variable for OpenRoutingService ([80c127b](https://github.com/hslayers/hslayers-ng/commit/80c127b3ea2f698b7e49000a3092443c1fa67d42))
* **wms:** zoom to joint bbox of layer group ([eeef2ce](https://github.com/hslayers/hslayers-ng/commit/eeef2ce1b774f484a49d4c8a3ce457b8c5c1aa62))


### BREAKING CHANGES

* Individual styling of features is removed in draw panel
* declutter function in HsLayerEditorVectorLayerService is removed
* Subscribers of HsStylerService.newLayerStyleSet should rename it to
HsStylerService.onSet
* **styler:** We don't include styler icons in hslayers lib, but the developer should provide an
array of icon definitions through HsConfig. This enables more customization (extra icons) and
reduced hslayers bundle size. Icons should be copied as any other image asset in angular.json. See:
```
 Object.assign(this.HsConfig, {
      symbolizerIcons: [
        {name: 'bag', url: '/assets/icons/bag1.svg'},
        {name: 'banking', url: '/assets/icons/banking4.svg'},
        {name: 'bar', url: '/assets/icons/bar.svg'},
        {name: 'beach', url: '/assets/icons/beach17.svg'},
      ]})
````

Angular.json:
```
 "architect": {
        "build": {
          "builder": "@angular-builders/custom-webpack:browser",
          "options": {
            "assets": [
              {
                "glob": "**/*",
                "input": "projects/test-app/src/assets",
                "output": "./assets"
              },
```
* Add peerDependency ngx-color
* Add peerDependencies geostyler-sld-parser and geostyler-style
* **layermanager:** Added @angular/cdk peerDependency to be able to use drag and drop feature
* **routing:** Be aware to specify OPENROUTESERVICE_API_KEY in .env of hslayers-server because
OpenRoutingService requests are routed through our proxy service to not expose the API key.
* See angular upgrade guide: https://update.angular.io/?l=2&v=10.0-11.0



## [4.0.1](https://github.com/hslayers/hslayers-ng/compare/3.1.0...4.0.1) (2021-05-14)


### Bug Fixes

* Add data from file advanced options not showing ([32767da](https://github.com/hslayers/hslayers-ng/commit/32767da421ce8d7c698453b85f8f640cf5427ac5))
* Add HslayersCesiumComponent to entryComponents ([4085a2a](https://github.com/hslayers/hslayers-ng/commit/4085a2a5d412e2f2e7d37f0b2dd313de35c96b27))
* Added translations for navigations service down ([bab6365](https://github.com/hslayers/hslayers-ng/commit/bab63653bad68a8c456202d260b7e4aef79b92dc))
* Change time dimension config logic ([cbbf141](https://github.com/hslayers/hslayers-ng/commit/cbbf141aabde4492a7e46d56aa0de267c172e2a7))
* Check for the hslayers-server.db directory existence ([bd4c117](https://github.com/hslayers/hslayers-ng/commit/bd4c11792e98bb4be52c8faa4493217d08ecc074))
* Check for the hslayers-server.db directory existence ([e21cfa5](https://github.com/hslayers/hslayers-ng/commit/e21cfa531e0e9c6f35f51d94893e3ce513f90cd5))
* Check if layer is wfs before trying remove on layman ([bf34b79](https://github.com/hslayers/hslayers-ng/commit/bf34b7905cbfeaac2ecccc91768769ec15ddb15d))
* Close toast messages ([467ce92](https://github.com/hslayers/hslayers-ng/commit/467ce923e0c3569dae6f6c378313f8fd3a22adc8))
* Disable X-Forwarded-* headers for WMS not to rewrite domains in capabilities ([a154129](https://github.com/hslayers/hslayers-ng/commit/a1541294b25e3333a3fe02eb1da6111d64034bff))
* Don't fail adding new draw layer if no layman endpoint def found ([49909e0](https://github.com/hslayers/hslayers-ng/commit/49909e0c042bdfb6ae28090334235909c1187e29))
* Dont proxy LAYMAN_BASEURL/micka paths ([11d0937](https://github.com/hslayers/hslayers-ng/commit/11d0937b32b80b66ca92838f142610e6d4b1afae))
* Encode features as Json object instead of string ([315e56a](https://github.com/hslayers/hslayers-ng/commit/315e56abaf61e6bbc1b3ebb0e1d9b853402368d0)), closes [#1398](https://github.com/hslayers/hslayers-ng/issues/1398)
* Fix layman composition sortBy param check ([53d54a5](https://github.com/hslayers/hslayers-ng/commit/53d54a59ae6efea7497ab7b95e3bab5f5a5dbd54))
* Graceful handling of routing service failure ([adee953](https://github.com/hslayers/hslayers-ng/commit/adee953855d1b7f2a7dc29dc2c3b11a67b780902))
* Interactions added twice with ngRouter ([35dbb6b](https://github.com/hslayers/hslayers-ng/commit/35dbb6bce657c01a5dd0ceab5e3ead4ae60e81fb))
* Make all advanced filter section dropdowns in one style ([e7129fe](https://github.com/hslayers/hslayers-ng/commit/e7129fea3ecc712772a880827e54999e86801b95))
* Make sure sidebar state is set after layout is loaded ([74e957e](https://github.com/hslayers/hslayers-ng/commit/74e957eebf16df84d14195d5f0d856617f86ee56))
* Missing http context attribute in server share component ([428954f](https://github.com/hslayers/hslayers-ng/commit/428954f5ae558040fb413684253b0bc2577b7337))
* Remove disfunctional WINDOW_PROVIDERS ([6d47735](https://github.com/hslayers/hslayers-ng/commit/6d47735d1141a0d0db52c8de066433f8a9c5b45f))
* Remove OSM layer from cesium app, since its hidden anyway ([d1cbc0c](https://github.com/hslayers/hslayers-ng/commit/d1cbc0c85ad55888c46c17caba531386d3d8e19b))
* Select all wms layers not enabling 'Add to map' button ([1a1e527](https://github.com/hslayers/hslayers-ng/commit/1a1e5276bab8de7fef99f7efe7f896371d1d8481))
* Set always correct url to the Layman login button ([#1791](https://github.com/hslayers/hslayers-ng/issues/1791)) ([1e7fb45](https://github.com/hslayers/hslayers-ng/commit/1e7fb4521a3ae0546a2e69e7cb4bbccaf7bb7ece))
* Set matched results to length of array when x-total-count header missing ([9de696c](https://github.com/hslayers/hslayers-ng/commit/9de696cf389863ce8b8a20502d48ed01455d4030))
* show layman compositions with micka together ([e5edcf9](https://github.com/hslayers/hslayers-ng/commit/e5edcf94044e9788cd2303df2415636bdb445cd0))
* Single version of OL for hslayers and hsl-app ([79effc1](https://github.com/hslayers/hslayers-ng/commit/79effc1b0c4c75c8154f69d5b27622c30962d794))
* Sort compositions and layers by date starting with the newest ([08791d0](https://github.com/hslayers/hslayers-ng/commit/08791d099e77a27278464ab160858f9709da5370))
* Substitute moment with dayjs ([273108e](https://github.com/hslayers/hslayers-ng/commit/273108e0ab9d6cd28b546a29afa0ec148f1b76bc)), closes [#1805](https://github.com/hslayers/hslayers-ng/issues/1805)
* Update czech translation ([cbfcd2f](https://github.com/hslayers/hslayers-ng/commit/cbfcd2f0b26afad4e7154b4165caa80cc342ef0f))
* Vendor chunk without sourcemap for hslayers-ng-app ([835c188](https://github.com/hslayers/hslayers-ng/commit/835c1882a1a4a1e077a7eb4b228178871850d6b0))
* Wrong structure of layerLoading subscriber ([04ec26e](https://github.com/hslayers/hslayers-ng/commit/04ec26ed6f3b89b86618f4babc6ab84ba68f475c))


### Build System

* Upgrade to Angular 10 ([cd43bd6](https://github.com/hslayers/hslayers-ng/commit/cd43bd6f06f7a72c6fef71b3225766f4070a56a3)), closes [#1752](https://github.com/hslayers/hslayers-ng/issues/1752)


### chore

* Upgrade ngBootstrap to from 6 to 8.0.4 ([8c90202](https://github.com/hslayers/hslayers-ng/commit/8c90202e14c55b5a35634cd972dbe0ee094a2a35)), closes [#1752](https://github.com/hslayers/hslayers-ng/issues/1752)


### Code Refactoring

* Don't use layers source to store loading progress, but descriptor instead ([c035bf9](https://github.com/hslayers/hslayers-ng/commit/c035bf9c870cee304edcaa605686f8ceda794a6d)), closes [#453](https://github.com/hslayers/hslayers-ng/issues/453)


### Features

* Add loading progressbar for base layers ([7db6274](https://github.com/hslayers/hslayers-ng/commit/7db627460b74e2a476de5437f65e6b6e76a24565))
* Add missing cz and sk translations ([78fb9cd](https://github.com/hslayers/hslayers-ng/commit/78fb9cd9384a0041d1b391ea5ee3e176be1e9ba9))
* Add possibility to filter layman drawable layers ([816f8d1](https://github.com/hslayers/hslayers-ng/commit/816f8d11fe7efcc04c2732dce3a695c249a9264d))
* Add redirect button pointing to Micka for compositions ([bad97df](https://github.com/hslayers/hslayers-ng/commit/bad97dfcb7aaf1a53e66681c0f3afcfbf18c0ef5))
* Allow permissions setting in Add data (layers from file) and new draw layers ([00ce36e](https://github.com/hslayers/hslayers-ng/commit/00ce36ee8ef6c142d9128e6c9f210247c07a5797)), closes [#1801](https://github.com/hslayers/hslayers-ng/issues/1801)
* Init hs.source.SPOI handy sub-class ([263b450](https://github.com/hslayers/hslayers-ng/commit/263b450ee98baafdf24c48d99fd9478e1ae9e472))
* Pre-fill hs.source.SPOI query ([78a6670](https://github.com/hslayers/hslayers-ng/commit/78a6670b79963d2b6d0d9de310f5b2bdb74d26ad)), closes [#1648](https://github.com/hslayers/hslayers-ng/issues/1648)


### Reverts

* Revert "build: Add webpack to dependencies of monorepo" ([0251595](https://github.com/hslayers/hslayers-ng/commit/0251595612bfd0d41fbcc525229f34aea4708d45))
* Add sensors entryComponets back ([2dbd518](https://github.com/hslayers/hslayers-ng/commit/2dbd518a727874606676623de5c84506e9f769be))


### BREAKING CHANGES

* Vendor chunk needs to be included in the <script> tags (order doesn't matter)
* Applications which rely on checking layers source 'error' and 'loaded' attributes
would break. We don't expect anyone to do it though, since those attributes were used internaly in
Hslayers. Also HsEventBusService.layerLoadings subject emits different parameter structure:
```
{layer:
Layer, progress: {
  loadCounter: number;
  loadTotal: number;
  loadError: number;
  percents: number;
  loaded: boolean;
  error?: boolean;
  timer?: any;
}}
```
* peerDependency ng-bootstrap is upgraded from 6.0 to 8.0
* See angular upgrade guide: https://update.angular.io/?l=2&v=9.1-10.2



# [3.1.0](https://github.com/hslayers/hslayers-ng/compare/3.0.0...3.1.0) (2021-04-14)


### Bug Fixes

* Change default proxy prefix and test ([52439aa](https://github.com/hslayers/hslayers-ng/commit/52439aa5bd471de94634613cbf05e3d64428e096))
* Defer app bootstraping ([755217d](https://github.com/hslayers/hslayers-ng/commit/755217d9d371d11f6f948d51301d2894badc2769)), closes [#1727](https://github.com/hslayers/hslayers-ng/issues/1727)
* Disable hover popup while drawing and measuring ([585af00](https://github.com/hslayers/hslayers-ng/commit/585af00f61f4b1ef06bab3cd26879a22f1568599)), closes [#1708](https://github.com/hslayers/hslayers-ng/issues/1708)
* Dont import Subscription from internal rxjs ([938e6a4](https://github.com/hslayers/hslayers-ng/commit/938e6a4020ceb8844824ff986995c261e196f891))
* Fix composition layer order ([74fce52](https://github.com/hslayers/hslayers-ng/commit/74fce529ec93d9f1bcf9a9ddf4d7e1e36abec14c))
* Fix filtering of layers in Layer Manager ([8aa29c6](https://github.com/hslayers/hslayers-ng/commit/8aa29c644c4f2e3f540f3e187655e44618b498a2))
* Hover popup background ([1da41f7](https://github.com/hslayers/hslayers-ng/commit/1da41f7dc66d974ff4f6ff56f1d24815646873da))
* Overwrite liferay css in data catalogue dropdown ([3d61a24](https://github.com/hslayers/hslayers-ng/commit/3d61a24ab15756777345794b96037906918b3adf))
* Remove hslayers-server db from repo ([31fc05a](https://github.com/hslayers/hslayers-ng/commit/31fc05ac6f428fe5816c1efafe7d790c7c6c477f))
* Reset base param after layer is added to map ([7afc7d2](https://github.com/hslayers/hslayers-ng/commit/7afc7d2259abfbcbf2c8eebb14425887adc3e275))
* Reset snap source when no drawable layers available ([5b5b587](https://github.com/hslayers/hslayers-ng/commit/5b5b587fe86fbe63a2352eeab016ceadc6f52ab3))
* Update czech translation ([9f46c6b](https://github.com/hslayers/hslayers-ng/commit/9f46c6bd77abac39ca79e6fbd6197a4295e3bffd))
* update legend list on init & typing ([37d0fe9](https://github.com/hslayers/hslayers-ng/commit/37d0fe94616a8605c54e104a79a2bed07febf4f3))


### Features

* Add a way to download vector layer contents as geojson ([f8288d2](https://github.com/hslayers/hslayers-ng/commit/f8288d2b15c552f0d0bfd13c0255c23d9e4a3db2)), closes [#1726](https://github.com/hslayers/hslayers-ng/issues/1726)
* Add option to delete layers from layman directly from datasoruces panel ([becbac4](https://github.com/hslayers/hslayers-ng/commit/becbac4aa0b977930056e5688db392c25180f707))
* Add possiblity to toggle snaping interaction ([49324d1](https://github.com/hslayers/hslayers-ng/commit/49324d1d277c6efdf48bebd5f5bc0114af8fb826)), closes [#1741](https://github.com/hslayers/hslayers-ng/issues/1741)
* Add Slovak translations ([7094cee](https://github.com/hslayers/hslayers-ng/commit/7094ceef1698d2ec3d5cb751a61fb104dd41c46e))
* Also filter base & terrain layers ([4332509](https://github.com/hslayers/hslayers-ng/commit/433250990bfed14c6ae5ce74715cf810af94d922))
* Introduce custom filter pipe ([167e5c5](https://github.com/hslayers/hslayers-ng/commit/167e5c58cb2783c0c9b56d6b3bb3f02df120fa28)), closes [#1717](https://github.com/hslayers/hslayers-ng/issues/1717)


### Performance Improvements

* Disable hmr since it doesn't work in ng9 ([19f946e](https://github.com/hslayers/hslayers-ng/commit/19f946e2b23cc317c1cf16f32bf0322c5e9fbf72))
* Leave the colon out of the translation string ([de5f209](https://github.com/hslayers/hslayers-ng/commit/de5f2097a2af936cde1851a4e0ca8c39b5ea5653))
* Optimize hslayers-app ([2f42797](https://github.com/hslayers/hslayers-ng/commit/2f4279708e8e997f12d19b925747aac7dc57655f))
* Rewrite time step parsing without moment-interval ([6b8dd5d](https://github.com/hslayers/hslayers-ng/commit/6b8dd5daacd6ba34037171d546260677a0648fa2)), closes [#1434](https://github.com/hslayers/hslayers-ng/issues/1434)


### Reverts

* Comments [@returns](https://github.com/returns) for tsdoc ([6ac5ff7](https://github.com/hslayers/hslayers-ng/commit/6ac5ff71c02f1a1333f048870c4e58c74cc18d8e))



# [3.0.0](https://github.com/hslayers/hslayers-ng/compare/2.5.0...3.0.0) (2021-03-26)



# [2.5.0](https://github.com/hslayers/hslayers-ng/compare/2.4.0...2.5.0) (2020-12-22)



# [2.4.0](https://github.com/hslayers/hslayers-ng/compare/2.3.0...2.4.0) (2020-10-02)



# [2.3.0](https://github.com/hslayers/hslayers-ng/compare/2.2.0...2.3.0) (2020-09-02)



# [2.2.0](https://github.com/hslayers/hslayers-ng/compare/2.1.1...2.2.0) (2020-07-28)



## [2.1.1](https://github.com/hslayers/hslayers-ng/compare/2.1.0...2.1.1) (2020-07-24)



# [2.1.0](https://github.com/hslayers/hslayers-ng/compare/2.0.1...2.1.0) (2020-07-10)


### Reverts

* Revert "Add @types/ol" ([6b35a50](https://github.com/hslayers/hslayers-ng/commit/6b35a50c01cbcc4e5f58212c4d1de42805230e48))
* Revert "Add @types/ol" ([d5a6dec](https://github.com/hslayers/hslayers-ng/commit/d5a6dec9bf4af54312019538fd6f3ae1872333c3))



## [2.0.1](https://github.com/hslayers/hslayers-ng/compare/2.0.0...2.0.1) (2020-06-28)



# [2.0.0](https://github.com/hslayers/hslayers-ng/compare/1.24.0...2.0.0) (2020-06-25)



# [1.24.0](https://github.com/hslayers/hslayers-ng/compare/1.23.0...1.24.0) (2020-06-08)



# [1.23.0](https://github.com/hslayers/hslayers-ng/compare/1.22.0...1.23.0) (2020-05-25)



# [1.22.0](https://github.com/hslayers/hslayers-ng/compare/1.21.4...1.22.0) (2020-05-21)



## [1.21.4](https://github.com/hslayers/hslayers-ng/compare/1.21.3...1.21.4) (2020-05-21)



## [1.21.3](https://github.com/hslayers/hslayers-ng/compare/1.21.2...1.21.3) (2020-05-20)



## [1.21.2](https://github.com/hslayers/hslayers-ng/compare/1.21.1...1.21.2) (2020-05-16)



## [1.21.1](https://github.com/hslayers/hslayers-ng/compare/1.21.0...1.21.1) (2020-05-15)



# [1.21.0](https://github.com/hslayers/hslayers-ng/compare/1.20.2...1.21.0) (2020-05-15)



## [1.20.2](https://github.com/hslayers/hslayers-ng/compare/1.20.1...1.20.2) (2020-05-12)



## [1.20.1](https://github.com/hslayers/hslayers-ng/compare/1.20.0...1.20.1) (2020-05-12)



# [1.20.0](https://github.com/hslayers/hslayers-ng/compare/1.19.1...1.20.0) (2020-05-12)



## [1.19.1](https://github.com/hslayers/hslayers-ng/compare/1.19.0...1.19.1) (2020-05-12)



# [1.19.0](https://github.com/hslayers/hslayers-ng/compare/1.18.1...1.19.0) (2020-05-11)



## [1.18.1](https://github.com/hslayers/hslayers-ng/compare/1.18.0...1.18.1) (2020-05-05)



# [1.18.0](https://github.com/hslayers/hslayers-ng/compare/1.17.5...1.18.0) (2020-05-05)



## [1.17.5](https://github.com/hslayers/hslayers-ng/compare/1.17.4...1.17.5) (2020-04-20)



## [1.17.4](https://github.com/hslayers/hslayers-ng/compare/1.17.3...1.17.4) (2020-04-20)



## [1.17.3](https://github.com/hslayers/hslayers-ng/compare/1.17.2...1.17.3) (2020-04-20)



## [1.17.2](https://github.com/hslayers/hslayers-ng/compare/1.17.1...1.17.2) (2020-04-17)



## [1.17.1](https://github.com/hslayers/hslayers-ng/compare/1.17.0...1.17.1) (2020-04-17)



# [1.17.0](https://github.com/hslayers/hslayers-ng/compare/1.16.0...1.17.0) (2020-04-16)



# [1.16.0](https://github.com/hslayers/hslayers-ng/compare/1.15.2...1.16.0) (2020-04-10)



## [1.15.2](https://github.com/hslayers/hslayers-ng/compare/1.15.1...1.15.2) (2020-04-07)



## [1.15.1](https://github.com/hslayers/hslayers-ng/compare/1.15.0...1.15.1) (2020-04-05)



# [1.15.0](https://github.com/hslayers/hslayers-ng/compare/1.14.0...1.15.0) (2020-04-01)



# [1.14.0](https://github.com/hslayers/hslayers-ng/compare/1.13.0...1.14.0) (2020-03-13)



# [1.13.0](https://github.com/hslayers/hslayers-ng/compare/1.12.0...1.13.0) (2020-03-05)



# [1.12.0](https://github.com/hslayers/hslayers-ng/compare/1.11.0...1.12.0) (2020-02-17)



# [1.11.0](https://github.com/hslayers/hslayers-ng/compare/1.10.0...1.11.0) (2020-01-28)



# [1.10.0](https://github.com/hslayers/hslayers-ng/compare/1.9.5...1.10.0) (2020-01-06)



## [1.9.5](https://github.com/hslayers/hslayers-ng/compare/1.9.4...1.9.5) (2019-12-20)



## [1.9.4](https://github.com/hslayers/hslayers-ng/compare/1.9.3...1.9.4) (2019-12-10)



## [1.9.3](https://github.com/hslayers/hslayers-ng/compare/1.9.2...1.9.3) (2019-12-09)



## [1.9.2](https://github.com/hslayers/hslayers-ng/compare/1.9.1...1.9.2) (2019-12-03)



## [1.9.1](https://github.com/hslayers/hslayers-ng/compare/1.9.0...1.9.1) (2019-12-02)



# [1.9.0](https://github.com/hslayers/hslayers-ng/compare/1.8.0...1.9.0) (2019-11-25)



# [1.8.0](https://github.com/hslayers/hslayers-ng/compare/1.7.2...1.8.0) (2019-11-12)



## [1.7.2](https://github.com/hslayers/hslayers-ng/compare/1.7.1...1.7.2) (2019-10-15)



## [1.7.1](https://github.com/hslayers/hslayers-ng/compare/1.7.0...1.7.1) (2019-10-15)



# [1.7.0](https://github.com/hslayers/hslayers-ng/compare/1.6.1...1.7.0) (2019-10-15)



## [1.6.1](https://github.com/hslayers/hslayers-ng/compare/1.6.0...1.6.1) (2019-10-01)



# [1.6.0](https://github.com/hslayers/hslayers-ng/compare/1.5.0...1.6.0) (2019-09-30)



# [1.5.0](https://github.com/hslayers/hslayers-ng/compare/1.4.0...1.5.0) (2019-08-30)



# [1.4.0](https://github.com/hslayers/hslayers-ng/compare/1.3.0...1.4.0) (2019-08-08)



# [1.3.0](https://github.com/hslayers/hslayers-ng/compare/1.2.1...1.3.0) (2019-07-30)



## [1.2.1](https://github.com/hslayers/hslayers-ng/compare/1.2.0...1.2.1) (2019-07-25)



## [1.1.3](https://github.com/hslayers/hslayers-ng/compare/1.1.2...1.1.3) (2019-07-04)



# [1.2.0](https://github.com/hslayers/hslayers-ng/compare/1.1.3...1.2.0) (2019-07-22)



## [1.1.3](https://github.com/hslayers/hslayers-ng/compare/1.1.2...1.1.3) (2019-07-04)



## [1.1.2](https://github.com/hslayers/hslayers-ng/compare/1.1.1...1.1.2) (2019-07-03)



## [1.1.1](https://github.com/hslayers/hslayers-ng/compare/1.0.2...1.1.1) (2019-07-02)



# [1.1.0](https://github.com/hslayers/hslayers-ng/compare/1.0.1...1.1.0) (2019-07-02)



## [1.0.2](https://github.com/hslayers/hslayers-ng/compare/1.1.0...1.0.2) (2019-07-02)



# [1.1.0](https://github.com/hslayers/hslayers-ng/compare/1.0.1...1.1.0) (2019-07-02)



## [1.0.1](https://github.com/hslayers/hslayers-ng/compare/1.0.0...1.0.1) (2019-05-31)



# [1.0.0](https://github.com/hslayers/hslayers-ng/compare/0.12.1...1.0.0) (2019-05-27)



## [0.12.1](https://github.com/hslayers/hslayers-ng/compare/0.12.0...0.12.1) (2019-05-15)



# [0.12.0](https://github.com/hslayers/hslayers-ng/compare/0.11.1...0.12.0) (2019-05-15)



## [0.11.1](https://github.com/hslayers/hslayers-ng/compare/0.11.0...0.11.1) (2019-04-05)



# [0.11.0](https://github.com/hslayers/hslayers-ng/compare/0.10.3...0.11.0) (2019-04-05)



## [0.10.3](https://github.com/hslayers/hslayers-ng/compare/0.10.2...0.10.3) (2019-04-01)



## [0.10.2](https://github.com/hslayers/hslayers-ng/compare/0.10.1...0.10.2) (2019-04-01)



## [0.10.1](https://github.com/hslayers/hslayers-ng/compare/0.10.0...0.10.1) (2019-04-01)



# [0.10.0](https://github.com/hslayers/hslayers-ng/compare/0.9.3...0.10.0) (2019-04-01)



## [0.9.3](https://github.com/hslayers/hslayers-ng/compare/0.9.2...0.9.3) (2019-03-26)



## [0.9.2](https://github.com/hslayers/hslayers-ng/compare/0.9.1...0.9.2) (2019-03-26)



## [0.9.1](https://github.com/hslayers/hslayers-ng/compare/0.9.0...0.9.1) (2019-03-26)



# [0.9.0](https://github.com/hslayers/hslayers-ng/compare/0.8.0...0.9.0) (2019-03-26)



# [0.8.0](https://github.com/hslayers/hslayers-ng/compare/0.7.2...0.8.0) (2019-03-25)



## [0.7.2](https://github.com/hslayers/hslayers-ng/compare/0.7.1...0.7.2) (2019-03-15)



## [0.7.1](https://github.com/hslayers/hslayers-ng/compare/0.7.0...0.7.1) (2019-03-15)



# [0.7.0](https://github.com/hslayers/hslayers-ng/compare/0.6.3...0.7.0) (2019-03-15)



## [0.6.3](https://github.com/hslayers/hslayers-ng/compare/0.6.2...0.6.3) (2019-03-12)



## [0.6.2](https://github.com/hslayers/hslayers-ng/compare/0.6.1...0.6.2) (2019-03-06)



## [0.6.1](https://github.com/hslayers/hslayers-ng/compare/0.6.0...0.6.1) (2019-02-21)



## [0.5.1](https://github.com/hslayers/hslayers-ng/compare/c8750ffa36928593d79eb3c895dc3a4b8574f028...0.5.1) (2017-12-05)


### Reverts

* Revert "cleanup" ([8394903](https://github.com/hslayers/hslayers-ng/commit/8394903ab3ace3d40e9ae4058ac6b1400e0128b8))
* Revert "Added multi-language feature" ([c8750ff](https://github.com/hslayers/hslayers-ng/commit/c8750ffa36928593d79eb3c895dc3a4b8574f028))



