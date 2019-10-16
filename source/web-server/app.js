import {splitPath, baseName} from "./bbutils.js";
import {WebFileSysS3} from './web-filesys-s3.js';

// http://ferret:8000/?base=files/moose#files/moose/moosling
// serves base files
// where base = files/moose/
// base_dir is relative to origin (eg. http://ferret:8000), with a trailing slash
// current_dir is relative to origin (eg. http://ferret:8000), with a trailing slash
// eg /files/moose/cub
// serves /files/moose/cub
// stored in URL's #

'use strict';

// Allow remote testing
const host = "http://tmv.brettbeeson.com.au.s3-ap-southeast-2.amazonaws.com/";
const DATETIME_FORMAT = 'YYYY-MM-DDTHH-mm-ss';
const DATE_FORMAT = 'YYYY-MM-DD';
const TIME_FORMAT = 'HH-mm-ss';
const HOUR_FORMAT = 'HH-';
const FILE_PREFIX = "tl-alex-";
// Localhost has filesystem
//const host = '';
// Initialize the Amazon Cognito credentials provider
AWS.config.region = 'ap-southeast-2'; // Region
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: 'ap-southeast-2:db4f53b6-3e51-4993-9fe6-f08924a57d75',
});
const TMV_BUCKET = "tmv.brettbeeson.com.au";

// Create a new service object
let s3 = new AWS.S3({
    apiVersion: '2006-03-01',
    params: {Bucket: TMV_BUCKET}
});

// choose one
let fs = new WebFileSysS3(host);
//let fs = new WebFileSysStd();

$(document).ajaxError(function (event, request, settings) {
    // debugging
    console.log("Ajax Error: " + settings.url + "," + request.status + "," + request.statusText);
});


function showElement(element) {
    $(element).addClass("d-block");
    $(element).removeClass("d-none");
}

async function s3_object(bucket, prefix, recursive = false) {
    let objs = s3_objects(bucket,prefix,recursive);
    if (objs.length>0) {
        return objs[0];
    } else {
        return false;
    }


}

/**
 * @todo Could cache
 * In prefix (not recursive)
 * @param prefix
 */
async function s3_objects(bucket, prefix, recursive = false) {
    let isTruncated = true;
    let continuationToken;
    let objects = [];
    while (isTruncated) {
        let params = {Bucket: bucket};
        if (prefix) params.Prefix = prefix;
        if (continuationToken) params.ContinuationToken = continuationToken;
        if (!recursive) params.Delimiter = "/";
        try {
            const response = await s3.listObjectsV2(params).promise();
            response.Contents.forEach(item => {
                objects.push(item.Key);
            });
            isTruncated = response.IsTruncated;
            if (isTruncated) {
                continuationToken = response.NextContinuationToken;
            }
        } catch (error) {
            throw error;
        }
    }
    return objects;
}

/**
 * @todo Could cache
 * @param bucket
 * @param prefix
 * @param recursive
 * @returns {Promise<Array>}
 */
async function s3_folders(bucket, prefix, recursive = false) {
    let isTruncated = true;
    let continuationToken;
    let objects = [];
    while (isTruncated) {
        let params = {Bucket: bucket};
        if (prefix) params.Prefix = prefix.slashEnd(true);
        if (continuationToken) params.ContinuationToken = continuationToken;
        if (!recursive) params.Delimiter = "/";
        try {
            const response = await s3.listObjectsV2(params).promise();
            response.CommonPrefixes.forEach(item => {
                objects.push(item.Prefix);

            });
            isTruncated = response.IsTruncated;
            if (isTruncated) {
                continuationToken = response.NextContinuationToken;
            }
        } catch (error) {
            throw error;
        }
    }
    return objects;
}


