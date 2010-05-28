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

function Identica() {
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
		xAuth: false
	};
	
	this.urlBase = "https://identi.ca/api";
}
Identica.prototype = new Twitteresque();

// Verifies the credentials of a user.  On failure, returns null,
// otherwise returns a user object.  We don't use Aja here because
// we want it to be synchronous.
//
Identica.prototype.verifyCredentials = function(username,password) {
	var req = new XMLHttpRequest();
	req.mozBackgroundRequest = true;
	var url = this._initUrl(this.url.verifyCredentials, null, null, null);
	jsdump("Verifying identica credentials, using " + url + " - " + username + "," + password);

	req.open('GET',url,false,username,password);
	req.send(null);

	if (req.status == 200) {
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