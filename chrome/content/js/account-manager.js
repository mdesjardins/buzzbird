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
function AccountManager() {
	var _loginMgr = Components.classes["@mozilla.org/login-manager;1"]
		                         .getService(Components.interfaces.nsILoginManager);

	this.getAccounts = function() {
		jsdump('getAccounts');
		
		// Cleanup old 'localhost' logins.  In an OAuth-only multi service world, these are no longer needed.
		var logins = _loginMgr.findLogins({}, 'localhost', 'localhost', null);
		if (logins != null && logins.length > 0) {
			for (var i=0, len=logins.length; i<len; i++) {
				_loginMgr.removeLogin(logins[i]);
			}
		}
	
		var results = new Array();
		for (var i=0,len=Global.supportedServices.length; i<len; i++) {
			service = Global.supportedServices[i];
			jsdump('Service ' + service);
			logins = _loginMgr.findLogins({}, service, '', null);
			for (var j=0, len=logins.length; j<len; j++) {
				login = logins[j];
				jsdump('login: ' + login.username);
				if (Social.service(service).support.xAuth) {
					results.push({
						'username':login.username,
						'password':null,
						'service':service,
						'token':login.usernameField,          // shudder
						'tokenSecret':login.password
					});
				} else {
					results.push({
						'username':login.username,
						'password':login.password,
						'service':service,
						'token':null,
						'tokenSecret':null
					});
				}
			}
		}
		return results;
	}

	this.getAccount = function(username,service) {
		var result = null;
		for (var i=0,len=Global.supportedServices.length; i<len; i++) {
			aService = Global.supportedServices[i];
			if (aService == service) {
				logins = _loginMgr.findLogins({}, service, '', null);
				for (var j=0, len=logins.length; j<len; j++) {
					login = logins[j];
					if (login.username == username) {
						if (Social.service(service).support.xAuth) {
							result = {
								'username':login.username,
								'password':null,
								'service':'twitter',
								'token':login.usernameField,          // shudder
								'tokenSecret':login.password
							};
							break;
						} else {
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

		jsdump("About to add login " + login.service + ", " + login.username + ", secret=" + login.tokenSecret + ", password=" + login.password);
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
