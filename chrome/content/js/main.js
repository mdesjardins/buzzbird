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
username = "";
password = "";
mostRecentTweet = null;
mostRecentDirect = null;
parser = new DOMParser();

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
		if (save) {
			saveCredentials(username,password);
		}
		var interval = getIntPref('buzzbird.update.interval',180000);
		jsdump('interval=' + interval);
		var updateTimer = getMainWindow().setInterval( function(that) { that.fetch(); }, interval, getMainWindow());
		getChromeElement('updateTimerId').value = updateTimer;
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
		getMainWindow().document.addEventListener("fetchWithRetweets", fetchWithRetweets, false); 
		getMainWindow().document.addEventListener("fetch", fetch, false); 
		getMainWindow().document.addEventListener("start", start, false); 
		getMainWindow().document.addEventListener("openSpeech", getMainWindow().openSpeech, false); 
		getMainWindow().document.addEventListener("closeSpeech", getMainWindow().closeSpeech, false); 
		getMainWindow().document.addEventListener("updateTweetLength", getMainWindow().updateLengthDisplay, false); 
		getMainWindow().document.addEventListener("updateLoginList", getMainWindow().updateLoginList, false);
		getMainWindow().document.addEventListener("countUnread", getMainWindow().countUnread, false);
	} catch(e) {
		jsdump('Problem initializing events: ' + e);
	}
}

