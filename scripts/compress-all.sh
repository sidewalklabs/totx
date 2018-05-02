#!/bin/bash

cd packages/transit/static
for file in *.js *.html style/*.css; do
  echo Compressing $file
  gzip --verbose --best --keep $file
done
