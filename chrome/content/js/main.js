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
var username = "";
var password = "";
var mostRecentTweet = null;
var mostRecentDirect = null;
var parser = new DOMParser();

var classes = {
	"tweet" : {
		message: "tweetMessage",
		bottomRow: "tweetBottomRow",
		box: "tweetBox",
		text: "tweetText",
		table: "tweetTable",
		avatar: "tweetAvatar",
		avatarColumn: "tweetAvatarColumn",
		textColumn: "tweetTextColumn",
		screenName: "tweetScreenName",
		content: "tweetContent",
		info: "tweetInfo",
		icon: "tweetIcon"
	},
	"mine" : {
		message: "mineMessage",
		bottomRow: "mineBottomRow",
		box: "mineBox",
		text: "mineText",
		table: "mineTable",
		avatar: "mineAvatar",
		avatarColumn: "mineAvatarColumn",
		textColumn: "mineTextColumn",
		screenName: "mineScreenName",
		content: "mineContent",
		info: "mineInfo",
		icon: "mineIcon"
	},
	"reply" : {
		message: "replyMessage",
		bottomRow: "replyBottomRow",
		box: "replyBox",
		text: "replyText",
		table: "replyTable",
		avatar: "replyAvatar",
		avatarColumn: "replyAvatarColumn",
		textColumn: "replyTextColumn",
		screenName: "replyScreenName",
		content: "replyContent",
		info: "replyInfo",
		icon: "replyIcon"
	},
	"direct-to" : {
		message: "directToMessage",
		bottomRow: "directToBottomRow",
		box: "directToBox",
		text: "directToText",
		table: "directToTable",
		avatar: "directToAvatar",
		avatarColumn: "directToAvatarColumn",
		textColumn: "directToTextColumn",
		screenName: "directToScreenName",
		content: "directToContent",
		info: "directToInfo",
		icon: "directToIcon"
	},
	"direct-from" : {
		message: "directFromMessage",
		bottomRow: "directFromBottomRow",
		box: "directFromBox",
		text: "directFromText",
		table: "directFromTable",
		avatar: "directFromAvatar",
		avatarColumn: "directFromAvatarColumn",
		textColumn: "directFromTextColumn",
		screenName: "directFromScreenName",
		content: "directFromContent",
		info: "directFromInfo",
		icon: "directFromIcon"
	}
}

// Gets the login params and calls login to attempt authenticating
// with the twitter API.  Calls start() if successful.
//
function authenticate(u, p, save) {
	message("Authenticating");
	$('loginThrobber').style.display = 'inline';
	$('username').disabled = true;
	$('password').disabled = true;
	$('loginOkButton').disabled = true;
	
	username = u;
	password = p;
	
	if (login()) {
		getChromeElement('usernameLabelId').value = username;
		getChromeElement('passwordLabelId').value = password;
		registerEvents();
		if (save) {
			saveCredentials(username,password);
		}
		getBrowser().loadURI("chrome://buzzbird/content/main.html",null,"UTF-8");
	} else {
		message("");
		$('badAuth').style.display = 'inline';
		$('loginThrobber').style.display = 'none';
		$('username').disabled = false;
		$('password').disabled = false;
		$('loginOkButton').disabled = false;
		//$('password').select(); // this not working as well as I had hoped.  :(
		$('password').focus(); 
	}
}

// Save these credentials as the new default if it does not already exist.
//
function saveCredentials(username,password) {
   var myLoginManager = Components.classes["@mozilla.org/login-manager;1"]
		                         .getService(Components.interfaces.nsILoginManager);
   var nsLoginInfo = new Components.Constructor("@mozilla.org/login-manager/loginInfo;1",
	                                             Components.interfaces.nsILoginInfo,
	                                             "init");
   var loginInfo = new nsLoginInfo('localhost', 'localhost', null, username, password,
	                                'username', 'password');
   myLoginManager.addLogin(loginInfo);
}

