/*
 * Subtitles For Youtube
 *
 * Created by Yash Agarwal
 * Copyright (c) 2014 Yash Agarwal. All rights reserved.
 *
 */

function loadNewSubs() {
  if (!tag) {
    $("#subtitles-dialog-error").html("Please enter a title");
    console.log("Tag not found in loadNewSubs. So returning");
    return;
  }
  var amaraSubLanguage = $('#sub-language').find('option:selected').attr('amaraSubLanguage');
  var openSubtitleSubLanguage = $('#sub-language').val();
  $("#subtitles-tag").val(tag);
  console.log("Searching subs for tag: " + tag + " with lang: " + openSubtitleSubLanguage + " " + amaraSubLanguage);
  $("#search-con .empty-con").css('display','none');
  $("#sub-files").css('display', 'none');
  $("#search-con .loader").css('display','block');
  $("#subtitles-dialog-error").html("Searching subs for " + tag);
  chrome.runtime.sendMessage({
    action: "loadNewSubs",
    openSubtitleSubLanguage: openSubtitleSubLanguage,
    amaraSubLanguage: amaraSubLanguage,
    tag: tag,
    youtubeUrl: originalUrl,
    originalTag: originalTag
  }, function(response) {
    response = response.response;
    /* This response will be 1 response accumalating data from every 3rd party service
    response : {
      status : {
        "OpenSubtitles" : "OK",
        "Amara" : "FAILED"
      },
      subtitles : [
        {
          downloadUrl : "",
          lang : "",
          name : ""
        },
        {

        }
      ]
    } */

    console.log("Response for loadNewSubs here is: ");
    console.log(response);
    if (response && response.subtitles) {
      $("#search-con .empty-con").css('display','none');
      $("#subtitles-dialog-error").html("Please select the subtitle from the dropdown to apply.");
      $("#sub-files").css('display', 'block');
      $(".loader").css('display', 'none');
      $("#sub-files").html('<option value="none">None</option>');
      var firstValue = "none";
      $.each(response.subtitles, function(index, value) {
        var source = value["source"];
        if (value["source"] == "OpenSubtitles") {
          source = "OpenSub";
        }
        $("#sub-files").append($("<option></option>").attr("value", value["downloadUrl"])
          .attr("encoding", value["encoding"]).attr("actual-download-url", value["actualDownloadUrl"])
          .attr("file-name", value["name"]).text("[" + source + "]  " + value["name"]));
        if (firstValue == "none") {
          firstValue = value["downloadUrl"];
        }
      });
      if (autoLoad && firstValue) {
        $("#sub-files").val(firstValue).change();
      }
    } else {
      // $("#subtitles-dialog-error").html("No subs found for " + tag + ", Sorry!! Try changing title");
      $("#subtitles-dialog-error").html("");
      $("#sub-files").html('<option value="none">None</option>');
      $("#sub-files").val("none").change();
      $(".loader").css('display', 'none');
      $("#search-con .empty-con").css('display','block');
      $("#search-con .empty-con").html("<img src='" + chrome.extension.getURL("images/empty.svg") + "' />");
    }
  });
}

