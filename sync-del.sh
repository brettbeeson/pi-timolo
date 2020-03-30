while inotifywait -r -e modify,create,delete,move .; do
    rsync --delete -qavz . $1:pi-timolo-root
done
