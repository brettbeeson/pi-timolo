import {baseName, splitPath, bytesToHumanReadable} from "./bbutils.js";


import {WebFileSysS3} from './web-filesys-s3.js';
import {WebFileSysStd} from './web-filesys-std.js';


// http://ferret:8000/?base=files/moose
// serves base files
// where base = /files/moose
// current_dir is absolute
// eg /files/moose/cub
// serves /files/moose/cub
// stored in URL's #

'use strict';


const host = "http://tmv.brettbeeson.com.au.s3-ap-southeast-2.amazonaws.com/";

// choose one
let fs = new WebFileSysS3(host);
//let fs = new WebFileSysStd();

$(document).ajaxError(function (event, request, settings) {
    // debugging
    console.log("Ajax Error: " + settings.url + "," + request.status + "," + request.statusText);
});

jQuery(document).ready(function () {
        /**
         * Set via textbox or query string, this is the root for all references
         * @returns {boolean} Whether the URL contained "camera" to enable settings
         */
        function set_base_dir_from_url() {
            // default: base if this html page's location relative to webroot
            base_dir = location.pathname.replace('/index.html', '/').replace(/\/\//g, '/');
            base_dir = '';
            // add "base" setting via query string
            let searchParams = new URLSearchParams(window.location.search);
            if (searchParams.has('base')) {
                base_dir = decodeURIComponent(searchParams.get('base')).slashStart(false).slashEnd(false);
                if (base_dir.length > 0 && base_dir.search(".")!==-1) {
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
            removePreviewers();
            let resource = prefix + element.title; //getAttribute('href');

            if (!fs.fileOrDirExists(resource)) {
                $(element).addClass('disabled');
                $(element).removeClass('active');
                return false;
            } else {
                $(element).addClass('active');
                if (fs.isDashDir(resource)) {
                    showDashVideoInPreviewElement(fs.urlTo(resource));
                } else if (fs.isDir(resource)) {
                    cd(resource);
                } else if (fs.isImage(resource)) {
                    showImageInPreviewElement(fs.urlTo(resource));
                } else if (fs.isVideo(resource)) {
                    showVideoInPreviewElement(fs.urlTo(resource));
                } else {
                    alert("Unknown file type");
                    return false;
                }
            }
            return true;
        }

        function removePreviewers() {
            $("#video-player").empty();
            $("#image-shower").empty();
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

        /**
         * A Dash Dir contains ONE .mpd file and ZERO folders
         * @returns string fileame of file matching *.mpd
         */
        function dashFile(path) {
            let dirfiles = fs.ls(path);
            let mpd_entries = dirfiles.filter(function (d) {
                return /.*.mpd$/.test(d);
            });
            if (mpd_entries.length > 0) {
                return path.slashEnd(true) + mpd_entries[0];
            } else {
                return "";
            }
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

            if (0) {
                // Special root element
                let root = document.createElement('a');
                root.title = base_dir;
                root.text = base_dir.slashStart(true);
                //root.addEventListener('click',function (e){ e.preventDefault(); return false; });
                root.addEventListener('click', function (e) {
                    e.preventDefault();
                    cd(base_dir);
                    return false;
                });
                $(".current-dir").empty().append(root);
                let temp_path = base_dir; // had to remove, above to made a special 'root'
                for (let i = 0; i < path_elements.length - 1; i++) {
                    if (path_elements[i].length > 0) {
                        let a = document.createElement('a');
                        temp_path += path_elements[i] + '/';
                        $(a).text(path_elements[i] + '/');
                        a.title = temp_path;//.substring(1);
                        $(a).click(function (e) {
                            e.preventDefault();
                            cd(this.getAttribute('href'));
                            return false;
                        });
                        $(".current-dir").append(a);
                    }
                }
            }
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
            removePreviewers();
            let img = document.createElement('img');
            img.src = filepath;
            img.className = "img-fluid sticky-top"; // must be on img
            $("#image-shower").append(img);
        }

        /**
         *
         * @param filepath Directory with .mp4 and .mpd files (of the same name as directory)
         */
        function showDashVideoInPreviewElement(filepath) {
            removePreviewers();
            let mpd_file = dashFile(filepath);
            //let splut = splitPath(mpd_file);
            //let mp4_file = splut['dirname'] + "/" + splut['filename'] + ".mp4";
            let player = MediaPlayer().create();
            player.initialize(null, mpd_file, false);
            let videoContainer = document.getElementById('video-player');
            let video = document.createElement('video');
            video.className = "dashjs sticky-top embed-responsive embed-responsive-16by9"; // must be on playa
            video.autoplay = true;
            video.controls = true;
            videoContainer.appendChild(video);
            player.attachView(video)
        }

        /**
         *
         * @param filepath Directory with .mp4 and .mpd files (of the same name as directory)
         */
        function showVideoInPreviewElement(filepath) {
            let video = document.createElement('video');
            video.src = filepath;
            video.className = "sticky-top embed-responsive embed-responsive-16by9"; // must be on playa
            video.autoplay = true;
            video.controls = true;
            $("#video-player").append(video);
        }

        $('.rel-link').click(function (e) {
            e.preventDefault();
            if (base_dir !== "") {
                showFileInPreviewElement(e, base_dir);
            } else {

            }
            return false;
        });

        $('#refresh').click(function () {
            cd(current_dir);
            removePreviewers();
            disActivateAllButtons();
            unDisableAllButtons();
        });

        $("#camera-select").click(function (e) {
            e.preventDefault();
            removePreviewers();
            disActivateAllButtons();
            unDisableAllButtons();
            let new_base = $('#camera-selector').val().slashEnd(true);
            if (new_base.length <= 1 ||  fs.ls(new_base).length === 0) {
                $("#camera-invalid").addClass("d-block");
                base_dir = "";
                $(".current-dir").empty();
                $(".browser-view").empty();
            } else {
                $("#camera-invalid").removeClass("d-block");
                if ('URLSearchParams' in window) {
                    let searchParams = new URLSearchParams(window.location.search);
                    searchParams.set("base", encodeURIComponent(new_base).slashEnd(false));
                    let newRelativePathQuery = window.location.pathname + '?' + searchParams.toString();
                    history.pushState(null, '', newRelativePathQuery);
                    base_dir = new_base; // global
                    cd(base_dir);
                } else {
                    console.log("URLSearchParams not available");
                }
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
        } else {
            $("#camera-selector").effect("shake", "distance");
        }
    }
)
;
