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

As you might guess, this is the base class for twitteresque APIs.

*/
var Twitteresque = {
	support  : {
		fetchTimeline: true,
		fetchMentions: true,
		fetchDirectTo: true,
		fetchDirectFrom: true,
		fetchUserProfile: true,
		fetchUserTimeline: true,
		fetchLists: false,
		post: true,
		reply: true,
		echo: true,
		deletePost: true,	
		governor: false,
		authenticate: true,
		favorite: true,
		follow: true,
		unfollow: true,
		isFollowing: true,
		verifyCredentials: true,
		xAuth: true
	},

	urlBase : "",
	
	url : {
		fetchTimeline: 'URL_BASE/statuses/home_timeline.json?count=COUNT',
		fetchMentions: 'URL_BASE/statuses/mentions.json?count=COUNT',
		fetchDirectTo: 'URL_BASE/direct_messages.json?count=COUNT',
		fetchDirectFrom: 'URL_BASE/direct_messages/sent.json?count=COUNT',
		fetchUserTimeline: 'URL_BASE/statuses/user_timeline/QUERIED_USER_ID.json?count=COUNT',
		fetchRetweetedByMe: 'URL_BASE/statuses/retweeted_by_me.json?count=COUNT',
		fetchUserProfile: 'URL_BASE/users/show/',
		fetchSingleUpdate: 'URL_BASE/statuses/show/STATUS_ID.json',
		postUpdate: 'URL_BASE/statuses/update.json?status=STATUS&source=SOURCE',
		postEcho: 'URL_BASE/statuses/retweet/RETWEET_ID.json?source=SOURCE',
		deletePost: 'URL_BASE/statuses/destroy/DELETE_ID.json?source=SOURCE',
		favorite: 'URL_BASE/favorites/create/UPDATE_ID.json',
		follow: 'URL_BASE/friendships/create.json',
		unfollow: 'URL_BASE/friendships/destroy.json',
		isFollowing: 'URL_BASE/friendships/show.json',
		verifyCredentials: 'URL_BASE/account/verify_credentials.json',
	},
	
	_ajax : new Aja(),
			
	_initUrl : function(url,count,since,queriedUserId) {
		if (url.match(/COUNT/)) {
			if (count == undefined || count == null) {
				count = 50;
			}
			url = url.replace("COUNT",count);
		}
		if (url.match(/QUERIED_USER_ID/)) {
			url = url.replace("QUERIED_USER_ID",queriedUserId)
		}
		if (since != undefined && since != null) {
			url = url + '&since_id=' + since;
		}
		if (url.match(/SOURCE/)) {
			url = url.replace("SOURCE",Social._source)
		}
		url = url.replace("URL_BASE",this.urlBase);
		return url;
	},
	
	_addAuthHeader : function(url,method,options) {
		jsdump('_addAuthHeader')
		var opts = {
			consumerKey: this.oauth.consumerKey,
			consumerSecret: this.oauth.consumerSecret,
			token: options.token,
			tokenSecret: options.tokenSecret
		};
		var message = {
			'method':method,
			action:url,
			parameters: []
		}
	
		OAuth.completeRequest(message,opts);
		var authHeader = OAuth.getAuthorizationHeader('',message.parameters);
		jsdump('authHeader='+authHeader);
		
		if (options.parameters === undefined) {
			jsdump('NO PARAMETERS.')
			options.parameters = [];
		}
	
		options.parameters.push('Authorization',authHeader)
		jsdump("OPTIONS.PARAMETERS=" + options.parameters);
		return options;
	},
	
		
	// Fetches the user's timeline.
	// Options:
	//  username = username
	//  password = password
	//  onSuccess = called on each update
	//  onError = called if there's an error.
	//  count = number of tweets to ask for.
	//  since = fetch timeline tweets since this ID
	//
	fetchTimeline : function(options) {
		var url = this.url.fetchTimeline;
		url = this._initUrl(url, options.count, options.since, null);
		options = this._addAuthHeader(url,'GET',options);
		return this._ajax.get(url,options);
	},
	
	// Fetches mentions of the user.
	// Options:
	//  username = username
	//  password = password
	//  onSuccess = called on each update
	//  onError = called if there's an error.
	//  count = number of tweets to ask for.
	//  since = fetch timeline tweets since this ID
	//
	fetchMentions : function(options) {
		var url = this.url.fetchMentions;
		url = this._initUrl(url, options.count, options.since, null);
		options = this._addAuthHeader(url,'GET',options);
		return this._ajax.get(url,options);
	},
	
	// Fetches direct messages to this user (i.e., received)
	// Options:
	//  username = username
	//  password = password
	//  onSuccess = called on each update
	//  onError = called if there's an error.
	//  count = number of tweets to ask for.
	//
	fetchDirectTo : function(options) {
		var url = this.url.fetchDirectTo;
		url = this._initUrl(url, options.count, options.since, null);
		options = this._addAuthHeader(url,'GET',options);
		return this._ajax.get(url,options);
	},

	// Fetches direct messages from this user (i.e., sent).
	// Options:
	//  username = username
	//  password = password
	//  onSuccess = called on each update
	//  onError = called if there's an error.
	//  count = number of tweets to ask for.
	//
	fetchDirectFrom : function(options) {
		var url = this.url.fetchDirectFrom;
		url = this._initUrl(url, options.count, options.since, null);
		options = this._addAuthHeader(url,'GET',options);
		return this._ajax.get(url,options);
	},
	
	// Fetches another user's timeline (not the logged in user's)
	// Options:
	//  username = username
	//  password = password
	//  onSuccess = called on each update
	//  onError = called if there's an error.
	//  count = number of tweets to ask for.
	//  queriedUserId = the ID of the user to look up.
	//
	fetchUserTimeline : function(options) {
		var url = this.url.fetchUserTimeline;
		url = this._initUrl(url, options.count, null, options.queriedUserId);
		options = this._addAuthHeader(url,'GET',options);
		return this._ajax.get(url,options);
	},
	
	// Fetches a user's profile.
	// Options:
	//  username = username
	//  password = password
	//  onSuccess = called on each update
	//  onError = called if there's an error.
	//  count = number of tweets to ask for.
	//  queriedUserId = the ID of the user to look up.
	//
	fetchUserProfile : function(options) {
		var url = this.url.fetchUserProfile;
		url = this._initUrl(url, null, null, options.queriedUserId);
		if (options.queriedUserId != undefined) {
			url = url + options.queriedUserId + '.json';
		} else if (options.queriedScreenName != undefined) {
			url = url + options.queriedScreenName + '.json';			
		}
		options = this._addAuthHeader(url,'GET',options);
		return this._ajax.get(url,options);
	},	
	
	// Fetches a single tweet.
	// Options:
	//  username = username
	//  password = password
	//  onSuccess = called on each update
	//  onError = called if there's an error.
	//  statusId = the ID of the update to be fetched.
	//
	fetchSingleUpdate : function(options) {
		var url = this.url.fetchSingleUpdate;
		url = this._initUrl(url, null, null, null);
		url = url.replace('STATUS_ID',options.statusId);
		options = this._addAuthHeader(url,'GET',options);
		return this._ajax.get(url,options);
	},	
	
	// Posts a status update.
	// Options:
	//  username = username
	//  password = password
	//  onSuccess = called on each update
	//  onError = called if there's an error.
	//  text = the content of the status update to post.
	//
	postUpdate : function(options) {
		var url = this.url.postUpdate;
		url = this._initUrl(url,null,null,null);
		url = url.replace('STATUS', encodeURIComponent(options.text));
		// Need to un-encode at signs or replies will not work.	
		url = url.replace(/%40/g, '@');
		options = this._addAuthHeader(url,'POST',options);
		return this._ajax.post(url,options);
	},
	
	// Posts a reply to an existing status update.
	// Options:
	//  username = username
	//  password = password
	//  onSuccess = called on each update
	//  onError = called if there's an error.
	//  text = the content of the status update to post.
	//  replyingToId = ID of the status to which we're replying.
	//
	postReply : function(options) {
		var url = this.url.postUpdate;
		url = this._initUrl(url,null,null,null);
		url = url.replace('STATUS', encodeURIComponent(options.text));
		// Need to un-encode at signs or replies will not work.	
		url = url.replace(/%40/g, '@');
		url = url + '&in_reply_to_status_id=' + options.replyingToId;
		options = this._addAuthHeader(url,'POST',options);
		return this._ajax.post(url,options);
	},
	
	// Posts an echo of an update (this corresponds to twitter's auto-retweet feature)
	// Options:
	//  username = username
	//  password = password
	//  onSuccess = called on each update
	//  onError = called if there's an error.
	//  echoId = ID of the status that we're echoing.
	//
	postEcho : function(options) {
		var url = this.url.postEcho;
		url = this._initUrl(url,null,null,null);
		url = url.replace('RETWEET_ID', options.echoId);
		options = this._addAuthHeader(url,'POST',options);
		return this._ajax.post(url,options);
	},
	
	// Delete's a user's existing post.
	// Options:
	//  username = username
	//  password = password
	//  onSuccess = called on each update
	//  onError = called if there's an error.
	//  deleteId = ID of the status that we're deleting.
	//
	deletePost: function(options) {
		var url = this.url.deletePost;
		url = url.replace('DELETE_ID', options.deleteId);
		options = this._addAuthHeader(url,'POST',options);
		return this._ajax.post(url,options);		
	},
	
	// Posts an echo of an update (this corresponds to twitter's auto-retweet feature)
	// Options:
	//  username = username
	//  password = password
	//  onSuccess = called on each update
	//  onError = called if there's an error.
	//  updateId = ID of the status to which we're echoing.
	//	
	favorite : function(options) {
		var url = this.url.favorite;
		url = url.replace('UPDATE_ID', options.updateId);
		options = this._addAuthHeader(url,'POST',options);
		return this._ajax.post(url,options);		
	},

	// Starts following a user.
	// Options:
	//  username = username
	//  password = password
	//  onSuccess = called on each update
	//  onError = called if there's an error.
	//  userId = ID of the user to stop following.
	//  screenName = screen name of the user to stop following.
	//
	// either the userId or the screenName must be provided.
	//	
	follow : function(options) {
		var url = this.url.follow;
		if (options.userId != undefined) {
			url = url + '?user_id=' + options.userId;
		} else if (options.screenName != undefined) {
			url = url + '?screen_name=' + options.screenName;
		} else {
			throw "Screen Name or User ID required.";
		}
		options = this._addAuthHeader(url,'POST',options);
		return this._ajax.post(url,options);		
	},
	
	// Stops following a user.
	// Options:
	//  username = username
	//  password = password
	//  onSuccess = called on each update
	//  onError = called if there's an error.
	//  userId = ID of the user to stop following.
	//  screenName = screen name of the user to stop following.
	//
	// either the userId or the screenName must be provided.
	//	
	unfollow : function(options) {
		var url = this.url.unfollow;
		if (options.userId != undefined) {
			url = url + '?user_id=' + options.userId;
		} else if (options.screenName != undefined) {
			url = url + '?screen_name=' + options.screenName;
		} else {
			throw "Screen Name or User ID required."
		}
		options = this._addAuthHeader(url,'POST',options);
		return this._ajax.post(url,options);
	},

	// Checks to see if two users are following each other.
	// Options:
	//  username = authorizing username.
	//  password = authorizing password.
	//  sourceUserId = user ID of the source user.
	//  sourceScreenName = screen name of the source user.
	//  targetUserId = user ID of the target user.
	//  targetScreenName = screen name of the target user.
	//  onSuccess = called on each update
	//  onError = called if there's an error.
	//
	// either the sourceUserId or the sourceScreenName must be provided.
	// either the targetUserId or the targetScreenName must be provided.
	//	
	isFollowing : function(options) {
		var url = this.url.isFollowing;

		if (options.sourceUserId != undefined) {
			url = url + '?source_id=' + options.sourceUserId;
		} else if (options.sourceScreenName != undefined) {
			url = url + '?source_screen_name=' + options.sourceScreenName;
		} else {
			throw "Source Screen Name or User ID required.";
		}

		if (options.targetUserId != undefined) {
			url = url + '&target_id=' + options.targetUserId;
		} else if (options.targetScreenName != undefined) {
			url = url + '&target_screen_name=' + options.targetScreenName;
		} else {
			throw "Target Screen Name or User ID required.";
		}
		
		options = this._addAuthHeader(url,'GET',options);
		return this._ajax.get(url,options);	
	},
	
	// Verifies the credentials of a user.  On failure, returns null,
	// otherwise returns a user object.  We don't use Aja here because
	// we want it to be synchronous.
	//
	// This is BASIC authentication. It won't work with OAuth (and thus,
	// with twitter), so override it if you need to.
	//
	verifyCredentials : function(username,password) {
		var req = new XMLHttpRequest();
		if (req.mozBackgroundRequest !== undefined) {
			req.mozBackgroundRequest = true;
		}
		req.open('GET',this.url.verifyCredentials,false,username,password);
		req.send(null);

		if (req.status == 200 && req.responseText != 'NULL') {
			var user = '';
			try {
				user = eval('(' + req.responseText + ')');
			} catch(e) {
				jsdump('Caught an exception trying to login.');
				return null;
			}
			if (user == '') {
				jsdump('JSON parse must have borked?');
				return null;
			}
			return user;
		} else {
			return null;
		}		
	}
}