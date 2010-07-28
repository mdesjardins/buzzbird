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
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHERWISE
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

Components.utils.import("resource://app/chrome/content/js/global.js");  

function Browser() { }
Browser.prototype = BrowserBase;

// Displays one tweet in a separate dialog.
//
Browser.prototype.viewConversation = function (tweetId) {
  var features = "chrome,titlebar,toolbar,centerscreen,modal,scrollbars=yes";
  var params = {'tweetId':tweetId, 'username':Ctx.user, 'password':Ctx.password};
  window.openDialog("chrome://buzzbird/content/onetweet.xul", "", features, params);	
  if (params.out) {
		browser.reopen(params);
  }
}
	
// Displays one user in a separate dialog.
//
Browser.prototype.showUser = function(userId) {
  jsdump('in showUser for userId ' + userId);
  var features = "chrome,titlebar,toolbar,centerscreen,modal,scrollbars=yes";
  var params = {'userId':userId, 'username':Ctx.user, 'password':Ctx.password}
  window.openDialog("chrome://buzzbird/content/user.xul", "", features, params);
  if (params.out) {
		browser.reopen(params);
  }		
}

// Reply
//
Browser.prototype.replyTo = function(id) {
	jsdump('replying to ' + id);
	var user = getBrowser().contentDocument.getElementById("screenname-" + id).innerHTML;
	var text = '@' + desanitize(user) + ' ';
	getChromeElement('replyTweetId').value = id;
	getChromeElement('textboxid').value = text;
	getChromeElement('statusid').label = text.length + "/140";
	getChromeElement('textboxid').focus();
	dispatch('openSpeech');
}

// Send DM
//
Browser.prototype.sendDirect = function(id) {
	var user = getBrowser().contentDocument.getElementById("screenname-" + id).innerHTML;
	var text = 'd ' + desanitize(user) + ' ';
	getChromeElement('textboxid').value = text;
	getChromeElement('statusid').label = text.length + "/140";
	getChromeElement('textboxid').focus();	
	dispatch('openSpeech');
}

function start() {
	try {
		var ev = document.createEvent("Events");
		ev.initEvent("start", true, false);
		getMainWindow().document.dispatchEvent(ev);
	} catch (e) {
		jsdump("Exception sending start event: "+ e);
	}
}

// Just dispatches.
//
function firstCycleFetch() {
	jsdump('sending event up.');
	try {
		var ev = document.createEvent("Events");
		ev.initEvent("firstCycleFetch", true, false);
		getMainWindow().document.dispatchEvent(ev);
	} catch (e) {
		jsdump("Exception sending firstCycleFetch event: "+ e);
	}
}

// General Event Dispatcher
//
function dispatch(eventName) {
	try {
		var ev = document.createEvent("Events");
		ev.initEvent(eventName, true, false);
		getMainWindow().document.dispatchEvent(ev);
	} catch (e) {
		jsdump("Exception sending '" + eventName + "' event: " + e);
	}		
}

var browser = new Browser();





