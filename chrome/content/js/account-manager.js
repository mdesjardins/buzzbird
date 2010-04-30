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

//var AccountManager; if (AccountManager == null) AccountManager = {};

function AccountManager(args) {
	var _loginMgr = Components.classes["@mozilla.org/login-manager;1"]
		                         .getService(Components.interfaces.nsILoginManager);

	this.getAccounts = function() {
		// Cleanup old 'localhost' logins.  In an OAuth-only multi service world, these are no longer needed.
		var logins = _loginMgr.findLogins({}, 'localhost', 'localhost', null);
		if (logins != null && logins.length > 0) {
			for (var i=0, len=logins.length; i<len; i++) {
				_loginMgr.removeLogin(logins[i]);
			}
		}
	
		// Look for Twitter logins.
		var results = new Array();
	
		jsdump('1');
	
		// Look for Twitter logins.
		logins = _loginMgr.findLogins({}, 'twitter', '', null);
		for (var i=0, len=logins.len; i<len; i++) {
			login = logins[i];
			jsdump('adding ' + login.username);
			results.push({
				'username':login.username,
				'password':null,
				'service':'twitter',
				'token':login.usernameField,          // shudder
				'tokenSecret':login.password
			});
		}

		jsdump('2');
		
		// Look for indenti.ca logins.
		logins = 	_loginMgr.findLogins({}, 'identi.ca', '', null);
		for (var i=0, len=logins.len; i<len; i++) {
			login = logins[i];
			results.push({
				'username':login.username,
				'password':login.password,
				'service':'twitter',
				'token':null,
				'tokenSecret':null
			});
		}

		return results;
	}

	this.getAccount = function(username,service) {
		var result = null;
		if (service === "twitter") {
			// Look for Twitter logins.
			logins = _loginMgr.findLogins({}, 'twitter', '', null);
			for (var i=0, len=logins.len; i<len; i++) {
				login = logins[i];
				if (login.username == username) {
					result = {
						'username':login.username,
						'password':null,
						'service':'twitter',
						'token':login.usernameField,          // shudder
						'tokenSecret':login.password
					}
					break;
				}
			}
		} else if (service === "identi.ca") {
			// Look for indenti.ca logins.
			logins = 	_loginMgr.findLogins({}, 'identi.ca', '', null);
			for (var i=0, len=logins.len; i<len; i++) {
				login = logins[i];
				if (login.username == username) {
					result = {
						'username':login.username,
						'password':login.password,
						'service':'twitter',
						'token':null,
						'tokenSecret':null
					};
					break;
				}
			}
		}
		return result;
	}

	this.addAccount = function(login) {
		var nsLoginInfo = new Components.Constructor("@mozilla.org/login-manager/loginInfo;1",
		                                             Components.interfaces.nsILoginInfo,
		                                             "init");
	
		// Make sure to delete old entries when trying to add the new details
		var logins = _loginMgr.findLogins({}, login.service, '', null);
		for (var i=0, len=logins.length; i<len; i++) {
			if (logins[i].username == login.username) {
				_loginMgr.removeLogin(logins[i]);
				break;
			}
		}    
		var loginInfo = null;
		if (Social.service(login.service).support.xAuth) {
			loginInfo = new nsLoginInfo(login.service, '', null, login.username, login.tokenSecret, login.token, '');
		} else {
			loginInfo = new nsLoginInfo(login.service, '', null, login.username, login.password, '', '');	
	  }

		jsdump('adding ' + login.service + ',' + login.username + ',' + login.tokenSecret + ',' + login.token);
		try {
	  	_loginMgr.addLogin(loginInfo);
		} catch(e) {
			jsdump('Error saving login credentials.');
			jsdump(e);
		}
	}

	this.removeAccount = function(login) {
		var nsLoginInfo = new Components.Constructor("@mozilla.org/login-manager/loginInfo;1",
		                                             Components.interfaces.nsILoginInfo,
		                                             "init");
		var loginInfo = null;
		if (Social.service(login.service).support.xAuth) {
			loginInfo = new nsLoginInfo(login.service, '', null, login.username, login.tokenSecret, login.token, '');
		} else {
			loginInfo = new nsLoginInfo(login.service, '', null, login.username, login.password, '', '');	
	  }

	 	_loginMgr.removeLogin(loginInfo);
	}
}
