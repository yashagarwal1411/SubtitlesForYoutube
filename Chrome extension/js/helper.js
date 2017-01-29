//helper.js

function storeAutoLoadFlag(autoLoad) {
  chrome.storage.local.set({
      "autoLoad": autoLoad
  }, function() {
    console.log("Stored autoLoad: " + autoLoad + " in chrome storage");
  });
}

function storeFontSizeInLocalStorage(fontSize) {
  chrome.storage.local.set({
      "subfontsize": fontSize
  }, function() {
    console.log("Stored font size: " + fontSize + " in chrome storage");
  });
}

function initDataFromLocalStorage() {
  chrome.storage.local.get(null, function(result) {
    console.log("Found font size in local storage:" + result["subfontsize"]);
    console.log("Found autoLoad in local storage:" + result["autoLoad"]);
    console.log("Found language id in local storage:" + result["sublanguageid"]);

    if (result["subfontsize"]) {
      subtitlesSize = result["subfontsize"];
    } else {
      subtitlesSize = "20";
    }
    if (result["autoLoad"] !== null && result["autoLoad"] !== undefined) {
      autoLoad = result["autoLoad"];
    } else {
      autoLoad = false;
    }
    if (result["sublanguageid"]) {
      subLanguage = result["sublanguageid"];
    } else {
      subLanguage = "eng";
    }

  });
}

function registerKeyboardListeners() {
  window.addEventListener('keydown', function(e) {
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
      if (subtitlesSize < 0) {
        subtitlesSize = 0;
      }
      if (subtitlesSize > 40) {
        subtitlesSize = 40;
      }
      $(".subtitles").css("font-size", subtitlesSize + "px");
      storeFontSizeInLocalStorage(subtitlesSize);
      $("#sub-info").html("Sub size: " + subtitlesSize).fadeIn();
      fadeOutSubtitlesInfo();
    }
    if (e.keyCode == 'w'.charCodeAt() || e.keyCode == 'W'.charCodeAt()) {
      subtitlesSize += 1;
      if (subtitlesSize < 0) {
        subtitlesSize = 0;
      }
      if (subtitlesSize > 40) {
        subtitlesSize = 40;
      }
      $(".subtitles").css("font-size", subtitlesSize+"px");
      storeFontSizeInLocalStorage(subtitlesSize);
      $("#sub-info").html("Sub size: " + subtitlesSize).fadeIn();
      fadeOutSubtitlesInfo();
    }
  }, false);
}


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
 * loads subtitle on youtube video
 * add second argument to decide if it's from local file */
function loadSubtitles(subtitlesURL, isLocalFile, encoding) {
  /* Hide any previously uploaded subtitles */
  $('.subtitles').css("display", "block");

  /* Initialize new bubbles instance */
  if (!subBubblesVideo) {
    subBubblesVideo = new Bubbles.video('sub-video');
    registerKeyboardListeners();
  }

  /* language does not matter, set url correctly */
  var data = {
    "English": {
      language: "English",
      file: subtitlesURL,
      encoding: encoding,
      isLocalFile: isLocalFile
    }
  };

  subBubblesVideo.subtitles(false, data);

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
}