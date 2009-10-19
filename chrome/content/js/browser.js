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
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHERWISE
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

// Displays one tweet in a separate dialog.
//
function viewOneTweet(tweetId) {
  var features = "chrome,titlebar,toolbar,centerscreen,modal";
  window.openDialog("chrome://buzzbird/content/onetweet.xul", "", features, tweetId, getUsername(), getPassword());	
}

// Displays one user in a separate dialog.
//
function showUser(userId) {
	jsdump('in showUser for userId ' + userId);
  var features = "chrome,titlebar,toolbar,centerscreen,modal";
  window.openDialog("chrome://buzzbird/content/user.xul", "", features, userId, getUsername(), getPassword());	
}


// Opens a link in the user's default browser.
//
function linkTo(href) {
	var ioservice = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
	var uriToOpen = ioservice.newURI(href, null, null);
	var extps = Components.classes["@mozilla.org/uriloader/external-protocol-service;1"].getService(Components.interfaces.nsIExternalProtocolService);
	extps.loadURI(uriToOpen, null);
}

// Shows the retweet/love/reply/direct icons for an individual tweet.
function showIcons(id) {
	$('tweetInfo-' + id).style.display = 'none';
	$('tweetIcons-' + id).style.display = 'inline';
}

// Same thing.  WTF?
function showInfo(id) {
	$('tweetInfo-' + id).style.display = 'inline';
	$('tweetIcons-' + id).style.display = 'none';
}

// Called onload of hte browser.  Dispatches up to the main window for now.
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

// Just dispatches for now.
//
function fetchAll() {
    jsdump('sending event up.');
	try {
        var ev = document.createEvent("Events");
        ev.initEvent("fetchAll", true, false);
        getMainWindow().document.dispatchEvent(ev);
    } catch (e) {
        jsdump("Exception sending fetchAll event: "+ e);
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

// Reply
//
function replyTo(id) {
	jsdump('replying to ' + id);
	var user = getBrowser().contentDocument.getElementById("screenname-" + id).innerHTML;
	var text = '@' + desanitize(user) + ' ';
	getChromeElement('textboxid').value = text;
	getChromeElement('statusid').label = text.length + "/140";
	getChromeElement('textboxid').focus();
	dispatch('openSpeech');
}

// Send DM
//
function sendDirect(id) {
	var raw = getBrowser().contentDocument.getElementById("raw-" + id).innerHTML;
	var user = getBrowser().contentDocument.getElementById("screenname-" + id).innerHTML;
	var text = 'd ' + desanitize(user) + ' ';
	getChromeElement('textboxid').value = text;
	getChromeElement('statusid').label = text.length + "/140";
	getChromeElement('textboxid').focus();	
	dispatch('openSpeech');
}

// Re-tweet
//
function retweet(id) {
	var raw = getBrowser().contentDocument.getElementById("raw-" + id).innerHTML;
	var user = getBrowser().contentDocument.getElementById("screenname-" + id).innerHTML;
	var f = getStringPref('buzzbird.retweet.format');
	jsdump('buzzbird.retweet.format=' + f);
	var text = 'RT @' + desanitize(user) + ': ' + desanitize(raw);
	if (f == 'via') {
		text = desanitize(raw) + ' (via @' + desanitize(user) + ')';
	} 
	text = text.substring(0,140);
	getChromeElement('textboxid').value = text;
	getChromeElement('textboxid').focus();		
	dispatch('openSpeech');
	dispatch('updateTweetLength');
}
 
// Favorite
//
function favorite(id) {
	url = 'http://twitter.com/favorites/create/' + id + '.json';
	new Ajax.Request(url,
		{
			method:'post',
			httpUserName: getUsername(),
			httpPassword: getPassword(),
		    onSuccess: function() { favoriteCallback; },
		    onFailure: function() { 
				var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
				                        .getService(Components.interfaces.nsIPromptService);
				prompts.alert(window, "Sorry.", "There was an error favoriting that tweet.");
			}
		});	
}

// Favorite callback
//
function favoriteCallback(transport) {
	getChromeElement('statusid').label = 'Tweet Favorited';
}

// Stop Following
//
function stopFollowingTweeter(id) {
	var user = getBrowser().contentDocument.getElementById('screenname-' + id).innerHTML;
	var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
	                        .getService(Components.interfaces.nsIPromptService);
	var result = prompts.confirm(window, "Confirm", 'Do you want to stop following ' + user + '?');
	if (result) {
		jsdump('Unfollowing ' + user);
		url = 'http://twitter.com/friendships/destroy/' + user + '.json';
		new Ajax.Request(url,
			{
				method:'post',
				httpUserName: getUsername(),
				httpPassword: getPassword(),
			    onSuccess: function() { stopFollowingTweeterCallback; },
			    onFailure: function() { 
					var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
					                        .getService(Components.interfaces.nsIPromptService);
					prompts.alert(window, "Sorry.", "There was an error processing your unfollow request.");
				}
			});	
	} else {
		jsdump('Aborted unfollow');
	}
}

// Favorite callback
//
function stopFollowingTweeterCallback(transport) {
	getChromeElement('statusid').label = 'Unfollowed';
}

// Marks/Unmarks one tweet.
//
function toggleMarkAsRead(id) {
	var mark = 'mark-' + id;
	var f = $(mark);
	if (f.src=='chrome://buzzbird/content/images/star-yellow.png') {
		f.src='chrome://buzzbird/content/images/checkmark-gray.png'; 
	} else {
		f.src='chrome://buzzbird/content/images/star-yellow.png'; 
	}
}

// Adds stuff to the end of the textbox.
//
function appendText(symbol) {
	var t = getChromeElement('textboxid').value;
	t = t + symbol;
	var len = t.length;
	getChromeElement('textboxid').value = t;
	getChromeElement('statusid').label = len + '/140';
}

// As the name implies... deletes a tweet.
//
function deleteTweetCallback(id) {
	jsdump('id='+id);
	var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
	                        .getService(Components.interfaces.nsIPromptService);
	prompts.alert(window, "Presto!", "Your tweet has been deleted.");
	var x = $('tweet-'+id);
	if (id != undefined && x != null) {
		jsdump('x='+x);
		x.style.display = 'none';

		// Why does this give me weird FF security exceptions?
		while (x.hasChildNodes()) {
			x.removeChild(x.lastChild);
		}
	}
}
function deleteTweet(id) {	
	var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
	                        .getService(Components.interfaces.nsIPromptService);
	var result = prompts.confirm(window, "Confirm", 'Do you want to delete this tweet?  There is no Undo!');
	if (result) {
		url = 'http://twitter.com/statuses/destroy/';
		url = url + id + '.json';
		new Ajax.Request(url,
			{
				method:'post',
				parameters:'source=buzzbird',
				httpUserName: getUsername(),
				httpPassword: getPassword(),
			    onSuccess: function() { deleteTweetCallback(id); },
			    onFailure: function() { 
					var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
					                        .getService(Components.interfaces.nsIPromptService);
					prompts.alert(window, "Sorry.", "There was an error deleting that status update.");
					deleteTweetCallback(); 
				}
			});
	}
}
