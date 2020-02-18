#!/bin/sh
sudo cp /usr/bin/ssh /usr/bin/ssh-tunnel
(crontab -l ; cat crontab.user)| crontab -
(sudo crontab -l ; cat crontab.root)| sudo crontab -

