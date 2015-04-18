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
      _gaq.push(['_trackEvent', "SubtitlesSearch", request.tag]);
      var response = {"response" : {"status" : {}}};
      var amaraSubLanguage = "en";
      if (request.subLanguage === "eng") {
        amaraSubLanguage = "en";
      } else if (request.subLanguage === "spa") {
        amaraSubLanguage = "es";
      }
      Amara.searchSubtitles(request.youtubeUrl, request.tag, amaraSubLanguage, function(data, status) {
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
          OpenSubtitles.loadNewSubs(request.tag, request.subLanguage, 3, function(data, status) {
            if (status === "OK") {
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
    } else if (request.action == "trackPageView") {
      _gaq.push(['_trackEvent', "PageView", request.tag, request.url]);
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