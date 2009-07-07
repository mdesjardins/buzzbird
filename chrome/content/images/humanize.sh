#!/bin/sh

for FILE in `ls -1 *human*.png`; do
  NONHUMAN=`echo $FILE|sed 's/human-//g'`
  echo "cp $FILE $NONHUMAN"
done
