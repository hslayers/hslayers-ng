#!/bin/sh

# Requirements: 
# pip install fonttools
# npm install ttf2eot -g

# CSS classes - Unicode character mappings:
# icon-layers U+F1CA
# icon-dotlist    U+f4c2
# icon-info-sign  U+f315
# icon-map    U+f209
# icon-database   U+f00b
# icon-analytics-piechart U+f000
# icon-plus U+002b
# icon-link U+f022
# icon-alertalt U+f2b4
# icon-refresh U+f078
# icon-chevron-right U+f488
# icon-chevron-left U+f489
# icon-chevron-down U+f48b
# icon-upload U+f47a
# icon-share U+f4c9
# icon-share-alt U+f16c
# icon-edit U+f47c
# icon-trash U+f0ce
# icon-twitter U+f16a
# icon-facebook U+f140
# icon-googleplus U+f165
# icon-download U+f47b
# icon-pin  U+f20a
# icon-polygonlasso U+f397
# icon-line U+f1bf
# icon-circleloaderfull U+f772
# icon-pencil   U+f1b7
# icon-remove   U+00d7
# icon-flag U+f487
# icon-camera   U+f19b
# icon-navigation   U+f23a
# icon-globealt U+f36c
# icon-warning-sign U+f316
# icon-menu U+f127
# icon-search   U+f0c5
# icon-brush    U+f1b8
# icon-resize   U+f1ed
# icon-resize-vertical  U+f319
# icon-fatredo  U+f692
# icon-globe    U+f01b
# icon-repeat   U+f187
# icon-circledelete U+f0d2
# icon-save-floppy  U+f0c8
# icon-calcplus U+f571
# icon-calcminus    U+f572
# icon-weightscale  U+f782
# icon-design   U+f53d
# icon-road U+f249
# icon-screenshot   U+f109
# icon-print    U+f125
# icon-settingsandroid  U+f309
# icon-slidersoff   U+f4d2
# icon-equals   U+f30c
# icon-minus    U+2212
# icon-gpson    U+f21f
# icon-gpsoff-gps   U+f21e
# icon-alertpay U+f269
# icon-remove-circle U+f470
# icon-check U+f310
# iconsettingsthree-gears U+f307
# icon-cloudaltsync U+f7ac
# icon-time U+f210
# icon-textfield U+f5d5
# icon-question-sign U+f0a3
# icon-calendarthree U+f4d0

pyftsubset css/whhg-font/font/webhostinghub-glyphs.ttf --unicodes="U+F1CA,U+f4c2,U+f315,U+f209,U+f00b,U+f000,U+002b,U+f022,U+f2b4,U+f078,U+f488,U+f489,U+f48b,U+f47a,U+f4c9,U+f47c,U+f0ce,U+f16a,U+f140,U+f165,U+f47b,U+f20a,U+f397,U+f1bf,U+f772,U+f1b7,U+00d7,U+f487,U+f19b,U+f23a,U+f36c,U+f316,U+f127,U+f0c5,U+f1b8,U+f1ed,U+f319,U+f692,U+f01b,U+f187,U+f0d2,U+f0c8,U+f571,U+f572,U+f782,U+f53d,U+f249,U+f109,U+f125,U+f309,U+f4d2,U+f30c,U+2212,U+f16c,U+f21e,U+f21f,U+f269,U+f470,U+f310,U+f307,U+f7ac,U+f210,U+f5d5,U+f0a3,U+f4d0"  --output-file="css/whhg-font/font/subset.ttf"
ttf2eot css/whhg-font/font/subset.ttf css/whhg-font/font/subset.eot
