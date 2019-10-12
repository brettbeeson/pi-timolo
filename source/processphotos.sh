#!/bin/bash


DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"  # get cur dir of this script
progName=$(basename -- "$0")
cd $DIR

filebyday=/usr/local/bin/filebyday.py

dir=picam

$filebyday --dest $dir/daily-photos --move $dir/photos/*.jpg

./makedailymovies.sh $dir/daily-photos $dir/daily-videos

dir=tlc32
$filebyday --dest $dir/daily-photos --move $dir/photos/*.jpg
./makedailymovies.sh $dir/daily-photos $dir/daily-videos
