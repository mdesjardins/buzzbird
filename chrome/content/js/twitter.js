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
		autoRetweet: true,
		governor: false,
		authenticate: true,
		follow: true,
		unfollow: true
	},
	
	url : {
		fetchTimeline: 'http://USERNAME:PASSWORD@twitter.com/statuses/home_timeline.json?count=COUNT&since_id=SINCE',
		fetchMentions: 'http://USERNAME:PASSWORD@twitter.com/statuses/mentions.json?count=COUNT',
		fetchDirectTo: 'http://USERNAME:PASSWORD@twitter.com/direct_messages.json?count=COUNT',
		fetchUserTimeline: 'http://USERNAME:PASSWORD@twitter.com/statuses/user_timeline/QUERIED_USER_ID.json?count=COUNT',
		fetchUserProfile: 'http://USERNAME:PASSWORD@twitter.com/users/show/QUERIED_USER_ID.json';
	}
	
	// A lot of this AJAXery was inspired by the jx.js library.
	// http://www.openjs.com/scripts/jx/
	//
	ajax : function(username,password,url,callback,method) {
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
	
	ajaxGet : function(username,password,url,callback) {
		return ajax(username,password,url,callback,"GET");
	},
	
	ajaxPost : function(username,password,url,callback) {
		return ajax(username,password,url,callback,"POST");
	},
	
	fetchTimeline : function(username,password,callback,count,since) {
		var url = url.fetchTimeline;
		url = url.replace("USERNAME",username);
		url = url.replace("PASSWORD",password);
		url = url.replace("COUNT",count);
		url = url.replace("SINCE",since);
		return ajaxGet(username,password,url,callback);
	},
	
	fetchMentions : function(username,password,callback,count) {
		var url = url.fetchMentions;
		url = url.replace("USERNAME",username);
		url = url.replace("PASSWORD",password);
		url = url.replace("COUNT",count);
		return ajaxGet(username,password,url,callback);
	},
	
	fetchDirectTo : function(username,password,callback,count) {
		var url = url.fetchDirectTo;
		url = url.replace("USERNAME",username);
		url = url.replace("PASSWORD",password);
		url = url.replace("COUNT",count);
		return ajaxGet(username,password,url,callback);
	},
	
	fetchUserTimeline : function(username,password,callback,queriedUserId,count) {
		var url = url.fetchUserTimeline;
		url = url.replace("USERNAME",username);
		url = url.replace("PASSWORD",password);
		url = url.replace("COUNT",count);
		url = url.replace("QUERIED_USER_ID",queriedUserId);
		return ajaxGet(username,password,url,callback);
	},
	
	fetchUserProfile : function(username,password,callback,queriedUserId) {
		var url = url.fetchUserTimeline;
		url = url.replace("USERNAME",username);
		url = url.replace("PASSWORD",password);
		url = url.replace("QUERIED_USER_ID",queriedUserId);
		return ajaxGet(username,password,url,callback);
	},	
}