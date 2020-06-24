/*
 * Subtitles For Youtube
 *
 * Created by Yash Agarwal
 * Copyright (c) 2014 Yash Agarwal. All rights reserved.
 *
 */

var OpenSubtitlesFactory = function() {

  var numTokenRetries = 0;
  setInterval(() => {
    numTokenRetries = 0;
  }, 5*60*1000); 

  var self = {};
  var token;

  self.loadToken = function(retries, callback) {

    //Return directly as token might be required on multiple pages
    //TODO: Check if token expired then relogin
    if (token) {
      console.log("Existing token found. No need to re-login");
      console.log("Returning token: " + token);
      callback(token, null);
      return;
    }


    if (numTokenRetries > 3) {
      console.error("numTokenRetries is greater than 3, returning");
      callback(null, "Token not loaded");
      return
    }

    numTokenRetries++

    $.xmlrpc({
      url: 'http://api.opensubtitles.org/xml-rpc',
      methodName: 'LogIn',
      params: ["", "", "", "subtitlesforyoutube"],
      success: function(response, status, jqXHR) {
        console.log("Success for open subtitles LogIn. Token is:");
        console.log(response[0]["token"]);
        token = response[0]["token"];
        callback(token, null);
      },
      error: function(jqXHR, status, error) {
        console.log("Error in login call for open subtitles");
        console.log(error);
        if (retries > 0) {
          self.loadToken(retries - 1, callback);
        } else {
          callback(null, "Token not loaded");
        }
      }
    });
  };

  self.loadNewSubs = function(tag, subLanguage, retries, callback) {
    console.log("Inside load new subs");
    console.log("Token: " + token);

    var loadNewSubsCallback = function() {
      $.xmlrpc({
        url: 'http://api.opensubtitles.org/xml-rpc',
        methodName: 'SearchSubtitles',
        params: [token, [{
          'query': tag,
          'sublanguageid': subLanguage
        }]],
        success: function(response, status, jqXHR) {
          console.log("Success for open subtitles SearchSubtitles");
          console.log(response);
          if (!response || response[0]["data"] === false) {
            console.error("Not found response or response false from OpenSubtitles");
            callback({
              response: false
            });
          } else if (response[0]["status"].indexOf("401 Unauthorized") != -1) {
            console.error("Response from OpenSubtitles contains 401 Unauthorized");
            token = "";
            self.loadNewSubs(tag, subLanguage, retries - 1, callback);
          } else {
            var filteredResponse = {"subtitles": []};
            $.each(response[0]["data"], function(index, value) {
              if (value["SubFormat"] && value["SubFormat"].toLowerCase() == "srt") {
                filteredResponse.subtitles.push({
                  "downloadUrl": value["SubDownloadLink"],
                  "lang": subLanguage,
                  "encoding": value["SubEncoding"],
                  "name": value["SubFileName"],
                  "actualDownloadUrl": value["SubDownloadLink"],
                  "source": "OpenSubtitles"
                });
              }
            });
            callback(filteredResponse, "OK");
          }
        },
        error: function(jqXHR, status, error) {
          console.log("Error in SearchSubtitles call for open subtitles");
          console.log(error);
          if (retries > 0) {
            self.loadNewSubs(tag, subLanguage, retries - 1, callback);
          } else {
            callback(null, "FAILED");
          }
        }
      });
    };

    if (!token) {
      self.loadToken(3, function(token, error) {
        if (token) {
          loadNewSubsCallback();
        } else {
          console.error("Could not load OpneSubtitles api token.");
          callback(null, "FAILED");
        }
      });
    } else {
      loadNewSubsCallback();
    }

  };

  self.getLocalUrl = function(subDownloadLink, callback) {
    var xhr = new XMLHttpRequest();
    if (subDownloadLink.startsWith("http://")) {
      console.log("subDownloadLink starts with http://, converting it to https://");
      subDownloadLink = subDownloadLink.replace("http://","https://");
    }
    xhr.open('GET', subDownloadLink, true);
    xhr.responseType = "arraybuffer";
    xhr.onreadystatechange = function () {
      if (xhr.readyState == 4) {
        if (xhr.status === 200) {
          console.log("Response data for url: " + subDownloadLink);

          console.log(xhr.response);
          var arrayBuffer = xhr.response;

          if (arrayBuffer) {
            var byteArray = new Uint8Array(arrayBuffer);
            var gunzip = new Zlib.Gunzip(byteArray);
            var plain = gunzip.decompress();
            var blob = new Blob([plain], {type: 'application/octet-binary'}); // pass a useful mime type here
            var url = URL.createObjectURL(blob);
            console.log("Local url for subtitle is: " + url);
            callback(url, null);
          } else {
            console.error("Array buffer nil from response data");
            callback("", "Array buffer nil from response data");
          }

        } else {
          console.error("Error response data for url: " + subDownloadLink);
          console.error(xhr.response);
          callback("", xhr.response);
        }
      }
    };
    xhr.send(null);
  };

  return self;
};