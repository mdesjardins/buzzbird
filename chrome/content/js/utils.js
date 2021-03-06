/*
Copyright (c) 2010 Mike Desjardins

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

Components.utils.import("resource://app/chrome/content/js/global.js");  

// Utility method to return the window object.
//
function getMainWindow() {
	var mainWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
	                   .getInterface(Components.interfaces.nsIWebNavigation)
	                   .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
	                   .rootTreeItem
	                   .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
	                   .getInterface(Components.interfaces.nsIDOMWindow);
	return mainWindow;
}

// Utility method to return the main browser window.
//
function getBrowser() {
	return getMainWindow().document.getElementById('browserid');
}

// Utility method to return the specified UI element.
//
function getChromeElement(id) {
	return getMainWindow().document.getElementById(id);
}

// Wrappers for fetching/setting a boolean preference.
//
function getBoolPref(prefname,def) {
  try { 
    var pref = Components.classes["@mozilla.org/preferences-service;1"]
                       .getService(Components.interfaces.nsIPrefBranch);
    return pref.getBoolPref(prefname);
  } catch(er) {
    return def;
  }
}
function setBoolPref(prefname,value) {
   var pref = Components.classes["@mozilla.org/preferences-service;1"]
                      .getService(Components.interfaces.nsIPrefBranch);
   return pref.setBoolPref(prefname,value);
}

// Wrappers for fetching/setting a integer preference.
//
function getIntPref(prefname,def) {
  try { 
    var pref = Components.classes["@mozilla.org/preferences-service;1"]
                       .getService(Components.interfaces.nsIPrefBranch);
    return pref.getIntPref(prefname);
  } catch(er) {
    return def;
  }
}
function setIntPref(prefname,value) {
   var pref = Components.classes["@mozilla.org/preferences-service;1"]
                      .getService(Components.interfaces.nsIPrefBranch);
   return pref.setIntPref(prefname,value);
}

// Wrappers for fetching/setting a string preference.
//
function getStringPref(prefname,def) {
  try { 
    var pref = Components.classes["@mozilla.org/preferences-service;1"]
                       .getService(Components.interfaces.nsIPrefBranch);
    return pref.getCharPref(prefname);
  } catch(er) {
    return def;
  }
}
function setStringPref(prefname,value) {
   var pref = Components.classes["@mozilla.org/preferences-service;1"]
                      .getService(Components.interfaces.nsIPrefBranch);
   return pref.setCharPref(prefname,value);
}


// Make stuff "HTML Safe"
//
function sanitize(text) {
	// I'm sure there are far better ways to do this, but I suck at regular expressions...
	var clean = text.replace(/&/g, '&amp;');
	clean = clean.replace(/&amp;lt;/g, '&lt;');
	clean = clean.replace(/&amp;gt;/g, '&gt;');
	clean = clean.replace(/&amp;quot;/g, '&quot;');
	clean = clean.replace(/&amp;apos;/g, '&#39;');
	clean = clean.replace(/</g, '&lt;');
	clean = clean.replace(/>/g, '&gt;');
	clean = clean.replace(/"(?![^<>]*>)/g, '&quot;');
	clean = clean.replace(/'(?![^<>]*>)/g, '&#39;');
	return clean;
}

// Unsafe
//
function desanitize(text) {
	var filthy = text.replace(/&amp;/g, '&');
	filthy = text.replace(/&lt;/g, '<');
	filthy = text.replace(/&rt;/g, '>');
	filthy = text.replace(/&quot;/g, '"');
	filthy = text.replace(/&apos;/g, "'");
	filthy = text.replace(/&#39;/g, "'");
	return filthy;
}

// Opens a hashtag link in the user's default browser
//
function hashTag(tagName) {
	if (getStringPref('buzzbird.hashtag.destination','hashtags.org') == 'search.twitter.com') {
		linkTo('http://search.twitter.com/search?q=%23' + tagName);
	} else {
		linkTo('http://hashtags.org/' + tagName);
	}
}

// Opens a link in the user's default browser.
//
function linkTo(href) {
	var ioservice = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
	var uriToOpen = ioservice.newURI(href, null, null);
	var extps = Components.classes["@mozilla.org/uriloader/external-protocol-service;1"].getService(Components.interfaces.nsIExternalProtocolService);
	extps.loadURI(uriToOpen, null);
}

// Craptastic logging.
//
function jsdump(str) {
	var d = new Date();
	str = d + ': ' + str;
	Components.classes['@mozilla.org/consoleservice;1']
    		.getService(Components.interfaces.nsIConsoleService)
            .logStringMessage(str);
}

// Returns 'tweet','reply','direct', or 'mine'
//
function tweetType(tweet,username,password) {
	var re = new RegExp(".*?@" + username + ".*?","i");
	var result = 'tweet'
	if (tweet.text.substring(0,11) == "Directly to") {
		result = 'direct-to';
	} else if (tweet.sender != undefined) {
		result = 'direct-from';
	} else if (tweet.in_reply_to_screen_name == username || re.test(tweet.text)) {
		result = 'reply';
	} else if (tweet.user.screen_name == username) {
		result = 'mine';
	}
	return result;
}
