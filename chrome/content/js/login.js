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


Components.utils.import("resource://app/chrome/content/js/global.js");  


var passwordManager = Components.classes["@mozilla.org/login-manager;1"]
                                .getService(Components.interfaces.nsILoginManager);

var hostname = 'localhost';
var formSubmitURL = 'localhost';  
// twitter.com
// realm = Twitter API
var httprealm = null;
var user = '';
var password = '';

try {
	// Get Login Manager 
	var myLoginManager = Components.classes["@mozilla.org/login-manager;1"]
		                         .getService(Components.interfaces.nsILoginManager);

	// Find users for the given parameters
	var logins = myLoginManager.findLogins({}, hostname, formSubmitURL, httprealm);		
	for (var i=0, len=logins.length; i<len; i++) {
		jsdump("LOGIN... username: " + logins[i].username + ", password: " + logins[i].password + ", hostname: " + logins[i].hostname + ", httpRealm: " + logins[i].httpRealm + ", formSubmitURL:" + logins[i].formSubmitURL);
	}

	// Find user from returned array of nsILoginInfo objects
	// Will be modified when support for multiple accounts is added.  For now,
	// just use the first one we find.
	if (logins != null && logins.length > 0) {
		user = logins[0].username;
		password = logins[0].password;
		authenticate(user,password,false);
	} else {
		jsdump('No saved logins found.');	
	}

	updateLoginList();
	getChromeElement('accountmenu-' + user).setAttribute("checked","true");
} catch (e) {
  // This will only happen if there is no nsILoginManager component class
  jsdump('Oops - failed at autologin: ' + e);
}

function checkEnter(e) {
	if (e.which == 13) {
		doAuthenticate();
	}
}

function doAuthenticate() {
	username = getBrowser().contentDocument.getElementById('username').value;
	password = getBrowser().contentDocument.getElementById('password').value;
	saveCreds = getBrowser().contentDocument.getElementById('saveCredentials').checked;
	authenticate(username,password,saveCreds);	
}
