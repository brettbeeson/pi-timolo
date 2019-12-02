# User Configuration variable settings for pitimolo
# Purpose - Motion Detection Security Cam
# Updated - 06-Jul-2017 IMPORTANT - Required for pi-timolo.py ver 11.2 or Greater
# Done by - Claude Pageau

configTitle = "pi-timolo ver 11.2 Default Settings"
configName  = "config.py"

#======================================
#   pi-timolo.py Settings
#======================================

# Logging and Debug Settings
# --------------------------
# Note - Set verbose to False if script is run in background or from /etc/rc.local

pluginEnable = True       # default= False True reads customized settings from a custom.py file
pluginName = "TLbattery"     # Specify filename in plugins subfolder without .py extension per below
                           # TLlong, TLshort, secfast, secstill, strmvid, secvid, secQTL, shopcam, dashcam, slowmo
dayFixedISO = 0         # default=0 0 for auto
requireCV2 = False          # Default = True Must be in config.py, not plugin

verbose = True         # default= True Sends logging Info to Console. False if running script as daeman
logDataToFile = True # default= False True logs diagnostic data to a disk file for review
debug = True              # default= False True = debug mode returns pixel average data for tuning
drawSpinnyOverlay = True
drawSpinnyGlyphDiameter = 50
showTextLeft = True
fileByDay = True	   # default= False File images under daily-photos/YYYY-MM-DD

# Image Settings
# --------------
awbMode = 'auto'
imageNamePrefix = 'pi-'  # default= 'cam1-' for all image file names. Eg garage-
imageWidth = 1280          # default= 1024 Full Size Image Width in px
imageHeight = 720          # default= 768  Full Size Image Height in px
imageFormat = ".jpg"       # default= ".jpg"  image Formats .jpeg .png .gif .bmp
imageJpegQuality = 75      # default= 95 jpg Encoder Quality Values 1(low)-100(high min compression) 0=85
imageRotation = 0         # Default= 0  Rotate image. Valid values: 0, 90, 180, 270
imageVFlip = False  # default= False True Flips image Vertically
imageHFlip = False  # default= False True Flips image Horizontally
imageGrayscale = False     # default= False True=Save image as grayscale False=Color
imagePreview = False       # default= False True=Preview image on connected RPI Monitor or Display
noNightShots = False       # default= False True=No Night Images (Motion or Timelapse)
noDayShots = False         # default= False True=No Day Images (Motion or Timelapse)
useVideoPort = False       # default= False True=Use the video port to capture motion images (faster than the image port).
useStream = True           # default = True False = To minimise spinning, don't use the stream (only valid for timelapse with specific start/stop time)
imageShowStream = False    # default= False True=Show video stream motion tracking area on full size image.
                           # Use to Align Camera for motion tracking.  Set to False when Alignment complete.
streamWidth = 320          # default= 320  Width of motion tracking stream detection area
streamHeight = 240         # default= 240  Height of motion tracking stream detection area
# Note see motionTrackFrameRate variable below to set motion video stream framerate for stream size above

# Date/Time Settings for Displaying info Directly on Images
# ---------------------------------------------------------
showDateOnImage = True     # default= True False=Do Not display date/time text on images
showTextFontSize = 20      # default= 18 Size of image Font in pixel height
showTextBottom = True      # default= True Bottom Location of image Text False= Top
showTextWhite = True       # default= True White Colour of image Text False= Black
showTextWhiteNight = True  # default= True Changes night text to white.  Useful if night needs white text instead of black

# Low Light Twilight and Night Settings
# -------------------------------------
nightTwilightThreshold = 90 # default= 90 dayPixAve where twilight starts (framerate_range shutter)
nightDarkThreshold = 50     # default= 50 dayPixAve where camera variable shutter long exposure starts
nightBlackThreshold = 4     # default= 4  dayPixAve where almost no light so Max settings used
nightSleepSec = 30          # default= 30 Sec - Time period to allow camera to calculate low light AWB
nightMaxShutSec = 5.9       # default= 5.9 Sec Highest V1 Cam shutter for long exposures V2=10 Sec.
nightMaxISO  = 800          # default= 800 Night ISO setting for Long Exposure below nightThreshold
nightDarkAdjust = 4.7       # default= 4.7 Factor to fine tune nightDarkThreshold brightness (lower is brighter)

