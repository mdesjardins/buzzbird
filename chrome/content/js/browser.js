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

// This is for common Browser components, intended to be extended for use
// in individual browsers.
//
var BrowserBase = {
	mainWindow : window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
	                   .getInterface(Components.interfaces.nsIWebNavigation)
	                   .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
	                   .rootTreeItem
	                   .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
	                   .getInterface(Components.interfaces.nsIDOMWindow),
	
	element : window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
	                   .getInterface(Components.interfaces.nsIWebNavigation)
	                   .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
	                   .rootTreeItem
	                   .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
	                   .getInterface(Components.interfaces.nsIDOMWindow)
                     .document.getElementById('browserid'),
	
	reopen : function(params) {
		jsdump('action:' + params.out.action);
		if (params.out.action == 'friend') {
			jsdump('userId=' + params.out.userId);
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
			BrowserBase.doRetweet(params.out.tweetId);
		} else if (params.out.action == 'oneTweet') {
			BrowserBase.viewConversation(params.out.tweetId);
		} else if (params.out.action == 'user') {
			BrowserBase.showUser(params.out.userId);
		} else if (params.out.action == 'unfollow') {
			BrowserBase.doStopFollowing(params.out.userId);
		}
	},
	
	// Shows the retweet/love/reply/direct icons for an individual tweet.
	showIcons : function(id) {
		document.getElementById('tweetInfo-' + id).style.display = 'none';
		document.getElementById('tweetIcons-' + id).style.display = 'inline';
	},
	
	// Opposite of showIcons.
	showInfo : function(id) {
		document.getElementById('tweetInfo-' + id).style.display = 'inline';
		document.getElementById('tweetIcons-' + id).style.display = 'none';
	},
	
	// Favorite
	//
	favorite : function(id) {
		Social.service(Ctx.service).favorite({
			username: Ctx.user,
			password: Ctx.password,
			token: Ctx.token,
			tokenSecret: Ctx.tokenSecret,
			updateId: id,
			onSuccess: BrowserBase.favoriteCallback,
			onError: function(status) {
				jsdump('Error favoriting, HTTP status ' + status)
				var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
				                        .getService(Components.interfaces.nsIPromptService);
				prompts.alert(window, "Sorry.", "There was an error favoriting.");
			}
		});
	},

	// Favorite callback
	//
	favoriteCallback : function(transport) {
		var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
		                        .getService(Components.interfaces.nsIPromptService);
		prompts.alert(window, "Sweet...", "Favorited!");
	},

	// Stop Following
	//
	stopFollowing : function(id) {
		BrowserBase.doStopFollowing(id);
	},
	doStopFollowing : function(id) {
		var user = document.getElementById('screenname-' + id).innerHTML;
		var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
		                        .getService(Components.interfaces.nsIPromptService);
		var result = prompts.confirm(window, "Confirm", 'Do you want to stop following ' + user + '?');
		if (result) {
			jsdump('Unfollowing ' + user);
			Social.service(Ctx.service).unfollow({
				username: Ctx.user,
				password: Ctx.password,
				token: Ctx.token,
				tokenSecret: Ctx.tokenSecret,
				screenName: user,
				onSuccess: BrowserBase.stopFollowingCallback,
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
	},

	stopFollowingTweeterCallback : function(transport) {
		var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
		                        .getService(Components.interfaces.nsIPromptService);
		prompts.alert(window, "Unfollowed", "You are no longer following this user.");
	},

	toggleMarkAsRead : function(id) {
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
	},

	appendText : function(symbol) {
		var t = getChromeElement('textboxid').value;
		t = t + symbol;
		var len = t.length;
		getChromeElement('textboxid').value = t;
		getChromeElement('statusid').label = len + '/140';
	},

	deletePost : function(id) {	
		var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
		                        .getService(Components.interfaces.nsIPromptService);
		var result = prompts.confirm(window, "Confirm", 'Do you want to delete this tweet?  There is no Undo!');
		if (result) {
			Social.service(Ctx.service).deletePost({
				username: Ctx.user,
				password: Ctx.password,
				token: Ctx.token,
				tokenSecret: Ctx.tokenSecret,
				deleteId: id,
				onSuccess: function(transport) { deletePostCallback(id,transport); },
				onError: function(status) {
					jsdump('Error processing delete, HTTP status ' + status);
					var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
					                        .getService(Components.interfaces.nsIPromptService);
					prompts.alert(window, "Sorry.", "There was an error deleting that status update.");
				}						
			});
		}
	},

	deletePostCallback : function(id,transport) {
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
	},
	
	retweet : function(id) {
		BrowserBase.doRetweet(id);
	},
	
	doRetweet : function(id) {
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

		var raw = document.getElementById("raw-" + id).innerHTML;
		var user = document.getElementById("screenname-" + id).innerHTML;
		var f = getStringPref('buzzbird.retweet.format');
		jsdump('buzzbird.retweet.format=' + f);
		var text = 'RT @' + desanitize(user) + ': ' + desanitize(raw);
		if (f == 'via') {
			text = desanitize(raw) + ' (via @' + desanitize(user) + ')';
		} 

		if (configMethod == 'A') {
			jsdump("Posting Echo (auto retweet)");
			Social.service(Ctx.service).postEcho({
				username: Ctx.user,
				password: Ctx.password,
				token: Ctx.token,
				tokenSecret: Ctx.tokenSecret,
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
}





