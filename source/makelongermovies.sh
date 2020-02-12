#!/bin/bash 
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

# If true, cp (or cp -r) to quick-links, instead of ln -s
# Required for file-systems without symblinks (eg. s3)
copy_not_link=true
quick_links=false
run_dashify=true

# Concat, dashify and quick-link
# $1 : from: a past time (eg "1 week ago")
# $2 : to: a past time (eg "1 week ago")
# $3 : quick link name (eg "today-video")
# $4 : relative speed
function make_video() {
	#													warning: quote confusion attack! seperate files
	concat_video=$($TLCONCAT --speed-rel "$4" "$1" "$2" ${daily_videos[*]})
	if [ $? -eq 0 ]; then
		mv "$concat_video" "$3".mp4
		concat_video="$3".mp4
		if $run_dashify; then
			echo Dashify video: "$concat_video"
			dash_dir=$($DASHIFY "$concat_video" .) || echo Error: dashify of "$concat_video" 1>&2
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
cam=$(basename "$1")

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

echo $(date --iso-8601=minutes): Starting $0 
echo Pulling latest daily-videos. Usually we have them locally, so this shouldnt run except on first/restart/etc.
echo --delete to remove expired videos
aws s3 sync --delete s3://tmv.brettbeeson.com.au/"$cam"/daily-videos daily-videos

# Only run if there are daily videos newer the long-video
# The directory's date changes *not* on files' dates changes,
# but if the fat changes (i.e. new file, etc.). This captures newly added files - good!
# The meaning of "today" changes, but we don't want to follow along "today" unless new videos are coming in.
# BUT: in S3, directories don't really exist!
# So use the oldest file in each directory instead to signify directory age
oldest_daily_video=$(ls -tr  "$daily_videos_dir"/*.mp4 | tail -1)
oldest_longer_video=$(ls -tr  "$longer_videos_dir"/*.mp4 | tail -1)


# There are some longer-videos already
if [ ! -z "$oldest_longer_video" ]; then
	# And they are newer than the daily videos  	
	if [ "$oldest_daily_video" -ot "$oldest_longer_video" ]; then
		echo Nothing to do. "$daily_videos_dir" is older than "$longer_videos_dir".
		exit 0
	fi
fi

# tlconcat writes to cwd.
cd "$longer_videos_dir" || exit 1

# Each day, old videos need deleting and re-making:
# eg. today 2000-01-03:
# eg. delete 2000-01-01_to_2000-01-02 which was yesterday's
# eg. make 2000-01-02_to_2000-01-03
# Delete anything that doesn't end today.
#rm -rf yesterday-video*
#rm -rf weekly-video*
#rm -rf monthly-video*
#rm -rf complete-video*

# Make new videos by concating daily-videos, dashify and add quick-links
make_video 'yesterday'  	'yesterday' 'yesterday-video'	1
make_video '1 week ago' 	'today'     'weekly-video'    	10
make_video '1 month ago' 	'today' 	'monthly-video' 	30
make_video '5 years ago' 	'today' 	'complete-video' 	100

# push new movie/s; no need to delete as the same names such as "today.mp4"
aws s3 sync --only-show-errors "$longer_videos_dir" s3://tmv.brettbeeson.com.au/"$cam"/longer-videos
exit 0
