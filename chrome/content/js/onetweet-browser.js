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

// Displays one tweet in a separate dialog.
//
function viewOneTweet(tweetId) {
	jsdump('viewing conversation ' + tweetId);
	getMainWindow().arguments[0].out = {'action':'oneTweet', 'tweetId':tweetId};
	getMainWindow().document.getElementById('onetweet-dialog').acceptDialog();
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

// Reply
//
function replyTo(id) {
	jsdump('replying to ' + id);
	var replyTo = document.getElementById("screenname-" + id).innerHTML;
	getMainWindow().arguments[0].out = {'action':'reply', 'tweetId':id, 'replyTo':replyTo};
	getMainWindow().document.getElementById('onetweet-dialog').acceptDialog();
}

// Show User
//
function showUser(userId) {
	getMainWindow().arguments[0].out = {'action':'user', 'userId':userId};
	getMainWindow().document.getElementById('onetweet-dialog').acceptDialog();
}

// Send DM
//
function sendDirect(id) {
	jsdump('direct to ' + id);
	var directTo = document.getElementById("screenname-" + id).innerHTML;
	getMainWindow().arguments[0].out = {'action':'directTo', 'tweetId':id, 'directTo':directTo};
	getMainWindow().document.getElementById('onetweet-dialog').acceptDialog();
}

// Re-tweet
//
function retweet(id) {
	var raw = document.getElementById("raw-" + id).innerHTML;
	var user = document.getElementById("screenname-" + id).innerHTML;
	var f = getStringPref('buzzbird.retweet.format');
	jsdump('buzzbird.retweet.format=' + f);
	var text = 'RT @' + desanitize(user) + ': ' + desanitize(raw);
	if (f == 'via') {
		text = desanitize(raw) + ' (via @' + desanitize(user) + ')';
	} 
	getMainWindow().arguments[0].out = {'action':'retweet', 'tweetId':id, 'user':user, 'text':text};
	getMainWindow().document.getElementById('onetweet-dialog').acceptDialog();
}
 
// Favorite
//
function favorite(id) {
	BzTwitter.favorite({
		username: getUsername(),
		password: getPassword(),
		updateId: id,
		onSuccess: favoriteCallback,
		onError: function(status) {
			jsdump('Error favoriting, HTTP status ' + status)
			var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
			                        .getService(Components.interfaces.nsIPromptService);
			prompts.alert(window, "Sorry.", "There was an error favoriting.");
		}
	});
}

// Favorite callback
//
function favoriteCallback(transport) {
	var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
	                        .getService(Components.interfaces.nsIPromptService);
	prompts.alert(window, "Sweet...", "Favorited!");
}