# Motion Track Settings
# ---------------------
motionTrackOn = False       # default= True True=Turns Motion Detect On, False=Off
motionTrackQuickPic = False # default= False True= save a frame image instead of switching out of opencv
motionTrackInfo = False     # default= False Hide detailed track progress logging messages
motionTrackTimeOut = 0.3    # default= 0.3 seconds Resets Track if no movement tracked
motionTrackTrigLen = 75     # default= 75 px Length of motion track to Trigger motionFound
motionTrackMinArea = 100    # default= 100 sq px  Minimum Area required to start tracking
motionTrackFrameRate = 10   # default= 20 fps  PiVideoStream setting.  Single core RPI suggest 15 fps
motionTrackQPBigger = 3.0   # default= 3.0 multiply size of QuickPic saved image from default 640x480

# Motion Settings
# ---------------
motionDir = "media/motion"  # default= "media/motion"  Folder Path for Motion Detect Image Storage
motionPrefix = "mo-"        # default= "mo-" Prefix for all Motion Detect images
motionStartAt = ""          # default= "" Off or Specify date/time to Start Sequence Eg "01-jan-20018 08:00:00" or "20:00:00"
motionVideoOn = False       # default= False  True=Take a video clip rather than image
motionVideoFPS = 15         # default= 15  If image size reduced to 640x480 then slow motion is possible at 90 fps
motionVideoTimer = 10       # default= 10 seconds of video clip to take if Motion Detected
motionQuickTLOn = False     # default= False  True=Take a quick time lapse sequence rather than a single image (overrides motionVideoOn)
motionQuickTLTimer = 20     # default= 20 Duration in seconds of quick time lapse sequence after initial motion detected
motionQuickTLInterval = 4   # default= 0 seconds between each Quick time lapse image. 0 is fast as possible
motionForce = 3600          # default= 3600 seconds (1 hr) Off=0  Force an image if no Motion Detected in specified seconds.
motionNumOn = True          # default= True filenames by sequenced Number  False= filenames by date/time
motionNumRecycle = True     # default= True when NumMax reached restart at NumStart instead of exiting
motionNumStart = 1000       # default= 1000 Start 0f motion number sequence
motionNumMax  = 500         # default= 0 Max number of motion images desired. 0=Continuous
motionSubDirMaxFiles = 0    # 0=off or specify Max Files to create new sub-folder if FilesMax exceeded
motionSubDirMaxHours = 0    # 0=off or specify Max Hrs to create new sub-folder if HrsMax exceeded
motionRecentMax = 40        # 0=off  Maintain specified number of most recent files in motionRecentDir
motionRecentDir = "media/recent/motion"  # default= "media/recent/motion"  Location of motionRecent files
motionDotsOn = False        # default= True Displays motion loop progress dots if verbose=True False=Non
motionDotsMax = 100         # default= 100 Number of motion dots before starting new line if motionDotsOn=True
motionCamSleep = 0.7        # default= 0.7 Sec of day sleep so camera can measure AWB before taking photo
createLockFile = False      # default= False True= Create pi-timolo.sync file whenever motion images saved.
                            # Lock File is used to indicate motion images have been added
                            # so sync.sh can sync in background via sudo crontab -e

