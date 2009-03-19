
var username = "";
var password = "";
var mostRecentTweet = null;
var mostRecentDirect = null;
var parser = new DOMParser();

var bubbles = {
	"tweet" : {
		msg: "CBmsg",
		icon: "CBicon",
		txt: "CBtxt",
		content: "CBcontent",
		t: "CBt",
		b: "CBb"
	},
	"mine" : {
		msg: "IBmsg",
		icon: "IBicon",
		txt: "IBtxt",
		content: "IBcontent",
		t: "IBt",
		b: "IBb"
	},
	"reply" : {
		msg: "RBmsg",
		icon: "RBicon",
		txt: "RBtxt",
		content: "RBcontent",
		t: "RBt",
		b: "RBb"
	},
	"direct" : {
		msg: "DBmsg",
		icon: "DBicon",
		txt: "DBtxt",
		content: "DBcontent",
		t: "DBt",
		b: "DBb"
	}
};

// Gets the login params and calls login to attempt authenticating
// with the twitter API.  Calls start() if successful.
//
function authenticate() {
	message("Authenticating");
	$('loginThrobber').style.display = 'inline';
	$('username').disabled = true;
	$('password').disabled = true;
	$('loginOkButton').disabled = true;
	
	username = $('username').value;
	password = $('password').value;
	
	if (login()) {
		getChromeElement('usernameLabelId').value = username;
		getChromeElement('passwordLabelId').value = password;
		getBrowser().loadURI("chrome://buzzbird/content/main.html",null,"UTF-8");
	} else {
		message("");
		$('badAuth').style.display = 'inline';
		$('loginThrobber').style.display = 'none';
		$('username').disabled = false;
		$('password').disabled = false;
		$('loginOkButton').disabled = false;
		$('password').select(); // this not working as well as I had hoped.  :(
		$('password').focus(); 
	}
}

// This function does the actual authentication request to the twitter API.  Called
// by the login function.
//
function login() {
	var req = new XMLHttpRequest();
	req.mozBackgroundRequest = true;
	req.open('GET','http://twitter.com/account/verify_credentials.json',false,username,password);
	req.send(null);
	if (req.status == 200) {
		var user = eval('(' + req.responseText + ')');
		var img = user.profile_image_url;
		getChromeElement('avatarLabelId').value = img;
		getChromeElement('realnameLabelId').value = user.name;
		getChromeElement('avatarId').src = img;
		return true;
	} else {
		return false;
	}
}

// Utility method to return the window object.
//
function getMainWindow() {
	var mainWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
	                   .getInterface(Components.interfaces.nsIWebNavigation)
	                   .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
	                   .rootTreeItem
	                   .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
	                   .getInterface(Components.interfaces.nsIDOMWindow);
	return mainWindow;
}

// Utility method to return the main browser window.
//
function getBrowser() {
	return getMainWindow().document.getElementById('browserid');
}

// Utility method to return the specified UI element.
//
function getChromeElement(id) {
	return getMainWindow().document.getElementById(id);
}

// Returns the username from the UI.
//
function getUsername() {
	return getChromeElement('usernameLabelId').value;
}

// Returns the password from the UI.
//
function getPassword() {
	return getChromeElement('passwordLabelId').value;
}

// Returns the update timer ID from the UI.
//
function getUpdateTimer() {
	return getChromeElement('updateTimerId').value;
}

