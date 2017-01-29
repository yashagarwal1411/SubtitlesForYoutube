/*
 * Subtitles For Youtube
 *
 * Created by Yash Agarwal
 * Copyright (c) 2014 Yash Agarwal. All rights reserved.
 *
 */

var OpenSubtitles = OpenSubtitlesFactory();
var Amara = AmaraFactory();

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {

    if (request.action == "loadToken") {
      OpenSubtitles.loadToken(sendResponse);
    } else if (request.action == "loadNewSubs") {

      _gaq.push(['_trackEvent', "SubtitlesSearch", request.originalTag + ' # ' + request.youtubeUrl, request.openSubtitleSubLanguage + ' # ' + request.originalTag]);

      var response = {"response" : {"status" : {}}};
      Amara.searchSubtitles(request.youtubeUrl, request.originalTag, request.amaraSubLanguage, function(data, status) {
        if (status === "OK") {
          console.log("Found status OK for Amara with data:");
          console.log(data);
          response.response.status["Amara"] = "OK";
          response.response["subtitles"] = data.subtitles;
          sendResponse(response);
        } else {
          console.log("Found status FAILED for Amara with data:");
          console.log(data);
          response.response.status["Amara"] = "FAILED";
          OpenSubtitles.loadNewSubs(request.tag, request.openSubtitleSubLanguage, 3, function(data, status) {
            if (status === "OK" && data.subtitles && data.subtitles.length > 0) {
              console.log("Found status OK for OpenSubtitles with data:");
              console.log(data);
              response.response.status["OpenSubtitles"] = "OK";
              response.response["subtitles"] = data.subtitles;
            } else {
              console.log("Found status FAILED for OpenSubtitles with data:");
              console.log(data);
              response.response.status["OpenSubtitles"] = "FAILED";
            }
            sendResponse(response);
          });
        }
      });
    } else if (request.action == "trackSubUpload") {
      //also add info of YouTube url
      _gaq.push(['_trackEvent', "SubUpload", request.tag + ' # ' + request.url, request.fileName]);
      sendResponse({
        response: "ok"
      });
    }

    // return true from the event listener to indicate you wish to
    // send a response asynchronously (this will keep the message
    // channel open to the other end until sendResponse is called).
    return true;
  }
);