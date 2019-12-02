#!/bin/bash
#
# Take the daily movies and combine them in to last week, last month and last year movies
#
# $1: daily_videos_dir folder (input)
# $2: longer_videos_dir folder (output)
#set -o xtrace
TLCONCAT=/usr/local/bin/tlconcat.py

daily_videos_dir=${1:-"picam/daily-videos"}
longer_videos_dir=${2:-"picam/longer-videos"}

# move to script's dir
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"  # get cur dir of this script
progName=$(basename -- "$0")
cd $DIR


# cd to put log files in right place. then must use absolute paths for arguments
daily_videos_dir=$(realpath $daily_videos_dir)
daily_videos=($daily_videos_dir/*.mp4)
longer_videos_dir=$(realpath $longer_videos_dir)

if [ ! -d "$daily_videos_dir" ]; then
	echo "$daily_videos_dir: No such directory"
	exit 1
fi
if [ ! -d "$longer_videos_dir" ]; then
  mkdir "$longer_videos_dir"
  if [ ! -d "$longer_videos_dir" ]; then
	  echo "$longer_videos_dir: No such directory"
	  exit 1
	fi
fi

cd $longer_videos_dir



#set -o xtrace # print commands for logging
# TLCONCAT outputs the resultant filename
last_2_days_movie="$($TLCONCAT  --speed-rel 1 'yesterday' 'today' ${daily_videos[*]})"
if [ $? -eq 0 ]; then
	echo last_2_days_movie = $last_2_days_movie
	mv $last_2_days_movie A-last_two_days_$last_2_days_movie || true
fi
last_week_movie="$($TLCONCAT  --speed-rel 5 '2 days ago' 'today' ${daily_videos[*]})"
if [ $? -eq 0 ]; then
	mv $last_week_movie B-last_week_$last_week_movie || true
fi

last_month_movie="$($TLCONCAT  --speed-rel 10 '30 days ago' today ${daily_videos[*]})"
if [ $? -eq 0 ]; then
	mv $last_month_movie C-last_month_$last_month_movie || true
fi

# hack for "forever"
complete_movie="$($TLCONCAT  --speed-rel 100 '100 years ago' today ${daily_videos[*]})"
if [ $? -eq 0 ]; then
	mv $complete_movie D-complete_$complete_movie || true
fi
set +o xtrace


