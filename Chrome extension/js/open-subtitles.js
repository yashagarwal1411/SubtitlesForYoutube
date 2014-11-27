/*
 * Subtitles For Youtube
 *
 * Created by Yash Agarwal
 * Copyright (c) 2014 Yash Agarwal. All rights reserved.
 *
 */

function initOpenSubtitlesSupport() {

  $("#search-opensubtitles-heading").html("<img src='" + chrome.extension.getURL("images/opensubtitles_128.png") + "' />");

  var token = "";
  var numberOfRetries = 3;
  var tokenRetries = numberOfRetries;
  var searchSubtitlesRetries = numberOfRetries;
  /* Clean up the youtube title (remove all '.') */
  var tag = $("#eow-title").html().trim().split('.').join(' ');
  var subLanguage = "eng"; //Let english be the language by default
  console.log("Tag: " + tag);
  var tokenLoadError = false

  /* Load api token for open subtitles.
   * As we cannot make request for token from here
   * becuase youtube loads in https:// and api endpoint
   * for opensubitles only supports http://. Chrome's
   * security policy restricts making requests direclty
   * from this page. So we talk to extensions background
   * page which in turn makes the api requests
   */
  function loadToken() {
    $("#subtitles-dialog-error").html("Fetching open subtitles api token");
    var self = this;
    chrome.runtime.sendMessage({
      action: "loadToken"
    }, function(response) {
      console.log("Response for loadToken here is: ");
      console.log(response);
      if (response) {
        token = response.token;
        //token found, should also clear subtitles-dialog-error
        //if load token called due to error, then call loadNewSubs
        $("#subtitles-dialog-error").html("");
        loadNewSubs();
      } else {
        if (tokenRetries > 0) {
          console.log("Retrying search for token. Retry no.: " + (numberOfRetries + 1 - tokenRetries));
          loadToken();
          tokenRetries = tokenRetries - 1;
        } else {
          console.log("Not retrying for token");
          $("#subtitles-dialog-error").html("(Something strange happened, api token request failed, <a id='callLoadToken'>Click here to try again</a>)");
          tokenRetries = numberOfRetries;
          $('#callLoadToken').on('click', function() {
            tokenLoadError = true;
            loadToken();
          });
        }
      }
    });
  }

  function loadNewSubs() {
    if (!token) {
      console.log("Token not found");
      $("#subtitles-dialog-error").html("(Something strange happened, api token request failed, <a id='callLoadApiToken'>Click here to try again</a>)");
      $('#callLoadApiToken').on('click', function() {
        loadToken();
      });
      return
    }
    if (!tag) {
      $("#subtitles-dialog-error").html("Please enter a title");
      console.log("Tag not found in loadNewSubs. So returning");
      return;
    }
    $("#subtitles-dialog-error").html("(Searching subs for " + tag + ")");
    chrome.runtime.sendMessage({
      action: "loadNewSubs",
      subLanguage: subLanguage,
      tag: tag
    }, function(response) {
      console.log("Response for loadNewSubs here is: ");
      console.log(response);
      response = response.response;
      if (response) {
        $("#subtitles-dialog-error").html("(Subtitles found for " + tag + ", choose one from Subtitle File list)");
        $("#sub-files").html('<option value="none">None</option>');
        $.each(response, function(index, value) {
          if (value["SubFormat"] && value["SubFormat"].toLowerCase() == "srt") {
            $("#sub-files").append($("<option></option>").attr("value", value["SubDownloadLink"]).text("[" + subLanguage + "]  " + value["SubFileName"]));
          } else {
            console.log("As sub format not srt not adding following to list");
            console.log(value);
          }

        })
      } else {
        //Using === to distinguish between false and null
        if (response === false) {
          $("#subtitles-dialog-error").html("(No subs found for " + tag + ", Sorry!! Try changing title)");
          $("#sub-files").html('<option value="none">None</option>');
        } else {
          //Response should always be null to reach here
          console.log("Response which should null is actually: " + response);
          if (searchSubtitlesRetries > 0) {
            console.log("Retrying search for sub. Retry no.: " + (numberOfRetries + 1 - searchSubtitlesRetries));
            loadNewSubs();
            searchSubtitlesRetries = searchSubtitlesRetries - 1;
          } else {
            searchSubtitlesRetries = numberOfRetries;
            $("#subtitles-dialog-error").html("(Something strange happened, search request failed, <a id='callLoadNewSubs'>Click here to try again</a>)");
            $('#callLoadNewSubs').on('click', function() {
              loadNewSubs();
            });
          }
        }
      }
    });
  }

  $("#subtitles-tag").val(tag);

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

  /* Load users language preference from local storage */
  chrome.storage.local.get(null, function(result) {
    console.log("Found language id in local storage:" + result["sublanguageid"]);
    if (result["sublanguageid"]) {
      subLanguage = result["sublanguageid"];
      $("#sub-language").val(subLanguage);
    }
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
    console.log("Sub download link is : " + subDownloadLink);
    var encodedURL = encodeURIComponent(subDownloadLink);
    console.log("Encode URI Component: " + encodedURL);
    loadSubtitles("https://subtitles-youtube.herokuapp.com/Upload/uploadGZipFile?url=" + encodedURL);
  });

  /* If user clicks on search button then display the open-subtitles dialog*/
  $("#sub-open-search-btn").click(function() {
    loadToken();
    /* Expand or collapse this panel */
    $("#sub-open-subtitles").css("display", "block");
    $("#subtitles-dialog-box").slideToggle('fast');
    $("#sub-open-search-btn").css("display", "none");
  });

};
