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
		icon: "tweetIcon",
		replyTo: "tweetReplyTo",
		mark: "mark",
		marked: "marked",
		via: "tweetVia"
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
		icon: "mineIcon",
		replyTo: "mineReplyTo",
		mark: "mark",
		marked: "marked",
		via: "mineVia"
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
		icon: "replyIcon",
		replyTo: "replyReplyTo",
		mark: "mark",
		marked: "marked",
		via: "replyVia"
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
		icon: "directToIcon",
		replyTo: "directToReplyTo",
		mark: "mark",
		marked: "marked",
		via: "directToVia"
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
		icon: "directFromIcon",
		replyTo: "directFromReplyTo",
		mark: "mark",
		marked: "marked",
		via: "directFromVia"
	}
}

// Formats a tweet for display.
//
function formatTweet(tweet,username,password) {
	//jsdump('formatting tweet ' + tweet.id);
	// Clean any junk out of the text.
	var retweet = tweet.retweeted_status;
	var text = sanitize(tweet.text);
	if (retweet != null && retweet != undefined) {
		// just to get all 140 characters...
		text = "RT @" + retweet.user.screen_name + " " + sanitize(retweet.text);
	} 
	
	// First, go through and replace links with real links.
	var re = new RegExp("http://(\\S*)", "g");
	var text = text.replace(re, "<a onmouseover=\"this.style.cursor='pointer';\" onclick=\"linkTo('http://$1');\">http://$1</a>");
	
	// Next, replace the twitter handles
	re = new RegExp("(^|\\s|^\\.)@(\\w*)", "g");
	text = text.replace(re, "$1@<a onmouseover=\"this.style.cursor='pointer';\" onclick=\"showUser('$2');\">$2</a>");
		
	// Finally, replace the hashtags
	re = new RegExp("(^|\\s)#(\\w*)", "g");
	text = text.replace(re, "$1#<a onmouseover=\"this.style.cursor='pointer';\" onclick=\"hashTag('$2');\">$2</a>");

	var when = new Date(tweet.created_at);
	var prettyWhen = when.toLocaleTimeString() + ' on ' + when.toLocaleDateString().substring(0,5);
	var user;
	if (tweetType(tweet,username,password) == 'direct-from') {
		user = tweet.sender;
	} else {
		user = tweet.user;
	}
	
	var tt = tweetType(tweet,username,password)
	var c = classes[tt];

	// Figure out if we're displaying this flavor of tweet
	var display = 'none';
	var filterer = getChromeElement('filterbuttonid');
	if (filterer == null) {
		display = 'inline'
	} else {
		var currentFilter = getChromeElement('filterbuttonid').label;
		var showingAllTweets = getChromeElement('showingAllTweetsId').value;
		var showingReplies = getChromeElement('showingRepliesId').value;
		var showingDirect = getChromeElement('showingDirectId').value;		
		if (  (currentFilter == showingAllTweets) ||
	          ((currentFilter == showingDirect) && (tweetType(tweet,username,password) == 'direct')) ||
	          ((currentFilter == showingReplies && (tweetType(tweet,username,password) == 'reply')) ) ) {
		  display = 'inline';
	    }
	}
	
	var via = ""
	if (tweet.source != undefined && tweet.source != null && tweet.source != "") {
		var re = new RegExp('<a href="(.*?)" rel="nofollow">(.*?)</a>');
		var src = re.exec(tweet.source);
		if (src != undefined && src != null && src.length == 3) {
			href = src[1]
			href = href.replace(/&/g, '%26');
			via = " <span class=\"" + c.via + "\"> posted from <a onmouseover=\"this.style.cursor='pointer';\" onclick=\"linkTo('" + href + "')\">" + src[2] + "</a></span>";
		}
	} 

	if (tweet.in_reply_to_status_id != null && tweet.in_reply_to_screen_name != null) {
		text = text + " <span class=\"" + c.replyTo + "\"><a onmouseover=\"this.style.cursor='pointer';\" onclick=\"viewOneTweet(" + tweet.in_reply_to_status_id + ");\">(a reply to " + sanitize(tweet.in_reply_to_screen_name) + ")</a></span>";
	}
	
	var altText = "Click to see " + sanitize(user.screen_name) + "'s profile";
	if (user.location != undefined && user.location != null && user.description != undefined && user.location != null) {
		var altText = sanitize(user.name) + ", '" + sanitize(user.description) + "' (" + sanitize(user.location) + "). " + altText;
	}

	var result = 
	   "<div id=\"raw-" + tweet.id + "\" style=\"display:none;\">" + sanitize(tweet.text) + "</div>"
     + "<div id=\"screenname-" + tweet.id + "\" style=\"display:none;\">" + sanitize(user.screen_name) + "</div>"
	 + "<div id=\"timestamp-" + tweet.id + "\" name=\"timestamp\" style=\"display:none;\">" + new Date(tweet.created_at).getTime() + "</div>"
     + "<div id=\"tweet-" + tweet.id + "\" class=\"tweetBox\" name=\"" + tweetType(tweet,username,password) + "\" "
     + "     style=\"display:" + display + "\" " 
     + "     onmouseover=\"showIcons("+ tweet.id + ")\" "
     + "     onmouseout=\"showInfo(" + tweet.id + ")\">"
	 + " <div class=\"" + c.message + "\">"
	 + "  <table class=\"" + c.table + "\">"
	 + "   <tr>"
	 + "    <td valign=\"top\" class=\"" + c.avatarColumn + "\">"
	 + "     <a onmouseover=\"this.style.cursor='pointer';\" style=\"margin:0px;padding:0px\" "  // old way: onclick=\"linkTo('http://twitter.com/" + sanitize(user.screen_name) + "');\" "
	 + "        onclick=\"showUser('" + user.screen_name + "');\" "
	 + "        title=\"" + altText + "\">"
	 + "      <img src=\"" + user.profile_image_url + "\" class=\"" + c.avatar +"\" />"
     + "     </a>"
     + "    </td>"
     + "    <td>"
	 + "     <div class=\"" + c.text + "\">"
	 
	 var emphasis = getStringPref('buzzbird.render.bold-name','handle');
	 if (emphasis == 'realname') {
	   result += "<p><span class=\"" + c.screenName + "\">" + sanitize(user.name) + "</span> <span class=\"" + c.content + "\">" + text + "</span></p>"	
	 } else {
	   result += "<p><span class=\"" + c.screenName + "\">" + sanitize(user.screen_name) + "</span> <span class=\"" + c.content + "\">" + text + "</span></p>"	
	 }
	
	 result = result
     + "     </div>"
     + "    </td>"
     + "   </tr>"
     + "  </table>"
     + "  <div class=\"" + c.bottomRow + "\">"
 	 + "   <img class=\"" + c.mark + "\" "
	 + "        id=\"mark-" + tweet.id + "\" "
//	 + "        name=\"" + tt + "\""
	 + "        src=\"chrome://buzzbird/skin/images/actions/unread.png\" "
	 + "        onclick=\"toggleMarkAsRead(" + tweet.id + ");\" "
	 + "        onmouseover=\"this.style.cursor='pointer';\" />"
     + "   <span id=\"tweetInfo-" + tweet.id + "\">"
	 if (emphasis == 'realname') {
	   result += "<span class=\"" + c.info + "\">" + sanitize(user.screen_name) 
	 } else {
	   result += "<span class=\"" + c.info + "\">" + sanitize(user.name) 
	 }

	 result = result
	 + "     <span id=\"prettytime-" + tweet.id + "\">less than 1m ago</span> "
     + "    </span>"
     + "   </span>"
     + "   <span id=\"tweetIcons-" + tweet.id + "\" style=\"display:none;\">";	        

	 var t = tweetType(tweet,username,password);
	 if (t == 'tweet' || t == 'direct-from' || t == 'reply') {
		result = result + " <a class=\"" + c.info + "\" title=\"Retweet This\" onclick=\"retweet(" + tweet.id + ");\"><img src=\"chrome://buzzbird/skin/images/actions/recycle-grey-16x16.png\" class=\"" + c.icon + "\" /></a>"
	 }
	 if (t == 'tweet' || t == 'reply') {
		result = result + " <a class=\"" + c.info + "\" title=\"Reply to " + sanitize(user.screen_name) + "\" onclick=\"replyTo(" + tweet.id + ");\"><img src=\"chrome://buzzbird/skin/images/actions/reply-grey-16x16.png\" class=\"" + c.icon + "\" /></a>"
	 }
	
	 // the user.following check does not work, per Issue 474.
	 // http://code.google.com/p/twitter-api/issues/detail?id=474
	 // The "following" member of the user object has been deprecated, 
	 // anyway, so I probably shouldn't use it.
	 //if (user.following == true) {
		 if (t == 'tweet' || t == 'direct-from' || t == 'reply') {
			result = result + " <a class=\"" + c.info + "\" title=\"Send a Direct Message to " + user.screen_name + "\" onclick=\"sendDirect(" + tweet.id + ");\"><img src=\"chrome://buzzbird/skin/images/actions/phone-grey-16x16.png\" class=\"" + c.icon + "\" /></a>"
		 }
	 //}

 	 if (t != 'mine') {
		result = result + " <a class=\"" + c.info + "\" title=\"Stop following" + sanitize(user.screen_name) + "\" onclick=\"stopFollowingTweeter(" + tweet.id + ");\"><img src=\"chrome://buzzbird/skin/images/actions/stop-grey-16x16.png\" class=\"" + c.icon + "\" /></a>"
 	 }
	 if (t == 'mine') {
		result = result + " <a class=\"" + c.info + "\" title=\"Delete this Tweet\" onclick=\"deleteTweet(" + tweet.id + ");\"><img src=\"chrome://buzzbird/skin/images/actions/trash-grey-16x16.gif\" class=\"" + c.icon + "\" /></a>"		
	 }
	
     result = result 
     + " <a class=\"" + c.info + "\" title=\"Mark as Favorite\" onclick=\"favorite(" + tweet.id + ");\"><img src=\"chrome://buzzbird/skin/images/actions/heart-grey-16x16.png\" class=\"" + c.icon + "\" /></a>"
	 + via
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
	}	
}
