#!/bin/bash
set -e

mkdir -p $BUILDDIR
cd $BUILDDIR

# Compile opencv
if [ ! -d "$BUILDDIR/opencv-src" ]
then
  if [ ! -f "$BUILDDIR/opencv-master.tar.gz" ]
  then
    curl -o opencv-master.tar.gz -L -z opencv-master.tar.gz https://github.com/opencv/opencv/archive/master.tar.gz
  fi
  tar xvzf opencv-master.tar.gz
  mv opencv-master opencv-src
fi
cd opencv-src

if [ ! -f "$BUILDDIR/opencv/bin/opencv_version" ]
then
  cmake -D CMAKE_BUILD_TYPE=Release -D CMAKE_INSTALL_PREFIX=$BUILDDIR/opencv ./
  make -j7
  make install
fi
