while inotifywait -e modify,create,delete,move .; do
    rsync -qavz . pi@raspberrypi.local:pi-timolo-root
done
