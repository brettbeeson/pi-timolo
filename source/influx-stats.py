#!/usr/bin/env python3
import os
import traceback
import urllib
from pathlib import Path
from pprint import pprint
from sys import stderr
from time import sleep

import influxdb
import pyrfc3339
import socket
import uptime

import argparse
import urllib.parse

try:
    from gpiozero import CPUTemperature
except Exception as e:
    print("Cannot load CPUTemp library", file=os.io.stderr)


def magic_filename():
    home_files = [f for f in os.listdir(Path.home()) if f[0] != "."]
    home_files.sort()
    return home_files[0]


def get_data(r):
    if r['error'] != 'NO_ERROR':
        raise RuntimeError("pijuice failed with code: {}".format(r['error']))
    else:
        return r['data']


def get_data2(f):
    """
    Try a few times
    """
    for i in range(0, 10):
        r = f()
        # pprint(r)
        if r['error'] == 'NO_ERROR':
            return r['data']
        else:
            print(".",newline='')
            sleep(.1)
    raise RuntimeError("pijuice failed with code: {}".format(f()['error']))


try:
    p = argparse.ArgumentParser()
    p.add_argument("influx", help="Influx machine in form USER:PASSWORD@HOST.COM[:PORT]")
    p.add_argument("--database", help="Influx database", default="iot")
    p.add_argument("--pijuice", help="Try to add pijuice stats", action="store_true")
    args = p.parse_args()
    deets = urllib.parse.urlparse('http://' + args.influx)

    try:
        temp = float(100 * CPUTemperature().value)
    except Exception as e:
        temp = None
        print("Cannot get CPUTemp", file=os.io.stderr)

    i = influxdb.InfluxDBClient(deets.hostname, username=deets.username, password=deets.password,
                                database=args.database)

    p = [{
        'measurement': 'status',
        'tags': {
            'magic_filename': magic_filename(),
            'hostname': socket.gethostname(),
        },
        'fields': {
            'load5': float(os.getloadavg()[2]),
            'soc_temp': temp,
            'uptime': float(uptime.uptime()),
            'lastboot': pyrfc3339.generator.generate(uptime.boottime(), accept_naive=True)
        }
    }]
    i.write_points(p)

    if args.pijuice:
        from pijuice import PiJuice

        pij = PiJuice()  # Instantiate PiJuice interface object
        #pprint(pij.status.GetStatus())

        p = [{
            'measurement': 'status',
            'tags': {
                'magic_filename': magic_filename(),
                'hostname': socket.gethostname(),
            },
            'fields': {
                'charge_level': float(get_data2(pij.status.GetChargeLevel)),
                'battery_voltage': float(get_data2(pij.status.GetBatteryVoltage)),
                'battery_current': float(get_data2(pij.status.GetBatteryCurrent)),
                'battery_power' : float(get_data2(pij.status.GetBatteryCurrent) * get_data2(pij.status.GetBatteryVoltage)/1000),
                'io_voltage': float(get_data2(pij.status.GetIoVoltage)),
                'io_current': float(get_data2(pij.status.GetIoCurrent)),
                'io_power': float(get_data2(pij.status.GetIoCurrent) * get_data2(pij.status.GetIoVoltage )/ 1000),
                'watch_dog_minutes': float(get_data2(pij.power.GetWatchdog))
            }
        }]

        i.write_points(p)

    exit(0)

except Exception as e:
    traceback.print_exc(file=stderr)
    exit(1)
