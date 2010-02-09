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

var BzTwitter {
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
	
	// Creds in the URL obviously needs to die a swift, painless death soon.
	url : {
		fetchTimeline: 'http://USERNAME:PASSWORD@twitter.com/statuses/home_timeline.json?count=COUNT&since_id=SINCE',
		fetchMentions: 'http://USERNAME:PASSWORD@twitter.com/statuses/mentions.json?count=COUNT',
		fetchDirectTo: 'http://USERNAME:PASSWORD@twitter.com/direct_messages.json?count=COUNT&since_id=SINCE',
		fetchUserTimeline: 'http://USERNAME:PASSWORD@twitter.com/statuses/user_timeline/QUERIED_USER_ID.json?count=COUNT',
		fetchUserProfile: 'http://USERNAME:PASSWORD@twitter.com/users/show/QUERIED_USER_ID.json';
		postUpdate: 'http://USERNAME:PASSWORD@twitter.com/statuses/update.json?status=STATUS';
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
			http.overrideMimeType('text/xml');
			http.open(method,url,true);
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
							error(http.status);
						}
					}
				}
			}
			http.send(null);
		}
	},
	
	_ajaxGet : function(username,password,url,callback) {
		return ajax(username,password,url,callback,"GET");
	},
	
	_ajaxPost : function(username,password,url,callback) {
		return ajax(username,password,url,callback,"POST");
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
		if (url.match(/SINCE/)) {
			if (since == undefined || since == null) {
				since = 0;
			}
			url = url.replace("SINCE",since);			
		}
		if (url.match(/QUERIED_USER_ID/) {
			url = url.replace("QUERIED_USER_ID",queriedUserId)
		}
		return url;
	},
	
	fetchTimeline : function(username,password,callback,count,since) {
		var url = url.fetchTimeline;
		url = this._initUrl(url,username,password,count,since,null);
		return this._ajaxGet(username,password,url,callback);
	},
	
	fetchMentions : function(username,password,callback,count) {
		var url = url.fetchMentions;
		url = this._initUrl(url,username,password);
		return this._ajaxGet(username,password,url,callback);
	},
	
	fetchDirectTo : function(username,password,callback,count,since) {
		var url = url.fetchDirectTo;
		url = this._initUrl(url,username,password,count,since,null);
		return this._ajaxGet(username,password,url,callback);
	},
	
	fetchUserTimeline : function(username,password,callback,queriedUserId,count) {
		var url = url.fetchUserTimeline;
		url = this._initUrl(url,username,password,count,null,queriedUserId);
		return this._ajaxGet(username,password,url,callback);
	},
	
	fetchUserProfile : function(username,password,callback,queriedUserId) {
		var url = url.fetchUserTimeline;
		url = this._initUrl(url,username,password,0,null,queriedUserId);
		return this._ajaxGet(username,password,url,callback);
	},	
	
	postUpdate : function(username,password,callback,text) {
		var url = url.postUpdate;
		url = this._initUrl(url,username,password,0,null,queriedUserId);
		url = url.replace('STATUS', encodeURIComponent(text));
		// Need to un-encode at signs or replies will not work.	
		url = url.replace(/%40/g, '@');
		return this._ajaxPost(username,password,url,callback);
	},
	
	postReply : function(username,password,callback,text,replyingToId) {
		var url = url.postUpdate;
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
	//
	fetchAll : function(options) {
		var u = options.username;
		var p = options.password;
		var c = function(transport) { this._fetchOneCallback(transport,options); };
		this._funcs = [function() {this.fetchDirectTo(u,p,c,options.count);},
		               function() {this.fetchMentions(u,p,c,options.count,drectSince);},
		               function() {this.fetchTimeline(u,p,c,options.count,options.timelineSince);}];
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
		_fetchOne(options);
	}
}