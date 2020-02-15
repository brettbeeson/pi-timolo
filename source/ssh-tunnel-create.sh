#!/bin/bash
# 1: ec2-user@live.phisaver.com
# 2: 2222
# 3: 3333
# Must do this first
# sudo cp /usr/bin/ssh /usr/bin/ssh-tunnel
#
# Once in, create further tunnels
# ssh -f -N -R 3030:raspberrypi.local:3000 ec2-user@live.phisaver.com
# ssh -f -N -R 8080:hfs02a.local:80 ec2-user@live.phisaver.com
#
#
if [ $# -ne 3 ]; then
    echo "Wrong/no arguments supplied" 1>&2
    exit 2
fi

if /bin/pidof ssh-tunnel > /dev/null; then
  echo Tunnel exists 
  exit 0
else
  for p in $(seq "$2" "$3"); do
    /usr/bin/ssh-tunnel -f -N -R "$p":localhost:22 "$1" -o "ForwardX11=no" -o "ExitOnForwardFailure=yes" -o "StrictHostKeyChecking=no" -o "ServerAliveInterval=20" -o "ServerAliveCountMax=3"
    ret=$?
    if [ $ret -eq 0 ]; then
    echo SUCCESS : Created tunnel to "$1":"$p"
       id=$(ls | head -n 1)
       echo "$id","$p","$(hostname)",$(date) | ssh -o "ForwardX11=no" $1 'cat - >> ~/ssh-tunnels.log '
    exit 0
    elif [ $ret -eq 255 ]; then
      pass
      #  echo INFO: Tunnel to "$1":$p fails as remote listening port taken. Trying next.
    elif [ $ret -eq 0 ]; then
      echo An unknown error creating a tunnel to "$1":"$p". RC was $ret. Trying next but not hopeful. 1>&2
    fi
  done
  echo Tunnel failed to "$1":"$p" ports available? 1>&2
  exit 1
fi
