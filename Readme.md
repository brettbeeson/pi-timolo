# PI-TIMOLO

Forked from [Claude's Pi-Timolo](https://github.com/pageauc/pi-timolo/)   

Modifications:
- TLBattery plug-in which implements different white balance, exposure, etc for nicer timelapse
- Various new options (end timelapse time, file by date, etc)
- New bash scripts to create timelapse movies (daily, weekly, etc)
- New bash scripts to create DASH versions of movies for streaming
- Scripts use ffmpeg and [tlmm](https://github.com/brettbeeson/tlmm) and MP4Box
- web-server component to *stream* videos and images for multiple cameras 
- web-server is all client-side. Uses AWS S3 to get images/videos. Can be statically served.

![See an example](https://github.com/brettbeeson/pi-timolo/example.jpg "Example")
