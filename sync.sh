while inotifywait -r -e modify,create,delete,move .; do
    rsync -qavz . pi@picam2.local:pi-timolo-root
done
