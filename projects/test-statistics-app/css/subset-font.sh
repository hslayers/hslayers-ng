#!/bin/sh

# Requirements: 
# pip install fonttools
# npm install ttf2eot -g

# CSS classes - Unicode character mappings:
# icon-barchartasc U+f5eb
pyftsubset ../../hslayers/src/css/whhg-font/font/webhostinghub-glyphs.ttf --unicodes="U+f5eb"  --output-file="whhg-font/font/subset.ttf"
ttf2eot whhg-font/font/subset.ttf whhg-font/font/subset.eot
