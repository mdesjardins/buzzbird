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

// Displays one tweet in a separate dialog.
//
function viewOneTweet(tweetId) {
	jsdump('viewing one tweet')
//	window.content.document.href = 'chrome://buzzbird/content/onetweet.html';
	document.getElementById('tweetId').value = tweetId;
	var ev = document.createEvent("Events");
	ev.initEvent("renderAnother", true, false);
	getMainWindow().document.dispatchEvent(ev);
	// 
	// 
	// jsdump('getting uname, pwd');
	// username = document.getElementById('username').value;
	// password = document.getElementById('password').value;
	// jsdump('u='+username+', p='+password);
	// renderTweet(tweetId,username,password);
//  var features = "chrome,titlebar,toolbar,centerscreen,modal";
//  window.openDialog("chrome://buzzbird/content/onetweet.xul", "", features, tweetId, getUsername(), getPassword());	
}

// Shows the retweet/love/reply/direct icons for an individual tweet.
function showIcons(id) {
	$('tweetInfo-' + id).style.display = 'none';
	$('tweetIcons-' + id).style.display = 'inline';
}

function showInfo(id) {
	$('tweetInfo-' + id).style.display = 'inline';
	$('tweetIcons-' + id).style.display = 'none';
}