# Time Lapse Settings
# -------------------
timelapseOn = True          # default= False True=Turn timelapse On, False=Off
timelapseDir = "/media/usb" # default= "media/timelapse"  Storage Folder Path for Time Lapse Image Storage
timelapsePrefix = ""     # default= "tl-" Prefix for All timelapse images with this prefix
timelapseStartAt = ""       # default= "" Off or Specify date/time to Start Sequence Eg "01-dec-2019 08:00:00" or "20:00:00"
timelapseEndAt = ""       # default= "" Off or Specify time to stop eg "08:00:00" or "20:00:00"
exposureMax = 0             # default = 0
exposureSmoothed = False    # default = False
timelapseTimer = 30         # default= 300 (5 min) Seconds between timelapse images
timelapseCamSleep = 4.0     # default= 4.0 seconds day sleep so camera can measure AWB before taking photo
timelapseNumOn = False      # default= True filenames Sequenced by Number False=filenames by date/time
timelapseNumRecycle = True  # default= True Restart Numbering at NumStart  False= Surpress Timelapse at NumMax
timelapseNumStart = 1000    # default= 1000 Start of timelapse number sequence
timelapseNumMax = 0         # default= 2000 Max number of timelapse images desired. 0=Continuous
timelapseExitSec = 0        # default= 0 seconds Surpress Timelapse after specified Seconds  0=Continuous
timelapseMaxFiles = 0       # default= 0 off or specify MaxFiles to maintain then oldest are deleted  default=0 (off)
timelapseSubDirMaxFiles = 0 # default= 0 off or specify MaxFiles - Creates New dated sub-folder if MaxFiles exceeded
timelapseSubDirMaxHours = 0 # default= 0 off or specify MaxHours - Creates New dated sub-folder if MaxHours exceeded
timelapseRecentMax = 40     # default= 0 off or specify number of most recent files to save in timelapseRecentDir
timelapseRecentDir = "media/recent/timelapse"  # default= "media/recent/timelapse"  location of timelapseRecent files

# Video Repeat Mode (suppresses Timelapse and Motion Settings)
# -----------------
videoRepeatOn = False       # Turn on Video Repeat Mode IMPORTANT Overrides timelapse and motion
videoPath = "media/videos"  # default= "media/videos" Storage folder path for videos
videoPrefix = "vid-"        # prefix for video filenames
videoStartAt = ""           # default= "" Off or Specify date/time to Start Sequence eg "01-dec-2019 08:00:00" or "20:00:00"
videoDuration = 120         # default= 120 seconds for each video recording
videoTimer = 60             # default= 60 minutes  Run Recording Session then Exit  0=Continuous
videoFPS = 30               # default= 30 fps.  Note slow motion can be achieved at 640x480 image resolution at 90 fps
videoNumOn = False          # default= True True=filenames by sequence Number  False=filenames by date/time
videoNumRecycle = False     # default= False when NumMax reached restart at NumStart instead of exiting
videoNumStart = 100         # default= 100 Start of video filename number sequence
videoNumMax  = 20           # default= 20 Max number of videos desired. 0=Continuous

# Manage Disk Space Settings
#---------------------------
spaceTimerHrs = 0           # default= 0  0=off or specify hours frequency to perform free disk space check
spaceFreeMB = 500           # default= 500  Target Free space in MB Required.
spaceMediaDir = '/home/pi/pi-timolo/media'  # default= '/home/pi/pi-timolo/media'  Starting point for directory walk
spaceFileExt  = 'jpg'       # default= 'jpg' File extension to Delete Oldest Files

#======================================
#       webserver.py Settings
#======================================

# Web Server settings
# -------------------
web_server_port = 8080        # default= 8080 Web server access port eg http://192.168.1.100:8080
web_server_root = "media"     # default= "media" webserver root path to webserver image/video sub-folders
web_page_title = "PI-TIMOLO Media"  # web page title that browser shows
web_page_refresh_on = True    # Refresh True=On (per seconds below) False=Off (never)
web_page_refresh_sec = "900"  # default= "900" seconds to wait for web page refresh  seconds (15 minutes)
web_page_blank = False        # default= True Start left image with a blank page until a right menu item is selected
                              # False displays second list[1] item since first may be in progress

# Left iFrame Image Settings
# --------------------------
web_image_height = "768"       # default= "768" px height of images to display in iframe
web_iframe_width_usage = "75%" # Left Pane - Sets % of total screen width allowed for iframe. Rest for right list
web_iframe_width = "100%"      # Desired frame width to display images. can be eg percent "80%" or px "1280"
web_iframe_height = "100%"     # Desired frame height to display images. Scroll bars if image larger (percent or px)

# Right Side Files List
# ---------------------
web_max_list_entries = 0         # default= 0 All or Specify Max right side file entries to show (must be > 1)
web_list_height = web_image_height  # Right List - side menu height in px (link selection)
web_list_by_datetime = True      # default= True Sort by datetime False= Sort by filename
web_list_sort_descending = True  # default= True descending  False= Ascending for sort order (filename or datetime per web_list_by_datetime setting

# ---------------------------------------------- End of User Variables -----------------------------------------------------