// Opens a link in the user's default browser.
//
function linkTo(href) {
	var ioservice = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
	var uriToOpen = ioservice.newURI(href, null, null);
	var extps = Components.classes["@mozilla.org/uriloader/external-protocol-service;1"].getService(Components.interfaces.nsIExternalProtocolService);
	extps.loadURI(uriToOpen, null);
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

// Toggles the progress meter.
//
function progress(throbbing) {
	var mainWindow = getMainWindow();
	if (throbbing) {
		getChromeElement('avatarId').src = 'chrome://buzzbird/content/images/ajax-loader.gif';
	} else {
		getChromeElement('avatarId').src = getChromeElement('avatarLabelId').value;
	}

}

// Returns 'tweet','reply','direct', or 'mine'
//
function tweetType(tweet) {
	var result = 'tweet'
	if (tweet.sender != undefined) {
		result = 'direct';
	} else if (tweet.in_reply_to_screen_name == getUsername()) {
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
		when = $(tweetid).innerHTML;
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
		$(elid).innerHTML = prettyWhen;
	}
	jsdump('finished updating timestamps.');

	// do it again a minute from now.
	//setTimeout(updateTimestamps(),ONE_MINUTE);
}

// Formats a tweet for display.
//
function formatTweet(tweet) {
	jsdump('formatTweet ' + tweet.id)
	
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
	if (tweetType(tweet) == 'direct') {
		user = tweet.sender;
	} else {
		user = tweet.user;
	}
	
	sb = bubbles[tweetType(tweet)];

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
	jsdump("via:" + via);
	
	var result = "<div id=\"tweet-" + tweet.id + "\" class=\"tweetbox\" name=\"" + tweetType(tweet) + "\" style=\"display:" + display + "\" onmouseover=\"showIcons("+ tweet.id + ")\" onmouseout=\"showInfo(" + tweet.id + ")\">"
	           + " <div class=\"" + sb.msg + "\">"
               + "  <div class=\"" + sb.icon + "\">"
               + "   <a onmouseover=\"this.style.cursor='pointer';\" onclick=\"linkTo('http://twitter.com/" + sanitize(user.screen_name) + "');\" style=\"margin:0px;padding:0px\" title=\"View " + sanitize(user.screen_name) + "'s profile\">"
               + "    <img src=\"" + user.profile_image_url + "\" class=\"avatar\" />"
               + "   </a>"
               + "  </div>"
	           + "  <div class=\"" + sb.txt + "\">"
	           + "   <div class=\"" + sb.content + "\">"
	           + "    <div class=\"" + sb.t + "\"></div>"
	           + "    <span class=\"screenname\">" + sanitize(user.screen_name) + "</span> <span class=\"tweet\">" + text + "</span>"
	           + "   </div>"
	           + "   <div class=\"" + sb.b + "\"><div></div></div>"
	           + "  </div>"
	           + " </div>"
	           + " <div id=\"raw-" + tweet.id + "\" style=\"display:none;\">" + sanitize(tweet.text) + "</div>"
			   + " <div id=\"screenname-" + tweet.id + "\" style=\"display:none;\">" + sanitize(user.screen_name) + "</div>"
			   + " <div id=\"timestamp-" + tweet.id + "\" name=\"timestamp\" style=\"display:none;\">" + new Date(tweet.created_at).getTime() + "</div>"
			   + " <br clear=\"all\" />"
	           + " <div style=\"width:100%;height:20px;\">"
	           + "  <img name=\"mark\""
	           + "       id=\"mark-" + tweet.id + "\""
	           + "       src=\"chrome://buzzbird/content/images/star-yellow.png\" "
	           + "       style=\"width:16px; height:16px; vertical-align:middle;\""
	           + "       onclick=\"toggleMarkAsRead(" + tweet.id + ");\""
	           + "       onmouseover=\"this.style.cursor='pointer';\" />"
	           + "  <span id=\"tweetInfo-" + tweet.id + "\">"
	           + "   <span class=\"tweetInfo\">" 
	           +      sanitize(user.name) + " <span id=\"prettytime-" + tweet.id + "\">less than 1m ago</span>"
//	           + "    <span class=\"via\">" + via + "</span>"
			   + "   </span>"
			   + "  </span>"
	           + "  <span id=\"tweetIcons-" + tweet.id + "\" style=\"display:none\">"	        
			   + "   <a class=\"tweetInfo\" title=\"Retweet This\" onclick=\"retweet(" + tweet.id + ");\"><img src=\"chrome://buzzbird/content/images/recycle-grey-16x16.png\" class=\"tweetIcon\" /></a>"
	           + "   <a class=\"tweetInfo\" title=\"Reply to " + sanitize(user.screen_name) + "\" onclick=\"replyTo(" + tweet.id + ");\"><img src=\"chrome://buzzbird/content/images/reply-grey-16x16.png\" class=\"tweetIcon\" /></a>"
	           + "   <a class=\"tweetInfo\" title=\"Send a Direct Message to " + user.screen_name + "\" onclick=\"sendDirect(" + tweet.id + ");\"><img src=\"chrome://buzzbird/content/images/phone-grey-16x16.png\" class=\"tweetIcon\" /></a>"
	           + "   <a class=\"tweetInfo\" title=\"Mark as Favorite\" onclick=\"favorite(" + tweet.id + ");\"><img src=\"chrome://buzzbird/content/images/heart-grey-16x16.png\" class=\"tweetIcon\" /></a>"
	           + "  </span>"
	           + " </div>"
	           + " <div class=\"spacer\"></div>"
	           + "</div>"
			   + "\n";
//	jsdump('tweet(' + tweet.id +'): ' + result);
	return result;
}

function sanitize(text) {
	// I'm sure there are far better ways to do this, but I suck at regular expressions...
	var clean = text.replace(/&/g, '&amp;');
	clean = clean.replace(/&amp;lt;/g, '&lt;');
	clean = clean.replace(/&amp;gt;/g, '&gt;');
	clean = clean.replace(/&amp;quot;/g, '&quot;');
	clean = clean.replace(/&amp;apos;/g, '&apos;');
	clean = clean.replace(/</g, '&lt;');
	clean = clean.replace(/>/g, '&gt;');
	clean = clean.replace(/"(?![^<>]*>)/g, '&quot;');
	clean = clean.replace(/'(?![^<>]*>)/g, '&apos;');
	return clean;
}

function desanitize(text) {
	var filthy = text.replace(/&amp;/g, '&');
	filthy = text.replace(/&lt;/g, '<');
	filthy = text.replace(/&rt;/g, '>');
	filthy = text.replace(/&quot;/g, '"');
	filthy = text.replace(/&apos;/g, "'");
	return filthy;
}

function showIcons(id) {
	$('tweetInfo-' + id).style.display = 'none';
	$('tweetIcons-' + id).style.display = 'inline';
}

function showInfo(id) {
	$('tweetInfo-' + id).style.display = 'inline';
	$('tweetIcons-' + id).style.display = 'none';
}

// Called to initialize the main window.
//
function start() {
	// Update Frequency, need to make this configurable.
	var interval = getIntPref('buzzbird.update.interval',180000);
	jsdump('interval=' + interval);
	showingAllTweets = getChromeElement('showingAllTweetsId').value;
	showingReplies = getChromeElement('showingRepliesId').value;
	showingDirect = getChromeElement('showingDirectId').value;
	var updateTimer = window.setInterval(fetch,interval);
	getChromeElement('updateTimerId').value = updateTimer;
	getChromeElement('toolbarid').collapsed=false;
	getChromeElement('textboxid').collapsed=false;
	//getChromeElement('buttonbarPanelId').collapsed=false;
        getChromeElement('refreshButtonId').collapsed=false;
        getChromeElement('shortenUrlId').collapsed=false;
        getChromeElement('markAllAsReadId').collapsed=false;
        getChromeElement('symbolButtonId').collapsed=false;
	fetchAll();
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

		var doc = parser.parseFromString('<div xmlns="http://www.w3.org/1999/xhtml">' + newText + '</div>', 'application/xhtml+xml');
		if (doc.documentElement.nodeName != "parsererror" ) {
			var root = doc.documentElement;
			for (var j=0; j<root.childNodes.length; ++j) {
				window.content.document.body.insertBefore(document.importNode(root.childNodes[j], true),window.content.document.body.firstChild);
			}
		} else {
			alert('An error was encountered while parsing tweets.');
		}	
	}
}

// UPDATE THIS COMMENT IT'S WRONG
//
// This function makes the API call to request an update from
// twitter.  It sets the BB.fetchCallback function as the callback to
// receive the tweet response.  This is called by the main page's
// onload() method, by the forceUpdate() method (which is called 
// when the user clicks the update button), and it's also called
// by the update timer.
//
// Note that this starts a chain where we make three Ajax calls in 
// a row.
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
		//var msg = 'Updated at ' + d.getHours() + ':' + mins;
		//message(msg);
		message('');
		
		refreshAllowed(true);
		progress(false);
		setTimeout(updateTimestamps(),1000);
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
	fetchUrl(['http://twitter.com/direct_messages.json','http://twitter.com/statuses/replies.json','http://twitter.com/statuses/friends_timeline.json']);
}
function fetch() {
	if(typeof fetchUrl === 'function') {
		fetchUrl(['http://twitter.com/statuses/friends_timeline.json','http://twitter.com/direct_messages.json']);
	} else {
		//jsdump('Hmph.  fetchUrl is not defined?  Trying again in 5 seconds.');
		//message('Error - retrying.');
		//getMainWindow().setTimeout(forceUpdate, 5000);
		window.setTimeout(forceUpdate, 5000);
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
	fetch();
}

// Posts a twitter update.
//
// Called on succesful tweet postation
//
function postTweetCallback() {
	var textbox = getChromeElement('textboxid');
	textbox.reset();
	textbox.disabled = false;
	getChromeElement('statusid').label = '0/140';
	forceUpdate();
}
function postTweet() {
	var tweet = getChromeElement('textboxid').value;
	url = 'http://twitter.com/statuses/update.json';
	url = url + '?status=' + escape(tweet);
	new Ajax.Request(url,
		{
			method:'post',
			parameters:'source=buzzbird',
			httpUserName: getUsername(),
			httpPassword: getPassword(),
		    onSuccess: postTweetCallback,
		    onFailure: function() { alert('Error posting status update.'); postTweetCallback(); }
		});
}

// Reply
//
function replyTo(id) {
	var user = getBrowser().contentDocument.getElementById("screenname-" + id).innerHTML;
	var text = '@' + desanitize(user) + ' ';
	getChromeElement('textboxid').value = text;
	getChromeElement('statusid').label = text.length + "/140";
	getChromeElement('textboxid').focus();
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
}

// Re-tweet
//
function retweet(id) {
	var raw = getBrowser().contentDocument.getElementById("raw-" + id).innerHTML;
	var user = getBrowser().contentDocument.getElementById("screenname-" + id).innerHTML;
	var text = 'RT @' + desanitize(user) + ': ' + desanitize(raw);
	text = text.substring(0,140);
	getChromeElement('textboxid').value = text;
	getChromeElement('statusid').label = text.length + "/140";
	getChromeElement('textboxid').focus();		
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
		    onFailure: function() { alert('Something went wrong...'); }
		});	
}

