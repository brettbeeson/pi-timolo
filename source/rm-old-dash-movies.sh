#!/bin/bash

# Remove older dashify'd videos, but keep the source .mp4 file
#
# Using S3, we can't do wildcard lifecycle
# We want to remove Dash versions:
# cam/daily-videos/2020-01-01/*
# ... but retain the source video: 
# cam/daily-videos/2020-01-01.mp4


if [ -z "$1" ]; then
	echo "No directory supplied (e.g. /home/ubuntu/tmv/picam/ "
	exit 3
fi

cam=$(basename $1)

startdate=$(date +%Y%m%d -d "-1 month")
enddate=$(date +%Y%m%d -d "-3 days")
datelist=$(/home/ubuntu/pi-timolo/daterange.sh $startdate $enddate)
for d in $datelist; do
	aws s3 rm --recursive s3://tmv.brettbeeson.com.au/$cam/daily-videos/$d/
	# delete locally, otherwise on sync we'll re-upload
	localdashdir=$(find "$1"/daily-videos -type d -name "$d")
	#echo localdashdirs="$localdashdirs" d=$d
	if [ -n "$localdashdir" ]; then
	  rm -rf "$localdashdir"
	fi

done
