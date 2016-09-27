#!/bin/bash
set -e

mkdir -p $BUILDDIR
cd $BUILDDIR

if [ ! -d "$BUILDDIR/poppler-src" ]
then
  if [ ! -f "$BUILDDIR/poppler-0.47.0.tar.xz" ]
  then
    curl -o poppler-0.47.0.tar.xz -L -z poppler-0.47.0.tar.xz https://poppler.freedesktop.org/poppler-0.47.0.tar.xz
  fi
  tar xvzf poppler-0.47.0.tar.xz
  mv poppler-0.47.0 poppler-src
fi
cd poppler-src

if [ ! -f "$BUILDDIR/poppler/bin/pdftotext" ]
then
  ./configure \
    --prefix=$BUILDDIR/poppler \
    --disable-libcurl \
    --disable-zlib \
    --disable-splash-output \
    --disable-cairo-output \
    --disable-poppler-glib \
    --disable-poppler-qt4 \
    --disable-poppler-qt5 \
    --disable-poppler-cpp \
    --disable-gtk-test \

  make install
fi
