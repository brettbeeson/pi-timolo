"""
pluginName = bbtl

Scenario Long Duration Timelapse Project
---------------------------------------
Suitable for a multi week/month long duration timelapse day and night.

This setup will save images continuously in number sequence in case date/time is not maintained
due to a reboot and no internet NTP server is available. subfolders will be created
every ten thousand images to make managing files easier. Depending on the full duration
of the timelapse sequence it is advised saving files to an attached USB hard drive or large memory stick.
It is recommended that an uninteruptible power supply (UPS) be used in case there is a power failure.

After testing to ensure correct operation, setup a crontab for sync.sh to force a reboot if
pi-timolo.py process stops.  Also setup pi-timolo to start on boot using /etc/rc.local
see pi-timolo wiki for details here https://github.com/pageauc/pi-timolo/wiki

Edit the settings below to suit your project needs.
if config.py variable pluginEnable=True and pluginName=TLlong
then these settings will override the config.py settings.

"""


noNightShots = True         # only day
awbMode = 'sunlight'        # default = 'auto' Options are off, auto, sunlight, cloudy, shade, tungsten, flash, horizon
dayFixedISO = 200           # default = 200 Autoiso is 0
exposureMax = 100000        # default = 1000000us (1s)
exposureSmoothed = True       # default = false Allow shutterspeed to vary only slowly
showTextLeft = True # default = False If False, show in centre

# Customize settings below to suit your project needs
# ---------------------------------------------------
imageNamePrefix = ''     # default= 'long-' for all image file names. Eg garage-
imageWidth = 1920             # default= 1920 Full Size Image Width in px
imageHeight = 1080            # default= 1080  Full Size Image Height in px
imageJpegQuality = 85          # default = 95  Valid jpg encoder quality values 1 to 100 (high)
showDateOnImage = True        # default= True False=Do Not display date/time text on images

# Time Lapse Settings
# -------------------
timelapseDir = "/home/pi/tmv/" # default= "media/timelapse"  Storage Folder Path for Time Lapse Image Storage
timelapsePrefix = ""       # default= "long-" Prefix for All timelapse images with this prefix
timelapseStartAt = "00:00:00"         # default= "" Off or Specify date/time to Start Sequence Eg "01-jan-20018 08:00:00" or "20:00:00"
timelapseEndAt = "23:59:00"         # default= "" Off or Specify date/time to End Sequence Eg "01-jan-20018 08:00:00" or "20:00:00"
timelapseTimer = 10         # default= 180 (3 min) Seconds between timelapse images
timelapseNumOn = False         # default= True filenames Sequenced by Number False=filenames by date/time
timelapseNumRecycle = False   # default= True Restart Numbering at NumStart  False= Surpress Timelapse at NumMax
timelapseNumStart = 100000    # default= 1000 Start of timelapse number sequence
timelapseNumMax = 0           # default= 2000 Max number of timelapse images desired. 0=Continuous
timelapseExitSec = 0          # default= 0 seconds Surpress Timelapse after specified Seconds  0=Continuous
timelapseMaxFiles = 0         # 0=off or specify MaxFiles to maintain then oldest are deleted  default=0 (off)
timelapseSubDirMaxHours = 0   # 0=off or specify MaxHours - Creates New dated sub-folder if MaxHours exceeded
timelapseSubDirMaxFiles = 0   # 0=off or specify MaxFiles - Creates New dated sub-folder if MaxFiles exceeded
timelapseRecentMax = 0      # 0=off or specify number of most recent files to save in timelapseRecentDir
timelapseRecentDir = "/home/pi/tmv/recent"  # default= "media/recent/timelapse"  location of timelapseRecent files

# Manage Disk Space Settings
#---------------------------
spaceTimerHrs = 24            # default= 0  0=off or specify hours frequency to perform free disk space check
spaceFreeMB = 500             # default= 500  Target Free space in MB Required.
spaceMediaDir = timelapseDir  # default= timelapseDir  Starting point for directory walk
spaceFileExt  = 'jpg'         # default= 'jpg' File extension to Delete Oldest Files

# Do Not Change These Settings
# ----------------------------
timelapseOn = True            # default= False True=Turn timelapse On, False=Off
motionTrackOn = False         # Turn on Motion Tracking
motionQuickTLOn = False       # Turn on motion timelapse sequence mode
motionVideoOn = False         # Take images not video
motionTrackQuickPic = False   # Turn off quick picture from video stream
videoRepeatOn = False         # Turn on Video Repeat Mode IMPORTANT Overrides timelapse and motion
motionForce = 0               # Do not force motion image if no motion for a period of time



