#!/usr/bin/env python3

import sys
import logging

from systemd import journal

log = logging.getLogger("pijuice")
log.setLevel(logging.INFO)
handler = journal.JournaldLogHandler()
formatter = logging.Formatter('%(module)s.%(funcName)s: %(message)s')
handler.setFormatter(formatter)
log.addHandler(handler)
log.info(str(sys.argv))