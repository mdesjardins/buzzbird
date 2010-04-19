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

function onOk() {
	return true;
}

function oneTweetOnLoad() {
	getMainWindow().document.addEventListener("renderAnother", renderAnother, false); 
	var params = window.arguments[0];
	var id = params.tweetId;
	var username = params.username;
	var password = params.password;
	browser = document.getElementById('onetweet-browser');
	browser.contentDocument.getElementById('username').value = username;
	browser.contentDocument.getElementById('password').value = password;
	window.resizeTo(450,180);
	renderStatusUpdate(id,username,password);	
}

function renderStatusUpdate(statusId,username,password) {
	jsdump('Getting tweet ' + statusId);
	Social.service(Ctx.service).fetchSingleUpdate({
		"username": username,
		"password": password,
		"statusId": statusId,
		"onSuccess": function(updates) { fetchSingleUpdateCallback(updates,username,password); },
		"onError": function(status) {
			if (status==403) {
				// we hit a protected user's tweets while following the thread.  the party
				// ends here.
				browser = document.getElementById('onetweet-browser');
				browser.contentDocument.getElementById('fetch-throb').style.display='none';
				window.resizeBy(0,-85);
				updateTimestamps();					
			} else {
				var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
				                        .getService(Components.interfaces.nsIPromptService);
				prompts.alert(window, "Sorry.", "There was an error processing this request.");				
			}
		}							
	});
}

function fetchSingleUpdateCallback(update,username,password) {
	var newText = formatTweet(update,username,password);
	var parser = new DOMParser();
	var doc = parser.parseFromString('<div id="onetweet" xmlns="http://www.w3.org/1999/xhtml"><div id="foo">' + newText + '</div></div>', 'application/xhtml+xml');
	if (doc.documentElement.nodeName != "parsererror" ) {
		var root = doc.documentElement;
		for (var j=0; j<root.childNodes.length; ++j) {
			window.content.document.body.insertBefore(document.importNode(root.childNodes[j], true),window.content.document.body.lastChild);
		}
	} else {
		jsdump("Couldn't render the tweet.");
	}
	
	if (update.in_reply_to_status_id != null && update.in_reply_to_screen_name != null) {
		renderStatusUpdate(update.in_reply_to_status_id,username,password);
		if (window.content.document.height < 400) {
			window.resizeBy(0,85);
		}
	} else {
		browser = document.getElementById('onetweet-browser');
		browser.contentDocument.getElementById('fetch-throb').style.display='none';
		updateTimestamps();
	}
}

function renderAnother() {
	browser = document.getElementById('onetweet-browser');
	username = browser.contentDocument.getElementById('username').value;
	password = browser.contentDocument.getElementById('password').value;
	id = browser.contentDocument.getElementById('tweetId').value;
	browser = document.getElementById('onetweet-browser');
	el = browser.contentDocument.getElementById('foo');
	if (el) {
		el.parentNode.removeChild(el); 
	} else {
		jsdump('Could not find element with id onetweet');
	}
	renderStatusUpdate(id,username,password);
}

function updateTimestamps() {
	var ONE_SECOND = 1000;
	var ONE_MINUTE = 60 * ONE_SECOND;
	var ONE_HOUR = 60 * ONE_MINUTE;
	var ONE_DAY = 24 * ONE_HOUR;
	
	var timestamps = window.content.document.getElementsByName('timestamp');
	var now = new Date();
	for (var i=0; i<timestamps.length; i++) {
		tweetid = timestamps[i].id;
		when = window.content.document.getElementById(tweetid).innerHTML;
		var then = new Date(parseFloat(when));
		var delta = now - then;
		var prettyWhen = "less than 1m ago";
		if (delta > ONE_MINUTE && delta < ONE_HOUR) {
			// between 1m and 59m, inclusive
			var prettyWhen = "about " + parseInt(delta/ONE_MINUTE) + "m ago"
		} else  if (delta >= ONE_HOUR && delta < ONE_DAY) {
			// less than 24h ago
			var prettyWhen = "about " + parseInt(delta/ONE_HOUR) + "h " + parseInt((delta%ONE_HOUR)/ONE_MINUTE) + "m ago"
		} else if (delta >= ONE_DAY) {
			var prettyWhen = "more than " + parseInt(delta/(ONE_DAY)) + "d ago";
		}
		var elid = 'prettytime-' + tweetid.substring(tweetid.indexOf('-')+1);
		el = window.content.document.getElementById(elid)
		if (el) {
		  el.innerHTML = prettyWhen;
		}
	}
}
