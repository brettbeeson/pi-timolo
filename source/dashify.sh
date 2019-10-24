#!/bin/bash
#
# Given a file (mp4), made DASH set of files
# Won't overwrite if dash directory newer than the mp4
# $1 mp4 file
# $2 directory to made dash directory in
# writes the DASH directory to stdout


#n_encodings=1
#scales=("640x360")
#crf=(28)

n_encodings=3
scales=("640x360" "1280x720" "1920x1080")
crf=(28 24 23)

function basestname() {
    base=$(basename "$1")
    basest="${base%.*}"
    echo "$basest"
}

function encoded_filename() {
    base=$(basename "$1")
    ext="${base##*.}"
    echo "${base%.*}"-"$2"-crf"$3"."$ext"
}

function encode() {
    # $1 : input file
    # $2 : rescale
    # $3
    output_filename=$(encoded_filename "$1" "$2" "$3")
    #return 0;
    # -x264opts is deprecated but the new x264-params silently fails!
    # keyint is #frames for keyframe, so make a multiple of fps
    # break segments (later, with mp4box) into keyframe time intervals (seems sensible?)
    #                   rescale    better-quality+faster!                            no-audio                         quality           fixed key frames
    ffmpeg -y -i "$1" -s:v "$2" -hide_banner -loglevel warning -vsync passthrough -an -c:v libx264 -preset veryfast -crf "$3" -x264opts 'keyint=50:min-keyint=50:no-scenecut' "$output_filename"
    # Return via 'stdout' to callee
    echo $output_filename
    return $?
}

if [ -z "$1" ]; then
    echo "No mp4 argument supplied"
    exit 3
fi
if [ ! -f "$1" ]; then
    echo "No such file: $1" 1>&2
    exit 2
fi
if [ -z "$2" ]; then
    echo "No directory argument supplied"
    exit 3
fi
if [ ! -d "$2" ]; then
    echo "No such directory: $1" >&2
    exit 2
fi

video="$1"
output_dir="$2"
if [ -f "$video" ]; then
    echo "Processing: $video" >&2
    dash_dir=$output_dir/$(basestname "$video")
    dash_file=$output_dir/$(basestname "$video")/$(basestname "$video").mpd
    all_encoded=
    echo "  dash_dir:$dash_dir" >&2
    echo "  dash_file:$dash_file" >&2
    if [ ! -f "$dash_file" ] || [ "$video" -nt "$dash_file" ]; then
        for ((i = 0; i < $n_encodings; i++)); do
            encoded=$(encode "$video" "${scales[i]}" "${crf[i]}")
            if [ $? -ne 0 ]; then exit 1; fi
            echo Encoded: "$encoded" >&2
            all_encoded="$all_encoded $encoded" # note quotes here to concat and without later to seperate with MP4Box
        done
        #                                       "inband" dlt. unsure                        # no quotes - seperate files
        if [ ! -d "$dash_dir" ]; then
            mkdir "$dash_dir" || exit 1
        fi
        #                                                                                   no quotes - seperate files                                                                                        
        MP4Box -dash-strict 2000 -rap -frag-rap -bs-switching no -profile "dashavc264:live" $all_encoded -out "$dash_file" || {
            echo MP4Box failed on "$dash_file" 1>&2
            rmdir "$dash_dir"
            exit 1
        }
        echo "$dash_dir" # output to caller via stdout
        rm $all_encoded
        
    else
        echo "$dash_file" exists and is newer than "$video" 1>&2
    fi
else
    echo No such file: "$video"
fi

exit 0
