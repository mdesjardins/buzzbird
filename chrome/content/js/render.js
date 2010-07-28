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

Components.utils.import("resource://app/chrome/content/js/global.js");  

var Render = {
	classes : {
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
	},

	sourceFilters: [
		{"source":'foursquare', "pref":'buzzbird.filters.foursquare'},
		{"source":'Gowalla', "pref":'buzzbird.filters.gowalla'},
		{"source":'Brightkite', "pref":'buzzbird.filters.brightkite'},
		{"source":'Whrrl', "pref":'buzzbird.filters.whrrl'},
		{"source":'Fishies', "pref":'buzzbird.filters.fishies'},
		{"source":'QRANK', "pref":'buzzbird.filters.qrank'},
		{"source":'Dots Online', "pref":'buzzbird.filters.dotsonline'},
		{"source":'Chess Online', "pref":'buzzbird.filters.chessonline'},
		{"source":'Pandora', "pref":'buzzbird.filters.pandora'},
		{"source":'Tweekly.fm', "pref":'buzzbird.filters.tweekly'},
		{"source":'Blip.fm', "pref":'buzzbird.filters.blip'},
		{"source":'LastfmLoveTweet', "pref":'buzzbird.filters.lastfmlovetweet'},
		{"source":'Last.fm Tweets', "pref":'buzzbird.filters.lastfmtweets'},
		{"source":'Twunes', "pref":'buzzbird.filters.twunes'},
	  {"source":'Rhythmbox plugin', "pref":'buzzbird.filters.rhythmbox'},
		{"source":'WeReward', "pref":'buzzbird.filters.wereward'},
		{"source":'MyLikes', "pref":'buzzbird.filters.mylikes'},
		{"source":'adCause', "pref":'buzzbird.filters.adcause'},
		{"source":'RatePoint', "pref":'buzzbird.filters.ratepoint'},
		{"source":'RatePoint SocialFeed', "pref":'buzzbird.filters.ratepoint'},
		{"source":'Assetize.', "pref":'buzzbird.filters.assetize'},
		{"source":'Ad.ly Network', "pref":'buzzbird.filters.adly'},
		{"source":'Sponsored Tweets', "pref":'buzzbird.filters.sponsoredtweets'}
	],

	contentFilters: [
 	  {"content":'(.*?)#SlackerRadio(.*?)', "pref":'buzzbird.filters.slackerradio'},
	  {"content":'^Rhythmbox: (.*)', "pref":'buzzbird.filters.rhythmbox'}
	],

	// Formats a tweet for display.
	//
	formatTweet: function(tweet,username,password) {
		//jsdump('formatting tweet ' + tweet.id);
		// Clean any junk out of the text.
		var text = sanitize(tweet.text);
				
		// First, go through and replace links with real links.
		var re = new RegExp("http://(\\S*)", "g");
		var text = text.replace(re, "<a onmouseover=\"this.style.cursor='pointer';\" onclick=\"linkTo('http://$1');\">http://$1</a>");
	
		// Next, replace the twitter handles
		re = new RegExp("(^|\\s|^\\.)@(\\w*)", "g");
		text = text.replace(re, "$1@<a onmouseover=\"this.style.cursor='pointer';\" onclick=\"browser.showUser('$2');\">$2</a>");
		
		// Finally, replace the hashtags
		re = new RegExp("(^|\\s)#(\\w*)", "g");
		text = text.replace(re, "$1#<a onmouseover=\"this.style.cursor='pointer';\" onclick=\"hashTag('$2');\">$2</a>");

		var retweet = tweet.retweeted_status;

		var when = new Date(tweet.created_at);
		var prettyWhen = when.toLocaleTimeString() + ' on ' + when.toLocaleDateString().substring(0,5);
		var user;
		if (tweetType(tweet,username,password) == 'direct-from') {
			user = tweet.sender;
		} else {
			if (retweet != null && retweet != undefined) {
				user = retweet.user;
			} else {
				user = tweet.user;
			}
		}
	
		var tt = tweetType(tweet,username,password)
		var c = Render.classes[tt];

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
				if (Render.filtered(src[2],text)) {
					jsdump("::::>>>>>>> Filtering tweet... source: " + tweet.source + ", content: '" + text + "'");
					return "";
				}
				href = src[1]
				href = href.replace(/&/g, '%26');
				via = " <span class=\"" + c.via + "\"> posted from <a onmouseover=\"this.style.cursor='pointer';\" onclick=\"linkTo('" + href + "')\">" + sanitize(src[2]) + "</a></span>";
			}
		} 

		if (tweet.in_reply_to_status_id != null && tweet.in_reply_to_screen_name != null) {
			text = text + " <span class=\"" + c.replyTo + "\"><a onmouseover=\"this.style.cursor='pointer';\" title=\"Click to view conversation\" onclick=\"browser.viewConversation(" + tweet.id + ");\">(Replying to " + sanitize(tweet.in_reply_to_screen_name) + ")</a></span>";
		}
	
		if (retweet != null && retweet != undefined) {
			text = text + " <span class=\"" + c.replyTo + "\"><a onmouseover=\"this.style.cursor='pointer';\" title=\"Click to view " + tweet.user.screen_name + "'s profile\" onclick=\"browser.showUser('" + tweet.user.screen_name + "');\">(Retweeted by " + sanitize(tweet.user.screen_name) + ")</a></span>";
		}

		var altText = "";
		var altText = "Click to see " + sanitize(user.screen_name) + "'s profile";
		if (user.location != undefined && user.location != null && user.description != undefined && user.location != null) {
			var altText = sanitize(user.name) + ", '" + sanitize(user.description) + "' (" + sanitize(user.location) + "). " + altText;
		}

		var result = 
