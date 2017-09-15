#!/bin/bash
set -e

mkdir -p $BUILDDIR
cd $BUILDDIR

# Compile opencv
if [ ! -d "$BUILDDIR/opencv-src" ]
then
  if [ ! -f "$BUILDDIR/3.3.0.tar.gz" ]
  then
    curl -o 3.3.0.tar.gz -L -z 3.3.0.tar.gz https://github.com/opencv/opencv/archive/3.3.0.tar.gz
  fi
  tar xzf 3.3.0.tar.gz
  mv opencv-3.3.0 opencv-src
fi
cd opencv-src

if [ ! -f "$THIRDPARTYDIR/opencv/lib/pkgconfig/opencv.pc" ]
then
  cmake -D CMAKE_BUILD_TYPE=Release -D CMAKE_INSTALL_PREFIX=$THIRDPARTYDIR/opencv \
    -D BUILD_SHARED_LIBS=ON -D BUILD_opencv_apps=OFF -D BUILD_DOCS=OFF -D BUILD_TESTS=OFF -D BUILD_PERF_TESTS=OFF -D BUILD_EXAMPLES=OFF -D BUILD_PACKAGE=OFF -D BUILD_FAT_JAVA_LIB=OFF -D BUILD_CUDA_STUBS=OFF \
    -D WITH_IPP=ON \
    -D WITH_OPENCL=OFF -D WITH_CUDA=OFF -D BUILD_opencv_gpu=OFF -D BUILD_opencv_gpuarithm=OFF -D BUILD_opencv_gpubgsegm=OFF -D BUILD_opencv_gpucodec=OFF -D BUILD_opencv_gpufeatures2d=OFF -D BUILD_opencv_gpufilters=OFF -D BUILD_opencv_gpuimgproc=OFF -D BUILD_opencv_gpulegacy=OFF -D BUILD_opencv_gpuoptflow=OFF -D BUILD_opencv_gpustereo=OFF -D BUILD_opencv_gpuwarping=OFF -D BUILD_opencv_shape=OFF -D BUILD_opencv_stiching=OFF -D BUILD_opencv_superres=OFF -D BUILD_opencv_objdetect=OFF \
    -D BUILD_TIFF=OFF -D BUILD_PNG=OFF -D BUILD_JPEG=OFF -D BUILD_ZLIB=OFF -D WITH_JASPER=OFF -D WITH_OPENEXR=OFF \
    -D BUILD_opencv_highgui=OFF -D BUILD_opencv_flann=OFF -D BUILD_opencv_ml=OFF -D BUILD_opencv_calib3d=OFF -D BUILD_opencv_videoio=OFF -D BUILD_opencv_video=OFF -D BUILD_opencv_videostab=OFF -D BUILD_opencv_java=OFF -D BUILD_opencv_python=OFF \
    -D WITH_AVFOUNDATION=OFF -D WITH_WEBP=OFF -D BUILD_framework_AVFoundation=OFF \
    -D CMAKE_OSX_ARCHITECTURES=x86_64 \
    -D JPEG_LIBRARY=$THIRDPARTYDIR/dependencies/lib/libjpeg.a -D JPEG_INCLUDE_DIR=$THIRDPARTYDIR/dependencies/include \
    -D TIFF_LIBRARY=$THIRDPARTYDIR/dependencies/lib/libtiff.a -D TIFF_INCLUDE_DIR=$THIRDPARTYDIR/dependencies/include \
    -D PNG_LIBRARY=$THIRDPARTYDIR/dependencies/lib/libpng.a -D PNG_INCLUDE_DIR=$THIRDPARTYDIR/dependencies/include \
    ./
  make
  make install
fi
