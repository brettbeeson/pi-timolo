#!/bin/bash
#
# $1: cam-name (default = hostname)

progName=$(basename -- "$0")

if [ $# -eq 0 ]; then
  tmv_cam=$(hostname)
elif [ $# -eq 1 ]; then
  tmv_cam=$1
else
    echo Wrong or no arguments supplied 1>&2
    exit 2
fi

# ---------------------------------------
rcloneName="s3tmv"     # Name of Remote Storage Service
syncRoot="/home/pi/tmv/daily-photos"   # Root Folder to Start
remoteDir="tmv.brettbeeson.com.au/$tmv_cam/daily-photos"        # Destination Folder on Remote
rcloneParam="move -L --s3-acl=public-read"    # -L follow symlinks. other options  Eg sync, copy, move 
# ---------------------------------------

echo ----------- SETTINGS -------------
echo tmv_cam 	     : $tmv_cam
echo lockFileCheck : $lockFileCheck
echo rcloneName    : $rcloneName
echo syncRoot      : $syncRoot

echo remoteDir     : $remoteDir
echo rcloneParam   : $rcloneParam   # sync|copy|move
echo ---------------------------------

cd $syncRoot   # Change to local rclone root folder
if pidof -o %PPID -x "$progName"; then
    echo "WARN  - $progName Already Running. Only One Allowed." 1>&2
else
    if [ -f /usr/bin/rclone ]; then    #  Check if rclone installed
        rclone version   # Display rclone version
        if [ ! -d "$syncRoot" ] ; then   # Check if Local sync Folder Exists
           echo ERROR : syncRoot="syncRoot" Does Not Exist. 1>&2
           exit 1
        fi
        /usr/bin/rclone listremotes | grep "$rcloneName"  # Check if remote storage name exists
        if [ $? == 0 ]; then    # Check if listremotes found anything
            echo "INFO  : /usr/bin/rclone $rcloneParam -v $syncRoot $rcloneName:$remoteDir"
            /usr/bin/rclone $rcloneParam $syncRoot $rcloneName:$remoteDir
            if [ ! $? -eq 0 ]; then
                echo ERROR : rclone $rcloneParam Failed 1>&2
            fi
        else
            echo ERROR : rcloneName=$rcloneName Does not Exist. Check rclone listremotes 2>&1
            rclone listremotes
        fi
    else
        echo "ERROR : /usr/bin/rclone Not Installed." 2>&1
    fi
fi
