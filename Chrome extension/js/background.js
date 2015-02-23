/*
 * Subtitles For Youtube
 *
 * Created by Yash Agarwal
 * Copyright (c) 2014 Yash Agarwal. All rights reserved.
 *
 */

var token
OpenSubtitles = {
    loadToken : function(sendResponse) {
        //Return directly as token might be required on multiple pages
        //TODO: Check if token expired then relogin
        if (token) {
            console.log("Existing token found. No need to re-login");
            console.log("Returning token: " + token);
            sendResponse({token: token});
            return
        }
        $.xmlrpc({
            url: 'http://api.opensubtitles.org/xml-rpc',
            methodName: 'LogIn',
            params: ["", "", "", "subtitlesforyoutube"],
            success: function(response, status, jqXHR) {
                console.log("Success for open subtitles LogIn. Token is:");
                console.log(response[0]["token"]);
                token = response[0]["token"];
                sendResponse({token: token});
            },
            error: function(jqXHR, status, error) {
                console.log("Error in login call for open subtitles");
                console.log(error);
                sendResponse({token: null});
            }
        });
    },
    loadNewSubs : function(tag, subLanguage, sendResponse) {
        console.log("Inside load new subs");
        console.log("Token found " + token);
        $.xmlrpc({
            url: 'http://api.opensubtitles.org/xml-rpc',
            methodName: 'SearchSubtitles',
            params: [ token, [{'query':tag, 'sublanguageid':subLanguage}]],
            success: function(response, status, jqXHR) {
                console.log("Success for open subtitles SearchSubtitles");
                console.log(response[0]["data"]);
                if (response[0]["data"] == false) {
                    sendResponse({response:false});
                } else {
                    sendResponse({response:response[0]["data"]});
                }
            },
            error: function(jqXHR, status, error) {
                console.log("Error in SearchSubtitles call for open subtitles");
                console.log(error);
                sendResponse({response:null});
            }
        });

    }
}

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {

        if (request.action == "loadToken") {
            OpenSubtitles.loadToken(sendResponse);
        } else if (request.action == "loadNewSubs") {
            _gaq.push(['_trackEvent', "OpenSubtitlesSearch", request.tag]);
            OpenSubtitles.loadNewSubs(request.tag, request.subLanguage, sendResponse);
        } else if (request.action == "trackPageView") {
            _gaq.push(['_trackEvent', "PageView", request.tag, request.url]);
            sendResponse({response:"ok"});
        }

        // return true from the event listener to indicate you wish to
        // send a response asynchronously (this will keep the message
        // channel open to the other end until sendResponse is called).
        return true;
    }
);