// Enables/disables the refresh button.
//
function refreshAllowed(allowed) {
	if (allowed) {
		getChromeElement('refreshButtonId').disabled = false;
		getChromeElement('refreshButtonId').image = normalIcon('refresh');
	} else {
		getChromeElement('refreshButtonId').disabled = true;
		getChromeElement('refreshButtonId').image = disabledIcon('refresh');
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

// Iterates over newly fetched tweets to add them to the browser window.
//
function renderNewTweets(url,newTweets) {
	jsdump('renderNewTweets, length: ' +newTweets.length+ ', for ' + url);
	if (newTweets.length == 0) {
		jsdump('renderNewTweets: Nothing to do, skipping.');
	} else {
		// Save the scrollbar position so we can set it back when we're done.  This reduces the "jumpiness"
		// that happens if you're scrolling through old tweets when an update takes place.
		var x = getBrowser().contentWindow.scrollX;
		var y = getBrowser().contentWindow.scrollY;
		var max_y = getBrowser().contentWindow.scrollMaxY;

		var newText = '';
		for (var i=0; i<newTweets.length; i++) {
			if (url.match('home_timeline') && (mostRecentTweet == null || mostRecentTweet < newTweets[i].id)) {
				mostRecentTweet = newTweets[i].id;
				jsdump('mostRecentTweet:' + mostRecentTweet);
			} else if (url.match('direct_messages') && (mostRecentDirect == null || mostRecentDirect < newTweets[i].id)) {
				mostRecentDirect = newTweets[i].id;
				jsdump('mostRecentDirect:' + mostRecentDirect);
			}
			var chk = window.content.document.getElementById('tweet-'+newTweets[i].id);
			if (chk == null) {
				newText = formatTweet(newTweets[i],getUsername(),getPassword()) + newText;
			}
		}
		insertAtTop(newText);
		
		// Restore the scrollbar position.
		if (y!=0) {
			var new_max_y = getBrowser().contentWindow.scrollMaxY;
			var difference = new_max_y - max_y;
			getBrowser().contentWindow.scrollTo(x,y + difference);
		}
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
		countUnread();
		setTimeout("function proxy(that) {that.updateTimestamps()}; proxy(getMainWindow());",1000);
	} else {
		var since = (url.match('home_timeline') || url.match('retweeted_by_me')) ? mostRecentTweet : mostRecentDirect;
		if ((url.match('home_timeline') || url.match('retweeted_by_me') || url.match('direct_messages')) && since != null) {
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
	fetchUrl(['http://twitter.com/direct_messages.json','http://twitter.com/statuses/mentions.json','http://twitter.com/statuses/home_timeline.json?count=50']);
}
function fetch() {
	var markAsReadNow = getBoolPref("buzzbird.auto.markread",false);
	if (markAsReadNow) {
		markAllAsRead();
	}
	
	// Don't think we need this check anymore, but I'm superstitious...
	if(typeof fetchUrl === 'function') {
		fetchUrl(['http://twitter.com/statuses/home_timeline.json','http://twitter.com/direct_messages.json']);
	}
}
function fetchWithRetweets() {
	// Don't think we need this check anymore, but I'm superstitious...
	if(typeof fetchUrl === 'function') {
		fetchUrl(['http://twitter.com/statuses/home_timeline.json','http://twitter.com/direct_messages.json','http://twitter.com/statuses/retweeted_by_me.json']);
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
		insertAtTop(formatTweet(tweet,getUsername(),getPassword()));
	}
	forceUpdate();
}

// Posts a twitter update.
//
function postTweet() {
	var tweet = getChromeElement('textboxid').value;
	url = 'http://twitter.com/statuses/update.json';
	url = url + '?status=' + encodeURIComponent(tweet); 	
	var replyTweetId = getChromeElement('replyTweetId').value;
	var replyCheckHidden = getChromeElement('replycheckboxid').hidden;
	var replyChecked = getChromeElement('replycheckboxid').checked;	
	jsdump('replyTweetId=' + replyTweetId);
	jsdump('replyCheckHidden=' + replyCheckHidden);
	jsdump('replyChecked=' + replyChecked);
	if (!replyCheckHidden && replyChecked && replyTweetId > 0) {
		jsdump("Replying");
		url = url + "&in_reply_to_status_id=" + replyTweetId;
	}
	// Need to un-encode at signs or replies won't work.	
	url = url.replace(/%40/g, '@');
	jsdump("post url = " + url);
	new Ajax.Request(url,
		{
			method:'post',
			parameters:'source=buzzbird',
			httpUserName: getUsername(),
			httpPassword: getPassword(),
		    onSuccess: function() { 
				var textbox = getChromeElement('textboxid');
				textbox.reset();
				textbox.disabled = false;
				getChromeElement('statusid').label = updateLengthDisplay();
				getChromeElement('replyTweetId').value = "0";
				getChromeElement('replycheckboxid').hidden = true;
				getChromeElement('replycheckboxid').checked = false;		
				postTweetCallback(tweet); 
			},
		    onFailure: function() { 
				var textbox = getChromeElement('textboxid');
				textbox.disabled = false;
				var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
				                        .getService(Components.interfaces.nsIPromptService);
				prompts.alert(window, "Sorry.", "There was an error posting that status update.");
				postTweetCallback(); 
			}
		});
}

// Runs on each key press in the tweet-authoring text area.
//
function keyPressed(e) {
	if (e.which == 13) {
		var textbox = getChromeElement('textboxid');
		textbox.disabled = true;
		postTweet();
	}
}

// Runs on each key up in the tweet-authoring text ara.
//
function keyUp(e) {
	var content = getChromeElement('textboxid').value;
	if (content.length <= 0 || content.substring(0,1) != "@") {
		getChromeElement('replyTweetId').value = "0";
		getChromeElement('replycheckboxid').hidden = true;
		getChromeElement('replycheckboxid').checked = false;		
	}
	updateLengthDisplay();
}

// This one is written funkily because it could take a while, and
// we don't want to lock up the browser.  We might want to consider
// doing this to showOrHide as well.
//
function showAllTweets() {
	getChromeElement('filtermenupopupid').disabled=true;
	var elements = getBrowser().contentDocument.getElementsByClassName('tweetBox');
	var i = 0;
	function doWork() {
		if (elements[i].style.display != 'inline') {
			elements[i].style.display = 'inline';
		}
		i++;
		if (i < elements.length) {
			setTimeout(doWork, 1);
		} else {
			getChromeElement('filtermenupopupid').disabled=false;
		}
	}
	setTimeout(doWork,1);
	getChromeElement('filterbuttonid').label=getChromeElement('showingAllTweetsId').value;
	getChromeElement('filter-alltweets').setAttribute("checked","true");
	getChromeElement('filter-responses').setAttribute("checked","false");
	getChromeElement('filter-direct').setAttribute("checked","false");
}

function showResponses() {
	showOrHide('tweet','none');
	showOrHide('mine','none');
	showOrHide('direct-to','none');
	showOrHide('direct-from','none');
	showOrHide('reply','inline');	
	getChromeElement('filterbuttonid').label=getChromeElement('showingRepliesId').value;
	getChromeElement('filter-alltweets').setAttribute("checked","false");
	getChromeElement('filter-responses').setAttribute("checked","true");
	getChromeElement('filter-direct').setAttribute("checked","false");
}
function showDirect() {
	showOrHide('tweet','none');
	showOrHide('mine','none');
	showOrHide('direct-to','inline');
	showOrHide('direct-from','inline');
	showOrHide('reply','none');	
	getChromeElement('filterbuttonid').label=getChromeElement('showingDirectId').value;
	getChromeElement('filter-alltweets').setAttribute("checked","false");
	getChromeElement('filter-responses').setAttribute("checked","false");
	getChromeElement('filter-direct').setAttribute("checked","true");
	
}
function showOrHide(tweetType,disp) {
	getChromeElement('filtermenupopupid').disabled=true;
	// ugh, this didn't work as well as I had hoped...
	//
	// var elements = getBrowser().contentDocument.getElementsByName(tweetType);
	// if (elements != null && elements != undefined && elements.length > 0) {
	// 	var i = 0;
	// 	function doWork() {
	// 		var j = 25;
	// 		var len = elements.length;
	// 		while (i<len && j--) {
	// 			if (elements[i].style.display != disp) {
	// 				elements[i].style.display = disp;
	// 			}
	// 			i++;
	// 		}
	// 		if (i < len) {
	// 			setTimeout(doWork, 1);
	// 		}
	// 	}
	// 	setTimeout(doWork, 1);
	// }
	var elements = getBrowser().contentDocument.getElementsByName(tweetType);
	for (var i=elements.length-1; i>=0; i--) {
		element = elements[i];
		element.style.display = disp;
	}
	getChromeElement('filtermenupopupid').disabled=false;
}

// Counts unread tweets by category.
//
function countUnread() {
	var markers = getBrowser().contentDocument.getElementsByClassName('mark');
	var len = markers.length;
	var unread = {'tweet': 0, 'mentions': 0, 'directFrom': 0};
	if (len > 0) {
		jsdump('Counting.');
		var i = 0;
		function doWork() {
			if (markers !== undefined) {
				if (markers[i].src == 'chrome://buzzbird/skin/images/actions/unread.png') {
					unread.tweet = unread.tweet + 1;
					if (markers[i].name == "direct-from") {
						unread.directFrom++;
					} else if (markers[i].name == "reply") {
						unread.mentions++;
					}
				}
				i++;
				if (i < len) {
					setTimeout(doWork,5);
				} else {
					jsdump("Unread: " + unread.tweet + ", Unread mentions: " + unread.mentions + ", Unread direct: " + unread.directFrom);				
					updateWindowTitle(unread);
				}
			}
		}
		setTimeout(doWork,5);
	} else {
		jsdump('None unread?');
		updateWindowTitle(unread);
	}
}

function updateWindowTitle(unread) {
	var windowTitlePref = getStringPref('buzzbird.window.title','both');
	var windowTitle = "Buzzbird";
	if (windowTitlePref == 'all') {
		if (unread.tweet > 0) {
			windowTitle = windowTitle + " (" + unread.tweet + " unread)"
		}
	} else if (windowTitlePref == 'both') {
		if (unread.directFrom > 0 && unread.mentions > 0) {
			windowTitle = windowTitle + " (" + unread.directFrom + " unread direct, " + unread.mentions + " unread mentions)"
		} else if (unread.directFrom > 0 && unread.mentions == 0) {
			windowTitle = windowTitle + " (" + unread.directFrom + " unread direct)"
		} else if (unread.directFrom == 0 && unread.mentions > 0) {
			windowTitle = windowTitle + " (" + unread.mentions + " unread mentions)"
		}
	} else if (windowTitlePref == 'direct') {
		if (unread.directFrom > 0) {
			windowTitle = windowTitle + " (" + unread.directFrom + " unread direct)"
		}
	} 
	document.title = windowTitle;
	
}

// Marks all as read.
//
function markAllAsRead() {
	unread = {'tweet':0, 'mentions':0, 'directFrom':0};
	updateWindowTitle(unread);
	var markers = getBrowser().contentDocument.getElementsByClassName('mark');
	var ids = new Array();
	var len = markers.length;
	for (var i=0; i<len; i++) {
		markers[i].src='chrome://buzzbird/skin/images/actions/read.png'; 
		ids[i] = markers[i].id;
	}
	var len = ids.length;
	for (var i=0; i<len; i++) {
		getBrowser().contentDocument.getElementById(ids[i]).className='marked';
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
		if (x.src == 'chrome://buzzbird/skin/images/actions/checkmark-gray.png') {
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
	getChromeElement('speechheaderid').collapsed=val;		
	getChromeElement('shortenUrlId').collapsed=val;		
	getChromeElement('symbolButtonId').collapsed=val;
	var replyTweetId = getChromeElement('replyTweetId').value;
	jsdump('replyTweetId is ' + replyTweetId);
	if (replyTweetId > 0) {
		jsdump('Showing Reply Checkbox');
		getChromeElement('replycheckboxid').hidden = false;
		getChromeElement('replycheckboxid').checked = true;
	} else {
		jsdump('Hiding Reply Checkbox');
		getChromeElement('replycheckboxid').hidden = true;
		getChromeElement('replycheckboxid').checked = false;
	}
	if (val) {
		getChromeElement('openSpeechId').image = normalIcon('comment-add');
	} else {
		getChromeElement('openSpeechId').image = clickedIcon('comment-add');
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
	getChromeElement('textboxid').focus();	
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
			    onFailure: function() { 
					var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
					                        .getService(Components.interfaces.nsIPromptService);
					prompts.alert(window, "Sorry.", "There was an error shortning your URL.");
				}
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

function goToUser() {
	var params = {};
	window.openDialog("chrome://buzzbird/content/gotouser.xul", "",
	    "chrome, dialog, modal, resizable=no",params).focus();
	if (params.out) {
	  var features = "chrome,titlebar,toolbar,centerscreen,modal,scrollbars=yes";
	  if (params.out.handle.match(/^@.*?/)) {
		params.out.handle = params.out.handle.substring(1);
	  }
	  var params = {'userId':params.out.handle, 'username':getUsername(), 'password':getPassword()}
	  window.openDialog("chrome://buzzbird/content/user.xul", "", features, params);
	  if (params.out) {
		if (params.out.action == 'friend') {
			var features = "chrome,titlebar,toolbar,centerscreen,modal,scrollbars=yes";
			window.openDialog("chrome://buzzbird/content/friendship.xul", "", features, params.out);
		} else if (params.out.action == 'reply') {
			var text = '@' + desanitize(params.out.replyTo) + ' ';
			getChromeElement('textboxid').value = text;
			getChromeElement('statusid').label = text.length + "/140";
			getChromeElement('textboxid').focus();
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
		}
	  }		
	  
	}
}

function onGoToUserOk() {
	window.arguments[0].out = {handle:document.getElementById("handle").value};
	return true;
}

function onGoToUserCancel() {
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
	var caret = getChromeElement('textboxid').selectionStart;
	var t = getChromeElement('textboxid').value;
	jsdump('caret=' + caret);
	if (caret == null || caret == undefined) {
		getChromeElement('textboxid').value = t + symbol;
	} else {
		var pre = t.substring(0,caret);
		var post = t.substring(caret);
		var t = pre + symbol + post;
		getChromeElement('textboxid').value = t;
	}
	var len = getChromeElement('textboxid').value.length;
	getChromeElement('statusid').label = len + '/140';
}

function updateLoginList() {
	jsdump('updating the login list!');
	
	// Get Login Manager 
   var myLoginManager = Components.classes["@mozilla.org/login-manager;1"]
		                         .getService(Components.interfaces.nsILoginManager);

   var hostname = 'localhost';
   var formSubmitURL = 'localhost';  
   var httprealm = null;

   // Find users for the given parameters
   var logins = myLoginManager.findLogins({}, hostname, formSubmitURL, httprealm);
   
	var loginButton = getChromeElement('accountbuttonid');
	loginButton.label = logins[0].username;
	var loginMenu = getChromeElement('accountbuttonmenuid'); 
	while (loginMenu.hasChildNodes()) {
		loginMenu.removeChild(loginMenu.lastChild);
	}
	
	const XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
	for (var i=0; i<logins.length; i++) {
		var item = logins[i].username + '|' + logins[i].password + '|' + 'localhost' + '|' + 'localhost';
		var menuitem = document.createElementNS(XUL_NS, "menuitem");
		menuitem.setAttribute("label", logins[i].username);
		menuitem.setAttribute("value", item);
		var f = "switchUser('" + logins[i].username + "','" + logins[i].password + "');";
		menuitem.setAttribute("oncommand", f);
		menuitem.setAttribute("checked","false");
		menuitem.setAttribute("type","checkbox");
		menuitem.setAttribute("id","accountmenu-" + logins[i].username);
		menuitem.setAttribute("class","accountmenu-account");  
		getChromeElement('accountbuttonmenuid').appendChild(menuitem);
   }

	var separator = document.createElementNS(XUL_NS, "menuseparator")
	getChromeElement('accountbuttonmenuid').appendChild(separator);
	var menuitem = document.createElementNS(XUL_NS, "menuitem");
	menuitem.setAttribute("label", "Configure Accounts...");
	menuitem.setAttribute("value", "");
	menuitem.setAttribute("oncommand", "openAccountPreferences();");
	getChromeElement('accountbuttonmenuid').appendChild(menuitem);
}

function switchUser(u,p) {	
	var oldusername = getUsername();
	username = u;
	password = p;
	if (login()) {	
		var loginButton = getChromeElement('accountbuttonid');
		loginButton.label = username;
		setUsername(u);
		setPassword(p);
		if (oldusername != null && oldusername != undefined && oldusername != "") {
			getChromeElement('accountmenu-' + oldusername).setAttribute("checked","false");
		}
		getChromeElement('accountmenu-' + u).setAttribute("checked","true");
		mostRecentTweet = null;
		mostRecentDirect = null;
		getBrowser().loadURI("chrome://buzzbird/content/main.html",null,"UTF-8");
	} else {
		username = getUsername();
		password = getPassword();
	}
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
  countUnread();	
}

function openAccountPreferences() {
  var instantApply = getBoolPref("browser.preferences.instantApply", false);
  jsdump("instantApply is " + instantApply);
  var features = "chrome,titlebar,toolbar,centerscreen" + (instantApply ? ",dialog=no" : ",modal");

  //var features = "chrome,titlebar,toolbar,centerscreen,modal";
  window.openDialog("chrome://buzzbird/content/prefs.xul", "", features, "paneMultiAccounts");
}

// Allows the user to click the whole button instead of just the triangle.
//
function showFilterMenu() {
	var x = getChromeElement("filtermenupopupid");
	jsdump('state=' + x.state);
	if (x.state === 'closed') {
		x.showPopup();
	} else {
		x.hidePopup();
	}
}
function showAccountMenu() {
	var x = getChromeElement("accountbuttonmenuid");
	jsdump('state=' + x.state);
	if (x.state === 'closed') {
		x.showPopup();
	} else {
		x.hidePopup();
	}
}

// Called when the user scrolls the main browser window - we enable/disable autoscroll
// in here to prevent 'jumping' in a user is scrolling through old tweets when an 
// update occurs.
//
function browserScrolled(e) {	
	var y = getBrowser().contentWindow.scrollY;
	var a = getBrowser().getAttribute('autoscroll');
	if (y==0 && a!='true') {
		getBrowser().setAttribute('autoscroll',true);
		jsdump('autoscroll activated.');		
	} else if (y!=0 && a=='true'){
		getBrowser().setAttribute('autoscroll',false);
		jsdump('autoscroll deactivated.');
	}
}

// Sets the checkboxes correctly on the toolbar's context menu.
//
function onToolbarContextMenuOpen() {
	var icon = getBoolPref('buzzbird.toolbar.show-icons');
	var text = getBoolPref('buzzbird.toolbar.show-text');
	var small = getBoolPref('buzzbird.toolbar.small-size');

	getChromeElement('toolbar-context-menu-icon-and-text').setAttribute("checked","false");
	getChromeElement('toolbar-context-menu-icon-only').setAttribute('checked','false');
	getChromeElement('toolbar-context-menu-text-only').setAttribute('checked','false');

	if (icon && text) {
		getChromeElement('toolbar-context-menu-icon-and-text').setAttribute("checked","true");
	} else {
		if (icon) {
			getChromeElement('toolbar-context-menu-icon-only').setAttribute('checked','true');
		} else {
			getChromeElement('toolbar-context-menu-text-only').setAttribute('checked','true');
		}
	}
	if (small) {
		getChromeElement('toolbar-context-menu-use-small-size').setAttribute('checked','true');
	} else {
		getChromeElement('toolbar-context-menu-use-small-size').setAttribute('checked','false');
	}
	return true;
}

function toolbarMode(mode) {
	if (mode == 'icons-and-text') {
		setBoolPref('buzzbird.toolbar.show-icons',true);
		setBoolPref('buzzbird.toolbar.show-text',true);
	} else if (mode == 'icons-only') {
		setBoolPref('buzzbird.toolbar.show-icons',true);
		setBoolPref('buzzbird.toolbar.show-text',false);
	} else if (mode == 'text-only') {
		setBoolPref('buzzbird.toolbar.show-icons',false);
		setBoolPref('buzzbird.toolbar.show-text',true);
	}
	updateToolbar();
}

function toggleSmallIcons() {
	var small = getBoolPref('buzzbird.toolbar.small-size');
	if (small) {
		setBoolPref('buzzbird.toolbar.small-size',false);
	} else {
		setBoolPref('buzzbird.toolbar.small-size',true);		
	}
	updateToolbar();
}

function updateToolbar() {
	var icon = getBoolPref('buzzbird.toolbar.show-icons');
	var text = getBoolPref('buzzbird.toolbar.show-text');
	var small = getBoolPref('buzzbird.toolbar.small-size');
	
	var refreshButton = getChromeElement('refreshButtonId');
	var markAllAsReadButton = getChromeElement('markAllAsReadId');
	var openSpeechButton = getChromeElement('openSpeechId');
	var shortenUrlButton = getChromeElement('shortenUrlId');
	var emojiButton = getChromeElement('symbolButtonId');
	var imagePath = 'chrome://buzzbird/skin/images/buttons/';
	var fontSize = '11px';
	if (small) {
		imagePath += 'small/';
		fontSize = '10px';
	} else {
		imagePath += 'large/';
	}
	
	refreshButton.setAttribute('image',imagePath + 'refresh.png');
	refreshButton.style.fontSize = fontSize;
	markAllAsReadButton.setAttribute('image',imagePath + 'mark-all.png');
	markAllAsReadButton.style.fontSize = fontSize;
	openSpeechButton.setAttribute('image',imagePath + 'comment-add.png');
	openSpeechButton.style.fontSize = fontSize;
	
	var width = '60px';
	if (text) {
		if (small) {
			width = '55px';
		} else {
			width = '60px';
		}
	} else {
		if (small) {
			width = '30px';
		} else {
			width = '45px';
		}
	}
	refreshButton.style.width = width;
	markAllAsReadButton.style.width = width;
	openSpeechButton.style.width = width;
	
	if (text) {
		refreshButton.setAttribute('label','Refresh');
		markAllAsReadButton.setAttribute('label','Mark All');
		openSpeechButton.setAttribute('label','Post');
	} else {
		refreshButton.removeAttribute('label');
		markAllAsReadButton.removeAttribute('label');
		openSpeechButton.removeAttribute('label');
	}
	
	if (icon) {
		refreshButton.setAttribute('image',normalIcon('refresh'));
		markAllAsReadButton.setAttribute('image',normalIcon('mark-all'));
		openSpeechButton.setAttribute('image',normalIcon('comment-add'));
	} else {
		refreshButton.removeAttribute('image');
		markAllAsReadButton.removeAttribute('image');
		openSpeechButton.removeAttribute('image');
	}
}

function iconPath(name) {
	var small = getBoolPref('buzzbird.toolbar.small-size');
	var imagePath = 'chrome://buzzbird/skin/images/buttons/';
	if (small) {
		imagePath += 'small/';
	} else {
		imagePath += 'large/';
	}
	imagePath += name;
	return imagePath;
}

function clickedIcon(name) {
	var show = getBoolPref('buzzbird.toolbar.show-icons');
	return show ? iconPath(name) + "-clicked.png" : null;
}

function disabledIcon(name) {
	var show = getBoolPref('buzzbird.toolbar.show-icons');
	return show ? iconPath(name) + "-disabled.png" : null;
}

function normalIcon(name) {
	var show = getBoolPref('buzzbird.toolbar.show-icons');
	return show ? iconPath(name) + ".png" : null;
}

// Called to initialize the main window from the browser's onload method.
//
function start() {
	registerEvents();
	showingAllTweets = getChromeElement('showingAllTweetsId').value;
	showingReplies = getChromeElement('showingRepliesId').value;
	showingDirect = getChromeElement('showingDirectId').value;
	updateToolbar();
	getChromeElement('toolbarid').collapsed=false;
	getChromeElement('refreshButtonId').collapsed=false;
	getChromeElement('markAllAsReadId').collapsed=false;
	getChromeElement('openSpeechId').collapsed=false;
	var zoom = getIntPref("buzzbird.zoom",100);
	var docViewer = getBrowser().markupDocumentViewer;
	docViewer.fullZoom = zoom/100.0;
	fetchAll();
}

// Stuff for the debugger.
//
function toOpenWindowByType(inType, uri) {
  var winopts = "chrome,extrachrome,menubar,resizable,scrollbars,status,toolbar";
  window.open(uri, "_blank", winopts);
}
function showDebugger() {
	start_venkman();
}
