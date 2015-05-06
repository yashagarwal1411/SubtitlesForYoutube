/*
 * Subtitles For Youtube
 *
 * Created by Yash Agarwal
 * Copyright (c) 2014 Yash Agarwal. All rights reserved.
 *
 */

var subBubblesVideo;
  /* Store display status for subs */
var areSubtitlesShowing = true;
/* Store sub delay in seconds. could be negative or positive */
var subtitlesSync = 0.0;
/* Timer for display sub-info span */
var subInfoDisplayTimer;
/* Font size of subtitles in px */
var subtitlesSize = "20";
/* Help message for subtitles */
var shortcutsMessage =  "Subtitles Shortcuts\\n\\n" +
                        "V : Show/Hide \\n" +
                        "G : -50ms delay \\n" +
                        "H : +50ms delay \\n" +
                        "Q : decrease font size \\n" +
                        "W : increase font size";

function fadeOutSubtitlesInfo() {
  if (subInfoDisplayTimer) {
    clearTimeout(subInfoDisplayTimer);
  }
  /* set a new subInfoDisplayTimer
   * wait for 1 second of no subInfoDisplayTimer
   * events before firing our changes */
  subInfoDisplayTimer = setTimeout(function() {
    $("#sub-info").fadeOut(3000);
  }, 1000);
}

/* Takes input as the url of the subtitle file and
 * loads subtitle on youtube video */
function loadSubtitles(subtitlesURL) {
  /* Hide any previously uploaded subtitles */
  $('.subtitles').css("display", "block");

  /* Initialize new bubbles instance */
  if (!subBubblesVideo) {
    subBubblesVideo = new Bubbles.video('sub-video');
    registerKeyboardListeners();
  }

  /* language does not matter, set url correctly */
  subBubblesVideo.subtitles(false, {
    "English": {
      language: "English",
      file: subtitlesURL
    }
  });

  $('#sub-info').css("opacity", 1);
  $("#sub-message").html("Subtitle upload completed. Enjoy!!! :)");
  $("#sub-message").fadeOut(3000);
  setTimeout(function() {
    $("#sub-message").html("Drag and drop SRT or Zipped srt file here to " +
      "add different subtitles to video or <a onclick=\"alert('" + shortcutsMessage + "')\">View Shortcuts</a>");
    $("#sub-message").fadeIn(3000);

    /* This is required because on adding subtitles some thing happens and
     * video is shifted 14-15px below */
    $('video').css("top","0px");
  }, 3000);

    /* Set value of font size from local storage */
    getFontSizeFromLocalStorage();
}

function registerKeyboardListeners() {
  window.addEventListener('keypress', function(e) {
    if (e.keyCode == 'v'.charCodeAt() || e.keyCode == 'V'.charCodeAt()) {
      if (areSubtitlesShowing) {
        console.log("Switching off subtitles");
        subBubblesVideo.subsShow(false);
        areSubtitlesShowing = false;
        $("#sub-info").html("Subtitles disabled").fadeIn();
        fadeOutSubtitlesInfo();
      } else {
        subBubblesVideo.subsShow(true);
        areSubtitlesShowing = true;
        console.log("Switching on subtitles");
        $("#sub-info").html("Subtitles enabled").fadeIn();
        fadeOutSubtitlesInfo();
      }
    }
    if (e.keyCode == 'g'.charCodeAt() || e.keyCode == 'G'.charCodeAt()) {
      subtitlesSync -= 0.050; //precede by 50ms
      subBubblesVideo.subsSync(subtitlesSync);
      console.log("Delaying subs by -0.050ms");
      $("#sub-info").html("Subtitle delay: " + Math.round(subtitlesSync * 1000) + "ms").fadeIn();
      fadeOutSubtitlesInfo();
    }
    if (e.keyCode == 'h'.charCodeAt() || e.keyCode == 'H'.charCodeAt()) {
      subtitlesSync += 0.050; //delay by 50ms
      subBubblesVideo.subsSync(subtitlesSync);
      console.log("Delaying subs by +0.050ms");
      $("#sub-info").html("Subtitle delay: " + Math.round(subtitlesSync * 1000) + "ms").fadeIn();
      fadeOutSubtitlesInfo();
    }
    if (e.keyCode == 'q'.charCodeAt() || e.keyCode == 'Q'.charCodeAt()) {
      subtitlesSize -= 1;
      $(".subtitles").css("font-size", subtitlesSize+"px");
      storeFontSizeInLocalStorage(subtitlesSize);
      $("#sub-info").html("Sub size: " + subtitlesSize).fadeIn();
      fadeOutSubtitlesInfo();
    }
    if (e.keyCode == 'w'.charCodeAt() || e.keyCode == 'W'.charCodeAt()) {
      subtitlesSize += 1;
      $(".subtitles").css("font-size", subtitlesSize+"px");
      storeFontSizeInLocalStorage(subtitlesSize);
      $("#sub-info").html("Sub size: " + subtitlesSize).fadeIn();
      fadeOutSubtitlesInfo();
    }
  }, false);
}

