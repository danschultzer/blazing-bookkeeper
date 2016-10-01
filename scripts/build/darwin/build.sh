#!/bin/bash
set -e

export PKG_CONFIG_PATH=$THIRDPARTYDIR/dependencies/lib/pkgconfig
export LDFLAGS=-L$THIRDPARTYDIR/dependencies/lib
export CPATH=$THIRDPARTYDIR/dependencies/include
export LD_LIBRARY_PATH=$THIRDPARTYDIR/dependencies/lib:$LD_LIBRARY_PATH

BASEDIR=$(dirname "$0")

echo [darwin-build] Will build files in $THIRDPARTYDIR

# Build dependencies
echo [darwin-build] Building developing dependencies with brew
brew install automake autoconf libtool pkg-config

echo [darwin-build] Building 3rdparty dependencies
cd $BASEDIR && ./dependencies.sh

echo [darwin-build] Building poppler-utils
cd $BASEDIR && ./poppler.sh

echo [darwin-build] Building tesseract
cd $BASEDIR && ./tesseract.sh

echo [darwin-build] Building opencv
cd $BASEDIR && ./opencv.sh
