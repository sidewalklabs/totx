#!/bin/bash

for file in packages/transit/static/*.{js,css,json,topojson,html}; do
  echo Compressing $file
  gzip --verbose --best --keep $file
done
