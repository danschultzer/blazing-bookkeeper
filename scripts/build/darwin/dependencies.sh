#!/bin/bash
set -e

mkdir -p $BUILDDIR
DEST_DEPENDENCIES_DIR=$THIRDPARTYDIR/dependencies

# Compile jpeg
cd $BUILDDIR
if [ ! -d "$BUILDDIR/jpeg-src" ]
then
  if [ ! -f "$BUILDDIR/jpeg-v8d.tar.gz" ]
  then
    curl -o jpeg-v8d.tar.gz -L -z jpeg-v8d.tar.gz http://www.ijg.org/files/jpegsrc.v8d.tar.gz
  fi
  tar xvzf jpeg-v8d.tar.gz
  mv jpeg-8d jpeg-src
fi
if [ ! -f "$DEST_DEPENDENCIES_DIR/lib/libjpeg.dylib" ]
then
  cd jpeg-src
  ./configure \
    --prefix=$DEST_DEPENDENCIES_DIR \
    --disable-dependency-tracking
  make install
fi

# Compile libpng
cd $BUILDDIR
if [ ! -d "$BUILDDIR/libpng-src" ]
then
  if [ ! -f "$BUILDDIR/libpng-1.6.25.tar.xz" ]
  then
    curl -o libpng-1.6.25.tar.xz -L -z libpng-1.6.25.tar.xz ftp://ftp.simplesystems.org/pub/libpng/png/src/libpng16/libpng-1.6.25.tar.xz
  fi
  tar xvzf libpng-1.6.25.tar.xz
  mv libpng-1.6.25 libpng-src
fi
if [ ! -f "$DEST_DEPENDENCIES_DIR/lib/libpng.dylib" ]
then
  cd libpng-src
  ./configure \
    --prefix=$DEST_DEPENDENCIES_DIR \
    --disable-dependency-tracking
  make
  make test
  make install
fi

# Compile libtiff
cd $BUILDDIR
if [ ! -d "$BUILDDIR/tiff-src" ]
then
  if [ ! -f "$BUILDDIR/tiff-4.0.6.tar.gz" ]
  then
    curl -o tiff-4.0.6.tar.gz -L -z tiff-4.0.6.tar.gz http://download.osgeo.org/libtiff/tiff-4.0.6.tar.gz
  fi
  tar xvzf tiff-4.0.6.tar.gz
  mv tiff-4.0.6 tiff-src
fi
if [ ! -f "$DEST_DEPENDENCIES_DIR/lib/libtiff.dylib" ]
then
  cd tiff-src
  ./configure \
    --prefix=$DEST_DEPENDENCIES_DIR \
    --disable-dependency-tracking \
    --without-x \
    --with-jpeg-include-dir=$DEST_DEPENDENCIES_DIR/include \
    --with-jpeg-lib-dir=$DEST_DEPENDENCIES_DIR/lib \
    --disable-lzma \
    --disable-docs
  make
  make install
fi

# Build dependencies
brew install cmake

# Compile openjpeg
cd $BUILDDIR
if [ ! -d "$BUILDDIR/openjpeg-src" ]
then
  if [ ! -f "$BUILDDIR/openjpeg-2.1.1.tar.gz" ]
  then
    curl -o openjpeg-2.1.1.tar.gz -L -z openjpeg-2.1.1.tar.gz https://github.com/uclouvain/openjpeg/archive/v2.1.1.tar.gz
  fi
  tar xvzf openjpeg-2.1.1.tar.gz
  mv openjpeg-2.1.1 openjpeg-src
fi
if [ ! -f "$DEST_DEPENDENCIES_DIR/lib/libopenjp2.dylib" ]
then
  cd openjpeg-src
  cmake -D CMAKE_INSTALL_PREFIX=$DEST_DEPENDENCIES_DIR ./
  make install

  # Fix for missing openjpeg.h in poppler install
  cd $DEST_DEPENDENCIES_DIR
  ln -s include/openjpeg-2.1/openjpeg.h include/openjpeg.h
fi

# Compile leptonica
cd $BUILDDIR
if [ ! -d "$BUILDDIR/leptonica-src" ]
then
  if [ ! -f "$BUILDDIR/leptonica-1.73.tar.gz" ]
  then
    curl -o leptonica-1.73.tar.gz -L -z leptonica-1.73.tar.gz https://github.com/DanBloomberg/leptonica/archive/v1.73.tar.gz
  fi
  tar xvzf leptonica-1.73.tar.gz
  mv leptonica-1.73 leptonica-src
fi
if [ ! -f "$DEST_DEPENDENCIES_DIR/lib/liblept.dylib" ]
then
  cd leptonica-src
  chmod +x configure
  ./configure \
    --prefix=$DEST_DEPENDENCIES_DIR \
    --exec-prefix=$DEST_DEPENDENCIES_DIR \
    --disable-dependency-tracking \
    --without-zlib \
    --without-libwebp \
    --without-giflib \
    --disable-static \
    --disable-programs
  chmod +x config/install-sh
  make install-strip
fi

# Compile freetype
cd $BUILDDIR
if [ ! -d "$BUILDDIR/freetype-src" ]
then
  if [ ! -f "$BUILDDIR/freetype-2.7.tar.bz2" ]
  then
    curl -o freetype-2.7.tar.bz2 -L -z freetype-2.7.tar.bz2 https://downloads.sf.net/project/freetype/freetype2/2.7/freetype-2.7.tar.bz2
  fi
  tar xvzf freetype-2.7.tar.bz2
  mv freetype-2.7 freetype-src
fi
if [ ! -f "$DEST_DEPENDENCIES_DIR/lib/libfreetype.dylib" ]
then
  cd freetype-src
  chmod +x configure
  ./configure \
    --prefix=$DEST_DEPENDENCIES_DIR \
    --without-harfbuzz
  make
  make install
fi

# Compile fontconfig
cd $BUILDDIR
if [ ! -d "$BUILDDIR/fontconfig-src" ]
then
  if [ ! -f "$BUILDDIR/fontconfig-2.12.1.tar.gz" ]
  then
    curl -o fontconfig-2.12.1.tar.bz2 -L -z fontconfig-2.12.1.tar.bz2 https://www.freedesktop.org/software/fontconfig/release/fontconfig-2.12.1.tar.bz2
  fi
  tar xvzf fontconfig-2.12.1.tar.bz2
  mv fontconfig-2.12.1 fontconfig-src
fi
if [ ! -f "$DEST_DEPENDENCIES_DIR/lib/libfontconfig.dylib" ]
then
  cd fontconfig-src
  chmod +x configure
  ./configure \
    --prefix=$DEST_DEPENDENCIES_DIR \
    --localstatedir=$DEST_DEPENDENCIES_DIR/var \
    --sysconfdir=$DEST_DEPENDENCIES_DIR/etc \
    --disable-dependency-tracking \
    --with-add-fonts=/System/Library/Fonts,/Library/Fonts,~/Library/Fonts \
    --disable-docs

  make install RUN_FC_CACHE_TEST=false
fi
