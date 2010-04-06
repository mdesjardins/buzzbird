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
//
// The Base64 Encoding stuff is from http://www.webtoolkit.info/
//
var Base64 = {
 
	// private property
	_keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
 
	// public method for encoding
	encode : function (input) {
		var output = "";
		var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
		var i = 0;
 
		input = Base64._utf8_encode(input);
 
		while (i < input.length) {
			chr1 = input.charCodeAt(i++);
			chr2 = input.charCodeAt(i++);
			chr3 = input.charCodeAt(i++);
 
			enc1 = chr1 >> 2;
			enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
			enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
			enc4 = chr3 & 63;
 
			if (isNaN(chr2)) {
				enc3 = enc4 = 64;
			} else if (isNaN(chr3)) {
				enc4 = 64;
			}
 
			output = output +
			this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
			this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
		}
		return output;
	},
 
	// public method for decoding
	decode : function (input) {
		var output = "";
		var chr1, chr2, chr3;
		var enc1, enc2, enc3, enc4;
		var i = 0;
 
		input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
 
		while (i < input.length) {
			enc1 = this._keyStr.indexOf(input.charAt(i++));
			enc2 = this._keyStr.indexOf(input.charAt(i++));
			enc3 = this._keyStr.indexOf(input.charAt(i++));
			enc4 = this._keyStr.indexOf(input.charAt(i++));
 
			chr1 = (enc1 << 2) | (enc2 >> 4);
			chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
			chr3 = ((enc3 & 3) << 6) | enc4;
 
			output = output + String.fromCharCode(chr1);
 
			if (enc3 != 64) {
				output = output + String.fromCharCode(chr2);
			}
			if (enc4 != 64) {
				output = output + String.fromCharCode(chr3);
			}
		}
 
		output = Base64._utf8_decode(output);
		return output;
 
	},
 
	// private method for UTF-8 encoding
	_utf8_encode : function (string) {
		string = string.replace(/\r\n/g,"\n");
		var utftext = "";
 
		for (var n = 0; n < string.length; n++) {
			var c = string.charCodeAt(n);
			if (c < 128) {
				utftext += String.fromCharCode(c);
			}
			else if((c > 127) && (c < 2048)) {
				utftext += String.fromCharCode((c >> 6) | 192);
				utftext += String.fromCharCode((c & 63) | 128);
			}
			else {
				utftext += String.fromCharCode((c >> 12) | 224);
				utftext += String.fromCharCode(((c >> 6) & 63) | 128);
				utftext += String.fromCharCode((c & 63) | 128);
			}
		}
		return utftext;
	},
 
	// private method for UTF-8 decoding
	_utf8_decode : function (utftext) {
		var string = "";
		var i = 0;
		var c = c1 = c2 = 0;
 
		while ( i < utftext.length ) {
			c = utftext.charCodeAt(i);
 
			if (c < 128) {
				string += String.fromCharCode(c);
				i++;
			}
			else if((c > 191) && (c < 224)) {
				c2 = utftext.charCodeAt(i+1);
				string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
				i += 2;
			}
			else {
				c2 = utftext.charCodeAt(i+1);
				c3 = utftext.charCodeAt(i+2);
				string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
				i += 3;
			}
		}
		return string;
	}
}

