#!/bin/bash

# Remove older dashify'd videos, but keep the source .mp4 file
#
# Using S3, we can't do wildcard lifecycle
# We want to remove Dash versions:
# cam/daily-videos/2020-01-01/*
# ... but retain the source video: 
# cam/daily-videos/2020-01-01.mp4


if [ -z "$1" ]; then
	echo "No CAM argument supplied"
	exit 3
fi

cam=$1

startdate=$(date +%Y%m%d -d "-6 months")
enddate=$(date +%Y%m%d -d "-2 weeks")
datelist=$(/home/ubuntu/pi-timolo/daterange.sh $startdate $enddate)
for d in $datelist; do
	aws s3 rm --recursive s3://tmv.brettbeeson.com.au/$cam/daily-videos/$d/
done
