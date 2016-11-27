/*
 * Subtitles For Youtube
 *
 * Created by Yash Agarwal
 * Copyright (c) 2014 Yash Agarwal. All rights reserved.
 *
 */

function initExternalSubtitlesSupport() {

  $("#search-opensubtitles-heading").html(
    "<a href='http://www.opensubtitles.org/en/search' target='_blank'>" +
      "<img src='" + chrome.extension.getURL("images/opensubtitles_128.png") + "' />" +
    "</a><br><br>" +
    "<a href='http://amara.org/en/' target='_blank'>" +
      "<img width='128px' src='" + chrome.extension.getURL("images/amara.png") + "' />" +
    "</a>"
    );

  $("#subtitles-tag").val(tag);

}

function loadNewSubs() {
  if (!tag) {
    $("#subtitles-dialog-error").html("Please enter a title");
    console.log("Tag not found in loadNewSubs. So returning");
    return;
  }
  var amaraSubLanguage = $('#sub-language').find('option:selected').attr('amaraSubLanguage');
  var openSubtitleSubLanguage = $('#sub-language').val();

  console.log("Searching subs for tag: " + tag + " with lang: " + openSubtitleSubLanguage + " " + amaraSubLanguage);
  $("#subtitles-dialog-error").html("Searching subs for " + tag);
  chrome.runtime.sendMessage({
    action: "loadNewSubs",
    openSubtitleSubLanguage: openSubtitleSubLanguage,
    amaraSubLanguage: amaraSubLanguage,
    tag: tag,
    youtubeUrl: window.location.href,
    originalTag: $("#eow-title").html()
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
      $("#subtitles-dialog-error").html("Subtitles found for " + tag + ", choose one from Subtitle File list");
      $("#sub-files").html('<option value="none">None</option>');
      var firstValue = "";
      $.each(response.subtitles, function(index, value) {
        var source = value["source"];
        if (value["source"] == "OpenSubtitles") {
          source = "OpenSub";
        }
        $("#sub-files").append($("<option></option>").attr("value", value["downloadUrl"])
          .attr("encoding", value["encoding"]).attr("actual-download-url", value["actualDownloadUrl"])
          .attr("file-name", value["name"]).text("[" + source + "]  " + value["name"]));
        if (!firstValue) {
          firstValue = value["downloadUrl"];
        }
      });
      if (autoLoad && firstValue) {
        $("#sub-files").val(firstValue).change();
      }
    } else {
      $("#subtitles-dialog-error").html("No subs found for " + tag + ", Sorry!! Try changing title");
      $("#sub-files").html('<option value="none">None</option>');
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
      subBubblesVideo.subsShow(false);
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
      $('#sub-file-download').attr('download', fileName);
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
