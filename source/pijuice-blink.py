#!/usr/bin/env python3
import sys
from time import sleep
from pijuice import PiJuice
import argparse

argparser = argparse.ArgumentParser("Blink the user LED on a pijuice")
argparser.add_argument("element",choices=['photo','upload','wifi'])
argparser.add_argument("status", choices=['ok','fail'])

args = argparser.parse_args()

lum = 64

if args.element == 'photo' and args.status == 'ok':
    rgb1 = [0,lum,0]
    period1 = 1000
    rgb2 = [0, 0, 0]
    period2 = 0
    count = 1
elif args.element == 'photo' and args.status == 'fail':
    rgb1 = [lum, 0, 0]
    period1 = 1000
    rgb2 = [0, 0, 0]
    period2 = 0
    count = 1
elif args.element == 'upload' and args.status == 'ok':
    rgb1 = [0, lum, 0]
    period1 = 250
    rgb2 = [0, 0, 0]
    period2 = 250
    count = 4
elif args.element == 'upload' and args.status == 'fail':
    rgb1 = [lum, 0, 0]
    period1 = 250
    rgb2 = [0, 0, 0]
    period2 = 250
    count = 4
elif args.element == 'wifi' and args.status == 'ok':
    rgb1 = [0, 0, lum]
    period1 = 1000
    rgb2 = [0, 0, 0]
    period2 = 0
    count = 1
elif args.element == 'wifi' and args.status == 'fail':
    print ("Not a valid status",file=sys.stderr)
    exit (1)
#    rgb1 = [0, 0, lum]
#    period1 = 250
#    rgb2 = [0, 0, 0]
#    period2 = 250
#    count = 4
else:
    raise RuntimeError("Internal error")

led = 'D2'
pijuice = PiJuice()
#SetLedBlink(led, count, rgb1, period1, rgb2, period2)
pijuice.status.SetLedBlink(led, count, rgb1, period1, rgb2, period2)
sleep(count * (period1 + period2) / 1000.0)