var registerEvents = function() {

  /* If user clicks on search button then display the open-subtitles dialog*/
  $("#sub-open-search-btn").click(function() {
    loadNewSubs();
    /* Expand or collapse this panel */
    $("#sub-open-subtitles").css("display", "block");
    $("#subtitles-dialog-box").slideToggle('fast');
    $("#sub-open-search-btn").css("display", "none");
  });

  $("#subtitle-button").click(function() {
    $('#watch-action-panels').css("display", "none");
    $('#new-subtitles-con').css("display", "block");
    $("#search-button").click();
  });

  $('.action-panel-trigger').click(function() {
    $('#new-subtitles-con').css("display", "none");
  });

  var removeSubtitleCon = function() {
    $('#new-subtitles-con').css("display", "none");
    $('#subtitle-button').removeClass('yt-uix-button-toggled');
  };

  $("#subtitle-close").click(function() {
    removeSubtitleCon();
  });

  $('#search-con .search-subtitles').click(function() {
    loadNewSubs();
  });

  $("#search-button").click(function() {
    loadNewSubs();
    $('#search-con').css("display", "block");
    $('#upload-con').css("display", "none");
    $('#settings-con').css("display", "none");
    $("#subtitles-dialog-box").css("display", "block");
  });

  $("#upload-button").click(function() {
    registerFileUploader();
    $('#search-con').css("display", "none");
    $('#upload-con').css("display", "block");
    $('#settings-con').css("display", "none");
    $("#subtitles-dialog-box").css("display", "none");
  });

  $("#settings-button").click(function() {
    $('#search-con').css("display", "none");
    $('#upload-con').css("display", "none");
    $('#settings-con').css("display", "block");
    $("#subtitles-dialog-box").css("display", "none");
    $("#poweredby .images").html('<img class="amara" src="'+ chrome.extension.getURL("images/amara.png")+'" width="140px">');
    $("#poweredby .images").append('<img class="opensubtitles" src="'+ chrome.extension.getURL("images/opensubtitles_128.png")+'" width="140px">');
  });

  $('#subtitles-auto-load').change(function() {
    autoLoad = $("#subtitles-auto-load").prop('checked');
    storeAutoLoadFlag(autoLoad);
  });

  /* If user changes the title field, then make a search
   * request with updated title */
  $("#subtitles-tag").on('change', function() {
    console.log("Subtitle tag is:" + this.value);
    tag = this.value;
    loadNewSubs();
  });

  /* Save users preffered langauge in chrome's local storage */
  $('#sub-language').on('change', function() {
    console.log("Language code selected is:" + this.value);
    subLanguage = this.value;
    loadNewSubs();
    chrome.storage.local.set({
      "sublanguageid": subLanguage
    }, function() {
      console.log("Stored language id: " + subLanguage + " in chrome storage");
    });
  });

  /* If user selects a subtitle file then load it */
  /* We can not directly use the url provided by
   * opensubtitles because they only give url to a gzipped file
   * but on making request for the gzipped file they do not set
   * content-encoding header. So browser does not deflate the gzipped
   * file and we cant display. To solve this we proxy the file from our
   * server with correct headers
   */
  $("#sub-files").on('change', function() {
    var subDownloadLink = this.value;
    if (subDownloadLink == "none") {
      console.log("Hiding subtitles");
      if (subBubblesVideo) {
        subBubblesVideo.subsShow(false);
      }
      areSubtitlesShowing = false;
      $("#sub-info").html("Subtitles disabled").fadeIn();
      fadeOutSubtitlesInfo();
      $('#sub-file-download').attr('href', "");
      $('#sub-file-download').attr('download', "");
      $("#sub-file-download").hide();
      return;
    } else {
      var actualDownloadUrl = $('option:selected', this).attr('actual-download-url');
      var fileName = $('option:selected', this).attr('file-name');
      $('#sub-file-download').attr('href', actualDownloadUrl);
      $('#sub-file-download').attr('download', "abc.srt");
      $("#sub-file-download").show();
    }
    var encoding = $('option:selected', this).attr('encoding');
    console.log("ENCODING FOUND HERE: " + encoding);
    var updatedUrl = "";
    if (subDownloadLink && subDownloadLink.indexOf("blob") > -1) {
      console.log("Found local url: " + subDownloadLink);
      /* This is Amara url which will not have a encoding defined
       * assume UTF-8 for them */
      if (!encoding) {
        encoding = "UTF-8";
      }
      loadSubtitles(subDownloadLink, false, encoding);
    } else {
      console.log("Sub download link is : " + subDownloadLink);
      var encodedURL = encodeURIComponent(subDownloadLink);
      console.log("Encode URI Component: " + encodedURL);
      updatedUrl = "https://subtitles-youtube.herokuapp.com/Upload/uploadGZipFile?url=" + encodedURL;
      loadSubtitles(updatedUrl, false, encoding);
    }
  });
};

function registerFileUploader() {

  $('#content').fileupload({
    url: '',
    dataType: 'json',
    dropZone: $('.fileinput-button'),
    add: function(e, data) {

      var file = data.files[0];

      /* Track page url and title */
      chrome.runtime.sendMessage({
          action: "trackSubUpload",
          url: originalUrl,
          fileName: file.name,
          tag: originalTag
        }, function(response) {
          console.log("Track sub upload event finished");
        });

      var reader = new FileReader();
      $('#srt-upload-name').html('"' + file.name + '"'+ ' subtitle applied');
      if (file.name.split(".").pop().toLowerCase() == "srt") {

        /* directly pass text */
        reader.onload = function(event) {
          var subResult = event.target.result;
          console.log("Result: " + subResult);
          loadSubtitles(subResult, true, "UTF-8");
        };

        reader.readAsText(file);
      } else if (file.name.split(".").pop().toLowerCase() == "zip") {
        reader.onload = function(event) {
          var foundSrtFile = false;
          var zipFileLoaded = new JSZip(event.target.result);

          for (var nameOfFileContainedInZipFile in zipFileLoaded.files)
          {
            if (!foundSrtFile) {
              var fileContainedInZipFile = zipFileLoaded.files[nameOfFileContainedInZipFile];

              var blob = new Blob([fileContainedInZipFile.asUint8Array().buffer]);
              var readerForZip = new FileReader();
              if (nameOfFileContainedInZipFile.split(".").pop().toLowerCase() == "srt" &&
                nameOfFileContainedInZipFile.indexOf("__MACOSX") == -1) {

                /* directly pass text */
                readerForZip.onload = function(event) {
                    var subResult = event.target.result;
                    console.log("Result: " + subResult);
                    loadSubtitles(subResult, true, "UTF-8");
                };

                readerForZip.readAsText(blob);
                foundSrtFile = true;
              }
            }
          }

          if (!foundSrtFile) {
            $("#srt-upload-name").html("No srt file found in this zip.");
          }

        };
        reader.readAsArrayBuffer(file);
      } else {
          $("#srt-upload-name").html("Unrecognised file extension. Please upload either a srt file or zipped srt file.");
      }
    }
  });
}
