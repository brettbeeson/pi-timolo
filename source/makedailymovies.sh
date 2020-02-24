#!/bin/bash
#
# Search the dailyphotos directory for days (e.g. 2011-01-11, 2011-01-12) with jpg in them
# If required, make a video of these and save it as 2011-01-11*.mp4 in dailyvideos
##
# $1: basey! directory
#
# File Structure:
# ---------------
# root
# |-- daily-videos
# |---- 2019-01-02.mp4           	<-- create these
# |-- daily-photos 			<-- search here for isoformat dates
# |---- 2019-01-02
# |------- 2019-01-01T10-10-10.jpg	<--- search for jpg to make videos
# |------- 2019-01-01T10-10-20.jpg

run_dashify=true

TLMM=/usr/local/bin/tlmm.py
DASHIFY=/usr/local/bin/dashify.sh

if [ -z "$1" ]; then
	echo "No argument supplied"
	exit 3
fi
if [ ! -d "$1" ]; then
	echo "No such directory: $1" 1>&2
	exit 2
fi

cam=$(basename "$1")

# Use relative where possible
# After a cd, use $ROOTDIR/$dailyphotos
cd "$1" || exit 1
ROOTDIR=$(pwd)
dailyphotos=daily-photos
dailyvideos=daily-videos
new_videos=0

if [ ! -d "$dailyvideos" ]; then
	mkdir "$dailyvideos" || exit 1
fi
if [ ! -d "$dailyphotos" ]; then
	mkdir "$dailyphotos" || exit 1
fi

tmpdir=$(mktemp -d)
echo $(date --iso-8601=minutes): Starting makedailymovies.sh
echo Tmp: $tmpdir
echo Root: $ROOTDIR
echo Photos: $dailyphotos
echo Videos: $dailyvideos
echo Cam: $cam

echo Pulling latest photos. Using --delete to remove stale local photos
# --show-only-errors
aws s3 sync --delete s3://tmv.brettbeeson.com.au/"$cam"/daily-photos daily-photos
echo Pulling latest daily-videos. This is so when we upload with --delete, we can remove the right ones.
aws s3 sync s3://tmv.brettbeeson.com.au/"$cam"/daily-videos daily-videos

# For each folder of a day's photos...
for d in "$dailyphotos"/*/; do
	# $dailyphotos is an absolute path, do d is too
	cd $ROOTDIR/$d
	day=$(basename $d)

	nfiles=$(ls -l *.jpg 2>/dev/null | grep -v ^d | grep -v ^t | wc -l)
	[ -z $nfiles ] && nfiles=0
	if [ -f nfiles ]; then
		lastnfiles=$(<nfiles)
	else
		lastnfiles=0
	fi
	nvideos=$(ls -l $ROOTDIR/$dailyvideos/$day*.mp4 2>/dev/null | grep -v ^d | grep -v ^t | wc -l)
	# Only run if more files available, or no videos
	if [ $nfiles -gt 0 ] && [ $nfiles -gt $lastnfiles -o $nvideos -eq 0 ]; then
		echo "$day": Found $nfiles images \(previously $lastnfiles\) and $nvideos videos.
		echo $day: Making a video
		# Move away old existing videos and dash dirs for that day (might have different hour-suffixs
		mv $ROOTDIR/$dailyvideos/$day*.mp4 $tmpdir/ 2>/dev/null
		mv $ROOTDIR/$dailyvideos/$day* $tmpdir/ 2>/dev/null
		# cwd to dir so tmp files and logs are in the relevant place
		video_made=$($TLMM video --log-level DEBUG --force --dest $ROOTDIR/$dailyvideos *.jpg 2>tlmm.log)
		madevideo=$?
		if [ $madevideo -eq 0 ]; then
			echo $nfiles >nfiles
			rm $tmpdir/$day*.mp4 2>/dev/null || true
			rm $tmpdir/$day* 2>/dev/null || true
			# Rename from 2019-01-01T15_to_2019-01-01T19.mp4 to 2019-01-01.mp4
			mv "$video_made" "$ROOTDIR"/$dailyvideos/"$day".mp4
			rm "$ROOTDIR"/$dailyvideos/"$day"T??_to_"$day"T??.mp4
			video_made="$ROOTDIR"/$dailyvideos/"$day".mp4
			if $run_dashify; then
				echo Dashify video: $video_made
				dash_dir=$($DASHIFY "$video_made" $ROOTDIR/$dailyvideos/) || echo Error: dashify "$video_made" "$ROOTDIR/$d"
			fi
			let new_videos++
		else
			echo $day: Make video failed: code $madevideo. Check $(pwd)/tlmm.log
			# Move them back
			mv "$tmpdir"/"$day".mp4 "$ROOTDIR"/$dailyvideos/ 2>/dev/null
			mv "$tmpdir"/"$day"* "$ROOTDIR"/$dailyvideos/ 2>/dev/null
			
		fi
	fi
	rm -f "$tmpdir"/* > /dev/null 2>&1
	rmdir "$tmpdir" > /dev/null 2>&1
done

echo Syncing changes
# push changes to daily-movies (files, overwrites daily movies from early in the day)
aws s3 sync "$ROOTDIR"/"$dailyvideos" s3://tmv.brettbeeson.com.au/"$cam"/daily-videos
