import {splitPath, baseName} from "./bbutils.js";
import {WebFileSysS3} from './web-filesys-s3.js';

'use strict';

// Serve images, videos and DASH videos from S3
//
// http://ferret:8000/?base=files/moose#files/moose/moosling
// serves base files
// where base = files/moose/
// base_dir is relative to origin (eg. http://ferret:8000), with a trailing slash
// current_dir is relative to origin (eg. http://ferret:8000), with a trailing slash
//   eg /files/moose/cub
//   serves /files/moose/cub
//   stored in URL's #

/**
 ***********************************************************************************
 * Globals
 ***********************************************************************************
 */
let base_dir = "";
//let current_dir = "";
const TMV_BUCKET = "tmv.brettbeeson.com.au";
const TMV_BUCKET_URL = "http://" + TMV_BUCKET + ".s3-ap-southeast-2.amazonaws.com/";

const DATETIME_FORMAT = 'YYYY-MM-DDTHH-mm-ss';
const DATE_FORMAT = 'YYYY-MM-DD';
const TIME_FORMAT = 'HH-mm-ss';
const HOUR_FORMAT = 'HH-';
const FILE_PREFIX = ''; // do not use - not completed

// Initialize the Amazon Cognito credentials provider
AWS.config.region = 'ap-southeast-2'; // Region
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: 'ap-southeast-2:db4f53b6-3e51-4993-9fe6-f08924a57d75',
});

// Create a new service object
let s3 = new AWS.S3({
    apiVersion: '2006-03-01',
    params: {Bucket: TMV_BUCKET}
});

let fs = new WebFileSysS3(TMV_BUCKET_URL);

// Block UI defaults
$.blockUI.defaults.overlayCSS.opacity = .3;
$.blockUI.defaults.baseZ = 10000;
$.blockUI.defaults.fadeIn = 1000;
$.blockUI.defaults.message = null;
// Don't block forever in case a bug caused no unblock
$.blockUI.defaults.timeout = 3000;
$.blockUI.defaults.ignoreIfBlocked = true;
/**
 ***********************************************************************************
 * Functions
 ***********************************************************************************
 */
$(document).ajaxError(function (event, request, settings) {
    $.growl.warning({message: "Server error: " + settings.url + "," + request.status + "," + request.statusText});
});

function disable_button(button) {
    button.addClass('disabled');
    button.removeClass('active');
}

function deactivate_all_buttons(element) {
    $('.list-group-item').not(element).removeClass('active');
}

function unhide_element(element) {
    $(element).removeClass("d-none");
}

function hide_element(element) {
    $(element).addClass("d-none");
}

function reset_elements(element) {
    hide_element($('#image-shower-div'));
    hide_element($('#video-player-div'));
    $('.list-group-item').not(element).removeClass('active');
    $('.list-group-item').removeClass('disabled');
}

/**
 * @todo Could cache
 * In prefix (not recursive)
 * @param bucket
 * @param prefix
 * @param recursive
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

/**
 * Set via textbox or query string, this is the root for all references
 * @returns {boolean} Whether the URL contained "camera" to enable settings
 */