// This function does the actual authentication request to the twitter API.  Called
// by the login function.
//
function login() {
	var req = new XMLHttpRequest();
	req.mozBackgroundRequest = true;
	req.open('GET','http://twitter.com/account/verify_credentials.json',false,username,password);
	req.send(null);
	
	var re = /\{"request":NULL.*?/
	if (re.match(req.responseText)) {
		jsdump ("Badness in twitter response.  Perhaps down for maintenance?");
		jsdump(req.responseText);
		return false;
	}
	
	if (req.status == 200 && req.responseText != 'NULL') {
		var user = '';
		try {
			user = eval('(' + req.responseText + ')');
		} catch(e) {
			jsdump('Caught an exception trying to login.');
			return false;
		}
		if (user == '') {
			jsdump('JSON parse must have borked?');
			return false;
		}
		var img = user.profile_image_url;
		getChromeElement('avatarLabelId').value = img;
		getChromeElement('realnameLabelId').value = user.name;
		return true;
	} else {
		return false;
	}
}

// Registers the events for this window
//
function registerEvents() {
	jsdump('register events')
	try {
		getMainWindow().document.addEventListener("fetchAll", fetchAll, false); 
		getMainWindow().document.addEventListener("fetch", fetch, false); 
		getMainWindow().document.addEventListener("start", start, false); 
		getMainWindow().document.addEventListener("openSpeech", getMainWindow().openSpeech, false); 
		getMainWindow().document.addEventListener("closeSpeech", getMainWindow().closeSpeech, false); 
		getMainWindow().document.addEventListener("updateTweetLength", getMainWindow().updateLengthDisplay, false); 
	} catch(e) {
		jsdump('Problem initializing events: ' + e);
	}
}

// Enables/disables the refresh button.
//
function refreshAllowed(allowed) {
	if (allowed) {
		getChromeElement('refreshButtonId').disabled=false;
		getChromeElement('refreshButtonId').image='chrome://buzzbird/content/images/reload-button-active-20x20.png';		
	} else {
		getChromeElement('refreshButtonId').disabled=true;
		getChromeElement('refreshButtonId').image='chrome://buzzbird/content/images/reload-button-disabled-20x20.png';				
	}
}

// Writes a message to the statusbar.
//
function message(text) {
	getChromeElement('statusid').value = text;	
}

// Writes the length of the tweet entry field to the statusbar.
//
function updateLengthDisplay() {
	var textbox = getChromeElement('textboxid');
	var length = textbox.value.length;
	var status = getChromeElement('statusid');
	if (length != 0) {
		status.value = length + '/140';
	} else {
		status.value = '';
	}
	
	if (length>140) {
		textbox.style.color = '#D00';
		status.style.color = '#F00'
	} else {
		textbox.style.color = '#000';
		status.style.color = '#000'
	}
}

// Toggles the progress meter.
//
function progress(throbbing) {
	var mainWindow = getMainWindow();
//	if (throbbing) {
//		getChromeElement('avatarId').src = 'chrome://buzzbird/content/images/ajax-loader.gif';
//	} else {
//		getChromeElement('avatarId').src = getChromeElement('avatarLabelId').value;
//	}
}

// Returns 'tweet','reply','direct', or 'mine'
//
function tweetType(tweet) {
	var re = new RegExp(".*?@" + getUsername() + ".*?");
	var result = 'tweet'
	if (tweet.text.substring(0,11) == "Directly to") {
		result = 'direct-to';
	} else if (tweet.sender != undefined) {
		result = 'direct-from';
	} else if (tweet.in_reply_to_screen_name == getUsername() || re.test(tweet.text)) {
		result = 'reply';
	} else if (tweet.user.screen_name == getUsername()) {
		result = 'mine';
	}
	return result;
}

// Update timestamp
//
function updateTimestamps() {
	var ONE_SECOND = 1000;
	var ONE_MINUTE = 60 * ONE_SECOND;
	var ONE_HOUR = 60 * ONE_MINUTE;
	var ONE_DAY = 24 * ONE_HOUR;
	
	jsdump('updating timestamps.');
	var timestamps = getBrowser().contentDocument.getElementsByName('timestamp');
	var now = new Date();
	for (var i=0; i<timestamps.length; i++) {
		tweetid = timestamps[i].id;
		when = getBrowser().contentDocument.getElementById(tweetid).innerHTML;
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
		el = getBrowser().contentDocument.getElementById(elid)
		if (el) {
		  el.innerHTML = prettyWhen;
		}
	}
	jsdump('finished updating timestamps.');

	// do it again a minute from now.
	//setTimeout(updateTimestamps(),ONE_MINUTE);
}

// Formats a tweet for display.
//
function formatTweet(tweet) {
	// Clean any junk out of the text.
	text = sanitize(tweet.text);
	
	// First, go through and replace links with real links.
	var re = new RegExp("http://(\\S*)", "g");
	var text = text.replace(re, "<a onmouseover=\"this.style.cursor='pointer';\" onclick=\"linkTo('http://$1');\">http://$1</a>");
	
	// Next, replace the twitter handles
	re = new RegExp("@(\\w*)", "g");
	text = text.replace(re, "@<a onmouseover=\"this.style.cursor='pointer';\" onclick=\"linkTo('http://twitter.com/$1');\">$1</a>");
	
	// Finally, replace the hashtags
	re = new RegExp("#(\\w*)", "g");
	text = text.replace(re, "#<a onmouseover=\"this.style.cursor='pointer';\" onclick=\"linkTo('http://hashtags.org/tag/$1');\">$1</a>");
	
	var when = new Date(tweet.created_at);
	var prettyWhen = when.toLocaleTimeString() + ' on ' + when.toLocaleDateString().substring(0,5);
	var user;
	if (tweetType(tweet) == 'direct-from') {
		user = tweet.sender;
	} else {
		user = tweet.user;
	}
	
	c = classes[tweetType(tweet)];

	// Figure out if we're displaying this flavor of tweet
	var currentFilter = getChromeElement('filterbuttonid').label;
	var showingAllTweets = getChromeElement('showingAllTweetsId').value;
	var showingReplies = getChromeElement('showingRepliesId').value;
	var showingDirect = getChromeElement('showingDirectId').value;
	
	var display = 'none';
	if (  (currentFilter == showingAllTweets) ||
          ((currentFilter == showingDirect) && (tweetType(tweet) == 'direct')) ||
          ((currentFilter == showingReplies && (tweetType(tweet) == 'reply')) ) ) {
	  display = 'inline';
    }
	
	var via = ""
	if (tweet.source != undefined && tweet.source != null && tweet.source != "") {
		via = " via " + tweet.source;
	} 

	var result = 
	   "<div id=\"raw-" + tweet.id + "\" style=\"display:none;\">" + sanitize(tweet.text) + "</div>"
     + "<div id=\"screenname-" + tweet.id + "\" style=\"display:none;\">" + sanitize(user.screen_name) + "</div>"
	 + "<div id=\"timestamp-" + tweet.id + "\" name=\"timestamp\" style=\"display:none;\">" + new Date(tweet.created_at).getTime() + "</div>"
     + "<div id=\"tweet-" + tweet.id + "\" class=\"tweetBox\" name=\"" + tweetType(tweet) + "\" style=\"display:" + display + "\" onmouseover=\"showIcons("+ tweet.id + ")\" onmouseout=\"showInfo(" + tweet.id + ")\">"
	 + " <div class=\"" + c.message + "\">"
	 + "  <table class=\"" + c.table + "\">"
	 + "   <tr>"
	 + "    <td valign=\"top\" class=\"" + c.avatarColumn + "\">"
	 + "     <a onmouseover=\"this.style.cursor='pointer';\" onclick=\"linkTo('http://twitter.com/" + sanitize(user.screen_name) + "');\" style=\"margin:0px;padding:0px\" title=\"View " + sanitize(user.screen_name) + "'s profile\">"
	 + "      <img src=\"" + user.profile_image_url + "\" class=\"" + c.avatar +"\" />"
     + "     </a>"
     + "    </td>"
     + "    <td>"
	 + "     <div class=\"" + c.text + "\">"
	 + "      <p><span class=\"" + c.screenName + "\">" + sanitize(user.screen_name) + "</span> <span class=\"" + c.content + "\">" + text + "</span></p>"
     + "     </div>"
     + "    </td>"
     + "   </tr>"
     + "  </table>"
     + "  <div class=\"" + c.bottomRow + "\">"
     + "   <img name=\"mark\" id=\"mark-" + tweet.id + "\" src=\"chrome://buzzbird/content/images/star-yellow.png\" style=\"width:16px; height:16px;\""
     + "        onclick=\"toggleMarkAsRead(" + tweet.id + ");\" onmouseover=\"this.style.cursor='pointer';\" />"
     + "   <span id=\"tweetInfo-" + tweet.id + "\">"
     + "    <span class=\"" + c.info + "\">" 
     +       sanitize(user.name) + " <span id=\"prettytime-" + tweet.id + "\">less than 1m ago</span>"
     + "    </span>"
     + "   </span>"
     + "   <span id=\"tweetIcons-" + tweet.id + "\" style=\"display:none;\">"	        
     + "    <a class=\"" + c.info + "\" title=\"Retweet This\" onclick=\"retweet(" + tweet.id + ");\"><img src=\"chrome://buzzbird/content/images/recycle-grey-16x16.png\" class=\"" + c.icon + "\" /></a>"
     + "    <a class=\"" + c.info + "\" title=\"Reply to " + sanitize(user.screen_name) + "\" onclick=\"replyTo(" + tweet.id + ");\"><img src=\"chrome://buzzbird/content/images/reply-grey-16x16.png\" class=\"" + c.icon + "\" /></a>"
     + "    <a class=\"" + c.info + "\" title=\"Send a Direct Message to " + user.screen_name + "\" onclick=\"sendDirect(" + tweet.id + ");\"><img src=\"chrome://buzzbird/content/images/phone-grey-16x16.png\" class=\"" + c.icon + "\" /></a>"
     + "    <a class=\"" + c.info + "\" title=\"Mark as Favorite\" onclick=\"favorite(" + tweet.id + ");\"><img src=\"chrome://buzzbird/content/images/heart-grey-16x16.png\" class=\"" + c.icon + "\" /></a>"
     + "    <a class=\"" + c.info + "\" title=\"Stop following" + sanitize(user.screen_name) + "\" onclick=\"stopFollowingTweeter(" + tweet.id + ");\"><img src=\"chrome://buzzbird/content/images/stop-grey-16x16.png\" class=\"" + c.icon + "\" /></a>"
	 + "   </span>"
     + "  </div>"
     + " </div>"
     + "</div>"
     + "\n";

	//jsdump('tweet(' + tweet.id +'): ' + result);
	return result;
}

// Writes to the top of the page.
//
function insertAtTop(newText) {
	var doc = parser.parseFromString('<div xmlns="http://www.w3.org/1999/xhtml">' + newText + '</div>', 'application/xhtml+xml');
	if (doc.documentElement.nodeName != "parsererror" ) {
		var root = doc.documentElement;
		for (var j=0; j<root.childNodes.length; ++j) {
			window.content.document.body.insertBefore(document.importNode(root.childNodes[j], true),window.content.document.body.firstChild);
		}
	} else {
		message('An error was encountered while parsing tweets.');
//		alert('An error was encountered while parsing tweets.');
	}	
}

// Iterates over newly fetched tweets to add them to the browser window.
//
function renderNewTweets(url,newTweets) {
	jsdump('renderNewTweets, length: ' +newTweets.length+ ', for ' + url);
	if (newTweets.length == 0) {
		jsdump('renderNewTweets: Nothing to do, skipping.');
	} else {
		var newText = '';
		for (var i=0; i<newTweets.length; i++) {
			if (url.match('friends_timeline') && (mostRecentTweet == null || mostRecentTweet < newTweets[i].id)) {
				mostRecentTweet = newTweets[i].id;
				jsdump('mostRecentTweet:' + mostRecentTweet);
			} else if (url.match('direct_messages') && (mostRecentDirect == null || mostRecentDirect < newTweets[i].id)) {
				mostRecentDirect = newTweets[i].id;
				jsdump('mostRecentDirect:' + mostRecentDirect);
			}
			var chk = window.content.document.getElementById('tweet-'+newTweets[i].id);
			if (chk == null) {
				newText = formatTweet(newTweets[i]) + newText;
			}
		}
		insertAtTop(newText);
	}
}

// THE BIG CHEESE.
//
function fetchUrlCallback(transport,url,destinations) {
	jsdump('fetched ===> ' + url);
    var response = eval('(' + transport.responseText + ')');
	jsdump('url:' + url);
	renderNewTweets(url,response);
	fetchUrl(destinations);
}
function fetchFailureCallback(transport) {
 	progress(false); 
	refreshAllowed(true); 
	jsdump('Something went wrong: ' + transport.status + ', ' + transport.responseText);	
	message('Error: ' + transport.status);
}
function fetchUrl(destinations) {
	message("Fetching tweets");
	refreshAllowed(false);
	progress(true);
	var url = destinations.shift();

	if (url == undefined) {
		//
		// All done fetching
		//
		var d = new Date();
		var mins = d.getMinutes()
		if (mins < 10) {
			mins = '0' + mins;
		}
		updateLengthDisplay();		
		refreshAllowed(true);
		progress(false);
		setTimeout("function proxy(that) {that.updateTimestamps()}; proxy(getMainWindow());",1000);
	} else {
		var since = url.match('friends_timeline') ? mostRecentTweet : mostRecentDirect;
		if ((url.match('friends_timeline') || url.match('direct_messages')) && since != null) {
			url = url + '?since_id=' + since;
		}
		jsdump('fetching ===>' + url);
		new Ajax.Request(url,
		  {
		    method:'get',
			httpUserName: getUsername(),
			httpPassword: getPassword(),
		    onSuccess: function(transport) { fetchUrlCallback(transport,url,destinations); },
		    onFailure: fetchFailureCallback
		  });	
	}
}

function fetchAll() {
	jsdump('in fetchAll');
	fetchUrl(['http://twitter.com/direct_messages.json','http://twitter.com/statuses/mentions.json','http://twitter.com/statuses/friends_timeline.json']);
}
function fetch() {
	var markAsReadNow = getBoolPref("buzzbird.auto.markread",false);
	if (markAsReadNow) {
		markAllAsRead();
	}
	
	// Don't think we need this check anymore, but I'm superstitious...
	if(typeof fetchUrl === 'function') {
		fetchUrl(['http://twitter.com/statuses/friends_timeline.json','http://twitter.com/direct_messages.json']);
	}
}

// This function is called from the UI to request a tweet fetch.
// We need to reset the update timer when the user requests a 
// refresh to prevent our tweets from happening too closely
// together.
//
function forceUpdate() {
	// This stuff doesn't seem to work... not sure why?  I was just trying to cancel
	// a pending update and push it out to updateinterval seconds from now...
	//
	// var timer = getUpdateTimer();
	// jsdump('clearing timer #' + timer);
	// window.clearInterval(timer);
	// timer = window.setInterval(fetch,getIntPref('buzzbird.update.interval',180000));
	// jsdump('setting timer #' + timer);
	// getChromeElement('updateTimerId').value = timer;
	jsdump('forceUpdate called.');
	fetch();
}

// Called on succesful tweet postation
//
function postTweetCallback(tweetText) {
	var textbox = getChromeElement('textboxid');
	textbox.reset();
	textbox.disabled = false;
	getChromeElement('statusid').label = updateLengthDisplay();
	if (tweetText.match(/^d(\s){1}(\w+?)(\s+)(\w+)/)) {
		// It was a DM, need to display it manually.
		var tweet = {
			id : 0,
			text : "",
			created_at : new Date(),
			sender : "",
			user : {
			   	screen_name : "",
				profile_image_url : "",
				name : ""
			},
			source : ""
		};
		tweet.text = "Directly to " + tweetText.substring(2);
		tweet.sender = getUsername();
		tweet.user.screen_name = getUsername();
		tweet.user.profile_image_url = getChromeElement("avatarLabelId").value;
		tweet.user.name = getChromeElement("realnameLabelId").value;
		tweet.in_reply_to_screen_name = "";
		tweet.sender = undefined;
		insertAtTop(formatTweet(tweet));
	}
	forceUpdate();
}

// Posts a twitter update.
//
function postTweet() {
	var tweet = getChromeElement('textboxid').value;
	url = 'http://twitter.com/statuses/update.json';
	url = url + '?status=' + encodeURIComponent(tweet);
	new Ajax.Request(url,
		{
			method:'post',
			parameters:'source=buzzbird',
			httpUserName: getUsername(),
			httpPassword: getPassword(),
		    onSuccess: function() { postTweetCallback(tweet); },
		    onFailure: function() { alert('Error posting status update.'); postTweetCallback(); }
		});
}

// Runs on each key press in the tweet-authoring text area.
//
function keyPressed(e) {
	var textbox = getChromeElement('textboxid');
	if (e.which == 13) {
		textbox.disabled = true;
		postTweet();
	}
}

// Runs on each key up in the tweet-authoring text ara.
//
function keyUp(e) {
	updateLengthDisplay();
}

// Filter tweet types.
//
function showAllTweets() {
	// showOrHide('tweet','inline');
	// showOrHide('mine','inline');
	// showOrHide('direct-to','inline');
	// showOrHide('direct-from','inline');
	// showOrHide('reply','inline');	
	var elements = getBrowser().contentDocument.getElementsByClassName('tweetBox');
	for (i=elements.length-1; i>=0; i--) {
		element = elements[i];
		element.style.display = 'inline';
	}
	getChromeElement('filterbuttonid').label=getChromeElement('showingAllTweetsId').value;;
}
function showResponses() {
	showOrHide('tweet','none');
	showOrHide('mine','none');
	showOrHide('direct-to','none');
	showOrHide('direct-from','none');
	showOrHide('reply','inline');	
	getChromeElement('filterbuttonid').label=getChromeElement('showingRepliesId').value;
}
function showDirect() {
	showOrHide('tweet','none');
	showOrHide('mine','none');
	showOrHide('direct-to','inline');
	showOrHide('direct-from','inline');
	showOrHide('reply','none');	
	getChromeElement('filterbuttonid').label=getChromeElement('showingDirectId').value;;
}
function showOrHide(tweetType,display) {
	var elements = getBrowser().contentDocument.getElementsByName(tweetType);
	for (i=elements.length-1; i>=0; i--) {
		element = elements[i];
		element.style.display = display;
	}
}

// Marks all as read.
//
function markAllAsRead() {
	var xx = getBrowser().contentDocument.getElementsByName('mark');
	var len = xx.length;
	for (var i=0; i<len; i++) {
		x = xx[i];
		x.src='chrome://buzzbird/content/images/checkmark-gray.png'; 
	}	
}

// Deletes all the previously marked-as-read tweets.  This is astoundingly inefficient.
//
function deleteAllRead() {
	var xx = getBrowser().contentDocument.getElementsByName('mark');
	var len = xx.length
	while (len--) {
		x = xx[len];
		// Yes, this is a hack, too.
		if (x.src == 'chrome://buzzbird/content/images/checkmark-gray.png') {
			id = x.id.substring(x.id.indexOf('-')+1);
			//jsdump( 'x.id ' + x.id + ' became ' + id);
			removeTweetFromDom(id);
		}
	}
}

function removeTweetFromDom(id) {
	//jsdump('delete ' + id);
	el = getBrowser().contentDocument.getElementById('tweet-' + id);
	if (el) {
		el.parentNode.removeChild(el); 
	} else {
		jsdump('Could not find element with id tweet-' + id);
	}
}

function speech(val) {
	getChromeElement('textboxid').collapsed=val;		
	getChromeElement('shortenUrlId').collapsed=val;		
	getChromeElement('symbolButtonId').collapsed=val;		
	if (val) {
		getChromeElement('openSpeechId').image = 'chrome://buzzbird/content/images/speech-button-active-20x20.png';	
	} else {
		getChromeElement('openSpeechId').image = 'chrome://buzzbird/content/images/speech-button-pressed-20x20.png';	

	}
}

function toggleSpeech() {
	var collapsed = getChromeElement('textboxid').collapsed;
	if (collapsed) {
		speech(false);
	} else {
		speech(true);
	}
}

function openSpeech() {
	jsdump('openSpeech called');
	speech(false);
}

function closeSpeech() {
	speech(true);
}
function shortenUrl() {
	var params = {};
	window.openDialog("chrome://buzzbird/content/shorten.xul", "",
	    "chrome, dialog, modal, resizable=no",params).focus();
	if (params.out) {
		var url2shorten = params.out.urlid;
		url = 'http://is.gd/api.php?longurl=' + url2shorten;
		new Ajax.Request(url,
			{
				method:'post',
			    onSuccess: shortenCallback,
			    onFailure: function() { alert('Error shortening the URL.'); }
			});
	}
}
function shortenCallback(transport) {
	var shortenedUrl = transport.responseText;
	appendText(shortenedUrl);
}

function onShortenOk() {
	window.arguments[0].out = {urlid:document.getElementById("urlid").value};
	return true;
}

function onShortenCancel() {
	return true;
}

function openAboutDialog() {
	var params = {};
	window.openDialog("chrome://buzzbird/content/about.xul", "",
	    "chrome, dialog, resizable=no",params).focus();
}

function zoomBigger() {
	var docViewer = getBrowser().markupDocumentViewer;
	docViewer.fullZoom = docViewer.fullZoom * 1.25;
	setIntPref("buzzbird.zoom", docViewer.fullZoom * 100);
}

function zoomSmaller() {
	var docViewer = getBrowser().markupDocumentViewer;
	docViewer.fullZoom = docViewer.fullZoom * 0.8;	
	setIntPref("buzzbird.zoom", docViewer.fullZoom * 100);
}

function zoomReset() {
	var docViewer = getBrowser().markupDocumentViewer;
	docViewer.fullZoom = 1.0;
	setIntPref("buzzbird.zoom", 100);
}

function appendText(symbol) {
	var t = getChromeElement('textboxid').value;
	t = t + symbol;
	var len = t.length;
	getChromeElement('textboxid').value = t;
	getChromeElement('statusid').label = len + '/140';
}


function quitApplication(aForceQuit) {
  var appStartup = Components.classes['@mozilla.org/toolkit/app-startup;1'].getService(Components.interfaces.nsIAppStartup);

  // eAttemptQuit will try to close each XUL window, but the XUL window can cancel the quit
  // process if there is unsaved data. eForceQuit will quit no matter what.
  var quitSeverity = aForceQuit ? Components.interfaces.nsIAppStartup.eForceQuit :
                                  Components.interfaces.nsIAppStartup.eAttemptQuit;
  appStartup.quit(quitSeverity);
}

function openPreferences() {
  var instantApply = getBoolPref("browser.preferences.instantApply", false);
  jsdump("instantApply is " + instantApply);
  var features = "chrome,titlebar,toolbar,centerscreen" + (instantApply ? ",dialog=no" : ",modal");

	//var features = "chrome,titlebar,toolbar,centerscreen,modal";
	window.openDialog("chrome://buzzbird/content/prefs.xul", "", features);
}

// Called to initialize the main window from the browser's onload method.
//
function start() {
	// Update Frequency, need to make this configurable.
	var interval = getIntPref('buzzbird.update.interval',180000);
	jsdump('interval=' + interval);
	showingAllTweets = getChromeElement('showingAllTweetsId').value;
	showingReplies = getChromeElement('showingRepliesId').value;
	showingDirect = getChromeElement('showingDirectId').value;
	var updateTimer = getMainWindow().setInterval( function(that) { that.fetch(); }, interval, getMainWindow());
	getChromeElement('updateTimerId').value = updateTimer;
	getChromeElement('toolbarid').collapsed=false;
	getChromeElement('refreshButtonId').collapsed=false;
	getChromeElement('markAllAsReadId').collapsed=false;
	getChromeElement('openSpeechId').collapsed=false;
	var zoom = getIntPref("buzzbird.zoom",100);
	var docViewer = getBrowser().markupDocumentViewer;
	docViewer.fullZoom = zoom/100.0;
	fetchAll();
}