// First based on jx.js
// Pooling based on http://drakware.com/?e=3
function Aja() {
	this.waitFor = 5000;  
	var _that = this;
	var _http = false;
	var _timer = null;
	var _reqPool = new Array();
	
	function reqTimeout(httpReq) {
		if (callInProgress(httpReq.http)) {
			jsdump(">>> Timeout.");
			httpReq.http.abort();
			window.clearTimeout(httpReq.timer);
			httpReq.freed = 1
		}
	}

	function callInProgress(http) {
		switch (http.readyState) {
			case 1,2,3:
				return true;
				break;
			default:
				return false;
				break;
		}
	}
	
	function XmlReqWrapper(freed) {
		this.freed = freed; 
		this.http = false; 
		this.timer = false;
		if (window.XMLHttpRequest) { 
			this.http = new XMLHttpRequest(); 
		} else if (window.ActiveXObject) { 
			this.http = new ActiveXObject("Microsoft.XMLHTTP"); 
		} 
	}
	
	function getXmlReqIndex() {
		var pos = -1; 
		for (var i=0; i<_reqPool.length; i++) { 
			if (_reqPool[i].freed == 1) { 
				// Reuse one from the pool
				pos = i; 
				break; 
			} 
		} 
		if (pos == -1) { 
			// Gotta make a new one.
			pos = _reqPool.length; 
			_reqPool[pos] = new XmlReqWrapper(0); 
		} 
		_reqPool[pos].freed = 0;
		_reqPool[pos].timer = window.setTimeout(function() { reqTimeout(_reqPool[pos]); }, _that.waitFor);
		jsdump("XMLReq Pool Depth " + _reqPool.length + ", using index " + pos + ".");
		return pos;
	}
	
	function freeXmlReq(pos) {
		jsdump("Freeing " + pos);
		window.clearTimeout(_reqPool[pos].timer);
		_reqPool[pos].freed = 1
	}
	
	
	function exec(username,password,url,callback,error,method) {
		var _reqPoolIndex = getXmlReqIndex()
		var _httpReq = _reqPool[_reqPoolIndex];
		var _http = _httpReq.http;
		if (_http) {
			_http.overrideMimeType('application/json');
			jsdump('_ajax opening ===> ' + url);
			_http.open(method,url,true);	
			
			if (username != null && username != undefined && username != "" &&
				  password != null && password != undefined && password != "") {
				//_http.open(method,url,true,username,password);	
				var tok = username + ':' + password;
				var hash = Base64.encode(tok);
				_http.setRequestHeader('Authorization', 'Basic ' + hash);
			} //else {
				//_http.open(method,url,true);	
			//}
			_http.onreadystatechange = function() {
				if (_http.readyState == 4) {
					if (_http.status == 200 || _http.status == 304) {
						var result = "";
						if (_http.responseText) {
							result = _http.responseText;
							result = result.replace(/[\n\r]/g,"");
							result = eval('('+result+')');
						}
						if (callback) {
							callback(result);
						}
					} else {
						if (error) {
							var status = 100;
							if (_http.status != null && _http.status != undefined) {
								status = _http.status;
							}
							result = { 'error': status };
							if (callback) {
								callback(result);	
							}
							error(status); 
						}
					}
					freeXmlReq(_reqPoolIndex);
				}
			}
			try {
				_http.send(null);
			} catch(e) {
				jsdump('Problem calling send: ' + e);
				reqTimeout(_http);
			}
		}
	}

	this.get = function(username,password,url,callback,error) {
		return exec(username,password,url,callback,error,"GET");
	}

	this.post = function(username,password,url,callback,error) {
		return exec(username,password,url,callback,error,"POST");
	}
}


