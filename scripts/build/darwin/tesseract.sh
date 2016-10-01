#!/bin/bash
set -e

mkdir -p $BUILDDIR
cd $BUILDDIR

# Compile tesseract
if [ ! -d "$BUILDDIR/tesseract-src" ]
then
  if [ ! -f "$BUILDDIR/tesseract-3.04.01.tar.gz" ]
  then
    curl -o tesseract-3.04.01.tar.gz -L -z tesseract-3.04.01.tar.gz https://github.com/tesseract-ocr/tesseract/archive/3.04.01.tar.gz
  fi
  tar xvzf tesseract-3.04.01.tar.gz
  mv tesseract-3.04.01 tesseract-src
fi
if [ ! -f "$THIRDPARTYDIR/tesseract/bin/tesseract" ]
then
  cd tesseract-src
  ./autogen.sh
  ./configure \
    LIBLEPT_HEADERSDIR=$THIRDPARTYDIR/dependencies/include \
    LDFLAGS=-L$THIRDPARTYDIR/dependencies/lib \
    --prefix=$THIRDPARTYDIR/tesseract \
    --disable-dependency-tracking
  make install
fi

cd $BUILDDIR

if [ ! -f "$THIRDPARTYDIR/tesseract/share/tessdata/eng.traineddata" ]
then
  if [ ! -f "$BUILDDIR/tessdata.tar.gz" ]
  then
    curl -o tessdata.tar.gz -L -z tessdata.tar.gz https://github.com/tesseract-ocr/tessdata/archive/master.tar.gz
  fi
  tar xvzf tessdata.tar.gz
  mkdir -p tesseract/share/tessdata/
  mv tessdata-master/* $THIRDPARTYDIR/tesseract/share/tessdata/
fi
