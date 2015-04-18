 /*
 * Subtitles For Youtube
 *
 * Created by Yash Agarwal
 * Copyright (c) 2014 Yash Agarwal. All rights reserved.
 *
 */

function AmaraFactory() {

  var apiUsername = "xxxxx";
  var apiKey = "xxxxxxxxxx";
  var baseUrl = "http://www.universalsubtitles.org/api2/partners";
  var domainUrl = "http://www.universalsubtitles.org";

  var self = {};

  self.searchSubtitles = function(youtubeUrl, tag, lang, callback) {
    console.log(youtubeUrl);
    $.ajax({
      url: baseUrl + "/videos/",
      headers : {
        "X-api-username" : apiUsername,
        "X-apikey" : apiKey
      },
      data: {
        "video_url" : youtubeUrl,
      },
      success: function(data) {
        console.log(data);
        if (data && data.objects) {
          var arr = data.objects;
          var ans = false;
          for (var index in arr) {
            if (arr[index].languages) {
              for (var j in arr[index].languages) {
                if (arr[index].languages[j].code === lang) {
                  var subUrl = arr[index].languages[j].subtitles_uri;
                  if (subUrl && ans === false) {
                    ans = true;
                    subUrl = domainUrl + subUrl + "?format=srt";
                    self.getLocalUrl(subUrl, function(localUrl, error) {
                      if (localUrl) {
                        callback({"subtitles": [{
                          "downloadUrl" : localUrl,
                          "lang" : lang,
                          "name" : tag,
                          "source" : "Amara"
                        }]}, "OK");
                        console.log("Found sub in lang " + lang + " for url: " + youtubeUrl + " with localUrl: " + localUrl);
                      } else {
                        console.error(error);
                        callback(null, "FAILED");
                      }
                    });
                  }
                }
              }
            }
          }
          if (!ans) {
            console.error("Not found sub for url: " + youtubeUrl + " of lang en");
            callback(null, "FAILED");
          }
        } else {
          console.error("No subtitles found for url: " + youtubeUrl + " in Amara");
          callback(null, "FAILED");
        }
      },
      error: function(error) {
        console.error(error);
        callback(null, "No subs found");
      }
    });
  };

  self.getLocalUrl = function(amaraUrl, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', amaraUrl, true);
    xhr.setRequestHeader("X-api-username", apiUsername);
    xhr.setRequestHeader("X-apikey", apiKey);
    xhr.responseType = "blob";
    xhr.onreadystatechange = function () {
      if (xhr.readyState == 4) {
        if (xhr.status === 200) {
          console.log("Response from getLocalUrl for url: " + amaraUrl);
          console.log(xhr.response);
          var localUrl = window.URL.createObjectURL(xhr.response);
          console.log("Local url: " + localUrl + " for amara url: " + amaraUrl);
          callback(localUrl, null);
        } else {
          console.error("Error response from getLocalUrl for url: " + amaraUrl);
          console.error(xhr.response);
          callback("", xhr.response);
        }
      }
    };
    xhr.send(null);
  };

  self.isAmaraUrl = function(url) {
    if(url && url.indexOf(baseUrl) > -1) {
      return true;
    } else {
      return false;
    }
  };

  return self;
}