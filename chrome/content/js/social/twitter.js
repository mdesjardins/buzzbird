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

function Twitter() {
	this.support = {
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
	};
	
	this.urlBase = "http://api.twitter.com/1";
	
	this.url.accessToken = 'https://api.twitter.com/oauth/access_token';
	this.url.fetchLists = 'https://api.twitter.com/1/QUERIED_SCREEN_NAME/lists.json';
	
	// I really don't understand how this is supposed to work for an opensource
	// application.  So, what, now any application can spoof being buzzbird?
	// How is that a good thing?
	//
	this.oauth = {
		consumerKey: '7tKJTFfI0MeSO8EUSZslkg',
		consumerSecret: 'XOYOcB76ZtgSOicqCEOKZEIGxBN7itETYPRpVjlo'
	}
}
Twitter.prototype = new Twitteresque();

// Verifies the credentials of a user.  On failure, returns null,
// otherwise returns a user object.  We don't use Aja here because
// we want it to be synchronous.
//
Twitter.prototype.verifyCredentials = function(username,password) {
	jsdump('in verifyCredentials.');
	var result = null;
	var opts = {
		consumerKey: this.oauth.consumerKey,
		consumerSecret: this.oauth.consumerSecret,
	};

	var message = {
		method:'POST',
		action:this.url.accessToken,
		parameters: [
			['x_auth_username', username],
			['x_auth_password', password],
			['x_auth_mode', 'client_auth']
		]
	}
	
	OAuth.completeRequest(message,opts);
	var authHeader = OAuth.getAuthorizationHeader('',message.parameters);
	jsdump('authHeader='+authHeader);
	
	// Aja doesn't suppose synchronous calls yet. :(
	// Do this the old fashioned way...
	var req = new XMLHttpRequest();
	if (req.mozBackgroundRequest !== undefined) {
		req.mozBackgroundRequest = true;
	}
	var postBody = "x_auth_username=" + encodeURIComponent(username) + "&x_auth_password=" + encodeURIComponent(password) + "&x_auth_mode=client_auth";
	req.open('POST',this.url.accessToken,false);
	req.setRequestHeader('Authorization', authHeader);
	req.setRequestHeader('Content-length', postBody.length);
	req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	jsdump('here we go...');
	req.send(postBody);

	if (req.status == 200 && req.responseText != null) {
		var result = '';
		try {
			data = OAuth.decodeForm(req.responseText);
			token = OAuth.getParameter(data, 'oauth_token');
			tokenSecret = OAuth.getParameter(data, 'oauth_token_secret');
			result = {
				'accessToken':token,
				'accessTokenSecret':tokenSecret
			};
		} catch(e) {
			jsdump('Caught an exception trying to login.');
		}
		if (result == '') {
			jsdump('OAuth parse must have borked?');
			return null;
		}
	}
	return result;	
};
	
// Fetches the user's timeline.
// Options:
//  username = username
//  password = password
//  onSuccess = called on each update
//  onError = called if there's an error.
//
Twitter.prototype.fetchLists = function(options) {
	var url = this.url.fetchLists;
	url = this._initUrl(url, options.count, options.since, null);
	url = url.replace('QUERIED_SCREEN_NAME',options.username);
//	options = this._addAuthHeader(url,'GET',options);
	return this._ajax.get(url,options);
};

// Fetches the user's timeline.
// Options:
//  username = username
//  password = password
//  onSuccess = called on each update
//  onError = called if there's an error.
//  count = number of tweets to ask for.
//  since = fetch timeline tweets since this ID
//
Twitter.prototype.fetchTimeline = function(options) {
	jsdump("=== twitter flavor of fetchTimeline");
	var url = this.url.fetchTimeline;
	url = this._initUrl(url, options.count, options.since, null);
	url = url + "&include_rts=true";
	options = this._addAuthHeader(url,'GET',options);
	return this._ajax.get(url,options);
};
	
