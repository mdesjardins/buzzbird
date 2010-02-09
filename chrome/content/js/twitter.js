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
		autoRetweet: true,
		governor: false,
		authenticate: true,
		follow: true,
		unfollow: true
	},
	
	url : {
		fetchTimeline: 'http://twitter.com/statuses/home_timeline.json?count=COUNT',
		fetchMentions: 'http://twitter.com/statuses/mentions.json?count=COUNT',
		fetchDirectTo: 'http://twitter.com/direct_messages.json?count=COUNT',
		fetchUserTimeline: 'http://twitter.com/statuses/user_timeline/QUERIED_USER_ID.json?count=COUNT',
		fetchRetweetedByMe: 'http://twitter.com/statuses/retweeted_by_me.json?count=COUNT',
		fetchUserProfile: 'http://twitter.com/users/show/QUERIED_USER_ID.json',
		postUpdate: 'http://twitter.com/statuses/update.json?status=STATUS'
	},
	
	_funcs : [],
	
	// A lot of this AJAXery was inspired by the jx.js library.
	// http://www.openjs.com/scripts/jx/
	//
	_ajax : function(username,password,url,callback,method) {
		try {
			http = new XMLHttpRequest();
		} catch (e) {
			http = false;
		}
		if (http) {
			http.overrideMimeType('application/json');
			http.open(method,url,true);	
			var tok = username + ':' + password;
		  	var hash = Base64.encode(tok);
			http.setRequestHeader('Authorization', 'Basic ' + hash);
			http.onreadystatechange = function() {
				if (http.readyState == 4) {
					if (http.status == 200) {
						var result = "";
						if (http.responseText) {
							result = http.responseText;
							result = result.replace(/[\n\r]/g,"");
							result = eval('('+result+')');
						}
						if (callback) {
							callback(result);
						}
					} else {
						if (error) {
							result = { error: http.status };
							callback(result);
							error(http.status); // TODO - Error Callback
						}
					}
				}
			}
			http.send(null);
		}
	},
	
	_ajaxGet : function(username,password,url,callback) {
		return this._ajax(username,password,url,callback,"GET");
	},
	
	_ajaxPost : function(username,password,url,callback) {
		return this._ajax(username,password,url,callback,"POST");
	},
	
	_initUrl : function(url,username,password,count,since,queriedId) {
		url = url.replace("USERNAME",username);
		url = url.replace("PASSWORD",password);
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
		return url;
	},
	
	fetchTimeline : function(username,password,callback,count,since) {
		var url = this.url.fetchTimeline;
		url = this._initUrl(url,username,password,count,since,null);
		return this._ajaxGet(username,password,url,callback);
	},
	
	fetchMentions : function(username,password,callback,count) {
		var url = this.url.fetchMentions;
		url = this._initUrl(url,username,password,count,null,null);
		return this._ajaxGet(username,password,url,callback);
	},
	
	fetchDirectTo : function(username,password,callback,count,since) {
		var url = this.url.fetchDirectTo;
		url = this._initUrl(url,username,password,count,since,null);
		return this._ajaxGet(username,password,url,callback);
	},
	
	fetchUserTimeline : function(username,password,callback,queriedUserId,count) {
		var url = this.url.fetchUserTimeline;
		url = this._initUrl(url,username,password,count,null,queriedUserId);
		return this._ajaxGet(username,password,url,callback);
	},
	
	fetchUserProfile : function(username,password,callback,queriedUserId) {
		var url = this.url.fetchUserTimeline;
		url = this._initUrl(url,username,password,0,null,queriedUserId);
		return this._ajaxGet(username,password,url,callback);
	},	
	
	postUpdate : function(username,password,callback,text) {
		var url = this.url.postUpdate;
		url = this._initUrl(url,username,password,0,null,queriedUserId);
		url = url.replace('STATUS', encodeURIComponent(text));
		// Need to un-encode at signs or replies will not work.	
		url = url.replace(/%40/g, '@');
		return this._ajaxPost(username,password,url,callback);
	},
	
	postReply : function(username,password,callback,text,replyingToId) {
		var url = this.url.postUpdate;
		url = this._initUrl(url,username,password,0,null,queriedUserId);
		url = url + '?status=' + encodeURIComponent(tweet);
		// Need to un-encode at signs or replies will not work.	
		url = url.replace(/%40/g, '@');
		url = url + '&in_reply_to_status_id=' + replyingToId;
		return this._ajaxPost(username,password,url,callback);
	},
	
	// The next three functions can be used to perform a single update.
	// Options:
	//  username = username
	//  password = password
	//  onFetched = called on each update
	//  onFinished = called after all updates
	//  count = number of tweets to ask for.
	//  directSince = fetch directs since this ID
	//  timelineSince = fetch timeline tweets since this ID
	//  allMentions = (true|false) fetch all mentions, too.
	//
	fetchAll : function(options) {
		var u = options.username;
		var p = options.password;
		var c = function(transport) { BzTwitter._fetchOneCallback(transport,options); };
		if (options.allMentions == undefined || options.allMentions == false) {
			this._funcs = [function() {BzTwitter.fetchDirectTo(u,p,c,options.count,options.directSince);},
			               function() {BzTwitter.fetchTimeline(u,p,c,options.count,options.timelineSince);}];
		} else {
			this._funcs = [function() {BzTwitter.fetchDirectTo(u,p,c,options.count,options.directSince);},
			               function() {BzTwitter.fetchMentions(u,p,c,options.count);},
			               function() {BzTwitter.fetchTimeline(u,p,c,options.count,options.timelineSince);}];
		}
		this._fetchOne(options);
	},
	
	_fetchOne : function(options) {
		var func = this._funcs.shift();
		if (func == undefined && options.onFinished != undefined) {
			options.onFinished();
		} else {
			func();
		}
	},
	
	_fetchOneCallback : function(transport,options) {
		options.onFetched(transport);
		this._fetchOne(options);
	}
}