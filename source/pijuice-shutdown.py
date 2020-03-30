#!/usr/bin/python3

import os
from pijuice import PiJuice

import logging
import logging.handlers

# system
log = logging.getLogger(__name__)
log.setLevel(logging.DEBUG)
handler = logging.handlers.SysLogHandler(address = '/dev/log')
formatter = logging.Formatter('%(module)s.%(funcName)s: %(message)s')
handler.setFormatter(formatter)
log.addHandler(handler)

log.critical("PiJuice Shutting Down in 60s")
pj=PiJuice(1, 0x14)
pj.power.SetPowerOff(60)
os.system("sudo shutdown now")

