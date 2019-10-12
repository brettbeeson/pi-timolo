#!/bin/bash
#
# Search the dailyphotos directory for days (e.g. 2011-01-11, 2011-01-12) with jpg in them
# If required, make a video of these and save it as 2011-01-11*.mp4 in dailyvideos
##
# $1: root directory
#
# File Structure:
# ---------------
# root
# |-- daily-videos
# |---- 2019-01-02T10.mp4           <-- create this
# |-- daily-photos 					<-- search for isoformat dates
# |---- 2019-01-02
# |------- 2019-01-01T10-10-10.jpg	<--- search for jpg to make vieos
# |------- 2019-01-01T10-10-20.jpg

TLMM=/usr/local/bin/tlmm.py
DASHIFY=/usr/local/bin/dashify.sh

if [ -z "$1" ]; then
	echo "No argument supplied"
	exit 3
fi
if [ ! -d $1 ]; then
	echo "No such directory: $1" 1>&2
	exit 2
fi

# Use relative where possible
# After a cd, use $ROOTDIR/$dailyphotos
cd $1
ROOTDIR=$(pwd)
dailyphotos=daily-photos
dailyvideos=daily-videos

if [ ! -d "$dailyvideos" ]; then
	echo "$dailyvideos: No such directory"
	exit 1
fi
if [ ! -d "$dailyphotos" ]; then
	echo "$dailyphotos: No such directory"
	exit 1
fi

tmpdir=$(mktemp -d)
echo ---------------------------------------------------------------
echo $(date --iso-8601=minutes): Starting makedailymovies.sh
echo Tmp: $tmpdir
echo Root: $ROOTDIR
echo Photos: $dailyphotos
echo Videos: $dailyvideos


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
	echo "$day": Found $nfiles images \(previously $lastnfiles\) and $nvideos videos.
	# Only run if more files available, or no videos
	if [ $nfiles -gt $lastnfiles -o $nvideos -eq 0 ]; then
		echo $day: Making a video
		# Move away old existing videos for that day (might have different hour-suffixs
		echo mv $ROOTDIR/$dailyvideos/$day*.mp4 $tmpdir 2>/dev/null
		mv $ROOTDIR/$dailyvideos/$day*.mp4 $tmpdir/ 2>/dev/null
		# cwd to dir so tmp files and logs are in the relevant place
		video_made=$($TLMM video --log-level DEBUG --force --dest $ROOTDIR/$dailyvideos *.jpg 2>tlmm.log)
		madevideo=$?
		if [ $madevideo -eq 0 ]; then
			echo $nfiles >nfiles
			rm $tmpdir/$day*.mp4 2>/dev/null || true
			echo Dashify video: $video_made
			dash_dir=$($DASHIFY "$video_made" $ROOTDIR/$dailyvideos/) || echo Error: dashify "$video_made" "$ROOTDIR/$d"
			#mv "$video_made" "$dash_dir"
		else
			echo $day: Make video failed: code $madevideo. Check $(pwd)/tlmm.log
			# Move them back
			mv "$tmpdir"/"$day".mp4 "$ROOTDIR"/$dailyvideos
		fi
	else
		pass=nulop
		#echo $d: video not required
	fi
	# could delete tmpdir
done



# Update quick-link to the latest video
# Use relative links to get a nice relative symlink
cd "$ROOTDIR" || exit 1
# a directory
latest_video=$(find daily-videos -name "20*" -type d | sort | tail -n 1)

#echo Updating today_video to: $today_video
if [ ! -z "$latest_video" ]; then
	rm quick-links/latest-video 1>/dev/null 2>&1 
	ln -s ../"$latest_video" quick-links/latest-video
fi
