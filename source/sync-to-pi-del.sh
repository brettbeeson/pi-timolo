while inotifywait -r -e modify,create,delete,move .; do
    rsync --delete -qavz . pi@raspberrypi.local:pi-timolo-root
done
