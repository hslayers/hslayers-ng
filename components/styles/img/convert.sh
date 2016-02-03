#!/bin/bash

for f in *.svg; 
do
     rsvg-convert -a -w 32 -f svg $f -o ${f}_new
     mv ${f}_new $f
done