function set_base_dir_from_url() {
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

function show_file_in_previewer_event(event, prefix = "") {
    if (!show_file_in_previewer(prefix + $(event.target).data("link"))) {
        disable_button($(event.target));
    }
}

/**
 * Open a file or disrectory at clickee's pathname/href
 * Use as onclick event handler
 * Uses 'title' for the resource location, which is based on webroot+prefix
 * Eg. Webroot: localhost/html/www/
 * => resource "bar.txt" looks for "localhost/html/www/bar.txt"
 * => adding "prefix="foo" looks for "localhost/html/www/foo/bar.txt"
 * Loads (i.e. set src) of non-existant resourses, but return false
 * @param event
 * @param prefix: add
 * @returns {boolean}
 */
function show_file_in_previewer(resource) {
    if (fs.isDashDir(resource)) {
        hide_element($("#image-shower-div"));
        showDashVideoInPreviewElement(resource);
    } else if (fs.isDir(resource)) {
        hide_element($("#video-player-div"));
        hide_element($("#image-shower-div"));
        cd(resource);
    } else if (fs.isImage(resource)) {
        hide_element($("#video-player-div"));
        showImageInPreviewElement(resource);
    } else if (fs.isVideo(resource)) {
        hide_element($("#image-shower-div"));
        showVideoInPreviewElement(resource);
    } else {
        $.growl.warning({message: "Unknown file type:" + resource});
        unblockInterface();
        return false;
    }
    return fs.fileOrDirExists(resource);
}

/**
 *
 * @param href Link to resource.
 * @param name Name to display
 * @returns {HTMLAnchorElement}
 */
function createTile(link, name) {
    let a = document.createElement('a');
    a.setAttribute("data-link", link);
    a.className = "list-group-item list-group-item-action";
    a.setAttribute("data-toggle", "list");
    a.innerText = name;
    a.addEventListener('click', (e) => {
        deactivate_all_buttons(e.target);
        show_file_in_previewer_event(e);
        e.preventDefault();
    });
    return a;
}

function createBackTile(title) {
    let a = document.createElement('a');
    a.setAttribute("data-link", splitPath(title.slashEnd((false)))['dirname']);
    a.setAttribute("data-toggle", "list");
    a.className = "list-group-item list-group-item-action";
    a.innerText = "< Back";
    a.addEventListener('click', (e) => {
        show_file_in_previewer_event(e);
        e.preventDefault();
    });
    return a;
}

function isValidTile(path) {
    return !fs.isIgnored(path) && (fs.isDir(path) || fs.isMisc(path) || fs.isImage(path) || fs.isVideo(path));
}

// load the contents of the given directory
function cd(dir) {
    let current_dir = decodeURI(dir).slashStart(false).slashEnd(true);
    location.hash = current_dir;
    let path_elements = current_dir.slashEnd(false).split('/');
    $(".current-dir").empty();
    let temp_path = '';
    path_elements.forEach(function (pe) {
            if (pe.length > 0) {
                let a = document.createElement('a');
                temp_path += pe + '/';
                $(a).text(pe + '/');
                a.setAttribute("data-link", temp_path);
                a.href = "#";
                $(a).click((e) => {
                    blockInterface();
                    e.preventDefault();
                    deactivate_all_buttons();
                    cd($(e.target).data("link"));
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

    let files_in_dir = fs.ls(current_dir);

    for (const file of files_in_dir) {
        if (isValidTile(current_dir + file)) {
            $(".browser-view").append(createTile(current_dir.slashEnd(true) + file, file));
        }
    }
    unblockInterface();
}

function setImageCaption(filepath, suffix = '') {
    let date_readable = moment(baseName(filepath), "YYYY-MM-DDThh:mm:ss").format('LLLL');
    if (date_readable === "Invalid date") date_readable = baseName(filepath.slashEnd(false));
    $("#image-caption").text(date_readable + suffix);
    $("#image-caption").attr('title', filepath);
}

function showImageInPreviewElement(filepath) {
    setImageCaption(filepath);
    $("#image-shower-div").data("datetime", (moment(splitPath(filepath)['filename'], DATETIME_FORMAT).format(DATETIME_FORMAT)));
    $("#image-shower").attr("src", fs.urlTo(filepath));
    unhide_element("#image-shower-div");
    //    unblockInterface(); by event in <img>
}

function setVideoCaption(filepath) {
    let date_readable = moment(baseName(filepath.slashEnd(false)), "YYYY-MM-DD").format('LL');
    if (date_readable === "Invalid date") {
        date_readable = baseName(filepath.slashEnd(false));
        hide_element($('#video-player-nav'));       // names such as 'monthly' can't go forward/backward in time
    } else {
        unhide_element($('#video-player-nav'));
    }
    $("#video-caption").text(date_readable);
    $("#video-caption").attr('title', filepath);
}

function blockInterface() {
    $.blockUI();
}

function unblockInterface() {
    $.unblockUI();
}

/**
 * Stream a video
 * @param filepath Directory with .mpd file. An mp4 file (of the *same name* as directory) will be used as fallback
 * Use DASH or fallback to plain mp4
 * Use video.js and dashjs.js to play video.
 */
function showDashVideoInPreviewElement(filepath) {
    let player = videojs('video-player');

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
    $("#video-player-div").data("date", (moment(splitPath(filepath.slashEnd(false))['filename'], DATE_FORMAT).format(DATE_FORMAT)));
    player.ready(() => {
        player.play();
    });
    player.on('playing', () => {
        unblockInterface();
    });
    player.error(() => {
        unblockInterface();
        $.growl.warning({message: "Couldn't play video. Error: " + player.error()});
    });
    unhide_element("#video-player-div");
    setVideoCaption(filepath);
}

/**
 *
 * @param filepath Filename (.mp4 required).
 */
function showVideoInPreviewElement(filepath) {
    let player = videojs('video-player');
    let sources = [];
    let mp4_file = filepath;
    if (fs.fileExists(mp4_file)) {
        sources.push({src: fs.urlTo(mp4_file), type: 'video/mp4'});
    }
    player.reset();
    player.src(sources);
    $("#video-player-div").data("date", (moment(splitPath(filepath)['filename'], DATE_FORMAT).format(DATE_FORMAT)));
    player.ready(() => {
        player.play();
        unblockInterface();
    });
    player.error(() => {
        unblockInterface();
        $.growl.warning({message: "Couldn't play video. Error: " + player.error()});
    });
    unhide_element("#video-player-div");
    setVideoCaption(filepath);
}

function show_rel_video(video, days) {
    let current_date = $("#video-player-div").data("date");
    let new_video_basename = moment(current_date, DATE_FORMAT).add(days, 'days').format(DATE_FORMAT);
    let new_video_dir = base_dir + "daily-videos/";
    let new_video_src;
    if (fs.isDashDir(new_video_dir + new_video_basename)) {
        new_video_src = new_video_dir + new_video_basename;             // dash dir
    } else {
        new_video_src = new_video_dir + new_video_basename + ".mp4";    // mp4
    }
    let h = video.height();
    let w = video.width();
    if (!show_file_in_previewer(new_video_src)) {
        // If not available, show a blank of the previous size
        $(video).height(h);
        $(video).width(w);
        $.growl.warning({message: "Couldn't find a video for " + new_video_basename});
    } else {
        // Reset responsive image
        $(video).css('height', 'auto');
        $(video).css('width', 'auto');
    }
}

function show_rel_image(image, numberof, units) {
    let current_datetime = moment($('#image-shower-div').data("datetime"), DATETIME_FORMAT);
    let new_image_basename = current_datetime.clone().add(numberof, units).format(DATETIME_FORMAT);
    let new_image_dir = current_datetime.clone().add(numberof, units).format(DATE_FORMAT) + "/";
    let new_image_src = base_dir + "daily-photos/" + new_image_dir + new_image_basename + ".jpg";
    let h = image.height();
    let w = image.width();

    if (show_file_in_previewer(new_image_src)) {
        image.css('height', 'auto');
        image.css('width', 'auto');
    } else {
        image.height(h);
        image.width(w);
        $.growl.warning({message: "Couldn't find an image for " + new_image_basename});
    }
}

function show_latest_image() {
    let latest_photo;
    hide_element($('#video-player-div'));
    if (base_dir === "") return;
    // Run backwards through the days, get the last
    // Do this async and await the s3 results sequentially
    (async () => {
        let dates_with_photos = await s3_folders(TMV_BUCKET, base_dir + "daily-photos/", false);
        for (let d of dates_with_photos.reverse()) {
            let photos = await s3_objects(TMV_BUCKET, d, false);
            if (photos.length > 0) {
                latest_photo = photos[photos.length - 1];
                showImageInPreviewElement(latest_photo);
                return false;
            }
        }
        $.growl.warning({message: "No images available"});
        // unblockInterface(); by <img> element's event 'error'
    })();
}

/**
 * For the two datepickers (video,photo), enable only valid selections. Ask the FS for valid dates.
 */
function enabled_dates_for_date_pickers() {
    (async () => {
            let daily_videos = fs.ls(base_dir + "daily-videos/");
            let valid_dates = [];
            daily_videos.forEach(item => {
                valid_dates.push(moment(baseName(item.slashEnd(false)), DATE_FORMAT));
            });
            $('#specific-video-date-picker').data('datetimepicker').enabledDates(valid_dates);
        }
    )
    ();
    (async () => {
            let days_with_photos = fs.ls(base_dir + "daily-photos/");
            let valid_dates = [];
            days_with_photos.forEach(item => {
                valid_dates.push(moment(baseName(item.slashEnd(false)), DATE_FORMAT));
            });
            $('#specific-photo-datetime-picker').data('datetimepicker').enabledDates(valid_dates);
        }
    )
    ();
}

function get_current_dir() {
    let current_dir = (location.hash.substring(1) + '/').replace(/\/\//g, '/').slashStart(false).slashEnd(true);
    if (current_dir.includes("..")) {
        current_dir = base_dir;
    }
    return current_dir;
}

jQuery(document).ready(function () {
    /**
     ***********************************************************************************
     * Attach events
     ***********************************************************************************
     */
    $('.rel-link').click(function (e) {
        blockInterface();
        deactivate_all_buttons(e.target);
        if (base_dir !== "") {
            show_file_in_previewer_event(e, base_dir);
        }
    });

    $('.image-hours-ago').click(function (e) {
        blockInterface();
        deactivate_all_buttons(e.target);
        hide_element($('#video-player-div'));
        let hours_ago = $(e.target).data('hours');
        if (base_dir === "" || !hours_ago) return;
        let image_datetime = moment().subtract(hours_ago, "hours").clone();
        let search_date = image_datetime.format(DATE_FORMAT);
        let search_hour = image_datetime.format(HOUR_FORMAT);

        (async () => {
            let prefix = base_dir + "daily-photos/" + search_date + "/" +
                FILE_PREFIX + search_date + "T" + search_hour;
            let photos_that_hour = await s3_objects(TMV_BUCKET, prefix);
            if (photos_that_hour.length > 0) {
                showImageInPreviewElement(photos_that_hour[0]);
            } else {
                disable_button($(e.target));
                $.growl.warning({message: "No photos found"});
                unblockInterface();
            }
        })();
    });

    $('#latest-image').click((e) => {
        blockInterface();
        deactivate_all_buttons(e.target);
        show_latest_image();
    });

    $('#latest-video').click(function (e) {
        blockInterface();
        deactivate_all_buttons(e.target);
        e.preventDefault();
        hide_element($('#image-shower-div'));
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
                $.growl.warning({message: "No video found. Soz."});
                unblockInterface();
            }
        })();
    });

    $("#image-shower").on('load', () => unblockInterface());
    $("#image-shower").on('error', () => unblockInterface());

    $(".nav-image-minutes").click((e) => {
        blockInterface();
        show_rel_image($("#image-shower"), $(e.target).data("minutes"), "minutes");
    });
    $(".nav-image-hours").click((e) => {
        blockInterface();
        show_rel_image($("#image-shower"), $(e.target).data("hours"), "hours");
    });
    $(".nav-image-days").click((e) => {
        blockInterface();
        show_rel_image($("#image-shower"), $(e.target).data("days"), "days");
    });

    // video.js changes <video> name, so find it as child of div
    $(".nav-video-days").click((e) => {
        blockInterface();
        show_rel_video(videojs('video-player'), $(e.target).data("days"));
    });

    $('#refresh').click(function (e) {
        blockInterface();
        reset_elements();
        cd(get_current_dir());
    });

    $("#camera-select").click(function (e) {
        e.preventDefault();
        blockInterface();
        // Note conversion to lowercase. Mobile devices use Titlecase as default
        let camera_field = $('#camera-selector');
        camera_field.val(camera_field.val().toLowerCase());
        let new_base = camera_field.val().slashEnd(true);
        if (new_base.length <= 1 || fs.ls(new_base).length === 0) {
            $("#camera-invalid").addClass("d-block");
            base_dir = "";
            $(".current-dir").empty();
            $(".browser-view").empty();
            unblockInterface();
        } else {
            $("#camera-invalid").removeClass("d-block");
            if ('URLSearchParams' in window) {
                let searchParams = new URLSearchParams(window.location.search);
                searchParams.set("base", encodeURIComponent(new_base.slashEnd(false)));
                let newRelativePathQuery = window.location.pathname + '?' + searchParams.toString();
                history.pushState(null, '', newRelativePathQuery);
            } else {
                $.growl.warning({message: "URLSearchParams not available. Use a modern browser!"});
            }
            base_dir = new_base.slashEnd(true); // global
            cd(base_dir);
            show_latest_image();
            enabled_dates_for_date_pickers();
        }
        return false;
    });

    $.fn.datetimepicker.Constructor.Default = $.extend({}, $.fn.datetimepicker.Constructor.Default, {
        icons: {
            time: 'fas fa-clock',
            date: 'fas fa-calendar',
            up: 'fas fa-arrow-up',
            down: 'fas fa-arrow-down',
            previous: 'fas fa-chevron-left',
            next: 'fas fa-chevron-right',
            today: 'fas fa-calendar-check-o',
            clear: 'fas fa-trash',
            close: 'fas fa-times'
        }
    });

    $('#specific-video-date-picker').datetimepicker({
        format: 'LL',
    });
    $('#specific-video-date').click('on', () => {
        $('#specific-video-date-picker').data('datetimepicker').show();
    });
    $('#specific-video-btn').on('click', () => {
        if (!$('#specific-video-date-picker').data('datetimepicker').unset) {
            blockInterface();
            deactivate_all_buttons();
            let selected_video_date = $('#specific-video-date-picker').data('datetimepicker').viewDate();
            let search_date = selected_video_date.format(DATE_FORMAT);
            let video_filepath = base_dir + "daily-videos/" + search_date + "/";
            show_file_in_previewer(video_filepath);
        }
    });

    $('#specific-photo-datetime').click('on', () => {
        $('#specific-photo-datetime-picker').data('datetimepicker').show();
    });
    $('#specific-photo-datetime-picker').datetimepicker({
        format: 'LL HH:mm',
        sideBySide: true
    });
    $('#specific-photo-btn').on('click', () => {
        if (!$('#specific-photo-datetime-picker').data('datetimepicker').unset) {
            blockInterface();
            deactivate_all_buttons();
            // note rounding to ignore seconds
            let selected_photo_datetime = $('#specific-photo-datetime-picker').data('datetimepicker').viewDate().startOf('minute');
            let image_filepath = base_dir + "daily-photos/" + selected_photo_datetime.format(DATE_FORMAT) + "/" + selected_photo_datetime.format(DATETIME_FORMAT) + ".jpg";
            if (fs.fileExists(image_filepath)) {
                show_file_in_previewer(image_filepath);
            } else {
                $.growl.warning({message: "No photo for " + selected_photo_datetime.format('LL HH:mm')});
            }

        }
    });

    /**
     ***********************************************************************************
     * Main
     ***********************************************************************************
     */
    
    if (set_base_dir_from_url()) {
        $("#latest-image").addClass("active");
        blockInterface($("#latest-image"));
        cd(base_dir);
        show_latest_image();
        enabled_dates_for_date_pickers();
    } else {
        $("#camera-selector").effect("shake", "distance");
        $.growl({duration: 10000, title: "Getting Started", message: "Please enter a camera's name to view it. You need to know the name. It's case insensitive."});
    }
});
