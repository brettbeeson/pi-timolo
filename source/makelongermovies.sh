#!/bin/bash -xv
#
# Take the daily videos and combine them in to last week, last month and last year videos
#
# $1: root directory
#
# File Structure:
# ---------------
# root
# |-- daily-videos
# |---- 2019-01-02T10.mp4           <-- input
# |---- 2019-01-03T10.mp4           <-- input
# |-- longer-videos
# |---- last-2days.mp4           	<-- output
# |---- last-weeks					<-- output
# |-- quick-links
# |---- yesterdays-video -> 		<-- symlink to longer-video/?.mp4

# Concat, dashify and quick-link
# $1 : from: a past time (eg "1 week ago")
# $2 : to: a past time (eg "1 week ago")
# $3 : quick link name (eg "today-video")
# $4 : relative speed
function make_video() {
	concat_video=$($TLCONCAT --speed-rel "$4" "$1" "$2" ${daily_videos[*]})
	if [ $? -eq 0 ]; then
		echo Dashify video: $concat_video
		dash_dir=$($DASHIFY "$concat_video" .) || echo Error: dashify of "$concat_video" 1>&2
		if [ ! -z $dash_dir ]; then
			#mv "$concat_video" "$dash_dir"
			rm "$quick_links_dir"/"$3" 1>/dev/null 2>&1 || true
			ln -s ../longer-videos/"$dash_dir" "$quick_links_dir"/"$3"
		fi
	fi
}

if [ -z "$1" ]; then
	echo "No argument supplied"
	exit 3
fi
if [ ! -d "$1" ]; then
	echo "No such directory: $1" 1>&2
	exit 2
fi

TLCONCAT=/usr/local/bin/tlconcat.py
DASHIFY=/usr/local/bin/dashify.sh

daily_videos_dir="$1"/daily-videos
longer_videos_dir="$1"/longer-videos
quick_links_dir="$1"/quick-links
# abs to allow cd later
daily_videos_dir=$(realpath $daily_videos_dir)
longer_videos_dir=$(realpath $longer_videos_dir)
quick_links_dir=$(realpath $quick_links_dir)
daily_videos=($daily_videos_dir/20*.mp4)

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

# Only run if there are daily videos newer the long-video
# The directory's date changes *not* on files' dates changes,
# but if the fat changes (i.e. new file, etc.). This captures newly added files - good!
# The meaning of "today" changes, but we don't want to follow along "today" unless new videos are coming in.
if [ ! "$daily_videos_dir" -nt "$longer_videos_dir" ]; then
	echo Nothing to do. "$daily_videos_dir" is older than "$longer_videos_dir".
	exit 0
fi

# tlconcat writes to cwd.
cd "$longer_videos_dir" || exit 1

# Each day, old videos need deleting and re-making:
# eg. today 2000-01-03:
# eg. delete 2000-01-01_to_2000-01-02 which was yesterday's
# eg. make 2000-01-02_to_2000-01-03
# Delete anything that doesn't end today.
TODAY=$(date +"%Y-%m-%d")
find . -maxdepth 1 -type f ! -name "*$TODAY*" -name "20*.mp4" -delete

# Make new videos by concating daily-videos, dashify and add quick-links
make_video 'yesterday'  	'yesterday' 'yesterday-video'	1
make_video '1 week ago' 	'today'     'weekly-video'    	10
make_video '1 month ago' 	'today' 	'monthly-video' 	30
make_video '5 years ago' 	'today' 	'complete-video' 	100

exit 0