// Favorite callback
//
function favoriteCallback(transport) {
	getChromeElement('statusid').label = 'Tweet Favorited';
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
	var textbox = getChromeElement('textboxid');
	var length = textbox.value.length;
	if (length != 0) {
		getChromeElement('statusid').label = length + '/140';
	} else {
		getChromeElement('statusid').label = '';
	}
}

// Filter tweet types.
//
function showAllTweets() {
	showOrHide('tweet','inline');
	showOrHide('mine','inline');
	showOrHide('direct','inline');
	showOrHide('reply','inline');	
	getChromeElement('filterbuttonid').label="Showing all tweets";
}
function showResponses() {
	showOrHide('tweet','none');
	showOrHide('mine','none');
	showOrHide('direct','none');
	showOrHide('reply','inline');	
	getChromeElement('filterbuttonid').label="Showing replies";
}
function showDirect() {
	showOrHide('tweet','none');
	showOrHide('mine','none');
	showOrHide('direct','inline');
	showOrHide('reply','none');	
	getChromeElement('filterbuttonid').label="Showing direct messages";
}
function showOrHide(tweetType,display) {
	var elements = getBrowser().contentDocument.getElementsByName(tweetType);
	for (i=0; i<elements.length; ++i) {
		element = elements[i];
		element.style.display = display;
	}
}

