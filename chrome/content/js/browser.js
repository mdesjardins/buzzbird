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
	jsdump('1');
	var text = '@' + desanitize(user) + ' ';
	jsdump('2');
	getChromeElement('textboxid').value = text;
	jsdump('3');
	getChromeElement('statusid').label = text.length + "/140";
	jsdump('4');
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
	var text = 'RT @' + desanitize(user) + ': ' + desanitize(raw);
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
		    onFailure: function() { alert('Failed to favorite that tweet.  Sorry!'); }
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
	var result = prompts.confirm(window, "Title", 'Do you want to stop following ' + user + '?');
	if (result) {
		jsdump('Unfollowing ' + user);
		url = 'http://twitter.com/friendships/destroy/' + user + '.json';
		new Ajax.Request(url,
			{
				method:'post',
				httpUserName: getUsername(),
				httpPassword: getPassword(),
			    onSuccess: function() { stopFollowingTweeterCallback; },
			    onFailure: function() { alert('Failed to unfollow.  Sorry!'); }
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



// Adds stuff to the end of the textbox.
//
function appendText(symbol) {
	var t = getChromeElement('textboxid').value;
	t = t + symbol;
	var len = t.length;
	getChromeElement('textboxid').value = t;
	getChromeElement('statusid').label = len + '/140';
}
