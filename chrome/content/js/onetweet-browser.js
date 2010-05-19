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

// Displays one tweet in a separate dialog.
//
function Browser() { }
Browser.prototype = BrowserBase;

Browser.prototype.viewConversation = function(tweetId) {
	jsdump('viewing conversation ' + tweetId);
	getMainWindow().arguments[0].out = {'action':'oneTweet', 'tweetId':tweetId};
	getMainWindow().document.getElementById('onetweet-dialog').acceptDialog();
}

// Reply
//
Browser.prototype.replyTo = function(id) {
	jsdump('replying to ' + id);
	var replyTo = document.getElementById("screenname-" + id).innerHTML;
	getMainWindow().arguments[0].out = {'action':'reply', 'tweetId':id, 'replyTo':replyTo};
	getMainWindow().document.getElementById('onetweet-dialog').acceptDialog();
}

// Show User
//
Browser.prototype.showUser = function(userId) {
	getMainWindow().arguments[0].out = {'action':'user', 'userId':userId};
	getMainWindow().document.getElementById('onetweet-dialog').acceptDialog();
}

// Send DM
//
Browser.prototype.sendDirect = function(id) {
	jsdump('direct to ' + id);
	var directTo = document.getElementById("screenname-" + id).innerHTML;
	getMainWindow().arguments[0].out = {'action':'directTo', 'tweetId':id, 'directTo':directTo};
	getMainWindow().document.getElementById('onetweet-dialog').acceptDialog();
}

// Retweet
//
Browser.prototype.retweet = function(id) {
	jsdump('retweet ' + id);
	getMainWindow().arguments[0].out = {'action':'retweet', 'tweetId':id};
	getMainWindow().document.getElementById('onetweet-dialog').acceptDialog();
}

// Stop Following
//
Browser.prototype.stopFollowing = function(id) {
	jsdump('unfollow ' + id);
	getMainWindow().arguments[0].out = {'action':'unfollow', 'userId':id};
	getMainWindow().document.getElementById('ontweet-dialog').acceptDialog();
}

// Called onload of the browser.  Dispatches up to the main window for now.
//
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
