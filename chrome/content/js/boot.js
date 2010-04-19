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

	// Find user from returned array of nsILoginInfo objects.  Just use the first
	// one that we find for now.
	if (logins != null && logins.length > 0) {
		user = logins[0].username;
		password = logins[0].password;
		firstLogin(user,password,"twitter",false);
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
		manualFirstLogin();
	}
}

function manualFirstLogin() {
	u = getBrowser().contentDocument.getElementById('username').value;
	p = getBrowser().contentDocument.getElementById('password').value;
	save = getBrowser().contentDocument.getElementById('saveCredentials').checked;
	firstLogin(u,p,"twitter",save);	
}

// Called if either the user enters login info, or we find a usable login in
// the password manager.
function firstLogin(u,p,service,save) {
	message("Authenticating");
	getBrowser().contentDocument.getElementById('loginThrobber').style.display = 'inline';
	getBrowser().contentDocument.getElementById('username').disabled = true;
	getBrowser().contentDocument.getElementById('password').disabled = true;
	getBrowser().contentDocument.getElementById('loginOkButton').disabled = true;
	
	username = u;
	password = p;
	
	if (login(username,password,service)) {
		getChromeElement('usernameLabelId').value = username;
		getChromeElement('passwordLabelId').value = password;
		if (save) {
			saveCredentials(username,password);
		}
		var interval = getIntPref('buzzbird.update.interval',180000);
		jsdump('interval=' + interval);
		var updateTimer = getMainWindow().setInterval( function(that) { that.cycleFetch(); }, interval, getMainWindow());
		getChromeElement('updateTimerId').value = updateTimer;
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

// Save these credentials as the new default if it does not already exist.
//
function saveCredentials(username,password) {
   var myLoginManager = Components.classes["@mozilla.org/login-manager;1"]
		                         .getService(Components.interfaces.nsILoginManager);
   var nsLoginInfo = new Components.Constructor("@mozilla.org/login-manager/loginInfo;1",
	                                             Components.interfaces.nsILoginInfo,
	                                             "init");
   var loginInfo = new nsLoginInfo('localhost', 'localhost', null, username, password,
	                                'username', 'password');
   
   // Make sure to delete old entries when trying to add the new details
   var logins = myLoginManager.findLogins({}, 'localhost', 'localhost', null);
   for (var i = 0; i < logins.length; i++) {
      if (logins[i].username == username) {
    	  myLoginManager.removeLogin(logins[i]);
         break;
      }
   }    
   myLoginManager.addLogin(loginInfo);
}

