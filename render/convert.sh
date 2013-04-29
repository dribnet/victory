#!/bin/bash

if ! [ -d "tmp" ]; then
  mkdir tmp
fi

PATH=$PATH:/Users/tom/installs/ImageMagick-6.7.4/bin

# OFFSET=-8
# for ROW in {0..15}
PDIR=`pwd`
[[ $PDIR =~ [\-0-9]+$ ]]
OFFSET=$BASH_REMATCH
# SUFFIX=$BASH_REMATCH
echo $OFFSET

# OFFSET=64
for ROW in {0..63}
do
    YVAL=$(($ROW + $OFFSET))
    ROWPAD=`printf "%04d" $ROW`
    convert `ls -rtca tile_*_$YVAL.png` -background none +append tmp/row_$ROWPAD.png
done
convert tmp/row* -background none -append final.png
rm -Rf tmp

