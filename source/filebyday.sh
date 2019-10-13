#!/bin/bash

#
# Use filebyday.py to put files into day-labelled sub-folders
# Requires "daily-photos" and "photos" folders to be correct
# Updates "quick-links" todo!

copy_not_link=1

function photo_hours_ago() {
	rm $quick_links_dir/latest-$1h.jpg 1>/dev/null 2>&1 || true
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
