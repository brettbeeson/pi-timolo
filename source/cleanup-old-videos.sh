#!/bin/bash

# 1. Remove older dashify'd videos, but keep the source .mp4 file
# 2. Remove Old files like 2019-01-01T15-2019-01-01T19
# 3. Empty folders


if [ -z "$1" ]; then
	echo "No directory supplied (e.g. /home/ubuntu/tmv/picam/ "
	exit 3
fi

cam=$(basename $1)

startdate=$(date +%Y%m%d -d "-1 months")
enddate=$(date +%Y%m%d -d "-3 days")
datelist=$(/home/ubuntu/pi-timolo/daterange.sh $startdate $enddate)
today=$(date +%Y-%m-%d -d today)

# Old files like 2019-01-01T15-2019-01-01T19
# Delete remotely
aws s3 rm --recursive --exclude "*" --include "*T*_to_*T*.mp4" --exclude '*"$today"*' s3://tmv.brettbeeson.com.au/$cam/daily-videos/
# Delete locally
find . -name "*T*_*T*.mp4" -delete


# Remove empty folders
find "$1" -type d -empty

# DASH FILES
# Using S3, we can't do wildcard lifecycle
# We want to remove Dash versions:
# cam/daily-videos/2020-01-01/*
# ... but retain the source video:
# cam/daily-videos/2020-01-01.mp4

for d in $datelist; do
  # remotely
	aws s3 rm --recursive s3://tmv.brettbeeson.com.au/$cam/daily-videos/$d/
	# delete locally, otherwise on sync we'll re-upload
	localdashdir=$(find "$1"/daily-videos -type d -name "$d")
	if [ -n "$localdashdir" ]; then
	  rm -rf "$localdashdir"
	fi
done
