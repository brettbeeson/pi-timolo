while inotifywait -r -e modify,create,delete,move .; do
    rsync --delete -qavz . pi@picam2.local:pi-timolo-root
done
