/*
Copyright (c) 2009 Mike Desjardins

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

function onOk() {
	return true;
}

function oneTweetOnLoad() {
	getMainWindow().document.addEventListener("renderAnother", renderAnother, false); 
	var id = window.arguments[0];
	var username = window.arguments[1];
	var password = window.arguments[2];
	browser = document.getElementById('onetweet-browser');
	browser.contentDocument.getElementById('username').value = username;
	browser.contentDocument.getElementById('password').value = password;
	window.resizeTo(450,180);
	renderTweet(id,username,password);
	
}

function renderTweet(id,username,password) {
	jsdump('Getting tweet ' + id);
	url = 'http://twitter.com/statuses/show/' + id + '.json';
	new Ajax.Request(url,
		{
			method:'get',
			httpUserName: username,
			httpPassword: password,
			onSuccess: function(transport) { oneTweetCallback(transport,username,password); },
			onFailure: function() { 
					var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
					                        .getService(Components.interfaces.nsIPromptService);
					prompts.alert(window, "Sorry.", "There was an error processing this request.");
			}
		});		
}

function oneTweetCallback(transport,username,password) {
	var tweet = eval('(' + transport.responseText + ')');
	var newText = formatTweet(tweet,username,password);
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
	
	if (tweet.in_reply_to_status_id != null && tweet.in_reply_to_screen_name != null) {
		renderTweet(tweet.in_reply_to_status_id,username,password);
		window.resizeBy(0,80);
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
	renderTweet(id,username,password);
}