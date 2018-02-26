#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

for file in $DIR/static/*.{js,css,json,topojson,html}; do
  echo Compressing $file
  gzip --verbose --best --keep $file
done