function registerFileUploader() {
  $('#content').fileupload({
    url: 'https://subtitles-youtube.herokuapp.com/upload/',
    dataType: 'json',
    add: function(e, data) {
      data.submit();
    },
    done: function(e, data) {
      console.log(data);
      loadSubtitles(data.result.url);
    },
    send: function(e, data) {

    },
    progressall: function(e, data) {
      $("#sub-message").html("Uploading subtitles ...");
    },
    fail: function(e, data) {
      $("#sub-message").html("Subtitle upload failed. Please retry. :(");
      console.log(e);
    }
  });
}

/* Function used to initliaze extension */
function initExtension() {

  /*sub-message is used to show status about upload status of subtitle file
  It appears just below the youtube video */
  $("#watch7-content").prepend("<span id='sub-message'></span><a id='sub-open-search-btn'> or Search Subtitles</a>");

  if ($("video").length === 0) {
    console.log("Flash video found. Return");
    $("#sub-message").html("This youtube video runs on Adobe Flash." + "Adding subtitles is not supported for it yet.");
    $("#sub-message").fadeOut(3000);
    $("#sub-open-search-btn").css("display", "none");
  } else {
    /* sub-info is used to display information about subs
     * like sync delay or enabled/disabled status.
     * It appears inside youtube video just above the controls toolbar */
    $(".html5-video-controls").prepend("<span id='sub-info'></span>");
    $("#sub-message").html("Drag and drop SRT or Zipped srt file here to add subtitles to video.");
    $('video').attr('id', 'sub-video');
    $('#sub-message').after('<input id="fileupload" type="file" name="uploadFile" style="display:none"/>');
    $('#fileupload').after("<div id='sub-open-subtitles' style='display:none' class='yt-card yt-card-has-padding'><div>");

    registerFileUploader();
    $("#sub-open-subtitles").load(chrome.extension.getURL("open-subtitles.html"), initExternalSubtitlesSupport);
  }

  /* Track page url and title */
  chrome.runtime.sendMessage({
      action: "trackPageView",
      url: window.location.href,
      tag: $("#eow-title").html()
    }, function(response) {
      console.log("Page view event finished");
    });
}

var pageHref;
var initExtensionInProcess = false;
setInterval(function() {
  if (window.location.href.indexOf("watch") > -1) {
    if (!pageHref || pageHref != window.location.href) {
        console.log("Found video page. Starting extension");
        pageHref = window.location.href;
        if (!initExtensionInProcess) {
          initExtensionInProcess = true;
          setTimeout(function(){
            $('.subtitles').css("display", "none");
            initExtension();
            initExtensionInProcess = false;
          }, 3000);
        }
    }
  }
}, 3000);

function storeFontSizeInLocalStorage(fontSize) {
  chrome.storage.local.set({
      "subfontsize": fontSize
  }, function() {
    console.log("Stored font size: " + fontSize + " in chrome storage");
  });
}

function getFontSizeFromLocalStorage() {
  chrome.storage.local.get(null, function(result) {
    console.log("Found font size in local storage:" + result["subfontsize"]);
    if (result["subfontsize"]) {
      subtitlesSize = result["subfontsize"];
      $(".subtitles").css("font-size", subtitlesSize+"px");
    }
  });
}