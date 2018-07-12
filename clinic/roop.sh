#!/bin/zsh

for number in `seq 860`
do
  node scraping.js $number
done
