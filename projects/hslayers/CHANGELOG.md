# [12.0.0-next.1](https://github.com/hslayers/hslayers-ng/compare/12.0.0-next.0...12.0.0-next.1) (2023-08-16)


### Bug Fixes

* Calculate combined ArcGIS service layer extent only from valid extents ([d9592ae](https://github.com/hslayers/hslayers-ng/commit/d9592ae2229238b37a52fb3136db9f0bd67164ca))
* Composition overwrite/rename option ([1490cde](https://github.com/hslayers/hslayers-ng/commit/1490cded37b1790f4d76745a388f2b619985df74))
* Composition WFS layers should be removable ([b685906](https://github.com/hslayers/hslayers-ng/commit/b6859069e88535b102d052d299577dd310e64794))
* Don't use public-api imports ([40a92c2](https://github.com/hslayers/hslayers-ng/commit/40a92c2dadbf4e892991fca485e9f6f1d590675d))
* **eslint:** Update rules to angular-eslint@16 ([ac7484c](https://github.com/hslayers/hslayers-ng/commit/ac7484c7cd9ab2042b2c143cafcf6c09ff3e4666))
* Geolocation ([8468c33](https://github.com/hslayers/hslayers-ng/commit/8468c33368c426e39e7bf1c57c70f590ba3abbd6))
* Gracefully handle IDW layers in composition ([a36fc21](https://github.com/hslayers/hslayers-ng/commit/a36fc21cd7c23cb0c375df9715065792f1a99ce7))
* Changed layer title in map swipe ([3440dbe](https://github.com/hslayers/hslayers-ng/commit/3440dbefb996e7c599faf90f0ee8643455c4f1d7))
* Layman layers status ([d063b0d](https://github.com/hslayers/hslayers-ng/commit/d063b0d6e54ebceda2f022829dc7dff3550a19b6))
* **Layman:** Request current-user only for Layman ([dfac713](https://github.com/hslayers/hslayers-ng/commit/dfac713cefd4e89f0cbac08f6c7d0e59fae730b7))
* **Layman:** Set layerSynchronizing=false on error ([f1014bb](https://github.com/hslayers/hslayers-ng/commit/f1014bb50e38bbd3be0339737529d4be81976c97))
* Loading of 4326 WFS features ([7155b70](https://github.com/hslayers/hslayers-ng/commit/7155b701a3fdb40db597c33ff448ed503881b786))
* **test-app:** Use correct translate pipe & module ([3996bd6](https://github.com/hslayers/hslayers-ng/commit/3996bd662c4d03d0e248a9b7db1fc5dd7b73c037))
* **types:** Add missing value to union type ([f03a3b7](https://github.com/hslayers/hslayers-ng/commit/f03a3b72029729c64416f46b5387e5a70bba64e1))
* Use better condition to filter out invalid extents values ([18c2687](https://github.com/hslayers/hslayers-ng/commit/18c26873a9d340219e9fe6f90f709147188050db))


### Code Refactoring

* Remove statusmanager endpoint support ([26060da](https://github.com/hslayers/hslayers-ng/commit/26060da1282fff57644c93c54dc67b08a0625fbb))


### Features

* Display status of Layman layers ([f181056](https://github.com/hslayers/hslayers-ng/commit/f181056459879aa104cb91645090fdaf7111a3a3))
* Sync language with wagtail ([b606e28](https://github.com/hslayers/hslayers-ng/commit/b606e281e3f6d2866454f43fc84c85dc04f94416))


### Performance Improvements

* Use new svh (small viewport height) unit to define fullscreen app ([5fd7c74](https://github.com/hslayers/hslayers-ng/commit/5fd7c74b0aa12fba3ad2f0e3334e5acaf5885c62))


### BREAKING CHANGES

* config.status_manager_url renamed to shareServiceUrl



## [11.2.3](https://github.com/hslayers/hslayers-ng/compare/11.2.2...11.2.3) (2023-07-25)


### Bug Fixes

* Only request current-user for Layman endpoint ([55fd13e](https://github.com/hslayers/hslayers-ng/commit/55fd13e0cfad45f74c5d6c2bb52b0dcc6b2748f0))
* **sensors:** Custom interval change ([81f010e](https://github.com/hslayers/hslayers-ng/commit/81f010e290be4fb95e757a9ef5eb58c6a07913f7))
* **sensors:** Observation fetching and displaying when triggered by timebutton ([3c0906e](https://github.com/hslayers/hslayers-ng/commit/3c0906eaeeb64812ae8bf449445f6d59b8236758))



## [12.0.0-next.0](https://github.com/hslayers/hslayers-ng/compare/11.2.0...12.0.0-next.0) (2023-06-30)

### BREAKING CHANGES

* API change for every service and component

* Remove app param/input from all the files ([064ff4a](https://github.com/hslayers/hslayers-ng/commit/064ff4a810416c0111bbcbaf7f3895c85e2cce4e))

### Features

* Remove multiple layer dialog for LM panel ([a48824d](https://github.com/hslayers/hslayers-ng/commit/a48824d449c092560245bfded6a6e9bd786b3537))
* **test-app:** Add GeoSPARQL layers into test app ([1c228b6](https://github.com/hslayers/hslayers-ng/commit/1c228b62417a3d0e7d3080ffc76589f64dc6bd4a))

### Bug Fixes

* Adjust sumLimits of datasources ([7af137b](https://github.com/hslayers/hslayers-ng/commit/7af137b198f570c9427ee32cea73366b32ad45f9))
* Close deletionInProgress toast when removing layers from memory ([c25f5b2](https://github.com/hslayers/hslayers-ng/commit/c25f5b24709c3586b77b116b724b48047af563c2)), closes [#3990](https://github.com/hslayers/hslayers-ng/issues/3990)
* Datasource/composition paging ([71da2d6](https://github.com/hslayers/hslayers-ng/commit/71da2d6a0ff19d8ce1b91f8dc1506be979987977))
* findLaymanForWfsLayer for layman-wagtail ep type ([8823eba](https://github.com/hslayers/hslayers-ng/commit/8823eba948b7215d39507be3dfe80bedea3dc71a))
* Greyscale baselayers on init ([d804b8c](https://github.com/hslayers/hslayers-ng/commit/d804b8ccd10be65eea3d74e3173dd97389d4ff4b)), closes [#4034](https://github.com/hslayers/hslayers-ng/issues/4034)
* Merging of unedited compositions ([2f40ecf](https://github.com/hslayers/hslayers-ng/commit/2f40ecf7238722ab6f65ccb262f7edceb03a4e25))
* Multiple layers removal ([15515fd](https://github.com/hslayers/hslayers-ng/commit/15515fd5795f8675e434b52f676580c39e75ac84))
* Prevent scrolling to add-data style input ([5c45ef2](https://github.com/hslayers/hslayers-ng/commit/5c45ef29ffbb9722b2ba9c5f42e72c5762a58fc9))
* Returned layman urls not pointing on layman-proxy if used ([5b2c344](https://github.com/hslayers/hslayers-ng/commit/5b2c34467dd1bec47723fcb99334cdb5fe3c0aef))
* Safely check composition load success ([94d977b](https://github.com/hslayers/hslayers-ng/commit/94d977b6dcaf233aca8b9a35dac235f95d196273)), closes [#3934](https://github.com/hslayers/hslayers-ng/issues/3934)
* **sparql:** Do not hardcode proxy URL ([4efc35e](https://github.com/hslayers/hslayers-ng/commit/4efc35edf2c2e43466352b502a8ba342b04c620a))
* **sparql:** Fix SPOI options ([e098cd4](https://github.com/hslayers/hslayers-ng/commit/e098cd4dd8f4aff3c66693a53511628251a34584))
* **sparql:** Handle geo and ID attributes properly ([24b76f7](https://github.com/hslayers/hslayers-ng/commit/24b76f7fbed5b3baa1a0639285a8e64798d72fde))
* Style sync indicator ([4d26f2c](https://github.com/hslayers/hslayers-ng/commit/4d26f2c288f4a8726859c6bd0b8a0113f933fbea))
* **styler:** Wait for cluster to be created ([85b242e](https://github.com/hslayers/hslayers-ng/commit/85b242eb39a8dca817c4453bf8f7f56362255b8e))
* Sync version with latest release ([cb7c89a](https://github.com/hslayers/hslayers-ng/commit/cb7c89aa7bbb152716dbd20b104ca4bb720a3df5))
* Syncing default style of  vector layers added  without style file ([8a6010e](https://github.com/hslayers/hslayers-ng/commit/8a6010e01554c7f308f1ec4a41074ef0a339705d))
* Vector styles not loading for composition layers ([4d88531](https://github.com/hslayers/hslayers-ng/commit/4d88531ab72b59183df64ba68811c44ff8c3335a))
* Overrides visibility when repopulating layers

### Performance Improvements

* Pointer move listeners for compositions and add-data catalogues ([e9c6001](https://github.com/hslayers/hslayers-ng/commit/e9c6001ea20bc25ebc94ef19145c6ae2ea3ad12a))



## [11.2.2](https://github.com/hslayers/hslayers-ng/compare/11.2.1...11.2.2) (2023-06-14)


### Bug Fixes

* Returned layman urls not pointing on layman-proxy if used ([ad7d6f7](https://github.com/hslayers/hslayers-ng/commit/ad7d6f79391530565225ed47fb978c8f9ea32c2c))


### Performance Improvements

* Pointer move listeners for compositions and adddata catalogues ([27d5a00](https://github.com/hslayers/hslayers-ng/commit/27d5a007035ed55eb24375018058ccf42b37c8ce))



## [11.2.1](https://github.com/hslayers/hslayers-ng/compare/11.2.0...11.2.1) (2023-04-25)


### Bug Fixes

* Multiple layers removal ([21beaee](https://github.com/hslayers/hslayers-ng/commit/21beaee7aaaf4ae2dfaa379a0be1896f6b8a8e7e))
* Prefer QML and SLD styles ([da7a888](https://github.com/hslayers/hslayers-ng/commit/da7a888200ae111aedf3c20dcc2b6f507a192373)), closes [#3943](https://github.com/hslayers/hslayers-ng/issues/3943)
* Prevent scrolling to add-data style input ([85b8b23](https://github.com/hslayers/hslayers-ng/commit/85b8b2315504411c4ea6df2686f0d266b73c1990))
* Safely check composition load success ([f843bca](https://github.com/hslayers/hslayers-ng/commit/f843bcad3e0e614c59c98194c447d013247590d2)), closes [#3934](https://github.com/hslayers/hslayers-ng/issues/3934) [#3956](https://github.com/hslayers/hslayers-ng/issues/3956)
* **sparql:** Fix loading GeoSPARQL layers ([17e4873](https://github.com/hslayers/hslayers-ng/commit/17e487351562a996708be74d0b364f6940fdad50))



# [11.2.0](https://github.com/hslayers/hslayers-ng/compare/11.1.0...11.2.0) (2023-04-13)


### Bug Fixes

* Add allowedStyles add-data param to missing data types ([d4425e0](https://github.com/hslayers/hslayers-ng/commit/d4425e08bbebab01dbb0972ff46409c2101f5554))
* Decode proxyfied url in case client send it that way ([5873561](https://github.com/hslayers/hslayers-ng/commit/58735614607398bd72a30934e0015552e8effd74))
* Handle calcAllLayersExtent error ([337e6b5](https://github.com/hslayers/hslayers-ng/commit/337e6b5c12b4dd6dea349bdea212c5720ae989f8))
* HsEndpoint import causing circular dep ([afafdc8](https://github.com/hslayers/hslayers-ng/commit/afafdc822f59cfe0ba3a1c452dec17ed2b4a30ca))
* In app login control ([3e5717a](https://github.com/hslayers/hslayers-ng/commit/3e5717accc5de759f665c3b4800f1132439ac6d8))
* Load external wfs layers without add layers panel ([ca9ca31](https://github.com/hslayers/hslayers-ng/commit/ca9ca3162e8c26703a3c87bf7d93b90f5cde5786))
* Pass app param to calcAllLayersExtent ([64b1319](https://github.com/hslayers/hslayers-ng/commit/64b131976f623c8399abfd2a113e9107dfde5ca0))
* Raster time-series regex patter for string with no separator ([b345804](https://github.com/hslayers/hslayers-ng/commit/b345804c85bce5ad6323cc1787289cb39a749507))
* Raster time-series regex priority, time-regex param values ([f93aec4](https://github.com/hslayers/hslayers-ng/commit/f93aec47b4c487c92942322595ca1cd5ecd99c63))
* Register 32633 and 32634 projs ([eb2564a](https://github.com/hslayers/hslayers-ng/commit/eb2564aaf23ca1fb0282dc3847bdcab91f456f13))
* **server:** Properly encode query params ([74b51c9](https://github.com/hslayers/hslayers-ng/commit/74b51c9acca07da68aa2efe684bc5432434e959d))
* Use full SUPPORTED_SRS_LIST as default ([6ba4658](https://github.com/hslayers/hslayers-ng/commit/6ba4658bf14f9c33106dee4a87300a3fe69ed648))
* **WFS:** Swap BBOX only for WFS 1.x ([3ed7009](https://github.com/hslayers/hslayers-ng/commit/3ed70092e2493fd9fafa51e0b587469840170818))
* When content-type headers are missing in getCapabilities response treat it as success ([bf1a9f6](https://github.com/hslayers/hslayers-ng/commit/bf1a9f682ece691141639c8a7e2ba83420c505f8))
* WMS extent parsing ([958e72d](https://github.com/hslayers/hslayers-ng/commit/958e72deabcf44b9dd933c028dfa04e05db7acc5))


### Features

* Add more intuitive option how to 'go back' after ArcGIS REST service is expanded. ([2114dac](https://github.com/hslayers/hslayers-ng/commit/2114daccb8108d07c872ede76154ac9f1ceda9de))
* Allow upload of raster series ([2b180bf](https://github.com/hslayers/hslayers-ng/commit/2b180bfa413f09d5aa97464690efbc35879106ad))
* Calculate combined extent for ArcGIS Map Server layers ([8c934c8](https://github.com/hslayers/hslayers-ng/commit/8c934c8e33e6589620e64d28e290497adb45a580))
* Zoom to combined extent for WMTS layers ([fcf4cb2](https://github.com/hslayers/hslayers-ng/commit/fcf4cb22c666ae6a32bb35998f23b892b763d36f))



# [11.1.0](https://github.com/hslayers/hslayers-ng/compare/11.0.0...11.1.0) (2023-02-17)


### Bug Fixes

* Add data tablist sticky only on wider screens ([5177e91](https://github.com/hslayers/hslayers-ng/commit/5177e91f68b262ac9941123897106aa118b76277))
* **compositions:** Pass on created WFS layer ([90d5eb2](https://github.com/hslayers/hslayers-ng/commit/90d5eb2f46ad4385a1c08365531c834f33838428)), closes [#3817](https://github.com/hslayers/hslayers-ng/issues/3817)
* Don't use default imports ([cb99ee6](https://github.com/hslayers/hslayers-ng/commit/cb99ee6988a0134c9ed100e9f128cf69c44c7569))
* Don't try to calculate combined extent when collection is empty ([6791a79](https://github.com/hslayers/hslayers-ng/commit/6791a799c6284572ad31a8f53fe23ef17b94a503))
* Don't use CRS:84 extent as transformation input when parsing WMS layer extent prop ([2c99595](https://github.com/hslayers/hslayers-ng/commit/2c99595f1c9b06cffb44ff1852f288d633aa6f49))
* Form control font-size ([17f75c7](https://github.com/hslayers/hslayers-ng/commit/17f75c772bd486deafd7fd9bc2b6aa09f65d35d3))
* jsonGetFeatureInfo type import ([ad0cb43](https://github.com/hslayers/hslayers-ng/commit/ad0cb43ba0bf819de26d0000e1b2066abeff9f59))
* Load Layman WFS ([b538e9e](https://github.com/hslayers/hslayers-ng/commit/b538e9e4e7489bfa7a3190d2f363842b936a0eab))
* Parsing of linted GML getFeatureInfo response ([39e6f28](https://github.com/hslayers/hslayers-ng/commit/39e6f28db7f35012d4697b58af7c68e8788398dd)), closes [#3780](https://github.com/hslayers/hslayers-ng/issues/3780)
* Remove already existing layer ([0b64b0f](https://github.com/hslayers/hslayers-ng/commit/0b64b0f6cb0dbdd332ac9ecad9f366d8bf908fae))
* Try to fit to content when new Layman layer added and synced ([5a52b76](https://github.com/hslayers/hslayers-ng/commit/5a52b768f18a99ccfaef5edb2fa632525e160e4c))
* WMTS getFeatureinfo ([a0cc7e2](https://github.com/hslayers/hslayers-ng/commit/a0cc7e21a0465863a729906396ba2d64c93d4589))
* Wrong usage of nullish coalescing operator when transforming WMS bbox. ([54bb820](https://github.com/hslayers/hslayers-ng/commit/54bb8208c015306d5d01d5caabf4ea78ccd54083))



# [11.0.0](https://github.com/hslayers/hslayers-ng/compare/10.0.0...11.0.0) (2023-01-16)


### Bug Fixes

*  Error: Can't resolve 'timers' ([538661f](https://github.com/hslayers/hslayers-ng/commit/538661f604d7e5b704130df98f6bdb7d87da87b2))
* Apply style on color hex input changes ([6b9548c](https://github.com/hslayers/hslayers-ng/commit/6b9548c3fad7456184fd679e7f06fb7fd5f2f06a))
* Baselayer toggling ([e87d9df](https://github.com/hslayers/hslayers-ng/commit/e87d9dfcc3c3db1f96977bb1ca9be90451b4d16e))
* Bootstrap button focus text color ([ad2e7a9](https://github.com/hslayers/hslayers-ng/commit/ad2e7a92d320fd27c9388a8dda0d350a948c221c)), closes [#3645](https://github.com/hslayers/hslayers-ng/issues/3645)
* Calculate style foreground color on init ([d161227](https://github.com/hslayers/hslayers-ng/commit/d1612279cd01bb3e2084424bbef2916ef03ea513))
* Center labels for additional panels ([0d9b662](https://github.com/hslayers/hslayers-ng/commit/0d9b6626dbe2708b6f5381746d84370c60cee0b7)), closes [#3437](https://github.com/hslayers/hslayers-ng/issues/3437)
* Composition/add-data item list overflow triggering map extent change ([873e88e](https://github.com/hslayers/hslayers-ng/commit/873e88e3973b29f12106d8ed5d7fb5176c21d310))
* Configurable mobilebreakpoint/sidebar position for multiapp ([85a5dff](https://github.com/hslayers/hslayers-ng/commit/85a5dfffc6d70ba4e8ef654c2d64d25ee3a11b85))
* current_base_layer composition param ([a58af0f](https://github.com/hslayers/hslayers-ng/commit/a58af0f7063628dc3003786ea6696ed0e1a60365))
* Do not fire compositionEdits event only when showInLayerManager is explicitly set to false not just falsy ([75d6cc1](https://github.com/hslayers/hslayers-ng/commit/75d6cc13a76e21b8d4b552daf8cae130afa264ee))
* Don't cache getCapabilities, if response is error or no data was found ([1de6bbc](https://github.com/hslayers/hslayers-ng/commit/1de6bbc477a113c4e74c3174044b9a90b126316e))
* Don't import cesium widgets css twice ([08d30e4](https://github.com/hslayers/hslayers-ng/commit/08d30e433c255e7abdcf2b3f80289865f788e72e))
* Feature by Id not found in some cases ([57e1c0b](https://github.com/hslayers/hslayers-ng/commit/57e1c0b050fabfdbea511a28e0f3ec8a655a487b))
* Fix sidebar duplication when hslayers component loaded twice ([ed845a6](https://github.com/hslayers/hslayers-ng/commit/ed845a64307d1de56d58bebbb6146bcc3440f268))
* Handle ol.Layer without ol.Source ([64cd453](https://github.com/hslayers/hslayers-ng/commit/64cd453bf05cee1c46cfa4010bbdf557eb8eda21))
* Make symbolizer headings smaller ([19103e1](https://github.com/hslayers/hslayers-ng/commit/19103e19cdda9b66bedb78378749b365f68daa87))
* Module imports for geostyler classes ([cc2ced8](https://github.com/hslayers/hslayers-ng/commit/cc2ced874874355f3ac7e9091dcacfac6e7cb36e))
* Properly disable pagination buttons ([6954247](https://github.com/hslayers/hslayers-ng/commit/695424773f54fb19d3efeeb47e2b260b869c317c))
* Unregister previous HsQueryPopupComponent when init called again ([44ac787](https://github.com/hslayers/hslayers-ng/commit/44ac78782230de05b2bd0c6e5a41860aed105438))
* **add-data-catalogue:** Handle login timeout ([7c0aade](https://github.com/hslayers/hslayers-ng/commit/7c0aadef8acb463a93d1edeb745ea8556e9d79ce)), closes [#3608](https://github.com/hslayers/hslayers-ng/issues/3608)
* **cesium:** Cesium Es6 module imports ([39dcdad](https://github.com/hslayers/hslayers-ng/commit/39dcdad0a14729c3d7ecb2be13ab36a6199a4d79))
* **docs:** Fix gen-doc script ([1f3c092](https://github.com/hslayers/hslayers-ng/commit/1f3c092a03b3b4f41b08d907e4e01b42fd169c42))
* Hide menu after adding style rule filter ([09d739b](https://github.com/hslayers/hslayers-ng/commit/09d739bcb743dd5f2b4e31764ae3e4f23ea6459c))
* Migrate to new NgMaterial components ([c450457](https://github.com/hslayers/hslayers-ng/commit/c45045737ffc436cf0dccef1f7c6dfffc9067110))
* Monitor showInLayerManager state change ([24ed343](https://github.com/hslayers/hslayers-ng/commit/24ed343596c7e2a050e095c1f3176226fa432dab))
* Overlay panel container need to fill screen ([425cf2c](https://github.com/hslayers/hslayers-ng/commit/425cf2c0b44ac7ca518432764dad0cf550f3430f))
* Provide translation service and utils in root ([47ba93d](https://github.com/hslayers/hslayers-ng/commit/47ba93d439818021c199f583e59260385ae3e394))
* Remove duplicit declarations from save map service ([308f932](https://github.com/hslayers/hslayers-ng/commit/308f93284e748a68f4c0a230bfcfb6933cd5e484))
* Select feature if clicked on symbol, but not exactly in geom ([c9b80fd](https://github.com/hslayers/hslayers-ng/commit/c9b80fd97e04f3ac60ebfa5a72f28d70c932ed30))
* Support sld 1.1.0 style definition ([db1310d](https://github.com/hslayers/hslayers-ng/commit/db1310d90ea8176612b3e4da3c67a090b306be77)), closes [#3579](https://github.com/hslayers/hslayers-ng/issues/3579)
* **hs-server:** Provide logout callback ([72b0669](https://github.com/hslayers/hslayers-ng/commit/72b066948b76b40ab6e7c25d3f07d0278ee9233c))
* Use tree shakable module imports for federation ([b911316](https://github.com/hslayers/hslayers-ng/commit/b91131641685adff3271651c9f105b1aeda87dff))


### Features

* Allow 'sidebarPosition' to be configured to 'bottom' by choice not by mediaQuery. ([2810a50](https://github.com/hslayers/hslayers-ng/commit/2810a50450df037cf0951ae24a4f7f1d4e050201))
* Expandable mobileview sidebar + UI enhancements ([2cf8b44](https://github.com/hslayers/hslayers-ng/commit/2cf8b44bbcb0d4ea09e045cca03f7cd9f1ecf1f2))
* **add-data:** Allow to load SHP as WFS ([57aea27](https://github.com/hslayers/hslayers-ng/commit/57aea279e256f263a661fa1e46be590eabb7f3a5))
* **add-data:** Allow to load vector-data as WMS ([8e1bdf6](https://github.com/hslayers/hslayers-ng/commit/8e1bdf677dc93b363b5ff5a00489e5fbcb6cc836))
* **add-data:** Mock "load as" UI ([9a1a0b2](https://github.com/hslayers/hslayers-ng/commit/9a1a0b24452815bad83409a26b113b1a7a8d98eb))
* **add-data-catalogue:** Refresh Layman auth ([f4bcd0a](https://github.com/hslayers/hslayers-ng/commit/f4bcd0a3b01b2ceb219e7409adaeebc6ef5970be))
* **config:** Add possibility to use base_layers config param to load baselayers as composition ([44c2015](https://github.com/hslayers/hslayers-ng/commit/44c201564cd6a6a6a045ba4036a95a728205fd91))
* **i18n:** Add new strings for symbolizer types ([d34d77a](https://github.com/hslayers/hslayers-ng/commit/d34d77aef4fe515b52e3f5336738fb85fec71172))
* Display legend for each rule in styler panel ([b186d9e](https://github.com/hslayers/hslayers-ng/commit/b186d9ebdb76a56b71e2badb8e8a97bf6f501e12))
* Improve graphics fill warnings and button to remove graphic ([673e90b](https://github.com/hslayers/hslayers-ng/commit/673e90bddc3671407bfd90f88141884cbd4e6691)), closes [#3444](https://github.com/hslayers/hslayers-ng/issues/3444)
* Make error toast duration configurable ([40560b8](https://github.com/hslayers/hslayers-ng/commit/40560b8832c9dda8fb90e35eae996c77243544d6))
* New feature select DOM action ([9f04700](https://github.com/hslayers/hslayers-ng/commit/9f0470070bcf4f5e68e40f3d12f57e2283a02bc9))
* Style filter/scale toggles differently if filter exists ([d6ba3c6](https://github.com/hslayers/hslayers-ng/commit/d6ba3c64ec0e80de99df4633163e5a00487e77f2))
* **config:** Use base_layers.default to set which layer from basemap composition should be visible ([a0981a7](https://github.com/hslayers/hslayers-ng/commit/a0981a7eaf1fa28c0c07ef8e5c4eb8200ab3e314))
* **UI:** Replace loader icon with CSS loader ([575dcc5](https://github.com/hslayers/hslayers-ng/commit/575dcc58af741d1d559c2942eb49ff1342fdc3f8))
* Use grayscale map composition param ([fe749bd](https://github.com/hslayers/hslayers-ng/commit/fe749bd549bf7a2490855e6729b8dc56c0548842))


### Reverts

* Re-enable external anchors for selecting features ([b6bb006](https://github.com/hslayers/hslayers-ng/commit/b6bb00696b1ebbe62e80723d9ed4ce40e0e3017d))



## [11.0.0-next.0](https://github.com/hslayers/hslayers-ng/compare/10.0.0...11.0.0-next.0) (2022-12-02)


### Bug Fixes

* Apply style on color hex input changes ([6b9548c](https://github.com/hslayers/hslayers-ng/commit/6b9548c3fad7456184fd679e7f06fb7fd5f2f06a))
* Center labels for additional panels ([0d9b662](https://github.com/hslayers/hslayers-ng/commit/0d9b6626dbe2708b6f5381746d84370c60cee0b7)), closes [#3437](https://github.com/hslayers/hslayers-ng/issues/3437)
* Do not fire compositionEdits event only when showInLayerManager is explicitly set to false not just falsy ([75d6cc1](https://github.com/hslayers/hslayers-ng/commit/75d6cc13a76e21b8d4b552daf8cae130afa264ee))
* Don't cache getCapabilities, if response is error or no data was found ([1de6bbc](https://github.com/hslayers/hslayers-ng/commit/1de6bbc477a113c4e74c3174044b9a90b126316e))
* Don't import cesium widgets css twice ([d68134d](https://github.com/hslayers/hslayers-ng/commit/d68134daaef2cc9567794dc3279b39aa4304a5db))
* Migrate to new NgMaterial components ([9e0c10f](https://github.com/hslayers/hslayers-ng/commit/9e0c10ffa576ba005354f28e110f1eddf5ca2d84))
* Monitor showInLayerManager state change ([24ed343](https://github.com/hslayers/hslayers-ng/commit/24ed343596c7e2a050e095c1f3176226fa432dab))
* Overlay panel container need to fill screen ([425cf2c](https://github.com/hslayers/hslayers-ng/commit/425cf2c0b44ac7ca518432764dad0cf550f3430f))
* Provide translation service and utils in root ([47ba93d](https://github.com/hslayers/hslayers-ng/commit/47ba93d439818021c199f583e59260385ae3e394))
* Remove duplicit declarations from save map service ([308f932](https://github.com/hslayers/hslayers-ng/commit/308f93284e748a68f4c0a230bfcfb6933cd5e484))
* Use tree shakable module imports for federation ([b911316](https://github.com/hslayers/hslayers-ng/commit/b91131641685adff3271651c9f105b1aeda87dff))


### Features

* Make error toast duration configurable ([40560b8](https://github.com/hslayers/hslayers-ng/commit/40560b8832c9dda8fb90e35eae996c77243544d6))
* New feature select DOM action ([9f04700](https://github.com/hslayers/hslayers-ng/commit/9f0470070bcf4f5e68e40f3d12f57e2283a02bc9))
* Use grayscale map composition param ([fe749bd](https://github.com/hslayers/hslayers-ng/commit/fe749bd549bf7a2490855e6729b8dc56c0548842))

# [10.0.0](https://github.com/hslayers/hslayers-ng/compare/10.0.0-next.1...10.0.0) (2022-10-21)


### Bug Fixes

* Clean up replay subjects when destroying containers ([06a02b5](https://github.com/hslayers/hslayers-ng/commit/06a02b5387e87a93c8fd5a9eba144d9845751d2b))
* Fix i18n string for layer deletion ([e911c12](https://github.com/hslayers/hslayers-ng/commit/e911c12c408abe18f24d267d0c217c02605fc54a))
* Map swipe button style ([1e33407](https://github.com/hslayers/hslayers-ng/commit/1e334072bf3426af4779f138fdd20bfec1b333cc))
* Trigger colorMapChanged event ([8cb62f3](https://github.com/hslayers/hslayers-ng/commit/8cb62f3d0867794b924b0445cdd1b9801d0f7cb8))
* Unsubscribe draw-panel sidebarpos subscription ([858a2ee](https://github.com/hslayers/hslayers-ng/commit/858a2eed7a11f8633b4b5e11fa8cfeb60a6e70b6))
* Unsubscribe layout components subscriptions ([6a67c18](https://github.com/hslayers/hslayers-ng/commit/6a67c180970eaf2703917e808942b670c1e3cfbc))
* Walkaround of wellKnowName bug when parsing qml ([14fb5b3](https://github.com/hslayers/hslayers-ng/commit/14fb5b3b5b0d7014e505318874c03a08e1d63299)), closes [#3431](https://github.com/hslayers/hslayers-ng/issues/3431)
* **i18n:** Add space to message ([9199033](https://github.com/hslayers/hslayers-ng/commit/919903392637fc1ae6031d1cb4b604a880fd45e6))
* **sensors:** Set chart dialog position in case of bottom placement ([2fc5f91](https://github.com/hslayers/hslayers-ng/commit/2fc5f918555ae75e9ca1264747761392e6326fb9))


### Features

* Support loading of QML in style panel upload ([f8d99f2](https://github.com/hslayers/hslayers-ng/commit/f8d99f22bc4ce5b63017982e994e433af82fc6f9)), closes [#3433](https://github.com/hslayers/hslayers-ng/issues/3433)


### Performance Improvements

* Withdraw swipe control from Zone.js ([c8d3d4e](https://github.com/hslayers/hslayers-ng/commit/c8d3d4e07961f8fa342dc50c69f7ad676c641e2d))



# [10.0.0-next.1](https://github.com/hslayers/hslayers-ng/compare/9.2.0...10.0.0-next.1) (2022-09-23)


### Bug Fixes

* Add back missing ngIf after rebase ([c77c6a4](https://github.com/hslayers/hslayers-ng/commit/c77c6a4e4991c249f7ec8597b8c5ac781d97efe7))
* Add time shift instead of subtracting ([56bb8f1](https://github.com/hslayers/hslayers-ng/commit/56bb8f1f3b382dba505e65da4bdf1637ef009a42))
* Async check of zip file size ([626acde](https://github.com/hslayers/hslayers-ng/commit/626acdea10f4ec1a73a096ddb4e66bc45ef53145))
* Async chunk upload ([79ffc0d](https://github.com/hslayers/hslayers-ng/commit/79ffc0d9247e7e565b232a45c911473c50dd9686))
* Await translations to load ([6e66a88](https://github.com/hslayers/hslayers-ng/commit/6e66a880693687662f8b332a34f472addefab5a9))
* Check for 4236 proj. aliases when uploading geojson file ([96296ef](https://github.com/hslayers/hslayers-ng/commit/96296eff4fbf249f62f65c726a1f27c9992cfbb4))
* Check if default_view property exists ([0867719](https://github.com/hslayers/hslayers-ng/commit/086771963dc6efb3df8adc15facd5dbbea0a4f87))
* Check if Layman endpoint exists where needed ([8305b17](https://github.com/hslayers/hslayers-ng/commit/8305b1779e3a6f8352225115f632c8c82847ab85))
* Correctly react to overwrite dialog actions ([fd723b5](https://github.com/hslayers/hslayers-ng/commit/fd723b557f70928659b2454f8b06a37ac6b7d292))
* Custom color maps on ol-ext 4 IDW layers ([acc3e36](https://github.com/hslayers/hslayers-ng/commit/acc3e368e9eab29d0aca0d7474ab14170e03682a))
* Do not call singleTile as constructor ([9738921](https://github.com/hslayers/hslayers-ng/commit/9738921166f75419d90ca9fac8d2b749a7b8779a))
* Don't rely on package.json to fill version info in impressum ([3e181d9](https://github.com/hslayers/hslayers-ng/commit/3e181d9720c0294318fd4c286f4b45196e73ae3b))
* Fix layman layer deletion ([f797f2c](https://github.com/hslayers/hslayers-ng/commit/f797f2c9b2ad60d303bf178534d7211754e3effc)), closes [#3114](https://github.com/hslayers/hslayers-ng/issues/3114)
* Fixed multiple layer removal ([6a2c897](https://github.com/hslayers/hslayers-ng/commit/6a2c8971d297d4d14cba35b808fcf7b38f1ef2b6))
* Format time by config instead of hardcoded cs ([115bc9f](https://github.com/hslayers/hslayers-ng/commit/115bc9f59bd7557640a0855fffe97b781a760718))
* If hsConfig language property is provided, set the languageService language to it as well ([5a8c674](https://github.com/hslayers/hslayers-ng/commit/5a8c674f9d8a4c80feb400d78975f1a561ca9e52))
* inherit parent el min-height, so the map doesn't disappear when no panel is enabled (For statistics) ([d1ac3e6](https://github.com/hslayers/hslayers-ng/commit/d1ac3e687cc4d9d954f0e77e538e097b843245dd))
* Initialise map data permalink, visibleLayersInUrl, externalCompositionId properties ([248aa25](https://github.com/hslayers/hslayers-ng/commit/248aa25396bfc7480ef83f62da33821775afe55c))
* Recreate permalink and externalCompositionId params when creating map service ([6138cef](https://github.com/hslayers/hslayers-ng/commit/6138cefd9d25924c7bb47bb19311d8b6c8d3a751))
* Save getColor function also as a property to allow legend creation ([0958805](https://github.com/hslayers/hslayers-ng/commit/0958805c9245e3178f0e472450bcca2d542374ab))
* **config:** Delete already assigned property ([b99cbeb](https://github.com/hslayers/hslayers-ng/commit/b99cbeb0a5bd764ff5bb394fa7193600159a12bc)), closes [#3309](https://github.com/hslayers/hslayers-ng/issues/3309)
* **sensors:** Set modal dialog background ([cd2a3c5](https://github.com/hslayers/hslayers-ng/commit/cd2a3c53a9e0d6bb7f56ac85701e1f618d2aac7c))
* Ignore wfs status, when looking for layer descriptor adding vector layers ([4463b38](https://github.com/hslayers/hslayers-ng/commit/4463b383ed6f9988cfeced0cc25c5001ef9f3404))
* Make importing of proj4 safer ([3e9aabb](https://github.com/hslayers/hslayers-ng/commit/3e9aabb47d428b8d6d6526fd2ddf038c7dcc2958))
* Make sure map is initiated properly before trying to fit extent ([1ffbb03](https://github.com/hslayers/hslayers-ng/commit/1ffbb03565670a2a05918d01374bde41c9c8d4ce))
* Overwrite geojson with sld ([8caab93](https://github.com/hslayers/hslayers-ng/commit/8caab938aaf5dfa0eee0b8dd6f31823301b71e9e))
* Prevent sidebar from opening when loading defaultComposition and config sidebarClosed is set to true ([6a81946](https://github.com/hslayers/hslayers-ng/commit/6a819463c0f17a72ad6937c4f84b8ae2abc782a8)), closes [#3149](https://github.com/hslayers/hslayers-ng/issues/3149)
* Provide header text for file upload error ([53eb812](https://github.com/hslayers/hslayers-ng/commit/53eb812c96b862225d66e4392c9d303ee1d13c98))
* Provide layer name from the descriptor if layer doesn't exists ([a714db6](https://github.com/hslayers/hslayers-ng/commit/a714db6b5a6a59b5308e35d9daf5d2d880e763d6))
* Saving of attribute value when it's not object ([c41622e](https://github.com/hslayers/hslayers-ng/commit/c41622e6e740750ba3e66b1d3cd7b498598918fd))
* Set UI for LaymanAccessRights component on Init ([9f86aff](https://github.com/hslayers/hslayers-ng/commit/9f86aff586421bd2fdfdf18149b6984bca6da0a9))
* Show dialogs also when they are created on startup ([d53105f](https://github.com/hslayers/hslayers-ng/commit/d53105f4f38e6c9942d896b4dfaf7d7f562121d7)), closes [#3190](https://github.com/hslayers/hslayers-ng/issues/3190)
* Tweak types for OL7 ([564fcd0](https://github.com/hslayers/hslayers-ng/commit/564fcd0eda718ecc97c33fc11ce44e2a0e499bfe))
* Zooming to default view buttons in multi-apps ([4f586a8](https://github.com/hslayers/hslayers-ng/commit/4f586a8eb78ea2660132fe51efcb323eb46e3835))
* **permalink:** Don't parse hs-permalink along with other customParams ([990e586](https://github.com/hslayers/hslayers-ng/commit/990e586c1a634bcdcd7b3f07313232ebb0a96d12))
* **scss:** Override wagtail theme css ([0d4ff17](https://github.com/hslayers/hslayers-ng/commit/0d4ff176f33c2a1058979c37d7cbb30905a634df))
* **wmts:** Allow sharing WMTS layers as base ([a2e24d2](https://github.com/hslayers/hslayers-ng/commit/a2e24d2a03beeeec16c2e8023751352c4770116e))
* Basemap gallery widgets created twice ([8dec9d2](https://github.com/hslayers/hslayers-ng/commit/8dec9d2e9943a93ee12c4d28f7945f247a2a2401))
* Declare default sidebarPosition ([45ef536](https://github.com/hslayers/hslayers-ng/commit/45ef536854ba533bce97f0cc274a4d7c754596d8)), closes [#3257](https://github.com/hslayers/hslayers-ng/issues/3257)
* Delay sidebarPosition monitoring to not get ExpressionChangedAfterItHasBeenCheckedError ([3a8cf22](https://github.com/hslayers/hslayers-ng/commit/3a8cf22b2a7c80274f51b6c52967170d0b9e5234))
* Multiple app support when generating permalink ([a93aabf](https://github.com/hslayers/hslayers-ng/commit/a93aabf069c8dfd4be20b771ff1bd9a50d3ec549))
* Reset translations dictionary when overrides provided in config ([70f6de2](https://github.com/hslayers/hslayers-ng/commit/70f6de2968e41ae68238cfa5edeb984c82f7ed42))
* Set tag when publishing next prerelease version ([3cea146](https://github.com/hslayers/hslayers-ng/commit/3cea1460c06974320359529358d27412a09478f8))
* **hslayers-server:** Pass correct HTTP response status code for most frequent errors ([b95a75b](https://github.com/hslayers/hslayers-ng/commit/b95a75b0925ed792581675898730a24b5b3f9e16))
* **LayerManager:** Pass 'app' property to service ([b4d2b59](https://github.com/hslayers/hslayers-ng/commit/b4d2b59d4a2b9690948104a7812b9116a4674d33))
* **LayerManager:** Safely polyfill dimensions ([f003c63](https://github.com/hslayers/hslayers-ng/commit/f003c63b00080bbcb48298f9099c5dc4b686bbcb))
* **SCSS:** Add new Bootstrap stylesheet ([8c01e81](https://github.com/hslayers/hslayers-ng/commit/8c01e81666523846f8ea5167b05b9d01f2edf05c))
* **statistics:** Better predictions and filter out nulls ([935c092](https://github.com/hslayers/hslayers-ng/commit/935c092022e0a36aefab2a91e764531eceb471ec))
* **statistics:** Fix building of statistics app for ng14 ([b3fb761](https://github.com/hslayers/hslayers-ng/commit/b3fb761e9b80c893ae5bd056770fcc65f23b0b95))
* **statistics:** Set title for statistics app ([e15ff73](https://github.com/hslayers/hslayers-ng/commit/e15ff7353019dbb749b22b03972763ab889d06eb))
* Provide SUPPORTED_SRS_LIST first 2 srs as default ([bfd3bc6](https://github.com/hslayers/hslayers-ng/commit/bfd3bc68e4acf16730dcb68df4ba7b3babf108d9))
* Relead current translations only if current lang set ([0010114](https://github.com/hslayers/hslayers-ng/commit/0010114827fb9cdb8d2d8842e61b9c5c0e815200))
* Return result of recursive checkForLayerInLayman func ([125808d](https://github.com/hslayers/hslayers-ng/commit/125808dc6ae7bdb59bab6d7648aee46d22c6061d))
* Show SRS input for SHP file type ([4544f7a](https://github.com/hslayers/hslayers-ng/commit/4544f7acfc066dd6c5ab8cfcf6e60e2a88d471a1))
* WFS version 2 getFeature params, URI EPSG aliases ([5c81dee](https://github.com/hslayers/hslayers-ng/commit/5c81deec5e964ad75e36f1d6fe23c46ce966dba9)), closes [#3151](https://github.com/hslayers/hslayers-ng/issues/3151)


### Features

* **add-data:** Finalise GeoSPARQL UI ([a985101](https://github.com/hslayers/hslayers-ng/commit/a985101132e6f4584f693422446286fe9944aeb2))
* **add-data:** Make use of new isUrlObtainable() ([56fb0e7](https://github.com/hslayers/hslayers-ng/commit/56fb0e7102ab97c9783b783e1ca9094ccdfb7d94))
* **add-data:** Mock GeoSPARQL add-data option ([11f07de](https://github.com/hslayers/hslayers-ng/commit/11f07de2cf68095ac991ab133d33fb573fd1e35d))
* **add-data:** Verify SPARQL endpoint URL ([78590d5](https://github.com/hslayers/hslayers-ng/commit/78590d5fd843852dfc374afcc7d5856c265bc500))
* **LM:** Show toast message when layer load fails ([7546aaf](https://github.com/hslayers/hslayers-ng/commit/7546aaf494e6784da0620b05da7ff9403c8e12b3))
* A nicer dialog to specify colorMap style options ([4ada5e0](https://github.com/hslayers/hslayers-ng/commit/4ada5e00333bed0e8343178111b576e8c778d929)), closes [#3025](https://github.com/hslayers/hslayers-ng/issues/3025)
* Add a dialog explaining statistics app ([80de9f0](https://github.com/hslayers/hslayers-ng/commit/80de9f0064e5328f77c17d0604de89bbc88c27eb))
* Add possibility to use reversed colorMap + add code description ([afd0614](https://github.com/hslayers/hslayers-ng/commit/afd0614a1d2d80194edca914d70254dfe3a0ff9d))
* Added set permissions feature to add data and compositions catalog items ([098b71b](https://github.com/hslayers/hslayers-ng/commit/098b71b5efba334b9d80d844470a143ff057d8d0))
* Assign extent to WMTS layers ([5d498f4](https://github.com/hslayers/hslayers-ng/commit/5d498f460363057ed15080034c97ec3a36fa5328))
* Check if url is obtainable for add-data-vector-url ([a127019](https://github.com/hslayers/hslayers-ng/commit/a1270191f7835fdc990cd29bedffe52327747abc)), closes [#3189](https://github.com/hslayers/hslayers-ng/issues/3189)
* Load WMTS datasets from Micka endpoint ([e97f86d](https://github.com/hslayers/hslayers-ng/commit/e97f86d68f493a20d4139adeece8652c73475b45))
* Provide ability to overwrite existing layman layers from file upload ([1ed41a5](https://github.com/hslayers/hslayers-ng/commit/1ed41a50604543c89a5b940a5d3040bcbb643729))
* Provide details if overwrite dialog appears again ([798dd3d](https://github.com/hslayers/hslayers-ng/commit/798dd3d544732fda96adc6f4c62ef850c65bc8d3))
* Scroll to app if its present in the URL ([5759608](https://github.com/hslayers/hslayers-ng/commit/57596081a3682f77088ad1faaf47778c4df450f0))
* Support timeout parameter in queues ([bdd71d2](https://github.com/hslayers/hslayers-ng/commit/bdd71d2de8dc621b2bab2198e7585fff08363a61))
* Update dimension from TIME param im WMS sources ([1980c5f](https://github.com/hslayers/hslayers-ng/commit/1980c5fdbb34ad7fc29202db06720907d3492cb3))
* Upgrade to Angular 14 ([09939e4](https://github.com/hslayers/hslayers-ng/commit/09939e423773fe41060f97f2685ee12e1a5e0166))
* **statistics:** Create function sketcher ([9268bc6](https://github.com/hslayers/hslayers-ng/commit/9268bc6444407ae2c82e4de183b6458087cce814))
* **statistics:** Dialog to fill in input for prediction models ([ec50fcf](https://github.com/hslayers/hslayers-ng/commit/ec50fcfa2d0872b2ed3e2064daa80f2ac8b2824a))
* **statistics:** Storing of prediction models ([4cc322d](https://github.com/hslayers/hslayers-ng/commit/4cc322d853751d5d3b473a620fa149461a04ea7c))
* **statistics:** Visualize predictions ([23e3800](https://github.com/hslayers/hslayers-ng/commit/23e38007ff5d6d73ad015fc2801bbf18fbcbc854))
* **wms-t:** Show loader if dates not fetched yet ([9856c89](https://github.com/hslayers/hslayers-ng/commit/9856c89f459c0f8f34b5d1a083f0e0ec4c9ef0da))
* Respond to keypress event for rename layer dialog ([333a81a](https://github.com/hslayers/hslayers-ng/commit/333a81a3c76d64d43991416bf2768273c2661b65))
* Update IDW layer legend on colorMap change ([4649bf4](https://github.com/hslayers/hslayers-ng/commit/4649bf485d83ec18b8827136dd20412bdc15619b))
* Widget for setting bounds and colormap for IDW layer ([4ea2eac](https://github.com/hslayers/hslayers-ng/commit/4ea2eac9f50f141ece88b10e64b88415e9cb1f22))


### Reverts

* Set ol-ext back to 4 ([87f54ad](https://github.com/hslayers/hslayers-ng/commit/87f54ad3725435d2534c9a45bf308af0205bfd4e))


* !feat(add-data): Implement GeoSPARQL logic ([8401e8d](https://github.com/hslayers/hslayers-ng/commit/8401e8d062abc0a7281b3ada6706b00deeb87ed3))


### BREAKING CHANGES

* for SparqlJson consumers



# [10.0.0-next.0](https://github.com/hslayers/hslayers-ng/compare/9.2.0...10.0.0-next.0) (2022-08-19)


### Bug Fixes

* Delay sidebarPosition monitoring to not get ExpressionChangedAfterItHasBeenCheckedError ([3a8cf22](https://github.com/hslayers/hslayers-ng/commit/3a8cf22b2a7c80274f51b6c52967170d0b9e5234))
* If hsConfig language property is provided, set the languageService language to it as well ([5a8c674](https://github.com/hslayers/hslayers-ng/commit/5a8c674f9d8a4c80feb400d78975f1a561ca9e52))
* Make importing of proj4 safer ([3e9aabb](https://github.com/hslayers/hslayers-ng/commit/3e9aabb47d428b8d6d6526fd2ddf038c7dcc2958))
* **SCSS:** Add new Bootstrap stylesheet ([8c01e81](https://github.com/hslayers/hslayers-ng/commit/8c01e81666523846f8ea5167b05b9d01f2edf05c))
* **statistics:** Fix building of statistics app for ng14 ([b3fb761](https://github.com/hslayers/hslayers-ng/commit/b3fb761e9b80c893ae5bd056770fcc65f23b0b95))
* **statistics:** Set title for statistics app ([e15ff73](https://github.com/hslayers/hslayers-ng/commit/e15ff7353019dbb749b22b03972763ab889d06eb))
* Add back missing ngIf after rebase ([c77c6a4](https://github.com/hslayers/hslayers-ng/commit/c77c6a4e4991c249f7ec8597b8c5ac781d97efe7))
* Add time shift instead of subtracting ([56bb8f1](https://github.com/hslayers/hslayers-ng/commit/56bb8f1f3b382dba505e65da4bdf1637ef009a42))
* Async check of zip file size ([626acde](https://github.com/hslayers/hslayers-ng/commit/626acdea10f4ec1a73a096ddb4e66bc45ef53145))
* Async chunk upload ([79ffc0d](https://github.com/hslayers/hslayers-ng/commit/79ffc0d9247e7e565b232a45c911473c50dd9686))
* Check for 4236 proj. aliases when uploading geojson file ([96296ef](https://github.com/hslayers/hslayers-ng/commit/96296eff4fbf249f62f65c726a1f27c9992cfbb4))
* Check if default_view property exists ([0867719](https://github.com/hslayers/hslayers-ng/commit/086771963dc6efb3df8adc15facd5dbbea0a4f87))
* Check if Layman endpoint exists where needed ([8305b17](https://github.com/hslayers/hslayers-ng/commit/8305b1779e3a6f8352225115f632c8c82847ab85))
* Correctly react to overwrite dialog actions ([fd723b5](https://github.com/hslayers/hslayers-ng/commit/fd723b557f70928659b2454f8b06a37ac6b7d292))
* Don't rely on package.json to fill version info in impressum ([3e181d9](https://github.com/hslayers/hslayers-ng/commit/3e181d9720c0294318fd4c286f4b45196e73ae3b))
* Fix layman layer deletion ([f797f2c](https://github.com/hslayers/hslayers-ng/commit/f797f2c9b2ad60d303bf178534d7211754e3effc)), closes [#3114](https://github.com/hslayers/hslayers-ng/issues/3114)
* Fixed multiple layer removal ([6a2c897](https://github.com/hslayers/hslayers-ng/commit/6a2c8971d297d4d14cba35b808fcf7b38f1ef2b6))
* Format time by config instead of hardcoded cs ([115bc9f](https://github.com/hslayers/hslayers-ng/commit/115bc9f59bd7557640a0855fffe97b781a760718))
* Ignore wfs status, when looking for layer descriptor adding vector layers ([4463b38](https://github.com/hslayers/hslayers-ng/commit/4463b383ed6f9988cfeced0cc25c5001ef9f3404))
* Make sure map is initiated properly before trying to fit extent ([1ffbb03](https://github.com/hslayers/hslayers-ng/commit/1ffbb03565670a2a05918d01374bde41c9c8d4ce))
* Overwrite geojson with sld ([8caab93](https://github.com/hslayers/hslayers-ng/commit/8caab938aaf5dfa0eee0b8dd6f31823301b71e9e))
* Prevent sidebar from opening when loading defaultComposition and config sidebarClosed is set to true ([6a81946](https://github.com/hslayers/hslayers-ng/commit/6a819463c0f17a72ad6937c4f84b8ae2abc782a8)), closes [#3149](https://github.com/hslayers/hslayers-ng/issues/3149)
* Provide header text for file upload error ([53eb812](https://github.com/hslayers/hslayers-ng/commit/53eb812c96b862225d66e4392c9d303ee1d13c98))
* Provide layer name from the descriptor if layer doesn't exists ([a714db6](https://github.com/hslayers/hslayers-ng/commit/a714db6b5a6a59b5308e35d9daf5d2d880e763d6))
* Provide SUPPORTED_SRS_LIST first 2 srs as default ([bfd3bc6](https://github.com/hslayers/hslayers-ng/commit/bfd3bc68e4acf16730dcb68df4ba7b3babf108d9))
* Reload current translations only if current lang set ([0010114](https://github.com/hslayers/hslayers-ng/commit/0010114827fb9cdb8d2d8842e61b9c5c0e815200))
* Reset translations dictionary when overrides provided in config ([70f6de2](https://github.com/hslayers/hslayers-ng/commit/70f6de2968e41ae68238cfa5edeb984c82f7ed42))
* Return result of recursive checkForLayerInLayman func ([125808d](https://github.com/hslayers/hslayers-ng/commit/125808dc6ae7bdb59bab6d7648aee46d22c6061d))
* Saving of attribute value when it's not object ([c41622e](https://github.com/hslayers/hslayers-ng/commit/c41622e6e740750ba3e66b1d3cd7b498598918fd))
* Set UI for LaymanAccessRights component on Init ([9f86aff](https://github.com/hslayers/hslayers-ng/commit/9f86aff586421bd2fdfdf18149b6984bca6da0a9))
* Show dialogs also when they are created on startup ([d53105f](https://github.com/hslayers/hslayers-ng/commit/d53105f4f38e6c9942d896b4dfaf7d7f562121d7)), closes [#3190](https://github.com/hslayers/hslayers-ng/issues/3190)
* Show SRS input for SHP file type ([4544f7a](https://github.com/hslayers/hslayers-ng/commit/4544f7acfc066dd6c5ab8cfcf6e60e2a88d471a1))
* WFS version 2 getFeature params, URI EPSG aliases ([5c81dee](https://github.com/hslayers/hslayers-ng/commit/5c81deec5e964ad75e36f1d6fe23c46ce966dba9)), closes [#3151](https://github.com/hslayers/hslayers-ng/issues/3151)
* **hslayers-server:** Pass correct HTTP response status code for most frequent errors ([b95a75b](https://github.com/hslayers/hslayers-ng/commit/b95a75b0925ed792581675898730a24b5b3f9e16))
* **LayerManager:** Pass 'app' property to service ([b4d2b59](https://github.com/hslayers/hslayers-ng/commit/b4d2b59d4a2b9690948104a7812b9116a4674d33))
* **LayerManager:** Safely polyfill dimensions ([f003c63](https://github.com/hslayers/hslayers-ng/commit/f003c63b00080bbcb48298f9099c5dc4b686bbcb))
* **statistics:** Better predictions and filter out nulls ([935c092](https://github.com/hslayers/hslayers-ng/commit/935c092022e0a36aefab2a91e764531eceb471ec))


### Features

* A nicer dialog to specify colorMap style options ([4ada5e0](https://github.com/hslayers/hslayers-ng/commit/4ada5e00333bed0e8343178111b576e8c778d929)), closes [#3025](https://github.com/hslayers/hslayers-ng/issues/3025)
* Add a dialog explaining statistics app ([80de9f0](https://github.com/hslayers/hslayers-ng/commit/80de9f0064e5328f77c17d0604de89bbc88c27eb))
* Add possibility to use reversed colorMap + add code description ([afd0614](https://github.com/hslayers/hslayers-ng/commit/afd0614a1d2d80194edca914d70254dfe3a0ff9d))
* Added set permissions feature to add data and compositions catalog items ([098b71b](https://github.com/hslayers/hslayers-ng/commit/098b71b5efba334b9d80d844470a143ff057d8d0))
* Assign extent to WMTS layers ([5d498f4](https://github.com/hslayers/hslayers-ng/commit/5d498f460363057ed15080034c97ec3a36fa5328))
* Check if url is obtainable for add-data-vector-url ([a127019](https://github.com/hslayers/hslayers-ng/commit/a1270191f7835fdc990cd29bedffe52327747abc)), closes [#3189](https://github.com/hslayers/hslayers-ng/issues/3189)
* Load WMTS datasets from Micka endpoint ([e97f86d](https://github.com/hslayers/hslayers-ng/commit/e97f86d68f493a20d4139adeece8652c73475b45))
* Provide ability to overwrite existing layman layers from file upload ([1ed41a5](https://github.com/hslayers/hslayers-ng/commit/1ed41a50604543c89a5b940a5d3040bcbb643729))
* Provide details if overwrite dialog appears again ([798dd3d](https://github.com/hslayers/hslayers-ng/commit/798dd3d544732fda96adc6f4c62ef850c65bc8d3))
* Respond to keypress event for rename layer dialog ([333a81a](https://github.com/hslayers/hslayers-ng/commit/333a81a3c76d64d43991416bf2768273c2661b65))
* Support timeout parameter in queues ([bdd71d2](https://github.com/hslayers/hslayers-ng/commit/bdd71d2de8dc621b2bab2198e7585fff08363a61))
* Update dimension from TIME param im WMS sources ([1980c5f](https://github.com/hslayers/hslayers-ng/commit/1980c5fdbb34ad7fc29202db06720907d3492cb3))
* Upgrade to Angular 14 ([09939e4](https://github.com/hslayers/hslayers-ng/commit/09939e423773fe41060f97f2685ee12e1a5e0166))
* **statistics:** Create function sketcher ([9268bc6](https://github.com/hslayers/hslayers-ng/commit/9268bc6444407ae2c82e4de183b6458087cce814))
* **statistics:** Dialog to fill in input for prediction models ([ec50fcf](https://github.com/hslayers/hslayers-ng/commit/ec50fcfa2d0872b2ed3e2064daa80f2ac8b2824a))
* **statistics:** Storing of prediction models ([4cc322d](https://github.com/hslayers/hslayers-ng/commit/4cc322d853751d5d3b473a620fa149461a04ea7c))
* **statistics:** Visualize predictions ([23e3800](https://github.com/hslayers/hslayers-ng/commit/23e38007ff5d6d73ad015fc2801bbf18fbcbc854))
* **wms-t:** Show loader if dates not fetched yet ([9856c89](https://github.com/hslayers/hslayers-ng/commit/9856c89f459c0f8f34b5d1a083f0e0ec4c9ef0da))
* Update IDW layer legend on colorMap change ([4649bf4](https://github.com/hslayers/hslayers-ng/commit/4649bf485d83ec18b8827136dd20412bdc15619b))
* Widget for setting bounds and colormap for IDW layer ([4ea2eac](https://github.com/hslayers/hslayers-ng/commit/4ea2eac9f50f141ece88b10e64b88415e9cb1f22))



# [9.3.0](https://github.com/hslayers/hslayers-ng/compare/9.2.0...9.3.0) (2022-08-05)


### Bug Fixes

* Add back missing ngIf after rebase ([c77c6a4](https://github.com/hslayers/hslayers-ng/commit/c77c6a4e4991c249f7ec8597b8c5ac781d97efe7))
* Add time shift instead of subtracting ([56bb8f1](https://github.com/hslayers/hslayers-ng/commit/56bb8f1f3b382dba505e65da4bdf1637ef009a42))
* Async check of zip file size ([626acde](https://github.com/hslayers/hslayers-ng/commit/626acdea10f4ec1a73a096ddb4e66bc45ef53145))
* Async chunk upload ([79ffc0d](https://github.com/hslayers/hslayers-ng/commit/79ffc0d9247e7e565b232a45c911473c50dd9686))
* Check for 4236 proj. aliases when uploading geojson file ([96296ef](https://github.com/hslayers/hslayers-ng/commit/96296eff4fbf249f62f65c726a1f27c9992cfbb4))
* Check if default_view property exists ([0867719](https://github.com/hslayers/hslayers-ng/commit/086771963dc6efb3df8adc15facd5dbbea0a4f87))
* Check if Layman endpoint exists where needed ([8305b17](https://github.com/hslayers/hslayers-ng/commit/8305b1779e3a6f8352225115f632c8c82847ab85))
* Correctly react to overwrite dialog actions ([fd723b5](https://github.com/hslayers/hslayers-ng/commit/fd723b557f70928659b2454f8b06a37ac6b7d292))
* Fix layman layer deletion ([f797f2c](https://github.com/hslayers/hslayers-ng/commit/f797f2c9b2ad60d303bf178534d7211754e3effc)), closes [#3114](https://github.com/hslayers/hslayers-ng/issues/3114)
* Fixed multiple layer removal ([6a2c897](https://github.com/hslayers/hslayers-ng/commit/6a2c8971d297d4d14cba35b808fcf7b38f1ef2b6))
* Format time by config instead of hardcoded cs ([115bc9f](https://github.com/hslayers/hslayers-ng/commit/115bc9f59bd7557640a0855fffe97b781a760718))
* Ignore wfs status, when looking for layer descriptor adding vector layers ([4463b38](https://github.com/hslayers/hslayers-ng/commit/4463b383ed6f9988cfeced0cc25c5001ef9f3404))
* Make sure map is initiated properly before trying to fit extent ([1ffbb03](https://github.com/hslayers/hslayers-ng/commit/1ffbb03565670a2a05918d01374bde41c9c8d4ce))
* Overwrite geojson with sld ([8caab93](https://github.com/hslayers/hslayers-ng/commit/8caab938aaf5dfa0eee0b8dd6f31823301b71e9e))
* Prevent sidebar from opening when loading defaultComposition and config sidebarClosed is set to true ([6a81946](https://github.com/hslayers/hslayers-ng/commit/6a819463c0f17a72ad6937c4f84b8ae2abc782a8)), closes [#3149](https://github.com/hslayers/hslayers-ng/issues/3149)
* Provide header text for file upload error ([53eb812](https://github.com/hslayers/hslayers-ng/commit/53eb812c96b862225d66e4392c9d303ee1d13c98))
* Provide layer name from the descriptor if layer doesn't exists ([a714db6](https://github.com/hslayers/hslayers-ng/commit/a714db6b5a6a59b5308e35d9daf5d2d880e763d6))
* Saving of attribute value when it's not object ([c41622e](https://github.com/hslayers/hslayers-ng/commit/c41622e6e740750ba3e66b1d3cd7b498598918fd))
* Show dialogs also when they are created on startup ([d53105f](https://github.com/hslayers/hslayers-ng/commit/d53105f4f38e6c9942d896b4dfaf7d7f562121d7)), closes [#3190](https://github.com/hslayers/hslayers-ng/issues/3190)
* Show SRS input for SHP file type ([4544f7a](https://github.com/hslayers/hslayers-ng/commit/4544f7acfc066dd6c5ab8cfcf6e60e2a88d471a1))
* WFS version 2 getFeature params, URI EPSG aliases ([5c81dee](https://github.com/hslayers/hslayers-ng/commit/5c81deec5e964ad75e36f1d6fe23c46ce966dba9)), closes [#3151](https://github.com/hslayers/hslayers-ng/issues/3151)
* **hslayers-server:** Pass correct HTTP response status code for most frequent errors ([b95a75b](https://github.com/hslayers/hslayers-ng/commit/b95a75b0925ed792581675898730a24b5b3f9e16))
* **LayerManager:** Pass 'app' property to service ([b4d2b59](https://github.com/hslayers/hslayers-ng/commit/b4d2b59d4a2b9690948104a7812b9116a4674d33))
* **LayerManager:** Safely polyfill dimensions ([f003c63](https://github.com/hslayers/hslayers-ng/commit/f003c63b00080bbcb48298f9099c5dc4b686bbcb))
* **statistics:** Better predictions and filter out nulls ([935c092](https://github.com/hslayers/hslayers-ng/commit/935c092022e0a36aefab2a91e764531eceb471ec))
* Provide SUPPORTED_SRS_LIST first 2 srs as default ([bfd3bc6](https://github.com/hslayers/hslayers-ng/commit/bfd3bc68e4acf16730dcb68df4ba7b3babf108d9))
* Reload current translations only if current lang set ([0010114](https://github.com/hslayers/hslayers-ng/commit/0010114827fb9cdb8d2d8842e61b9c5c0e815200))
* Reset translations dictionary when overrides provided in config ([70f6de2](https://github.com/hslayers/hslayers-ng/commit/70f6de2968e41ae68238cfa5edeb984c82f7ed42))
* Return result of recursive checkForLayerInLayman func ([125808d](https://github.com/hslayers/hslayers-ng/commit/125808dc6ae7bdb59bab6d7648aee46d22c6061d))
* Set UI for LaymanAccessRights component on Init ([9f86aff](https://github.com/hslayers/hslayers-ng/commit/9f86aff586421bd2fdfdf18149b6984bca6da0a9))


### Features

* Add a dialog explaining statistics app ([80de9f0](https://github.com/hslayers/hslayers-ng/commit/80de9f0064e5328f77c17d0604de89bbc88c27eb))
* Assign extent to WMTS layers ([5d498f4](https://github.com/hslayers/hslayers-ng/commit/5d498f460363057ed15080034c97ec3a36fa5328))
* Check if url is obtainable for add-data-vector-url ([a127019](https://github.com/hslayers/hslayers-ng/commit/a1270191f7835fdc990cd29bedffe52327747abc)), closes [#3189](https://github.com/hslayers/hslayers-ng/issues/3189)
* Support timeout parameter in queues ([bdd71d2](https://github.com/hslayers/hslayers-ng/commit/bdd71d2de8dc621b2bab2198e7585fff08363a61))
* Update dimension from TIME param im WMS sources ([1980c5f](https://github.com/hslayers/hslayers-ng/commit/1980c5fdbb34ad7fc29202db06720907d3492cb3))
* **statistics:** Create function sketcher ([9268bc6](https://github.com/hslayers/hslayers-ng/commit/9268bc6444407ae2c82e4de183b6458087cce814))
* **statistics:** Dialog to fill in input for prediction models ([ec50fcf](https://github.com/hslayers/hslayers-ng/commit/ec50fcfa2d0872b2ed3e2064daa80f2ac8b2824a))
* **statistics:** Storing of prediction models ([4cc322d](https://github.com/hslayers/hslayers-ng/commit/4cc322d853751d5d3b473a620fa149461a04ea7c))
* **statistics:** Visualize predictions ([23e3800](https://github.com/hslayers/hslayers-ng/commit/23e38007ff5d6d73ad015fc2801bbf18fbcbc854))
* **wms-t:** Show loader if dates not fetched yet ([9856c89](https://github.com/hslayers/hslayers-ng/commit/9856c89f459c0f8f34b5d1a083f0e0ec4c9ef0da))
* A nicer dialog to specify colorMap style options ([4ada5e0](https://github.com/hslayers/hslayers-ng/commit/4ada5e00333bed0e8343178111b576e8c778d929)), closes [#3025](https://github.com/hslayers/hslayers-ng/issues/3025)
* Add possibility to use reversed colorMap + add code description ([afd0614](https://github.com/hslayers/hslayers-ng/commit/afd0614a1d2d80194edca914d70254dfe3a0ff9d))
* Added set permissions feature to add data and compositions catalog items ([098b71b](https://github.com/hslayers/hslayers-ng/commit/098b71b5efba334b9d80d844470a143ff057d8d0))
* Load WMTS datasets from Micka endpoint ([e97f86d](https://github.com/hslayers/hslayers-ng/commit/e97f86d68f493a20d4139adeece8652c73475b45))
* Provide ability to overwrite existing layman layers from file upload ([1ed41a5](https://github.com/hslayers/hslayers-ng/commit/1ed41a50604543c89a5b940a5d3040bcbb643729))
* Provide details if overwrite dialog appears again ([798dd3d](https://github.com/hslayers/hslayers-ng/commit/798dd3d544732fda96adc6f4c62ef850c65bc8d3))
* Respond to keypress event for rename layer dialog ([333a81a](https://github.com/hslayers/hslayers-ng/commit/333a81a3c76d64d43991416bf2768273c2661b65))
* Update IDW layer legend on colorMap change ([4649bf4](https://github.com/hslayers/hslayers-ng/commit/4649bf485d83ec18b8827136dd20412bdc15619b))
* Widget for setting bounds and colormap for IDW layer ([4ea2eac](https://github.com/hslayers/hslayers-ng/commit/4ea2eac9f50f141ece88b10e64b88415e9cb1f22))



# [9.2.0](https://github.com/hslayers/hslayers-ng/compare/9.1.0...9.2.0) (2022-05-20)


### Bug Fixes

* Display hover popup even when query is disabled ([97501a1](https://github.com/hslayers/hslayers-ng/commit/97501a197b103957c083878622f0d6f18c1e1e5e))
* Don't forget to set sld layer param when parsing defaultStyle to ol style ([2dd49e5](https://github.com/hslayers/hslayers-ng/commit/2dd49e556741d64576b29a1f0ef138c01d0750bc))
* Hide compositionInfo panel on config change ([3edd504](https://github.com/hslayers/hslayers-ng/commit/3edd504486d23df70148dba95ada8208d6af91cb))
* Only layers visible in layermanager should trigger compositionEdits ([2d93270](https://github.com/hslayers/hslayers-ng/commit/2d93270e7fd6840378edf403bde1316fdef50812))
* Provide all params for addSld translation ([4da3174](https://github.com/hslayers/hslayers-ng/commit/4da317490c53db8f42ea2aab15fa6a276bd3c8df))
* Reduce size of color picker and center it ([9a280f3](https://github.com/hslayers/hslayers-ng/commit/9a280f37ee4b247d30ad3cccbcd3aee3a65efcdb))
* Selection of sensor after selecting feature in map ([fbae152](https://github.com/hslayers/hslayers-ng/commit/fbae1529d7806a2a2ec7078679593084841c2755))
* Sidebar button order after layout resize ([65250bc](https://github.com/hslayers/hslayers-ng/commit/65250bcc730571c5dfab9c1907ba84dd44e26b59))
* Support senslog OTS2 endpoint ([e47286d](https://github.com/hslayers/hslayers-ng/commit/e47286d8ef26664147035892730962cf74803a3a))
* **sensors:** Use translated sensor names in charts ([dcd6317](https://github.com/hslayers/hslayers-ng/commit/dcd6317f9fc9462108731fc1d8cb350752e906b0))

### Features

* **sensors:** Highlight selected unit ([cb2382f](https://github.com/hslayers/hslayers-ng/commit/cb2382f1d1e87c92d77bb7a1dd636e8e9bcbcbb3))
* Support listing of all attributes in hover popup ([706d2a8](https://github.com/hslayers/hslayers-ng/commit/706d2a83b7abbf0cd974954f13f85f9b37ce11e5)), closes [#3037](https://github.com/hslayers/hslayers-ng/issues/3037)
* Various improvements for visualizing sensor readings ([911c18a](https://github.com/hslayers/hslayers-ng/commit/911c18a606b677aa065245463839ebe12fb50970))
* **sensors:** Read observations for particular unit from OTS2 ([9aaf84b](https://github.com/hslayers/hslayers-ng/commit/9aaf84b46f46da45ad4702ac01e42195611bb6c9))


### Performance Improvements

* Don't compare entire data object, but just app ([1a0136f](https://github.com/hslayers/hslayers-ng/commit/1a0136f29c856a796465e4c69679245b1b682809))
* Don't trigger digests on marker painting ([16c8291](https://github.com/hslayers/hslayers-ng/commit/16c8291a7440a3216d0893a56992635025512de5))



# [9.1.0](https://github.com/hslayers/hslayers-ng/compare/9.0.0...9.1.0) (2022-05-16)


### Bug Fixes

* Access right translation ([96a5bee](https://github.com/hslayers/hslayers-ng/commit/96a5bee19a63cde9f583bb776b23d6f9178fd2ae))
* Change structure for mapExtentChanges event subject ([9056ec2](https://github.com/hslayers/hslayers-ng/commit/9056ec206c9108942c5bd7cf5b614a9a783f68ea)), closes [#2951](https://github.com/hslayers/hslayers-ng/issues/2951)
* Circular dependency in compositions ([bea2b11](https://github.com/hslayers/hslayers-ng/commit/bea2b112b069fdbbcdd5f2e000fd55c5ebd6a72b))
* Clean map content when overwriting composition ([f20e357](https://github.com/hslayers/hslayers-ng/commit/f20e3571aea2f7a17b2e3de7e3bfb6129f666eea))
* Cleanup after layer manager component is destroyed ([5d08430](https://github.com/hslayers/hslayers-ng/commit/5d08430119971d81f89272571418b4b30bcae568))
* Display toasts for correct app instead of default ([6475fb8](https://github.com/hslayers/hslayers-ng/commit/6475fb8c64dba41abf007d2db23c7fb1a09d1511))
* Expression changed errors in minisidebar ([0a0c8c1](https://github.com/hslayers/hslayers-ng/commit/0a0c8c19a6a6ba841754cb7e8936951cd4bdb74e))
* filter duplicate layers or compositions ([f862306](https://github.com/hslayers/hslayers-ng/commit/f86230675127c1dcfcfcc0993df61323ea2bfdbf))
* Fix translations and icon selector for symbolizers ([2494d12](https://github.com/hslayers/hslayers-ng/commit/2494d12d75b2437f049abe00e6a31f288af45196)), closes [#2925](https://github.com/hslayers/hslayers-ng/issues/2925) [#2924](https://github.com/hslayers/hslayers-ng/issues/2924)
* Hide save current map btn, if saveMap is not enabled ([8e01059](https://github.com/hslayers/hslayers-ng/commit/8e010590bf6419b4ffa6da792a930adf09bc150a))
* InterpolatedSource weight option is manditory ([8a8f961](https://github.com/hslayers/hslayers-ng/commit/8a8f961936886fcf9170aed47fec2853db27815f))
* Only layers visible in layermanager should trigger compositionEdits ([2d93270](https://github.com/hslayers/hslayers-ng/commit/2d93270e7fd6840378edf403bde1316fdef50812))
* Pass app to wmts url component ([64c272d](https://github.com/hslayers/hslayers-ng/commit/64c272d90684e625d8df9f4120f513ed6f9431d3))
* Provide all params for addSld translation ([4da3174](https://github.com/hslayers/hslayers-ng/commit/4da317490c53db8f42ea2aab15fa6a276bd3c8df))
* Provide default app id if none is present ([4f70ff0](https://github.com/hslayers/hslayers-ng/commit/4f70ff0b1240016085a6a4be17feb18cf60c53c2))
* Reduce size of color picker and center it ([9a280f3](https://github.com/hslayers/hslayers-ng/commit/9a280f37ee4b247d30ad3cccbcd3aee3a65efcdb))
* Remove unnecessary jQuery conflicting dropdown attrs ([6a719ba](https://github.com/hslayers/hslayers-ng/commit/6a719badba48bbb87d06eb1c8c744c688c625277))
* Resetting of default view for multi-apps ([1c8e900](https://github.com/hslayers/hslayers-ng/commit/1c8e9000e7f871f0b6a0fa3021e513550c374b2f))
* Save layers to composition in order 'higher zindex first /base map last ([f1f20e8](https://github.com/hslayers/hslayers-ng/commit/f1f20e8ee07506aa2ea5fb67df25e7ad20fc743d))
* Selection of sensor after selecting feature in map ([fbae152](https://github.com/hslayers/hslayers-ng/commit/fbae1529d7806a2a2ec7078679593084841c2755))
* Show users screenName or username if given name and family name is not provided ([f2625e4](https://github.com/hslayers/hslayers-ng/commit/f2625e41a2659ae74731be6c74cbfa14a4864624))
* Sidebar button order after layout resize ([65250bc](https://github.com/hslayers/hslayers-ng/commit/65250bcc730571c5dfab9c1907ba84dd44e26b59))
* Sidebar not toggleable in mobile layout ([c87e57c](https://github.com/hslayers/hslayers-ng/commit/c87e57c47823c2270ed45409b3faf5f41bbebce7))
* Sublayers checkboxes ([8028932](https://github.com/hslayers/hslayers-ng/commit/802893244f6f490472f17327b487a12704dd1b3b))


### Features

* Ability to set access_rights per user ([ce6ef33](https://github.com/hslayers/hslayers-ng/commit/ce6ef336b26fb595631c27803b438b0472592fd8))
* Allow SLD style for loaded geojson layers ([546f75d](https://github.com/hslayers/hslayers-ng/commit/546f75df3cf099c886ab90801d4e01039f5ae01d))
* Parse few CSW composition metadata ([94c3515](https://github.com/hslayers/hslayers-ng/commit/94c35153a6522ee7aab2f1c0a78b5e90b684292a))
* Support creation of color maps through SLD filters ([9b8c4a6](https://github.com/hslayers/hslayers-ng/commit/9b8c4a68abfe64885e96737059e0d54b23fb1bdd))
* **add-data:** Service list component ([b32c5d1](https://github.com/hslayers/hslayers-ng/commit/b32c5d16fe0d0c2504c5553ce6245ea88e56dd14))
* Support function as getUrl result for vector layers ([8299f0f](https://github.com/hslayers/hslayers-ng/commit/8299f0fdf43ff23896e3ede56c47fa9051a51371))


### Performance Improvements

* Don't call functions from sidebar template ([c2adce0](https://github.com/hslayers/hslayers-ng/commit/c2adce065de5cb4da8e0d0ec5961fb088191f68b))
* Don't compare whole data object, but just app string in pipe ([7ed060b](https://github.com/hslayers/hslayers-ng/commit/7ed060b4b9777f049a0c3bdf98873774ad615501))
* Don't translate sensor names ([5b0c0ee](https://github.com/hslayers/hslayers-ng/commit/5b0c0ee174c48b9f75b3b05aac8b816458e0ebc4))
* Generate color map for interpolated layer ([1cbabe2](https://github.com/hslayers/hslayers-ng/commit/1cbabe25f2bf62fe353ce0c6a1cc3355587b6683))
* Move asset path handling to hsConfig ([68dd74a](https://github.com/hslayers/hslayers-ng/commit/68dd74a15162378d103f76f59490dd97a9212dd3)), closes [#2984](https://github.com/hslayers/hslayers-ng/issues/2984)


### BREAKING CHANGES

* Substitute `HsUtilsService.getAjaxLoaderIcon()` with `hsConfigRef._ajaxLoaderPath`.
hsConfigRef can be filled by `HsConfig.get(app | 'default')` inside components ngOnInit.
Substitute `HsUtilsService.getAssetsPath()` function with variable `configRef.assetsPath`.
* npm i colormap
* hsEventBusService.mapExtentChanges event data changes to {map, event, extent, app}



# [9.0.0](https://github.com/hslayers/hslayers-ng/compare/8.1.0...9.0.0) (2022-04-20)


### Bug Fixes

* Add missing required composition params ([5b353a5](https://github.com/hslayers/hslayers-ng/commit/5b353a51f79bc7d13037c2cedf92fb8603ae62fa))
* Bootstrapping code for cesium-app ([02ca26a](https://github.com/hslayers/hslayers-ng/commit/02ca26a8178cdac81af82fcf9a487e8645a62364))
* Building of cesium app ([d8e2e64](https://github.com/hslayers/hslayers-ng/commit/d8e2e64f574c8ddb14d4c27cea7e54bf1e2ef323))
* Capabilities parsing error ([22bfa9b](https://github.com/hslayers/hslayers-ng/commit/22bfa9b44a6fbdd1192c3885e2eb170a6d98f4c5))
* Composition panel fixes ([906e79d](https://github.com/hslayers/hslayers-ng/commit/906e79d22bee385e91d049b67538d6862a7cb367))
* connectServiceFromUrlParam ([d9bb208](https://github.com/hslayers/hslayers-ng/commit/d9bb2086096c47f3512fd7561b897a46d67b8db7))
* contentWrapper needs to be set before sidebarPosition ([5e0d7fa](https://github.com/hslayers/hslayers-ng/commit/5e0d7fa7ca963bec143fb08474d68e5601475b3b))
* Copy/move feature ([c44ad30](https://github.com/hslayers/hslayers-ng/commit/c44ad308c3efcc42947ce3a10cb521d79791857c))
* Create empty toasts array if none exists ([7a66e57](https://github.com/hslayers/hslayers-ng/commit/7a66e572a3afaa215b973dad339fceedf3c372c1))
* Don't go fullscreen in very small containers ([dffcf13](https://github.com/hslayers/hslayers-ng/commit/dffcf13e50047c2375d10b1c40162350dd6a0d23))
* Don't store layers not visible in LM ([d87c2d9](https://github.com/hslayers/hslayers-ng/commit/d87c2d93bcaa1a3e167705ea6532e9b1b0774298))
* Don't throw error if some highlightable feature null ([c8a5ccf](https://github.com/hslayers/hslayers-ng/commit/c8a5ccfed09bc02f44ee720344c9684ba594045e))
* Dont request layman version if no endpoint ([b4ec6f2](https://github.com/hslayers/hslayers-ng/commit/b4ec6f272c5cf55466be5ee15468f0503c306997))
* Ensure Layman username at first login ([2af8705](https://github.com/hslayers/hslayers-ng/commit/2af87053815eca6eec8a9c9704663adcd9c2b12c))
* Error filling bbox for composition when sharing map ([7599145](https://github.com/hslayers/hslayers-ng/commit/759914508e27527def747a36f96227603c089cef))
* ExpressionChangedAfterItHasBeenCheckedError ([32fd074](https://github.com/hslayers/hslayers-ng/commit/32fd074d7e2ad9bd7c31d9c69c73a459b09664f0))
* Fix basemap gallery for multi-apps ([15fde85](https://github.com/hslayers/hslayers-ng/commit/15fde8518bafaaf644c150eeb969002020d771f0))
* Fix decoupling test app for multi-apps ([b311ced](https://github.com/hslayers/hslayers-ng/commit/b311ced74898bf99651d359c00694ace504134d7))
* Init popup service before component ([57edff5](https://github.com/hslayers/hslayers-ng/commit/57edff54319d7daccb2e0697def15a3d9d0e997a))
* initRun for undefined app ([8393c73](https://github.com/hslayers/hslayers-ng/commit/8393c7313a8d1ba55c3711a7575eeec2c9f34797))
* LM multi app fixes ([4c173bd](https://github.com/hslayers/hslayers-ng/commit/4c173bd9f9dbbaf1c359336efe8ad3b57cdbfb83))
* Loading layman wfs layers ([f208291](https://github.com/hslayers/hslayers-ng/commit/f2082918828a2e3a165a16411e8c2a8c8077de85))
* Make sure dialogs are passed app id in data object ([22380a6](https://github.com/hslayers/hslayers-ng/commit/22380a623ea2ce8ac12791c35c95e9444388ec63))
* Make sure sidebarPosition is set before layoutservice init ([#2916](https://github.com/hslayers/hslayers-ng/issues/2916)) ([3138a2c](https://github.com/hslayers/hslayers-ng/commit/3138a2c88d8028b76eb893536803dffc16a35383))
* Map swipe position in storage ([7a2eb3f](https://github.com/hslayers/hslayers-ng/commit/7a2eb3ff76b6fb44393e805597e110c486de1ad7))
* Merge data objects for widgets from js and html ([460ad4d](https://github.com/hslayers/hslayers-ng/commit/460ad4dec701b37ef908b89d3308eb795671c1d4))
* Minisidebar buttons displayed ([3762c30](https://github.com/hslayers/hslayers-ng/commit/3762c309ac4952406fe573449edbdd3e93123c02))
* OSM layer from app not added due to placeholder ([5209115](https://github.com/hslayers/hslayers-ng/commit/52091159e3768fcc4e31677665ad9916e806c6bc))
* Passing of data object to panel from multiple sources ([9b4c43d](https://github.com/hslayers/hslayers-ng/commit/9b4c43dc697bfe9c5616c72b6022b3bf4e79ed9b))
* Prioritize user defined height on init ([ae3a7ec](https://github.com/hslayers/hslayers-ng/commit/ae3a7ecaed34d5c0418c9e0e7c2f4ae3970ddd34))
* Provide correct attr bound id for chb and label ([ad0100c](https://github.com/hslayers/hslayers-ng/commit/ad0100c25f30e340af22efe77ba9f49c3e99ddbb))
* Provide correct data object for layman login ([45bd632](https://github.com/hslayers/hslayers-ng/commit/45bd632284730d0280152619fef4ad46976a4b5a))
* Provide default style for tmp draw layer ([ee3e536](https://github.com/hslayers/hslayers-ng/commit/ee3e536a70fbef735a088fcbe7db178b03e6427e))
* Remove obsolete Status Manager requests, fixes [#2796](https://github.com/hslayers/hslayers-ng/issues/2796) ([3a389f3](https://github.com/hslayers/hslayers-ng/commit/3a389f3902196ff6f22ebf65f8a4e9a0c6bea385))
* Remove only selected layman layer ([2dbfc92](https://github.com/hslayers/hslayers-ng/commit/2dbfc92bdb48c8dd091f7677a2533b9e02621a24))
* Remove osm placeholder layer if default_layers has OSM already ([f340919](https://github.com/hslayers/hslayers-ng/commit/f3409197a7b2dcc73dbe048ecd1952cc49817c10))
* Return app reference string on auth change ([1a3b486](https://github.com/hslayers/hslayers-ng/commit/1a3b48689ef3d6e40282c48a1355c3be8532cd8d))
* Save map component undefined error ([b1001ec](https://github.com/hslayers/hslayers-ng/commit/b1001ec8a1ecc3587a556c94cca6853e98ebd7e3))
* Separate vector uploaders, empty sld blob breaking vector upload ([88b4559](https://github.com/hslayers/hslayers-ng/commit/88b455981069b26cfd3bb3165f0d285358296ce6))
* Set default style object if parsing sld/qml fails ([50cb0d7](https://github.com/hslayers/hslayers-ng/commit/50cb0d79eed3d21d43c45cbefbc198c819ec11e8)), closes [#2880](https://github.com/hslayers/hslayers-ng/issues/2880)
* Share pure map ([df24678](https://github.com/hslayers/hslayers-ng/commit/df2467830bb19c485ea43e347b9aff891c0141f0))
* Share radio buttons ([2e145d5](https://github.com/hslayers/hslayers-ng/commit/2e145d5bb8a8f50fe08a8f46fd08ee9e5d418c7c))
* Sidebar should load always, but be hidden if configured ([1932fe3](https://github.com/hslayers/hslayers-ng/commit/1932fe33efff11822bfeb63ce778be46676ecc9d))
* **add-data:** Fix url details params translation ([759f979](https://github.com/hslayers/hslayers-ng/commit/759f979f73d42aa54b2fd0b6801bde2053b572f6))
* Sidebar not shrinking on layoutresize ([a7936cc](https://github.com/hslayers/hslayers-ng/commit/a7936cc5e12f6ddeac4032821930953889126cef))
* **map-swipe:** Cannot addLayer from undefined ([754d724](https://github.com/hslayers/hslayers-ng/commit/754d7243b221ab6cbdd84497f10ff58e5898510c))
* **measure:** Bind data to html from service and don't store it inside the component ([4a535d0](https://github.com/hslayers/hslayers-ng/commit/4a535d0690430ea0d7515028c9f4a8e12817d41b))
* **save-map:** Add missing app input ([d1c6a52](https://github.com/hslayers/hslayers-ng/commit/d1c6a52fc9950565f036d458277ec27da606d154))
* Translation pipe syntax ([62de181](https://github.com/hslayers/hslayers-ng/commit/62de181607082e2bddd9cbf1ae91f83c4856d910))


### Build System

* Add popperjs/core peer dependency for ngBootstrap ([735c51c](https://github.com/hslayers/hslayers-ng/commit/735c51c49cf68fcf47b5ea702d437958a38fbd81))


### Code Refactoring

* Change sidebar button management ([4ae9387](https://github.com/hslayers/hslayers-ng/commit/4ae93877334e9a2a59ff14e4fb743f7d4b786e34))
* Make HsLayoutService.sidebarVisible an observable ([f9822bf](https://github.com/hslayers/hslayers-ng/commit/f9822bf6dffefc7f69953162e913ac85bdbc85a6)), closes [#2888](https://github.com/hslayers/hslayers-ng/issues/2888)
* Multiple translation services for multi-apps ([77e0158](https://github.com/hslayers/hslayers-ng/commit/77e0158ce3936a6e7dec4905efbf6af2de415b4d))
* Replace sidebarBottom() with sidebarPosition observable ([b15450e](https://github.com/hslayers/hslayers-ng/commit/b15450e74589b3053070656afda6f1653afe1560)), closes [#2888](https://github.com/hslayers/hslayers-ng/issues/2888)


### Features

* Ability to load CSW type compositions ([3944356](https://github.com/hslayers/hslayers-ng/commit/3944356da2f0be32a80edeebb76c0d7639070130))
* Add multiple-apps support with shared services but separate config ([e0c1dd5](https://github.com/hslayers/hslayers-ng/commit/e0c1dd539202390b45d67add38cbc49ce75a7cdb))
* Add new defaultComposition config parameter ([ed7794d](https://github.com/hslayers/hslayers-ng/commit/ed7794d4ae497d0d957f2dd7791e1dbca38ca96f))
* Add overridable senslog path config ([c5b668e](https://github.com/hslayers/hslayers-ng/commit/c5b668e3456ae9c1e1ccd1a2c9d32d8aca650873))
* Allow multiple hslayersNgConfig with app id postfix ([601f440](https://github.com/hslayers/hslayers-ng/commit/601f440c429e338903e0da5e2f2a69744d92f532))
* Create InterpolatedSource class for IDW layers ([c8326a6](https://github.com/hslayers/hslayers-ng/commit/c8326a66b1e7e6811a1a33a8d72ad89752f16daa))
* Support multiple hslayers-app elements ([eeb161e](https://github.com/hslayers/hslayers-ng/commit/eeb161ea243bc0d9638d203a89ee7f32afc9d0d6))


### Performance Improvements

* Make panelSpaceWidth observable ([7514330](https://github.com/hslayers/hslayers-ng/commit/75143300d9926fe05c73a29a35db5cc13d151943))


### BREAKING CHANGES

* Since a page can have multiple hslayers maps, but Angular services are singletone, a lot of functions inside hslayers services need `app` parameter specified. Use value 'default' if unsure.
* Replace sidebarVisible() with sidebarVisible observable. It returns {app, visible}
* Replace sidebarBottom() with sidebarPosition observable. It returns {app, position}
where position == 'bottom' if sidebar is located at bottom.
* panelSpaceWidth is not a function anymore, but a BehaviourSubject<{app, width}>
* Add ol-ext library as peer dependency
```
npm i ol-ext
```
* Hslayers wont compile without popperjs/core
* Use `translateHs: {'app': data.app}` or just `translateHs: {app: data.app} ` pipe provided by HsLanguageModule instead of `translate` which is provided by ngx-translate if you want to translate components which are integrated into hslayers application such as custom HSlayers-ng panels or widgets.
* Buttons are now added by HsSidebarService.addButton() function



# [8.1.0](https://github.com/hslayers/hslayers-ng/compare/8.0.0...8.1.0) (2022-03-15)


### Bug Fixes

* **external:** Check if layer is visible, when handling feature custom actions ([15aeebe](https://github.com/hslayers/hslayers-ng/commit/15aeebef725c99a302826bae7303492370d4ac6c))
* **legend:** Layer has no style rules ([91956e9](https://github.com/hslayers/hslayers-ng/commit/91956e97851e1342b7e427ea241911a3f4867e0a))
* **print:** Implemented fixes for found bugs and issues ([1f5416b](https://github.com/hslayers/hslayers-ng/commit/1f5416b99a9f27bcd6af8198fe1e31eca2bfb50d))
* **print:** Provide correct wms layer legend height ([1b910dd](https://github.com/hslayers/hslayers-ng/commit/1b910ddba847f4e8f7ee1a358bb5da01e616bce5))
* **save-map:** Button for downloading composition json ([a6c4f83](https://github.com/hslayers/hslayers-ng/commit/a6c4f83717884193bc3044bf462c228e84d602c8))
* Fix save-map thumbnail generation ([8e91564](https://github.com/hslayers/hslayers-ng/commit/8e915643d6ad0aa04c2741cf3701e5971a87451f))
* **save-map:** Improve map saving completion ([af84014](https://github.com/hslayers/hslayers-ng/commit/af840144d15fd4537574fc1c40f50a686da1ecaa))
* Improve map saving UX and validation ([7876384](https://github.com/hslayers/hslayers-ng/commit/7876384a064866a500e04ca7fb152838b210ec29))
* Look for wms layers with name recursively ([bdd0e2a](https://github.com/hslayers/hslayers-ng/commit/bdd0e2a4ed7afe8401ba4b448549ab95cfa830df))


### Code Refactoring

* Merge the two variants of map saving forms ([a908092](https://github.com/hslayers/hslayers-ng/commit/a908092da458bfbb9c303ff764aa14eb5703eb55))


### Features

* **print:** Support configuring legend, scale and text for print panel ([1c7ad71](https://github.com/hslayers/hslayers-ng/commit/1c7ad71e7c9ceafafe4f81348a68fff31e2be325))


### BREAKING CHANGES

* advancedForm hsConfig parameter removed



# [8.0.0](https://github.com/hslayers/hslayers-ng/compare/7.0.3...8.0.0) (2022-02-11)


### Bug Fixes

* Await for locales to load for some translations ([2d41de5](https://github.com/hslayers/hslayers-ng/commit/2d41de5c22216cac9d5e093ba26c562c809523c5)), closes [#2671](https://github.com/hslayers/hslayers-ng/issues/2671)
* Check if server layer is vector ([083f92f](https://github.com/hslayers/hslayers-ng/commit/083f92f2b2abf308ab7e25de849217cb7abe1a40))
* Clear error message on each tile load successfully loaded ([7cc6c65](https://github.com/hslayers/hslayers-ng/commit/7cc6c65c490b63bb20142bd090efd36527b65d60))
* clusteringDistance config param ([1d8d599](https://github.com/hslayers/hslayers-ng/commit/1d8d59973340305a3b9ea767a5f5bb5972ba02c4))
* Correctly remove external actions on layer removal ([9258524](https://github.com/hslayers/hslayers-ng/commit/925852483b61f49efd7c402b306b86190f1e75da)), closes [#2635](https://github.com/hslayers/hslayers-ng/issues/2635)
* Don't scroll to layer being added through GET param ([c2a66fe](https://github.com/hslayers/hslayers-ng/commit/c2a66fe71c5f0ab0e37ec6271b7c0f1855dd6af5)), closes [#2541](https://github.com/hslayers/hslayers-ng/issues/2541)
* Don't search layer for feature in invisible layers ([e16e771](https://github.com/hslayers/hslayers-ng/commit/e16e7719404c5047b10155cd6f1141d919e6d19d))
* Dont clear hover widget replay subject on destruction ([aa18426](https://github.com/hslayers/hslayers-ng/commit/aa18426aad1c81a492574862a5185b369633330d))
* Draw layer list dropdown position ([cbc7ff0](https://github.com/hslayers/hslayers-ng/commit/cbc7ff0841310443eaeda7d7b63c63540dea386c))
* Enable getfeatureinfo if capabilities lists layer as queryable ([381b772](https://github.com/hslayers/hslayers-ng/commit/381b77267e57f2ef3779e62693552408bf468558))
* Exclude GPServer services from services list ([fc3ae66](https://github.com/hslayers/hslayers-ng/commit/fc3ae6662825a07fdff239c477bd43c813ea7dd7))
* Finding of correct layer when feature IDs overlap ([6cf6739](https://github.com/hslayers/hslayers-ng/commit/6cf6739d32006ba2c6849920113520add9742d32)), closes [#2617](https://github.com/hslayers/hslayers-ng/issues/2617)
* Flickering due to cached feature-layer mappings ([7e1432a](https://github.com/hslayers/hslayers-ng/commit/7e1432ae5e23702bc8bbab3cd40ef79e6aa4e589))
* Group layer manager action under dropdown menu ([94ed8ea](https://github.com/hslayers/hslayers-ng/commit/94ed8eaf6630389a4132afdeb82bb961fd5ffcdf)), closes [#2585](https://github.com/hslayers/hslayers-ng/issues/2585)
* Hide popup for layers where it's not configured ([5a96c81](https://github.com/hslayers/hslayers-ng/commit/5a96c81be574a0177f4f34a03df2234b9e301839)), closes [#2672](https://github.com/hslayers/hslayers-ng/issues/2672)
* Increase supported max panel size ([388b36f](https://github.com/hslayers/hslayers-ng/commit/388b36fc34ca963bdc975c59e2dfc1509bcd9569))
* Layer scale settings in LayerManager keeps its value ([3a73ec4](https://github.com/hslayers/hslayers-ng/commit/3a73ec459336d36f6bd8cb3f5488a7a6d119280f))
* Make instance checking more robus when mod-fed is used ([3126d68](https://github.com/hslayers/hslayers-ng/commit/3126d6813d68accb455a26c1b6550f6ba4dcc125))
* Make layer removed async ([3bf71ee](https://github.com/hslayers/hslayers-ng/commit/3bf71eecb468fccaca36bae3643da68091bba92d))
* Missing layer editor widgets after second toggle ([4d721a1](https://github.com/hslayers/hslayers-ng/commit/4d721a15bcfc26fc4ff2d9f073681f92797b5090)), closes [#2602](https://github.com/hslayers/hslayers-ng/issues/2602)
* Not possible to add Layman layer to the map using draw layers list ([0188beb](https://github.com/hslayers/hslayers-ng/commit/0188beb1193e4f363edd378016f87bf37b9bbea1))
* Only imageServer gets loaded ([89f96ae](https://github.com/hslayers/hslayers-ng/commit/89f96aed9ee064e7cde16fd5cc3fa38661c3de06))
* Override LAYERS param with subLayers if specified ([5f0f0de](https://github.com/hslayers/hslayers-ng/commit/5f0f0de9a5c374c1499f5e1f4bc71f5edbc6f100))
* Panels space minw width ([6d2d95a](https://github.com/hslayers/hslayers-ng/commit/6d2d95ae9cb29d5fb624ee5442feb151da4b4cdd))
* Render font in styler imediately after change ([89ba1cf](https://github.com/hslayers/hslayers-ng/commit/89ba1cfed945a576ed4ec1b630e59a94a0ed15e8)), closes [#2637](https://github.com/hslayers/hslayers-ng/issues/2637)
* Set copied layer props and source params before adding to map ([ddc9861](https://github.com/hslayers/hslayers-ng/commit/ddc986100b693654b4a3e817c284d1d1386b5e6a))
* Set copied layers sublayers to new copy ([cfcb6c3](https://github.com/hslayers/hslayers-ng/commit/cfcb6c3837c07af984834a12274b10add929a357))
* sidebarToggleable config param ([8c5fc0e](https://github.com/hslayers/hslayers-ng/commit/8c5fc0efd5920f4321eb3b49d7aae9aa1536b251))
* **map:** Fix mousewheel zoom not working in Material apps ([c83ff8d](https://github.com/hslayers/hslayers-ng/commit/c83ff8dcc02b05fb4608e7d76229d72044d0b538))
* Add ability to toggle arcgisrest sub layers ([45255da](https://github.com/hslayers/hslayers-ng/commit/45255da485a6040ef0c72d378f18fc5d1e3b3451))
* Add checked layers OR all layers if none checked ([3de2100](https://github.com/hslayers/hslayers-ng/commit/3de210037f9d602fffbc66573722fe646ffb859c))
* Adding of ArcGis layers as one layer ([fa97558](https://github.com/hslayers/hslayers-ng/commit/fa97558d35efb90428e497c9d8ba5678fcce29b7))
* Allow setting of arcgis layer title ([dc4e497](https://github.com/hslayers/hslayers-ng/commit/dc4e49711a9ac0cd65f50b825fc759c58dad94c3))
* Callback fix for Wagtail ([bbd47a0](https://github.com/hslayers/hslayers-ng/commit/bbd47a030f83fc9e7f6a276c110ffe7097edf34d))
* Catch error, if Ol cannot get mapExtent ([cec1ec3](https://github.com/hslayers/hslayers-ng/commit/cec1ec3fd70fac45b4ddc0e58dc434614cbfb01f))
* Changed some missed replacements from ([5ccba47](https://github.com/hslayers/hslayers-ng/commit/5ccba47564025303adb58dc77e8389b1611d05bb))
* Check if caps.documentInfo exists ([89af3e4](https://github.com/hslayers/hslayers-ng/commit/89af3e44f4274c86b6f976eeff945b2a5de95a32))
* Check if layer is clustered ([ae070ba](https://github.com/hslayers/hslayers-ng/commit/ae070bafb2efd48cf0da7499e97e1cce51db3676))
* Clear initial urlType after it is loaded ([6b4a0c4](https://github.com/hslayers/hslayers-ng/commit/6b4a0c4e3bd0a0542b2558f101542c7c381e2c8e)), closes [#2541](https://github.com/hslayers/hslayers-ng/issues/2541)
* Clone copied layers source ([27a29ab](https://github.com/hslayers/hslayers-ng/commit/27a29ab3a7748bbe2fe42ebc1b4056b8b969bbcd))
* Create a layer copy ([bd36a2d](https://github.com/hslayers/hslayers-ng/commit/bd36a2d7878b495df8de13146f5d4ac253e3a75c))
* Delete ArcGis Layer array if size is 0 ([cc4f76e](https://github.com/hslayers/hslayers-ng/commit/cc4f76eab5c9b53dc85d111691039f5a52ecd154))
* Display subset of sublayers if needed ([d3cc6f8](https://github.com/hslayers/hslayers-ng/commit/d3cc6f8f3259f10fc1284736e6502f9a8f22babe))
* Do not iterate undefined ([479edbb](https://github.com/hslayers/hslayers-ng/commit/479edbb402f4fb30a9fdb028bd787acc8f248d18))
* Don't generate new arcGis layer title from sublayers ([096cde9](https://github.com/hslayers/hslayers-ng/commit/096cde96ee043c262b89b680d100dbc759f67ba1))
* Don't set subLayers property if whole wms layer is added ([1230841](https://github.com/hslayers/hslayers-ng/commit/1230841895fd929311612e562a18f959d46e076c))
* Expanding services in arcgis ([4da520d](https://github.com/hslayers/hslayers-ng/commit/4da520dc2568c710852c4fab95709fd4a93be49b))
* Get arcgis layer name preferably from documentInfo ([16c42a6](https://github.com/hslayers/hslayers-ng/commit/16c42a62a275d882bfa1db40b861c1079586dc08))
* Load extent of ArcGIS layers for zoom to button ([b1dd9b6](https://github.com/hslayers/hslayers-ng/commit/b1dd9b640932acf235b3575cbf78cfa06780b846))
* Might fix the loading layer icon ([26ef760](https://github.com/hslayers/hslayers-ng/commit/26ef76008c18cf1c906dc246e60a9c6b3956d053))
* OpenLayersParser when default imports are used ([fc38ff4](https://github.com/hslayers/hslayers-ng/commit/fc38ff4578e5f5d2b2a2940471b75065d1af72d2))
* Private view properties not applied ([abbf2f4](https://github.com/hslayers/hslayers-ng/commit/abbf2f4b336a320dfe58839a7b203209aa358758)), closes [#2522](https://github.com/hslayers/hslayers-ng/issues/2522)
* Push argis added layers to returned collection ([c340986](https://github.com/hslayers/hslayers-ng/commit/c3409862ceaef938a47b405a851c0824ad9b9b5b))
* Readme link to hslayers-server ([f6d69de](https://github.com/hslayers/hslayers-ng/commit/f6d69de100e8a4bbdcd665e7eb1b0454f4c3d62a))
* Register 3031 projection to proj.def ([4004f2b](https://github.com/hslayers/hslayers-ng/commit/4004f2b142f64be87bed132eb175404bdadbf006))
* Register 3995 projection to proj.def ([d1b046f](https://github.com/hslayers/hslayers-ng/commit/d1b046f9a6be6164996f88e7998c12c6649714cb))
* Replace default url path for map sharing ([9b25b5c](https://github.com/hslayers/hslayers-ng/commit/9b25b5c0efc305dfedcef3e7f47786709878ed9d))
* Reset also views rotation ([fa61a43](https://github.com/hslayers/hslayers-ng/commit/fa61a43a431a31debbe2e9fd8e2517feea550dd9))
* Set AddData panel to catalogue after adding layers ([07f0325](https://github.com/hslayers/hslayers-ng/commit/07f0325a3b323857c3408f8dde13969eabc4ebc3))
* Set fornt size for new SLD rule for clusters ([03d0da5](https://github.com/hslayers/hslayers-ng/commit/03d0da5df1106abf4219a61112ba0573f5ba4cee))
* Setting of vector layer definition ([593e03e](https://github.com/hslayers/hslayers-ng/commit/593e03e0e3e9f60d41d4143103f4fb944f0fa333))
* Unclosable sidebar ([477746b](https://github.com/hslayers/hslayers-ng/commit/477746b697466fdbeb155637c5ea143115760a8e))
* Update dependencies for the material layermanager component ([3782d8c](https://github.com/hslayers/hslayers-ng/commit/3782d8c03af24ca083fa4293d43fcefcea70a791))
* Use correct values for tooltip positions ([88dfe25](https://github.com/hslayers/hslayers-ng/commit/88dfe2531c261b696a0ed78f3124cebbbdebde0d))
* Wrong arcgis subl;ayer list when 1 selected ([221c5b7](https://github.com/hslayers/hslayers-ng/commit/221c5b7b903eb6ec174ce39dab8a1010b2d26c0f))
* **add-data:** Open dataset for micka catalogue items ([689b03d](https://github.com/hslayers/hslayers-ng/commit/689b03d07895b8b2d9284a80fb246c3fe8479239))
* vector file upload not syncing with layman ([1c0c2ed](https://github.com/hslayers/hslayers-ng/commit/1c0c2ed3ce77ec981b14fbac5ddbb739ab128c9e))
* Wait for panel to be populated before setting the width style ([905128c](https://github.com/hslayers/hslayers-ng/commit/905128c20db41393b1da3151441743b445047c75))
* Widgets overlaping container ([4b81b0e](https://github.com/hslayers/hslayers-ng/commit/4b81b0e4f67d35cea99b06ebac45600ba9491455))


### Code Refactoring

* Add layers to entire map by default ([80b11fc](https://github.com/hslayers/hslayers-ng/commit/80b11fc3c9a9f088cda1e13ffb524d54fda45200))
* Removal of owsFilling and owsConnecting ([6cb9ae7](https://github.com/hslayers/hslayers-ng/commit/6cb9ae7f70c5b8e847adf34d45691d50b899ab4a))


### Features

* Map swipe state in url, properties stored ([b4d92d0](https://github.com/hslayers/hslayers-ng/commit/b4d92d0ebf7aa8414730906eb8157e306ed2007b))
* **overlay:** Fine tune overlay buttons ([d836bed](https://github.com/hslayers/hslayers-ng/commit/d836beda72aec14343f657db315d5ed07939d607))
* Ability to add a layer copy to the map ([743f0de](https://github.com/hslayers/hslayers-ng/commit/743f0ded42882e9b8fe84bf615ea3f640933b58b))
* Ability to display layer for full map ([0ca73a5](https://github.com/hslayers/hslayers-ng/commit/0ca73a5baa301201b2bf11990c69b4357d40cc1e))
* Ability to load service layers from service list ([01b9314](https://github.com/hslayers/hslayers-ng/commit/01b9314c95207787be7ba9a9cd0033852a5f00b2))
* Add support for raster images with world file (Issue 356) ([#2575](https://github.com/hslayers/hslayers-ng/issues/2575)) ([ef95c05](https://github.com/hslayers/hslayers-ng/commit/ef95c052a94ad4502c6a7909759fadd8c8328056))
* Added button to toggle all layer visibility ([2c90b88](https://github.com/hslayers/hslayers-ng/commit/2c90b8886743eb4bece06648221738ff4254ed4a))
* Added multiple item removal dialog ([0edf5bb](https://github.com/hslayers/hslayers-ng/commit/0edf5bb487459b4516f0c18ff711b93d2d6a2a69))
* Added new copy-layer-dialog ([e953349](https://github.com/hslayers/hslayers-ng/commit/e953349db37d02996ae7d59e0f44b16058a42b95))
* Allow user to add multiple arcgis services as a whole ([ae4660d](https://github.com/hslayers/hslayers-ng/commit/ae4660d7770918d7063a18550b8e9682cba8f6bf))
* Check for imageServices and add them to map on request ([6dac200](https://github.com/hslayers/hslayers-ng/commit/6dac20089e22bcc268be13b1f566236f2dd5a6a0))
* Cleanup after panels ([e58173b](https://github.com/hslayers/hslayers-ng/commit/e58173b38439dafb161a40e445684cbef8ff9f88))
* Execute cleanup on panel container component destruction ([052c2b0](https://github.com/hslayers/hslayers-ng/commit/052c2b023680c2e3824b250d1f2f44066dcebc52))
* Provide toast, informing user about deletion in progress ([ae00641](https://github.com/hslayers/hslayers-ng/commit/ae00641b2eea3a9b6eefb036bcbe9408378e6a31))
* **add-data:** Added new service ([cfe2f76](https://github.com/hslayers/hslayers-ng/commit/cfe2f76f0f958d16924729ee51d416b10157b09b))
* **pager:** Ability to change item count per page ([53f8b00](https://github.com/hslayers/hslayers-ng/commit/53f8b0065545573a14f5e7bb403d6179d5c2dcc2))
* **permalink:** Added getParamValAndRemove func ([473da70](https://github.com/hslayers/hslayers-ng/commit/473da70cf4ad2ac68e7dbd28a09b160d1294d93d))
* **server:** Add env parameter for payload size limit ([1812b1f](https://github.com/hslayers/hslayers-ng/commit/1812b1f86157f0deb2a8edd26d92bdae5f8dc624))
* **server:** Add options to run only specified components of server ([6f45898](https://github.com/hslayers/hslayers-ng/commit/6f4589827828459776b279220d85db31c7c065c0))
* Return added layers from getCaps/add-data panel ([377396c](https://github.com/hslayers/hslayers-ng/commit/377396c92592647f6f03fdce55393d7a7c1fa65f))
* Show placeholder for d&d lists ([098ceef](https://github.com/hslayers/hslayers-ng/commit/098ceef1f4def1d34edd19647be2b32f2945f331))
* Support untiled arcgis layers and extra params ([1a285e2](https://github.com/hslayers/hslayers-ng/commit/1a285e20bef863f3010ff766d9d25e556626e0a1))


### Performance Improvements

* Remove usage of panelSpaceWidth function ([b3d91a3](https://github.com/hslayers/hslayers-ng/commit/b3d91a390a00daef1431dc1d53a38726e07a7c15))


### Reverts

* Remove unneeded translations ([43b0af3](https://github.com/hslayers/hslayers-ng/commit/43b0af325e948bad0dc1e29827a98a773df8b7d5))


### BREAKING CHANGES

* Removal of hsLayoutService.initializedOnce variable which was a crutch anyway
* owsFilling and owsConnecting rxjs subjects are no
longer being used. To load external layers, please now use
HsAddDataOwsService.connectToOWS
* Layer property swipeRight is changed to swipeSide, and the values are changed from boolean to string (left and right) respectively



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

* Need to specify HsConfig.get(app).ngRouter = true if Angular router is used
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

this.HsConfig.get(app).update({
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
* **layout:** allow percentage values in HsConfig.get(app).panelWidths array ([3f4124c](https://github.com/hslayers/hslayers-ng/commit/3f4124c42eca8598586b26fa31f27996f5b3a8ec))
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
* **layout:** Hide sidebar if HsConfig.get(app).pureMap is set to true ([9411940](https://github.com/hslayers/hslayers-ng/commit/9411940e9d24483a5145cbb00c0d7b7e2e7026f2))
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
array of icon definitions through HsConfig.get(app). This enables more customization (extra icons) and
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


