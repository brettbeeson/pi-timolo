#!/bin/bash
startdate=$1 # YYYY-MM-DD
enddate=$2

enddate=$( date -d "$enddate" +%Y-%m-%d )  # rewrite in YYYYMMDD format
i=0
while [ "$thedate" != "$enddate" ]; do
    thedate=$( date -d "$startdate + $i days" +%Y-%m-%d ) # get $i days forward
    #printf 'The date is "%s"\n' "$thedate"
    printf '%s\n' "$thedate"
    i=$(( i + 1 ))
done
