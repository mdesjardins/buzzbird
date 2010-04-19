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

function reopen(params) {
	jsdump('action:' + params.out.action);
	if (params.out.action == 'friend') {
		jsdump('userId=' + params.out.userId);
		//showUser(params.out.userId);
		var features = "chrome,titlebar,toolbar,centerscreen,modal,scrollbars=yes";
		window.openDialog("chrome://buzzbird/content/friendship.xul", "", features, params.out);
	} else if (params.out.action == 'reply') {
		var text = '@' + desanitize(params.out.replyTo) + ' ';
		getChromeElement('textboxid').value = text;
		getChromeElement('statusid').label = text.length + "/140";
		getChromeElement('textboxid').focus();
		getChromeElement('replyTweetId').value = params.out.tweetId;
		dispatch('openSpeech');
	} else if (params.out.action == 'directTo') {
		var text = 'd ' + desanitize(params.out.directTo) + ' ';
		getChromeElement('textboxid').value = text;
		getChromeElement('statusid').label = text.length + "/140";
		getChromeElement('textboxid').focus();	
		dispatch('openSpeech');
	} else if (params.out.action == 'retweet') {
		var text = params.out.text
		getChromeElement('textboxid').value = text;
		getChromeElement('textboxid').focus();		
		dispatch('openSpeech');
		dispatch('updateTweetLength');
	} else if (params.out.action == 'oneTweet') {
		viewOneTweet(params.out.tweetId);
	} else if (params.out.action == 'user') {
		showUser(params.out.userId);
	}
}

// Displays one tweet in a separate dialog.
//
function viewOneTweet(tweetId) {
  var features = "chrome,titlebar,toolbar,centerscreen,modal,scrollbars=yes";
  var params = {'tweetId':tweetId, 'username':getUsername(), 'password':getPassword()};
  window.openDialog("chrome://buzzbird/content/onetweet.xul", "", features, params);	
  if (params.out) {
	reopen(params);
  }
}

// Displays one user in a separate dialog.
//
function showUser(userId) {
  jsdump('in showUser for userId ' + userId);
  var features = "chrome,titlebar,toolbar,centerscreen,modal,scrollbars=yes";
  var params = {'userId':userId, 'username':getUsername(), 'password':getPassword()}
  window.openDialog("chrome://buzzbird/content/user.xul", "", features, params);
  if (params.out) {
	reopen(params);
  }		
}

// Shows the retweet/love/reply/direct icons for an individual tweet.
function showIcons(id) {
	document.getElementById('tweetInfo-' + id).style.display = 'none';
	document.getElementById('tweetIcons-' + id).style.display = 'inline';
}

// Same thing.  WTF?
function showInfo(id) {
	document.getElementById('tweetInfo-' + id).style.display = 'inline';
	document.getElementById('tweetIcons-' + id).style.display = 'none';
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

// Just dispatches for now.
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

// Reply
//
function replyTo(id) {
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
	var configMethod = getStringPref('buzzbird.retweet.method','Q');
	
	if (configMethod == 'Q') {
		var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
		                        .getService(Components.interfaces.nsIPromptService);
		var check = {value:false};
		var flags = prompts.BUTTON_TITLE_IS_STRING * prompts.BUTTON_POS_0 + 
		            prompts.BUTTON_TITLE_IS_STRING * prompts.BUTTON_POS_1;
		var button = prompts.confirmEx(window, "Retweet Method", "Which retweet method do you want to use?", flags, 
		             "Manual Edit", "Automatic", "Button 2", "Do this for all retweets", check);
		
		if (button == 0) {
			configMethod = 'M'
		} else {
			configMethod = 'A'
		}
		
		if (check.value == true) {
			setStringPref('buzzbird.retweet.method',configMethod);
		}
	}	

	var raw = getBrowser().contentDocument.getElementById("raw-" + id).innerHTML;
	var user = getBrowser().contentDocument.getElementById("screenname-" + id).innerHTML;
	var f = getStringPref('buzzbird.retweet.format');
	jsdump('buzzbird.retweet.format=' + f);
	var text = 'RT @' + desanitize(user) + ': ' + desanitize(raw);
	if (f == 'via') {
		text = desanitize(raw) + ' (via @' + desanitize(user) + ')';
	} 
	//text = text.substring(0,140);
	
	if (configMethod == 'A') {
		jsdump("Posting Echo (auto retweet)");
		Social.service(Ctx.service).postEcho({
			username: getUsername(),
			password: getPassword(),
			echoId: id,
			onSuccess: function() {
				var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
				                        .getService(Components.interfaces.nsIPromptService);
				prompts.alert(window, "Done!", "Retweet accomplished.");
				dispatch('cycleFetch');
			},
			onError: function(status) {
				jsdump('Error retweeting, HTTP status ' + status);
				var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
				                        .getService(Components.interfaces.nsIPromptService);
				prompts.alert(window, "Sorry.", "There was an error retweeting that tweet.");				
			}
		});		
	} else {
		getChromeElement('textboxid').value = text;
		getChromeElement('textboxid').focus();		
		dispatch('openSpeech');
		dispatch('updateTweetLength');
	}
}

// Favorite
//
function favorite(id) {
	Social.service(Ctx.service).favorite({
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

// Stop Following
//
function stopFollowingTweeter(id) {
	var user = getBrowser().contentDocument.getElementById('screenname-' + id).innerHTML;
	var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
	                        .getService(Components.interfaces.nsIPromptService);
	var result = prompts.confirm(window, "Confirm", 'Do you want to stop following ' + user + '?');
	if (result) {
		jsdump('Unfollowing ' + user);
		Social.service(Ctx.service).unfollow({
			username: getUsername(),
			password: getPassword(),
			screenName: user,
			onSuccess: stopFollowingTweeterCallback,
			onError: function(status) {
				jsdump('Error processing unfollow, HTTP status ' + status);
				var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
				                        .getService(Components.interfaces.nsIPromptService);
				prompts.alert(window, "Sorry.", "There was an error processing your unfollow request.");
			}			
		})
	} else {
		jsdump('Aborted unfollow');
	}
}

// Favorite callback
//
function stopFollowingTweeterCallback(transport) {
	var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
	                        .getService(Components.interfaces.nsIPromptService);
	prompts.alert(window, "Unfollowed", "You are no longer following this user.");
}

// Marks/Unmarks one tweet.
//
function toggleMarkAsRead(id) {
	var mark = 'mark-' + id;
	var f = document.getElementById(mark);
	if (f.src=='chrome://buzzbird/skin/images/actions/unread.png') {
		f.src='chrome://buzzbird/skin/images/actions/read.png'; 
		f.className='marked';
	} else {
		f.src='chrome://buzzbird/skin/images/actions/unread.png'; 
		f.className='mark';
	}
	dispatch('countUnread');
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
function deleteTweetCallback(id,transport) {
	jsdump('id='+id);
	var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
	                        .getService(Components.interfaces.nsIPromptService);
	prompts.alert(window, "Presto!", "Your tweet has been deleted.");
	var x = document.getElementById('tweet-'+id);
	if (id != undefined && x != null) {
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
		Social.service(Ctx.service).deletePost({
			username: getUsername(),
			password: getPassword(),
			deleteId: id,
			onSuccess: function(transport) { deleteTweetCallback(id,transport); },
			onError: function(status) {
				jsdump('Error processing delete, HTTP status ' + status);
				var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
				                        .getService(Components.interfaces.nsIPromptService);
				prompts.alert(window, "Sorry.", "There was an error deleting that status update.");
			}						
		});
	}
}
