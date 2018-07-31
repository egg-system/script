#!/bin/zsh

SECONDS=0

#for number in `seq 860`
for number in `seq 857`
do
  echo "-------"
  node scraping.js $number
done

time=$SECONDS
echo "処理時間:${time}秒"
