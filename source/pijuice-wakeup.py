#!/usr/bin/python3
import datetime
import os
import time
from datetime import time
import dateutil.parser
from pijuice import PiJuice
import argparse


def pijuice_check_error(pyjuice_response):
    if pyjuice_response['error'] != 'NO_ERROR':
        raise RuntimeError("pijuice failed with code: {}".format(pyjuice_response['error']))


def pijuice_get_data(f):
    """
    Try a few times
    """
    for i in range(0, 10):
        r = f()
        # pprint(r)
        if r['error'] == 'NO_ERROR':
            return r['data']
        else:
            time.sleep(.1)
    raise RuntimeError("pijuice failed with code: {}".format(f()['error']))


argparser = argparse.ArgumentParser("Manage wakeup time using local times")
argparser.add_argument("command",choices=['enable','disable'],nargs='?',help="Or omit to get status only")
argparser.add_argument("wake", nargs="?", help="Set wakeup time to time (anything parsable, local timezone)")
args = argparser.parse_args()


sleeps = 0
while not os.path.exists('/dev/i2c-1'):
    time.sleep(0.1)
    sleeps += 1
    if sleeps > 600:
        raise Exception("pijuice-wakeup: No path to /dev/i2c-1")

pj = PiJuice()
if args.command == 'enable':
    print("Enabling wakeup")
    pj.rtcAlarm.SetWakeupEnabled(True)
elif args.command == 'disable':
    print("Disabling wakeup")
    pj.rtcAlarm.SetWakeupEnabled(False)

if args.wake:
    wake_dt = dateutil.parser.parse(timestr=args.wake).replace(tzinfo=dateutil.tz.tzlocal())
    wake_dt_utc = wake_dt.astimezone(dateutil.tz.UTC)
    print("Setting alarm to local: {} (UTC: {})".format(wake_dt, wake_dt_utc))
    wake_time_tz_utc_dict = {'second': wake_dt_utc.second,
                             'minute': wake_dt_utc.minute,
                             'hour': wake_dt_utc.hour,
                             'day': "EVERY_DAY"}
    pijuice_check_error(pj.rtcAlarm.SetAlarm(wake_time_tz_utc_dict))

check = pijuice_get_data(pj.rtcAlarm.GetAlarm)
if check['hour'] == "EVERY_HOUR":
    hour_var = 0
else:
    hour_var = int(check['hour'])

wake_time_tz_utc = datetime.datetime(hour=hour_var, minute=int(check['minute']),
                                     second=int(check['second']), year=2000, month=1, day=1).replace(
    tzinfo=dateutil.tz.UTC)
wake_time_tz_local = wake_time_tz_utc.astimezone(dateutil.tz.tzlocal())
wake_enabled = pijuice_get_data(pj.rtcAlarm.GetControlStatus)['alarm_wakeup_enabled']
if args.command is None:
    print("Wakeup enabled: {}".format(wake_enabled))
    if wake_enabled:
        print("Wakeup time (local):{}".format(wake_time_tz_local.time()))
        print("Wakeup time (UTC):{}".format(wake_time_tz_utc.time()))
