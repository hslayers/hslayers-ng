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



