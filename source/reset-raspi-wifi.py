#!/usr/bin/env python3
#
import sys
import time
from pijuice import PiJuice
import os
import fileinput
import subprocess

# Set up pins via pijuice-cli, then set IO1 = 1 or IO2 = 2 here
pijuice_pin = 1


def config_file_hash():
    config_file = open('/etc/raspiwifi/raspiwifi.conf')
    config_hash = {}

    for line in config_file:
        line_key = line.split("=")[0]
        line_value = line.split("=")[1].rstrip()
        config_hash[line_key] = line_value

    return config_hash


def reset_to_host_mode():
    if not os.path.isfile('/etc/raspiwifi/host_mode'):
        os.system('rm -f /etc/wpa_supplicant/wpa_supplicant.conf')
        os.system('rm -f /home/pi/Projects/RaspiWifi/tmp/*')
        os.system('rm /etc/cron.raspiwifi/apclient_bootstrapper')
        os.system('cp /usr/lib/raspiwifi/reset_device/static_files/aphost_bootstrapper /etc/cron.raspiwifi/')
        os.system('chmod +x /etc/cron.raspiwifi/aphost_bootstrapper')
        os.system('mv /etc/dhcpcd.conf /etc/dhcpcd.conf.original')
        os.system('cp /usr/lib/raspiwifi/reset_device/static_files/dhcpcd.conf /etc/')
        os.system('mv /etc/dnsmasq.conf /etc/dnsmasq.conf.original')
        os.system('cp /usr/lib/raspiwifi/reset_device/static_files/dnsmasq.conf /etc/')
        os.system('cp /usr/lib/raspiwifi/reset_device/static_files/dhcpcd.conf /etc/')
        os.system('touch /etc/raspiwifi/host_mode')
    os.system('reboot')

# Set up pins via pijuice-cli, then set IO1 = 1 or IO2 = 2 here
pijuice_pin = 1
counter = 0
pj = PiJuice()

while True:
    try:
        while int(pj.status.GetIoDigitalInput(pijuice_pin)['data']) == 1:
            time.sleep(1)
            counter = counter + 1
            print(counter)
            if counter == 9:
                reset_to_host_mode()
            if int(pj.status.GetIoDigitalInput(pijuice_pin)['data']) == 0:
                counter = 0
                break
    except Exception as e:
        print(e, file=sys.stderr)

    time.sleep(1)
