# 2.0.0 (2024-02-12)

All CommonJS modules transformed to ES modules

### Bug Fixes

* Do not send X-Forwarded-* headers via proxy ([aaa4782](https://github.com/hslayers/hslayers-ng/commit/aaa4782a3ef517c4bd660ee1c5b8ef694363a500)), closes [#4635](https://github.com/hslayers/hslayers-ng/issues/4635)
* Don't encode+decode tinyurl requests ([efc8b3c](https://github.com/hslayers/hslayers-ng/commit/efc8b3cae5f42fbc56832a71dcbb4ce7f4f2da7c))
* Fix querystring parsing ([a47d81d](https://github.com/hslayers/hslayers-ng/commit/a47d81d6647ae8acfb1a2f8e2b65f79148de0f15))
* Re-send also multiple search-params in URL ([5f7c6ec](https://github.com/hslayers/hslayers-ng/commit/5f7c6ec0d75d7247d126cc7db6fae23c3fe8ce41))


### Features

* Add more test cases ([c8d7fe4](https://github.com/hslayers/hslayers-ng/commit/c8d7fe4f97699816c0d00fc2eb843f2d4082b2ed))
* Create tests ([7e32633](https://github.com/hslayers/hslayers-ng/commit/7e3263310313e09dd07c57466da0566f51765bbf))
* Log hslayers-server version on startup ([c7706db](https://github.com/hslayers/hslayers-ng/commit/c7706db9da1d35098d3171e4e133fac647841849))

### Package Updates
* `better-sqlite3` from 7.6.2 to 9.3.0
* `dotenv` from 14.2.0 to 16.4.0
* `follow-redirects` from 1.15.2 to 1.15.4
* `got` from 12.5.3 to 13.0.0
* `passport` from 0.6.0 to 0.7.0

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
