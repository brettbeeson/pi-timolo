# PI-TIMOLO

Forked from [Claude's Pi-Timolo] (https://github.com/pageauc/pi-timolo/)   

Modifications:
- TLBattery plug which implemented different white balance, exposure, etc for nicer timelapse
- Various new options (end timelapse time, file by date, etc)
- New bash scripts to create timelapse movies (daily, weekly, etc)
- New bash scripts to create DASH versions of movies
- Scripts use ffmpeg and tlmm [https://github.com/brettbeeson/tlmm] and MP4Box
- web-server component to *stream* videos and images for multiple cameras 
- web-server is all client-side and AWS S3 based
