# 1.5.3 (2023-11-10)

### Bug Fixes

* Encode also URI path ([60a6a76](https://github.com/hslayers/hslayers-ng/commit/60a6a76a7d4ca9161cee443975734e9a53a0eed7))
* Do not replace /proxy in resource urls ([aac1656](https://github.com/hslayers/hslayers-ng/commit/aac1656cc7166aaa9cc6965d9d357f3c59321cf4))

# 1.5.2 (2023-05-19)

### Bug Fixes and Refactoring

* Update URL params when single HSL app is bootstrapped ([37f1982](https://github.com/hslayers/hslayers-ng/commit/37f1982a830e37b561e1a8a153ba78c889eaed9b))
* Don't change proxied response status code ([aca6ab9](https://github.com/hslayers/hslayers-ng/commit/aca6ab9c1a193586ca69d7c5d85d5160e0e613ea))
* Remove redundancy & reword ([174ca88](https://github.com/hslayers/hslayers-ng/commit/174ca88916c1dcc38abe167925aa7793e341061e))
* Properly encode query params ([74b51c9](https://github.com/hslayers/hslayers-ng/commit/74b51c9acca07da68aa2efe684bc5432434e959d))
* Decode proxyfied url in case client send it that way ([5873561](https://github.com/hslayers/hslayers-ng/commit/58735614607398bd72a30934e0015552e8effd74))
* Update packages' metadata ([59ef0d3](https://github.com/hslayers/hslayers-ng/commit/59ef0d31430bca91d0f730b67d7e64181703102c))
* Re-allow legacy SSL with Node >=18 ([4863997](https://github.com/hslayers/hslayers-ng/commit/48639973af2605baf531d13b88d05d202a65ce98))
* Fix dynamic import of "got" lib ([30adaf3](https://github.com/hslayers/hslayers-ng/commit/30adaf3fff0d277b4168568d46eebafdb77343f8))
* Update import type of ES module "got" ([30b42f8](https://github.com/hslayers/hslayers-ng/commit/30b42f86ad3b3780b71074e6a8816cdf7b8cf667))
* Code cleanup and formatting ([a6152ec](https://github.com/hslayers/hslayers-ng/commit/a6152ec3cd42494d434c6f5dd1d26d84183a3ebb))
* Provide logout callback ([72b0669](https://github.com/hslayers/hslayers-ng/commit/72b066948b76b40ab6e7c25d3f07d0278ee9233c))
* Pass correct HTTP response status code for most frequent errors ([b95a75b](https://github.com/hslayers/hslayers-ng/commit/b95a75b0925ed792581675898730a24b5b3f9e16))

### Package Updates

* `express` from 4.17.2 to 4.17.3
* `cacheable-request` from 7.0.2 to 10.2.7
* `got` from 11.8.3 to 12.5.3
* `http-cache-semantics` from 4.1.0 to 4.1.1
* `moment` from 2.29.2 to 2.29.4
* `passport` from 0.5.2 to 0.6.0
* `sqlite3` from 5.0.2 to 5.1.5
