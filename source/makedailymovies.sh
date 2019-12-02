#!/bin/bash 
#
# Search the dailyphotos directory for days (e.g. 2011-01-11, 2011-01-12) with jpg in them
# If required, make a video of these and save it as 2011-01-11*.mp4 in dailyvideos
#
#
# $1: dailyphotos folder
# $2: dailyvideos folder

TLMM=/usr/local/bin/tlmm.py

dailyphotos=${1:-"daily-photos"}
dailyvideos=${2:-"daily-videos"}

if [ ! -d "$dailyvideos" ]; then
	echo "$dailyvideos: No such directory"
	exit 1
fi
if [ ! -d "$dailyphotos" ]; then
	echo "$dailyphotos: No such directory"
	exit 1
fi

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"  # get cur dir of this script
progName=$(basename -- "$0")
cd $DIR

tmpdir=`mktemp`


# For each folder of a day's photos...
for d in $dailyphotos/*/ ; do
    day=$(basename $d)
    nfiles=$( ls -l $d*.jpg 2> /dev/null | grep -v ^d | grep -v ^t | wc -l )
    [ -z "$nfiles" ] &&  nfiles=0
    if [ -f $d/nfiles ]; then
    	lastnfiles=$(<$d/nfiles)
    else
    	lastnfiles=0
    fi
    #[ -z "$lastnfiles" ] &&  lastnfiles=0
    nmovies=$( ls -l $dailyvideos/$day*.mp4 2> /dev/null | grep -v ^d | grep -v ^t | wc -l )
    #echo $d: Found $nfiles images \(previously $lastnfiles\) and $nmovies movies.
    # Only run if more files available, or no movies
    if [ $nfiles -gt $lastnfiles -o $nmovies -eq 0 ]; then
    	echo $d: Making a movie
	# Move away old existing movies for that day (might have different hour-suffixs
  	mv $dailyvideos/$day*.mp4 $tmpdir 2>/dev/null
	# cwd to dir so tmp files and logs are in the relevant place
	cd "$DIR"/"$d"
	"$TLMM" video --log-level DEBUG --dest "$DIR/$dailyvideos" "$DIR/$d*.jpg" > "$DIR/$d/tlmm.log" 2>&1
	cd "$DIR"
	mademovie=$?
	if [ $mademovie -eq 0 ]; then
           echo $nfiles > "$d/nfiles"
	   rm $tmpdir/$day*.mp4 2>/dev/null
	else
	   echo $d: Make movie failed: code $mademovie
	   # Move them back
	   mv $tmpdir/$day.mp4  $dailyvideos/
	fi
    else 
	echo $d: Movie not required
    fi
# could delete tmpdir
done

