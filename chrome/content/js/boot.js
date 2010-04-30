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
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

/*
 * This is the "bootstrap" code that runs when Buzzbird first starts up.  It
 * checks the password manager to see if there's a login that we can auto-login
 * with, and if not, it presents the user with a page where they can enter their
 * login info.
 */

//var passwordManager = Components.classes["@mozilla.org/login-manager;1"]
//                                .getService(Components.interfaces.nsILoginManager);

//var hostname = 'localhost';
//var formSubmitURL = 'localhost';  
// twitter.com
// realm = Twitter API
//var httprealm = null;
//var user = '';
//var password = '';

try {
	var am = new AccountManager();
	var logins = am.getAccounts();
	if (logins != null && logins.length > 0) {
		jsdump('Found logins');
		var login = logins[0]; // autologin with the first account.
		jsdump('First login is ' + login.username);
		jsdump('First service is ' + login.service);
		if (Social.service(login.service).support.xAuth || login(login.username,login.password,login.service)) {
			Ctx.user = login.username;
			Ctx.password = login.password;
			Ctx.list = null;
			Ctx.service = login.service;
			Ctx.token = login.token;
			Ctx.tokenSecret = login.tokenSecret;
			var interval = getIntPref('buzzbird.update.interval',180000);
			Global.updateTimer = getMainWindow().setInterval( function(that) { that.cycleFetch(); }, interval, getMainWindow());
			getBrowser().loadURI("chrome://buzzbird/content/main.html",null,"UTF-8");
			updateLoginList();
			getChromeElement('accountmenu-' + user).setAttribute("checked","true");
		}
	} else {
		jsdump('No saved logins found.');	
	}
} catch (e) {
  // This will only happen if there is no nsILoginManager component class
  jsdump('Oops - failed at autologin: ' + e);
}

function checkEnter(e) {
	if (e.which == 13) {
		manualFirstLogin();
	}
}

function manualFirstLogin() {
	var username = getBrowser().contentDocument.getElementById('username').value;
	var password = getBrowser().contentDocument.getElementById('password').value;
	var service = getBrowser().contentDocument.getElementById('service').value;
	var save = getBrowser().contentDocument.getElementById('saveCredentials').checked;
//	firstLogin(u,p,s,save);	

	message("Authenticating");
	getBrowser().contentDocument.getElementById('loginThrobber').style.display = 'inline';
	getBrowser().contentDocument.getElementById('username').disabled = true;
	getBrowser().contentDocument.getElementById('password').disabled = true;
	getBrowser().contentDocument.getElementById('loginOkButton').disabled = true;

	var token = login(username,password,service)
	if (token) {
		if (save) {
			var accessToken = null;
			var accessTokenSecret = null;
			if (Social.service(service).support.xAuth) {
				accessToken = token.accessToken;
				accessTokenSecret = token.accessTokenSecret;
			}
			var am = new AccountManager();
			am.addAccount({
				'username':username,
				'password':password,
				'service':service,
				'token':accessToken,
				'tokenSecret':accessTokenSecret
			});
//			saveCredentials(username,password,service,token);
		}
		var interval = getIntPref('buzzbird.update.interval',180000);
		Global.updateTimer = getMainWindow().setInterval( function(that) { that.cycleFetch(); }, interval, getMainWindow());
		getBrowser().loadURI("chrome://buzzbird/content/main.html",null,"UTF-8");
	} else {
		message("");
		getBrowser().contentDocument.getElementById('badAuth').style.display = 'inline';
		getBrowser().contentDocument.getElementById('loginThrobber').style.display = 'none';
		getBrowser().contentDocument.getElementById('username').disabled = false;
		getBrowser().contentDocument.getElementById('password').disabled = false;
		getBrowser().contentDocument.getElementById('loginOkButton').disabled = false;
		getBrowser().contentDocument.getElementById('password').focus(); 
	}
}

// // Called if either the user enters login info, or we find a usable login in
// // the password manager.
// function firstLogin(username,password,service,save) {
// }
// 
// // Save these credentials as the new default if it does not already exist.
// //
// function saveCredentials(username,password,service,token) {
// 	var loginManager = Components.classes["@mozilla.org/login-manager;1"]
// 		                         .getService(Components.interfaces.nsILoginManager);
// 	var nsLoginInfo = new Components.Constructor("@mozilla.org/login-manager/loginInfo;1",
// 	                                             Components.interfaces.nsILoginInfo,
// 	                                             "init");
// 
// 	// Make sure to delete old entries when trying to add the new details
// 	var logins = loginManager.findLogins({}, service, null, null);
// 	for (var i=0, len=logins.length; i<len; i++) {
// 		if (logins[i].username == username) {
// 			loginManager.removeLogin(logins[i]);
// 			break;
// 		}
// 	}    
// 
// 	var loginInfo = null;
// 	if (Social.service(service).support.xAuth) {
// 		loginInfo = new nsLoginInfo(service, null, null, username, '', token.accessToken, token.accessTokenSecret);
// 	} else {
// 		loginInfo = new nsLoginInfo(service, null, null, username, password, '', '');	
//   }
// 
//   loginManager.addLogin(loginInfo);
// }