jQuery(document).ready(function () {
    /**
     * Set via textbox or query string, this is the root for all references
     * @returns {boolean} Whether the URL contained "camera" to enable settings
     */
    function set_base_dir_from_url() {
        // default: base if this html page's location relative to webroot
        //base_dir = location.pathname.replace('/index.html', '/').replace(/\/\//g, '/');
        base_dir = '';
        // add "base" setting via query string
        let searchParams = new URLSearchParams(window.location.search);
        if (searchParams.has('base')) {
            base_dir = decodeURIComponent(searchParams.get('base')).slashStart(false).slashEnd(true);
            if (base_dir.length > 1 && base_dir.search(".") !== -1) {
                $('#camera-selector').val(base_dir.slashEnd(false));
                return true;
            }
        }
        base_dir = '';
        return false;
    }

    /**
     * Search in hardcoded directory for a lsit of directories
     * which represent cameras. Populate the camera_selection form
     * item
     */
    function update_camera_select() {
        let base_dir = "";
        let searchParams = new URLSearchParams(window.location.search);
        if (searchParams.has('base')) {
            base_dir = searchParams.get('base');
            base_dir = splitPath(base_dir)['filename'].slashEnd(true);
        }
        let cams = fs.ls("/files");
        let cam_select = $("#camera-select");
        $.each(cams, function (i, item) {
            if (fs.isDir(item)) {
                let o = new Option(item.slashEnd(false), item.slashEnd(false));
                cam_select.append(o);
                if (item.slashEnd(true) === base_dir) {
                    o.selected = true;
                }
            }
        });
        cam_select.selectedIndex = 0;
    }

    /**
     * Open a file or disrectory at clickee's pathname/href
     * Use as onclick event handler
     * Uses 'title' for the resource location, which is based on webroot+prefix
     * Eg. Webroot: localhost/html/www/
     * => resource "bar.txt" looks for "localhost/html/www/bar.txt"
     * => adding "prefix="foo" looks for "localhost/html/www/foo/bar.txt"
     * @param event
     * @param prefix: add
     * @returns {boolean}
     */
    function showFileInPreviewElement(event, prefix = "") {

        let element = event.target;
        disActivateAllButtons(element);
        hideAllPreviewers();
        let resource = prefix + element.title; //getAttribute('href');

        if (!fs.fileOrDirExists(resource)) {
            $(element).addClass('disabled');
            $(element).removeClass('active');
            return false;
        } else {
            $(element).addClass('active');
            if (fs.isDashDir(resource)) {
                showDashVideoInPreviewElement(resource);
            } else if (fs.isDir(resource)) {
                cd(resource);
            } else if (fs.isImage(resource)) {
                showImageInPreviewElement(resource);
            } else if (fs.isVideo(resource)) {
                showVideoInPreviewElement(resource);
            } else {
                alert("Unknown file type");
                return false;
            }
        }
        return true;
    }

    function hideAllPreviewers() {
        $("#video-player-div").removeClass("d-block");
        $("#video-player-div").addClass("d-none");
        $("#image-shower-div").removeClass("d-block");
        $("#image-shower-div").addClass("d-none");
    }

    function disActivateAllButtons(except) {
        $('.list-group-item').not(except).removeClass('active');
    }

    function unDisableAllButtons() {
        $('.list-group-item').removeClass('disabled');
    }

    /**
     *
     * @param href Link to resource.
     * @param name Name to display
     * @returns {HTMLAnchorElement}
     */
    function createTile(title, name) {
        let a = document.createElement('a');
        a.title = title;
        a.className = "list-group-item list-group-item-action";
        a.target = "preview";
        a.innerText = name;
        a.addEventListener('click', showFileInPreviewElement);
        return a;
    }

// can replace
    function createBackTile(title) {
        let a = document.createElement('a');
        a.title = splitPath(title.slashEnd((false)))['dirname'];
        a.className = "list-group-item list-group-item-action";
        a.innerText = "< Back";
        a.addEventListener('click', showFileInPreviewElement);
        return a;
    }

    function isValidTile(path) {
        return !fs.isIgnored(path) && (fs.isDir(path) || fs.isMisc(path) || fs.isImage(path) || fs.isVideo(path));
    }


// load the contents of the given directory
    function cd(dir) {
        current_dir = decodeURIComponent(dir).slashStart(false).slashEnd(true);
        location.hash = current_dir;
        let current_dir_rel = (current_dir.substr(base_dir.length));
        let path_elements = current_dir_rel.split('/');

        // temp
        path_elements = current_dir.slashEnd(false).split('/');
        $(".current-dir").empty();
        let temp_path = '';
        path_elements.forEach(function (pe) {
                if (pe.length > 0) {
                    let a = document.createElement('a');
                    temp_path += pe + '/';
                    $(a).text(pe + '/');
                    a.title = temp_path;//.substring(1);
                    a.href = "#";
                    $(a).click((e) => {
                        e.preventDefault();
                        cd(e.target.title);
                        return false;
                    });
                    $(".current-dir").append(a);
                }
            }
        );

        $(".browser-view").empty();
        if (path_elements.length > 1) {
            $(".browser-view").append(createBackTile(current_dir));
        }
// Query the server and get the standard html file
// list, then parse that!
        let files_in_dir = fs.ls(current_dir);

        for (const file of files_in_dir) {
            //console.log(file);

            if (isValidTile(current_dir + file)) {
                $(".browser-view").append(createTile(current_dir.slashEnd(true) + file, file));
            }

        }

    }

    function showImageInPreviewElement(filepath) {
        hideAllPreviewers();
        $("#image-shower").attr("src", fs.urlTo(filepath));
        showElement("#image-shower-div");
    }

    /**
     * Stream a video
     * @param filepath Directory with .mpd file. An mp4 file (of the *same name* as directory) will be used as fallback
     * Use DASH or fallback to plain mp4
     * Use video.js and dashjs.js to play video.
     */
    function showDashVideoInPreviewElement(filepath) {
        hideAllPreviewers();
        showElement("#video-player-div");
        let player = videojs('video-player');
        player.ready(() => {
            let sources = [];
            let mpd_file = fs.dashFile(filepath);
            if (mpd_file !== "") {
                sources.push({src: fs.urlTo(mpd_file), type: 'application/dash+xml'});
            }
            // Backup video for devices (eg Apple) which are crap.
            let mp4_file = filepath.slashEnd(false) + ".mp4";
            if (fs.fileExists(mp4_file)) {
                sources.push({src: fs.urlTo(mp4_file), type: 'video/mp4'});
            }
            player.src(sources);
            player.play();
        });


        /*
        //video.className = "video-js vjs-default-skin sticky-top embed-responsive embed-responsive-16by9"; // must be on playa
        //video.autoplay = true;
        //video.controls = true;

        // DASH source player

        let mpd_file = fs.dashFile(filepath);
        if (mpd_file!=="") {
            let dash_src = document.createElement("source");
            dash_src.src = fs.urlTo(mpd_file);
            dash_src.type = "application/dash+xml";
            video.appendChild(dash_src);
        }

        // Backup video for devices (eg Apple) which are crap.
        let mp4_file = filepath.slashEnd(false) + ".mp4";
        if (fs.fileExists(mp4_file)) {
            let fallback = document.createElement("source");
            fallback.src = fs.urlTo(mp4_file);
            fallback.type = "video/mp4";
            //video.appendChild(fallback);
        }

        videoContainer.appendChild(video);
        */
        //$("#video-player-div").addClass("d-block");  //

    }

    /**
     *
     * @param filepath Filename (.mp4 required).
     */
    function showVideoInPreviewElement(filepath) {
        hideAllPreviewers();
        showElement("#video-player-div");
        let player = videojs('video-player');
        player.ready(() => {
            let sources = [];
            let mp4_file = filepath;
            if (fs.fileExists(mp4_file)) {
                sources.push({src: fs.urlTo(mp4_file), type: 'video/mp4'});
            }
            player.src(sources);
            player.play();
        });
    }

    $('.rel-link').click(function (e) {
        e.preventDefault();
        if (base_dir !== "") {
            showFileInPreviewElement(e, base_dir);
        } else {

        }
        return false;
    });

    $('.image-hours-ago').click(function (e) {
        e.preventDefault();
        hideAllPreviewers();
        let hours_ago = e.target.title;
        if (base_dir === "" || !hours_ago) return false;
        let image_datetime = moment().subtract(hours_ago, "hours").clone();
        let search_datetime = image_datetime.format(DATETIME_FORMAT);
        let search_date = image_datetime.format(DATE_FORMAT);
        let search_hour = image_datetime.format(HOUR_FORMAT);
        (async () => {
            let prefix = base_dir + "daily-photos/" + search_date + "/" +
                FILE_PREFIX + search_date + "T" + search_hour
            let photos_that_hour = await s3_objects(TMV_BUCKET, prefix);
            if (photos_that_hour.length > 0) {
                showImageInPreviewElement(photos_that_hour[0]);
                return false;
            } else {
                $(e.target).addClass('disabled');
                $(e.target).removeClass('active');
                console.log("No photos found");
            }
        })();
        return false;
    });

    $('#latest-image').click(function (e) {
        let latest_photo;
        e.preventDefault();
        hideAllPreviewers();
        if (base_dir === "") return;

        // Run backwards through the days, get the last
        // Do this async and await the s3 results sequentially
        (async () => {
            let dates_with_photos = await s3_folders(TMV_BUCKET, base_dir + "daily-photos/", false);
            console.log(dates_with_photos);
            for (let d of dates_with_photos.reverse()) {
                let photos = await s3_objects(TMV_BUCKET, d, false);
                if (photos.length > 0) {
                    //base_dir + "daily-photos/" + d + "/" +
                    latest_photo = photos[photos.length - 1];
                    showImageInPreviewElement(latest_photo);
                    return false;
                }
            }
            console.log("#latest-image found no images");
        })();
        return false;
    });

    $('#latest-video').click(function (e) {
        e.preventDefault();
        hideAllPreviewers();
        if (base_dir === "") return;
        (async () => {
            let videos_mp4 = await s3_objects(TMV_BUCKET, base_dir + "daily-videos/", false);
            let videos_dash = await s3_folders(TMV_BUCKET, base_dir + "daily-videos/", false);
            if (videos_dash.length > 0 && videos_mp4.length > 0) {
                // choose the latest. Looks at start time - probably ok.
                // eg.  "2019-10-16T04_to_2019-10-16T13" >= "2019-10-16T04_to_2019-10-16T12"
                if (baseName(videos_dash[videos_dash.length - 1].slashEnd(false)) >=
                    baseName(videos_mp4[videos_mp4.length - 1])) {
                    showDashVideoInPreviewElement(videos_dash[videos_dash.length - 1]);
                } else {
                    showVideoInPreviewElement(videos_mp4[videos_mp4.length - 1])
                }
            } else if (videos_dash.length > 0) {
                // only dash available
                showDashVideoInPreviewElement(videos_dash[videos_dash.length - 1]);
            } else if (videos_mp4.length > 0) {
                // only mp4 available
                showVideoInPreviewElement(videos_mp4[videos_mp4.length - 1])
            } else {
                console.log("#latest-video found no video");
                return;
            }

        })();
        return false;
    });

/*
    $('.longer-video-named').click(function (e) {
        e.preventDefault();
        hideAllPreviewers();
        if (base_dir === "") return;
        (async () => {
            let video_mp4 = await s3_object(TMV_BUCKET, base_dir + "longer-videos/" + e.target.title + ".mp4", false);
            let video_dash = false;//await s3_folder(TMV_BUCKET, base_dir + "longer-videos/" + e.target.title, false);
            if (video_dash) {
                showDashVideoInPreviewElement(video_dash);
            } else if (video_mp4) {
                showVideoInPreviewElement(video_mp4);
            } else {
                console.log(".longer-video-named found no video");
                return false;
            }
        })();
        return false;
    });
*/

    $('#refresh').click(function () {
        cd(current_dir);
        hideAllPreviewers();
        disActivateAllButtons();
        unDisableAllButtons();
    });

    $("#camera-select").click(function (e) {
        e.preventDefault();
        hideAllPreviewers();
        disActivateAllButtons();
        unDisableAllButtons();
        // Note conversion to lowercase. Mobile devices use Titlecase as default
        let camera_field = $('#camera-selector');
        camera_field.val(camera_field.val().toLowerCase());
        let new_base = camera_field.val().slashEnd(true);
        if (new_base.length <= 1 || fs.ls(new_base).length === 0) {
            $("#camera-invalid").addClass("d-block");
            base_dir = "";
            $(".current-dir").empty();
            $(".browser-view").empty();
        } else {
            $("#camera-invalid").removeClass("d-block");
            if ('URLSearchParams' in window) {
                let searchParams = new URLSearchParams(window.location.search);
                searchParams.set("base", encodeURIComponent(new_base.slashEnd(false)));
                let newRelativePathQuery = window.location.pathname + '?' + searchParams.toString();
                history.pushState(null, '', newRelativePathQuery);
            } else {
                console.log("URLSearchParams not available");
            }
            base_dir = new_base.slashEnd(true); // global
            cd(base_dir);
            $('#latest-image').trigger("click");
        }
        return false;
    });

    /**
     * Main
     */
    let current_dir = (location.hash.substring(1) + '/').replace(/\/\//g, '/').slashStart(false).slashEnd(true);
    if (current_dir.includes("..")) {
        current_dir = '';
    }
    let base_dir = "";
    if (set_base_dir_from_url()) {
        cd(base_dir);
        $('#latest-image').trigger("click");
    } else {
        $("#camera-selector").effect("shake", "distance");
    }

    if (window.jQuery().datetimepicker) {
        $('.datetimepicker1').datetimepicker({
            // Formats
            // follow MomentJS docs: https://momentjs.com/docs/#/displaying/format/
            format: 'DD-MM-YYYY hh:mm A',

            // Your Icons
            // as Bootstrap 4 is not using Glyphicons anymore
            icons: {
                time: 'fa fa-clock-o',
                date: 'fa fa-calendar',
                up: 'fa fa-chevron-up',
                down: 'fa fa-chevron-down',
                previous: 'fa fa-chevron-left',
                next: 'fa fa-chevron-right',
                today: 'fa fa-check',
                clear: 'fa fa-trash',
                close: 'fa fa-times'
            }
        });


    }

});