//		   "<div id=\"raw-" + tweet.id + "\" style=\"display:none;\">" + sanitize(tweet.text) + "</div>" // stupid to store this in the DOM like this.
	       "<div id=\"screenname-" + tweet.id + "\" style=\"display:none;\">" + sanitize(user.screen_name) + "</div>"
		   + "<div id=\"timestamp-" + tweet.id + "\" name=\"timestamp\" style=\"display:none;\">" + new Date(tweet.created_at).getTime() + "</div>"
	     + "<div id=\"tweet-" + tweet.id + "\" class=\"tweetBox\" name=\"" + tweetType(tweet,username,password) + "\" "
	     + "     style=\"display:" + display + "\" " 
	     + "     onmouseover=\"browser.showIcons("+ tweet.id + ")\" "
	     + "     onmouseout=\"browser.showInfo(" + tweet.id + ")\">"
		   + " <div class=\"" + c.message + "\">"
		   + "  <table class=\"" + c.table + "\">"
		   + "   <tr>"
		   + "    <td valign=\"top\" class=\"" + c.avatarColumn + "\">"
		   + "     <a onmouseover=\"this.style.cursor='pointer';\" style=\"margin:0px;padding:0px\" "  
		   + "        onclick=\"browser.showUser('" + user.screen_name + "');\" "
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
		   + "        tweetType=\"" + tt + "\""
		   + "        src=\"chrome://buzzbird/skin/images/actions/unread.png\" "
		   + "        onclick=\"browser.toggleMarkAsRead(" + tweet.id + ");\" "
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
	
		 if (user.protected !== undefined && user.protected == true) {
			result = result + "<img src=\"chrome://buzzbird/skin/images/protected.png\" alt=\"This user has protected his/her tweets\" title=\"This user has protected his/her tweets\"/>";
		 }
	
			result = result	 	
	     + "   </span>"

			result = result	 
	     + "   <span id=\"tweetIcons-" + tweet.id + "\" style=\"display:none;\">";	        

		 var t = tweetType(tweet,username,password);
		 if (Ctx.service === "twitter") {
			 if ((t == 'tweet' || t == 'reply') && !user.protected) {
				result = result + " <a class=\"" + c.info + "\" title=\"Retweet This\" onclick=\"browser.retweet(" + tweet.id + ");\"><img src=\"chrome://buzzbird/skin/images/actions/repost.png\" class=\"" + c.icon + "\" /></a>"
			 }
		 }
		 if (t == 'tweet' || t == 'reply') {
			result = result + " <a class=\"" + c.info + "\" title=\"Quote This\" onclick=\"browser.quote(" + tweet.id + ");\"><img src=\"chrome://buzzbird/skin/images/actions/quote.png\" class=\"" + c.icon + "\" /></a>"
		 }
		 if (t == 'tweet' || t == 'reply') {
			result = result + " <a class=\"" + c.info + "\" title=\"Reply to " + sanitize(user.screen_name) + "\" onclick=\"browser.replyTo(" + tweet.id + ");\"><img src=\"chrome://buzzbird/skin/images/actions/reply.png\" class=\"" + c.icon + "\" /></a>"
		 }
		 if (tweet.geo !== undefined && tweet.geo != null) {
			jsdump(user.screen_name + ' has geo info');
			if (tweet.geo.type !== undefined && tweet.geo.type == "Point" && 
			    tweet.geo.coordinates !== undefined && tweet.geo.coordinates != null) {
				jsdump('coordinates.');
				result = result + " <a class=\"" + c.info + "\" title=\"Current location of " + sanitize(user.screen_name) + "\" onclick=\"linkTo('";
				result = result + "http://maps.google.com?q=" + tweet.geo.coordinates[0] + "," + tweet.geo.coordinates[1]
				result = result + "');\"><img src=\"chrome://buzzbird/skin/images/actions/location.png\" class=\"" + c.icon + "\" /></a>"
			}			
		 }
	
			var renderDirectButton = (t == 'direct-from');
		 	if (Social.service(Ctx.service).support.fetchFollowerIds == true) {
				// Go through the list of followers first and make sure the user follows
				// us back before rendering the direct message button. This is slow as
				// hell.  Needs a hashmap or something.
				//
				for (var i=0,len=Ctx.followers.length; i<len; i++) {
					if (user.id == Ctx.followers[i]) {
						renderDirectButton = true;
						break;
					}
				}
			} else {
				renderDirectButton = true;
			}
			if (renderDirectButton) {
				if (t == 'tweet' || t == 'direct-from' || t == 'reply') {
					result = result + " <a class=\"" + c.info + "\" title=\"Send a Direct Message to " + user.screen_name + "\" onclick=\"browser.sendDirect(" + tweet.id + ");\"><img src=\"chrome://buzzbird/skin/images/actions/direct.png\" class=\"" + c.icon + "\" /></a>"
				}
			}

	 	 if (t != 'mine') {
			result = result + " <a class=\"" + c.info + "\" title=\"Stop following " + sanitize(user.screen_name) + "\" onclick=\"browser.stopFollowing(" + tweet.id + ");\"><img src=\"chrome://buzzbird/skin/images/actions/unfollow.png\" class=\"" + c.icon + "\" /></a>"
	 	 }
		 if (t == 'mine') {
			result = result + " <a class=\"" + c.info + "\" title=\"Delete this Update\" onclick=\"browser.deletePost(" + tweet.id + ");\"><img src=\"chrome://buzzbird/skin/images/actions/delete.png\" class=\"" + c.icon + "\" /></a>"		
		 }
	
	   result = result 
	     + " <a class=\"" + c.info + "\" title=\"Mark as Favorite\" onclick=\"browser.favorite(" + tweet.id + ");\"><img src=\"chrome://buzzbird/skin/images/actions/favorite.png\" class=\"" + c.icon + "\" /></a>"
		   + via
		   + "   </span>"
	     + "  </div>"
	     + " </div>"
	     + "</div>"
	     + "\n";

		 //jsdump('tweet(' + tweet.id +'): ' + result);
		 return result.replace(/[ \t]+/g, ' ');
	},

	filtered: function(source,tweet) {
		if (source != undefined && source != null && source != "") {
			//jsdump(":::: Checking source filters.");
			for (var i=0,len=Render.sourceFilters.length; i<len; i++) {
				s = Render.sourceFilters[i]
				//jsdump(":::: Checking source " + source + " against " + s.source);
				if (s.source == source) {
					jsdump(":::: match!");
					if (getBoolPref(s.pref,false)) {
						jsdump("::: Rejecting.")
						return true;
					}
				}
			}
		}
		for (var i=0,len=Render.contentFilters.length; i<len; i++) {
			s = Render.contentFilters[i]
			if (tweet.match(s.content)) {
				if (getBoolPref(s.pref,false)) {
					return true;
				}
			}
		}
		return false;
	},

	// Writes to the top of the page.
	//
	insertAtTop: function(newText) {
		var parser = new DOMParser();
		var doc = parser.parseFromString('<div xmlns="http://www.w3.org/1999/xhtml">' + newText + '</div>', 'application/xhtml+xml');
		if (doc.documentElement.nodeName != "parsererror" ) {
			var root = doc.documentElement;
			for (var j=0; j<root.childNodes.length; ++j) {
				window.content.document.body.insertBefore(document.importNode(root.childNodes[j], true),window.content.document.body.firstChild);
			}
		} else {
			Statusbar.message('An error was encountered while parsing tweets.');
		}	
	}
}