var BzTwitter = {
	support : {
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
		verifyCredentials: true
	},
	
	url : {
		fetchTimeline: 'http://api.twitter.com/1/statuses/home_timeline.json?count=COUNT',
		fetchMentions: 'http://api.twitter.com/1/statuses/mentions.json?count=COUNT',
		fetchDirectTo: 'http://api.twitter.com/1/direct_messages.json?count=COUNT',
		fetchDirectFrom: 'http://api.twitter.com/1/direct_messages/sent.json?count=COUNT',
		fetchUserTimeline: 'http://api.twitter.com/1/statuses/user_timeline/QUERIED_USER_ID.json?count=COUNT',
		fetchRetweetedByMe: 'http://api.twitter.com/1/statuses/retweeted_by_me.json?count=COUNT',
		fetchUserProfile: 'http://api.twitter.com/1/users/show/',
		fetchSingleUpdate: 'http://api.twitter.com/1/statuses/show/STATUS_ID.json',
		postUpdate: 'http://api.twitter.com/1/statuses/update.json?status=STATUS&source=SOURCE',
		postEcho: 'http://api.twitter.com/1/statuses/retweet/RETWEET_ID.json?source=SOURCE',
		deletePost: 'http://api.twitter.com/1/statuses/destroy/DELETE_ID.json?source=SOURCE',
		favorite: 'http://api.twitter.com/1/favorites/create/UPDATE_ID.json',
		follow: 'http://api.twitter.com/1/friendships/create.json',
		unfollow: 'http://api.twitter.com/1/friendships/destroy.json',
		isFollowing: 'http://api.twitter.com/1/friendships/show.json',
		verifyCredentials: 'https://api.twitter.com/1/account/verify_credentials.json',
		fetchLists: 'http://api.twitter.com/1/QUERIED_SCREEN_NAME/lists.json'
	},
	
	_source : "buzzbird",
	
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
			url = url.replace("SOURCE",BzTwitter._source)
		}
		return url;
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
		return this._ajax.get(options.username, options.password, url, options.onSuccess, options.onError);
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
		return this._ajax.get(options.username, options.password, url, options.onSuccess, options.onError);
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
		return this._ajax.get(options.username, options.password, url, options.onSuccess, options.onError);
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
		return this._ajax.get(options.username, options.password, url, options.onSuccess, options.onError);
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
		return this._ajax.get(options.username, options.password, url, options.onSuccess, options.onError);
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
		return this._ajax.get(options.username, options.password, url, options.onSuccess, options.onError);
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
		return this._ajax.get(options.username, options.password, url, options.onSuccess, options.onError);
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
		return this._ajax.post(options.username, options.password, url, options.onSuccess, options.onError);
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
		return this._ajax.post(options.username, options.password, url, options.onSuccess, options.onError);
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
		return this._ajax.post(options.username, options.password, url, options.onSuccess, options.onError);
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
		return this._ajax.post(options.username, options.password, url, options.onSuccess, options.onError);		
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
		return this._ajax.post(options.username, options.password, url, options.onSuccess, options.onError);		
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
			return null; // TODO THROW EXCEPTION
		}
		return this._ajax.post(options.username, options.password, url, options.onSuccess, options.onError);		
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
			return null; // TODO THROW EXCEPTION
		}
		jsdump('unfollow URL=' + url);
		return this._ajax.post(options.username, options.password, url, options.onSuccess, options.onError);		
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
			return null; // TODO THROW EXCEPTION
		}

		if (options.targetUserId != undefined) {
			url = url + '&target_id=' + options.targetUserId;
		} else if (options.targetScreenName != undefined) {
			url = url + '&target_screen_name=' + options.targetScreenName;
		} else {
			return null; // TODO THROW EXCEPTION
		}
		
		jsdump('isFollowing URL=' + url);
		return this._ajax.get(null, null, url, options.onSuccess, options.onError);		
	},
	
	// Fetches the user's timeline.
	// Options:
	//  username = username
	//  password = password
	//  onSuccess = called on each update
	//  onError = called if there's an error.
	//
	fetchLists : function(options) {
		var url = this.url.fetchLists;
		url = this._initUrl(url, options.count, options.since, null);
		url = url.replace('QUERIED_SCREEN_NAME',options.username);
		return this._ajax.get(options.username, options.password, url, options.onSuccess, options.onError);
	},
	
	// Verifies the credentials of a user.  On failure, returns null,
	// otherwise returns a user object.  We don't use Aja here because
	// we want it to be synchronous.
	//
	verifyCredentials : function(username,password) {
		var req = new XMLHttpRequest();
		req.mozBackgroundRequest = true;
		req.open('GET',this.url.verifyCredentials,false,username,password);
		req.send(null);

		// var re = /\{"request":NULL.*?/;
		// if (re.match(req.responseText)) {
		// 	jsdump ("Badness in twitter response.  Perhaps down for maintenance?");
		// 	jsdump(req.responseText);
		// 	return null;
		// }

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