// Marks all as read.
//
function markAllAsRead() {
	var xx = getBrowser().contentDocument.getElementsByName('mark');
	for (var i=0; i<xx.length; i++) {
		x = xx[i];
		x.src='chrome://buzzbird/content/images/checkmark-gray.png'; 
/*		x.name='marked';  */
	}	
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

function getBoolPref(prefname,def) {
  try { 
    var pref = Components.classes["@mozilla.org/preferences-service;1"]
                       .getService(Components.interfaces.nsIPrefBranch);
    return pref.getBoolPref(prefname);
  }
  catch(er) {
    return def;
  }
}

function getIntPref(prefname,def) {
  try { 
    var pref = Components.classes["@mozilla.org/preferences-service;1"]
                       .getService(Components.interfaces.nsIPrefBranch);
    return pref.getIntPref(prefname);
  }
  catch(er) {
    return def;
  }
}


function openPreferences() {
  var instantApply = getBoolPref("browser.preferences.instantApply", false);
  var features = "chrome,titlebar,toolbar,centerscreen" + (instantApply ? ",dialog=no" : ",modal");

//	var features = "chrome,titlebar,toolbar,centerscreen,modal";
	window.openDialog("chrome://buzzbird/content/prefs.xul", "", features);
}

// Craptastic logging.
//
function jsdump(str) {
	var d = new Date();
	str = d + ': ' + str;
	Components.classes['@mozilla.org/consoleservice;1']
    		.getService(Components.interfaces.nsIConsoleService)
            .logStringMessage(str);
}



