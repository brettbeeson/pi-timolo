#!/bin/bash

#
# Use filebyday.py to put files into day-labelled sub-folders
# Requires "daily-photos" and "photos" folders to be correct
# Updates "quick-links" todo!

# If true, cp (or cp -r) to quick-links, instead of ln -s
# Required for file-systems without symblinks (eg. s3)

#
# !!! use python AWS S3 sdk or cli to mv instead of sync, mv, sync !!!
# or modify pi-timolo to put in daily-photos directly! (better)
#
copy_not_link=1

function photo_hours_ago() {
	rm -rf "$quick_links_dir"/latest-$1h.jpg 1>/dev/null 2>&1 || true
	FILENAME_MATCH=$(date -d "-$1 hours" +"%Y%m%d-%H")
	PHOTO=$(find daily-photos -name *$FILENAME_MATCH*.jpg -type f | sort -n | tail -n 1)
	if [ ! -z "$PHOTO" ]; then
		if [ $copy_not_link ]; then
			cp $PHOTO $quick_links_dir/latest-$1h.jpg
		else
			ln -s ../$PHOTO $quick_links_dir/latest-$1h.jpg
		fi	
	fi
}

if [ -z "$1" ]; then
	echo "No argument supplied"
	exit 3
fi
if [ ! -d $1 ]; then
	echo "No such directory: $1" 1>&2
	exit 2
fi

cd $1

# pull latest photos
aws s3 sync s3://tmv.brettbeeson.com.au/picam/photos photos

filebyday=/usr/local/bin/filebyday.py

$filebyday --dest daily-photos --move photos/*.jpg

quick_links_dir=quick-links

# Update quick-links
# For "latest", not necessaily 0 hours ago - get the latest instead
rm $quick_links_dir/latest.jpg 1>/dev/null 2>&1 || true
latest=$(find daily-photos/ -name *20??*.jpg -type f | sort -n | tail -n 1)
if [ -f $latest ]; then
	if [ $copy_not_link ]; then
		cp $latest $quick_links_dir/latest.jpg
	else
		ln -s ../$latest $quick_links_dir/latest.jpg
	fi	
fi

set -x
photo_hours_ago 01
photo_hours_ago 03
photo_hours_ago 06
photo_hours_ago 09
photo_hours_ago 12
photo_hours_ago 24

# push changes to photos (removes old)
aws s3 sync --delete photos s3://tmv.brettbeeson.com.au/picam/photos
# push changes to daily-photos (files, no remove required)
aws s3 sync daily-photos s3://tmv.brettbeeson.com.au/picam/daily-photos
# push changes to quick-links (removes old)
aws s3 sync --delete quick-links s3://tmv.brettbeeson.com.au/picam/quick-links
