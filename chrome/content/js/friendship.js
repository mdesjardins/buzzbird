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

function onOk() {
	return true;
}

function populateUserInfo(myUsername, myPassword, hisUserId) {
	Social.service(Ctx.service).fetchUserProfile({
		"username":myUsername,
		"password":myPassword,
		"token": Ctx.token,
		"tokenSecret": Ctx.tokenSecret,
		"queriedUserId":hisUserId,
		"onSuccess": function(profile) { populateUserInfoCallback(profile,hisUserId,myUsername); },
		"onError": function(status) {
			var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
			                        .getService(Components.interfaces.nsIPromptService);
			prompts.alert(window, "Sorry.", "There was an error processing this request.");
		}
	});
}

function populateUserInfoCallback(user,hisUserId,myUsername) {
	document.getElementById('name').value = user.name;
	document.getElementById('username').value = '@' + user.screen_name;
	document.getElementById('avatar').src = user.profile_image_url;
	document.getElementById('followstats').value = 'Following: ' + user.friends_count + ', Followers: ' + user.followers_count; 
	document.getElementById('location').value = user.location;
	document.getElementById('homepage').value = user.url;
	document.getElementById('bio').value = user.description;
}

function friendshipOnLoad() {
	var params = window.arguments[0];
	var hisUserId = params.hisUserId;
	var hisUsername = params.hisUsername;

	populateUserInfo('','',hisUserId);

	browser = document.getElementById('friendship-browser');
	// browser.contentDocument.getElementById('myUsername').value = username;
	// browser.contentDocument.getElementById('myPassword').value = password;
	browser.contentDocument.getElementById('hisUserId').value = hisUserId;
	browser.contentDocument.getElementById('hisUsername').value = hisUsername;

	var am = new AccountManager();
	var logins = am.getAccounts();
	
	// Get Login Manager 
	// var myLoginManager = Components.classes["@mozilla.org/login-manager;1"]
	// 	                         .getService(Components.interfaces.nsILoginManager);
  // Find users for the given parameters
	//    var logins = myLoginManager.findLogins({}, hostname, formSubmitURL, httprealm);
	// 
	//    // Find user from returned array of nsILoginInfo objects
	//    // Will be modified when support for multiple accounts is added.  For now,
	//    // just use the first one we find.
	//    if (logins != null && logins.length > 0) {
	for (var i=0; i<logins.length; i++) {
		var myUsername = logins[i].username;
		var myPassword = logins[i].password;
		jsdump("myUsername=" + myUsername + ", hisUsername=" + hisUsername);
		if (myUsername != hisUsername) {
			// couldn't get this to work.
			//jsdump("window.height=" + window.height);
			//jsdump("window.content.document.height=" + window.content.document.height);
			//if (window.content.document.height < 600) {
			//	jsdump('resizing');
			//	window.resizeBy(0,250);
			//}
			var newText = '<div class="account">' +
						  ' <table style="width:99%;">' +
						  '  <tr>' +
						  '   <td style="width:100px;">' + myUsername + '</td>' +
						  '   <td><span id="followback-' + myUsername + '" class="followback"></span></td>' +
						  '   <td  style="width:40px;">' +
			              '    <img id="throb-' + myUsername + '" src="chrome://buzzbird/content/images/tiny-throbber.gif"/>' + 
			              '    <input id="check-' + myUsername + '" type="checkbox" style="display:none;" onclick="toggleFollow(\'' + myUsername + '\',\'' + myPassword + '\',\'' + hisUserId + '\');"/>' +
						  '   </td>' +
						  '  </tr>' +
						  ' </table>' +
						  '</div>';
			var parser = new DOMParser();
			var doc = parser.parseFromString('<div xmlns="http://www.w3.org/1999/xhtml"><div id="foo">' + newText + '</div></div>', 'application/xhtml+xml');
			if (doc.documentElement.nodeName != "parsererror" ) {
				var root = doc.documentElement;
				for (var j=0; j<root.childNodes.length; ++j) {
					window.content.document.body.insertBefore(document.importNode(root.childNodes[j], true),window.content.document.body.lastChild);
				}
			} else {
				jsdump("render error.");
			}
			getStatus(hisUserId,myUsername,myPassword)
		}
	}
}

function getStatus(hisUserId,myUsername,myPassword) {
	jsdump('Getting friendship status for ' + hisUserId + ' and ' + myUsername + ' on service ' + Ctx.service);
	Social.service(Ctx.service).isFollowing({
		"username":myUsername,
		"password":myPassword,
		"token": Ctx.token,
		"tokenSecret": Ctx.tokenSecret,
		"sourceScreenName":myUsername,
		"targetScreenName":hisUserId,
		"onSuccess": function(result) { getStatusCallback(result,hisUserId,myUsername); },
		"onError": function(status) {
			var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
			                        .getService(Components.interfaces.nsIPromptService);
			prompts.alert(window, "Sorry.", "There was an error processing this request.");
		}
	});
}

function getStatusCallback(friendship,hisUserId,myUsername) {
	jsdump("Callback, result is " + friendship + ", hisUserId " + hisUserId + ", myUsername " + myUsername);
	var meFollowsHe = friendship.relationship.target.followed_by;
	var heFollowsMe = friendship.relationship.target.following;
	var browser = document.getElementById('friendship-browser');
	var throb = browser.contentDocument.getElementById('throb-' + myUsername);
	throb.style.display='none';
	var check = browser.contentDocument.getElementById('check-' + myUsername);
	if (meFollowsHe) {
		jsdump("meFollowsHe is true.");
		check.checked = true;
	}
	var he = friendship.relationship.target.screen_name;
	if (heFollowsMe) {
		jsdump("heFollowsMe is true.");
		browser.contentDocument.getElementById('followback-' + myUsername).innerHTML =
		  '@' + he + ' follows @' + myUsername + '.'		
	} else {
		jsdump("heFollowsMe is false.");
		browser.contentDocument.getElementById('followback-' + myUsername).innerHTML =
		  '@' + he + ' does not follow @' + myUsername + '.'
	}
	check.style.display='inline';
}

function goToAvatar() {
	var username = document.getElementById('username').value;
	linkTo('http://twitter.com/account/profile_image/' + username);
}


