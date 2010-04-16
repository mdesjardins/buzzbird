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

var Prefs = {
	hostname : 'localhost',
	formSubmitURL : 'localhost',
	httprealm : null,
	user : '',
	password : '',
	
	dispatch : function(eventName) {
		jsdump('prefs is dispatching ' + eventName);
		try {
	        var ev = document.createEvent("Events");
	        ev.initEvent(eventName, true, false);
	        getMainWindow().opener.document.dispatchEvent(ev);
	    } catch (e) {
	        jsdump("Exception sending '" + eventName + "' event: " + e);
	    }		
	},

	loginListClicked : function() {
		var deleteButton = document.getElementById('deleteAccount');
		var listbox = document.getElementById('richlistbox_accounts');
		if (listbox.selectedIndex >= 0) {
			deleteButton.disabled = false;
		} else {
			deleteButton.disabled = true;
		}
	},

	checkCredentials : function(aUsername,aPassword) {
		var req = new XMLHttpRequest();
		req.mozBackgroundRequest = true;
		req.open('GET','https://twitter.com/account/verify_credentials.json',false,aUsername,aPassword);
		req.send(null);
	
		// This crap should totally work.  Why is it bitching that match isn't a valid method?
		//
		//var re = /\{"request":NULL.*?/;
		// var re = new RegExp('\{"request":NULL.*?/');
		// jsdump("RE:" + re);
		// jsdump("RE.match" + re.match(req.responseText))
		// if (re.match(req.responseText)) {
		// 	jsdump("Badness in twitter response.  Perhaps down for maintenance?");
		// 	jsdump(req.responseText);
		// 	return false;
		// }
	
		if (req.status == 200 && req.responseText != 'NULL') {
			var user = '';
			try {
				user = eval('(' + req.responseText + ')');
			} catch(e) {
				jsdump('Caught an exception trying to login.');
				return false;
			}
			if (user == '') {
				jsdump('JSON parse must have borked?');
				return false;
			}
			return true;
		} else {
			return false;
		}
	},

	addAccount : function() {
		var params = {};
		window.openDialog("chrome://buzzbird/content/add-account.xul", "",
		    "chrome, dialog, modal, resizable=no",params).focus();
		if (params.out) {
			var success = params.out.success;
			if (success) {
				var login = params.out.login;
				var password = params.out.password;

				var nsLoginInfo = new Components.Constructor("@mozilla.org/login-manager/loginInfo;1",
				                                             Components.interfaces.nsILoginInfo,
				                                             "init");
			   	var loginInfo = new nsLoginInfo('localhost', 'localhost', null, login, password,
				                                'username', 'password');

				var myLoginManager = Components.classes["@mozilla.org/login-manager;1"]
					                         .getService(Components.interfaces.nsILoginManager);

			    myLoginManager.addLogin(loginInfo);
				var newItem = login + '|' + password + '|' + 'localhost' + '|' + 'localhost';
				var listbox = document.getElementById('richlistbox_accounts');
				Prefs.addAccountToList(listbox,login,password,'localhost','localhost');
				//document.getElementById('richlistbox_accounts').appendItem(login,newItem);
				//Prefs.dispatch('updateLoginList');
			}
		}
	},

	onAddAccountOk : function() {
		var success = true;

		var login = document.getElementById("login").value;
		var password = document.getElementById("password").value;

		document.documentElement.getButton('accept').disabled=true;
		document.documentElement.getButton('cancel').disabled=true;
		document.getElementById("authenticating").collapsed=false;

		// Get Login Manager 
		var myLoginManager = Components.classes["@mozilla.org/login-manager;1"]
			                         .getService(Components.interfaces.nsILoginManager);

		// Make sure the login doesn't already exist.
		var logins = myLoginManager.findLogins({}, this.hostname, this.formSubmitURL, this.httprealm);
		for (i=0; i<logins.length; i++) {
			if (logins[i].username == login) {
				var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
				                        .getService(Components.interfaces.nsIPromptService);
				prompts.alert(window, "Oops!", "That login has already been configured.");
				success = false;
			} 
		}		
	
		// We ran the gauntlet, let's try to authenticate it and add it if we're successful.
		jsdump('Checking credentials... login ' + login + ' password ' + password);
		if (!Prefs.checkCredentials(login,password)) {
			var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
			                        .getService(Components.interfaces.nsIPromptService);
			prompts.alert(window, "Oops!", "That username/password combination didn't match.");
			success = false;
		}
		jsdump('leaving!');
		window.arguments[0].out = {'login':document.getElementById("login").value, 'password':document.getElementById("password").value, 'success':success};
		return true;
	},

	onAddAccountCancel : function() {
		return true;
	},

	initLogins : function() {
		try {
			// Get Login Manager 
			var myLoginManager = Components.classes["@mozilla.org/login-manager;1"]
				                         .getService(Components.interfaces.nsILoginManager);

			// Find users for the given parameters
			var logins = myLoginManager.findLogins({}, this.hostname, this.formSubmitURL, this.httprealm);

			// Find user from returned array of nsILoginInfo objects
			// Will be modified when support for multiple accounts is added.  For now,
			// just use the first one we find.
			var listbox = document.getElementById('richlistbox_accounts');
			if (listbox == null || listbox == undefined) {
		    	jsdump("Where's the listbox?");
			} else {
				var len = logins.length;
			   	if (logins != null && len > 0) {
					for (i=0; i<len; i++) {
						Prefs.addAccountToList(listbox,logins[i].username,logins[i].password,logins[i].hostname,logins[i].formSubmitURL);
					}
				} else {
			     	jsdump('No saved logins found.');	
				}
			}
		} catch (e) {
		  // This will only happen if there is no nsILoginManager component class
		  jsdump('Oops - failed at autologin: ' + e);
		}
	},

	addAccountToList : function(listbox,username,password,hostname,url) {
		var value = username + "|" + password + "|" + hostname + "|" + url;
		var template = document.getElementById('account_template');
		if (template == null || template == undefined) {
			jsdump('Where is the template?');
		} else {
			var xulAccount = template.cloneNode(true);
			xulAccount.setAttribute('hidden','false');
			xulAccount.getElementsByAttribute('field','image')[0].setAttribute('src','http://a1.twimg.com/profile_images/687800820/Buzzbird.png');
			xulAccount.getElementsByAttribute('field','image')[0].setAttribute('img_screen_name',username);
			xulAccount.getElementsByAttribute('field','screen_name')[0].setAttribute('value',username);
			xulAccount.getElementsByAttribute('field','real_name')[0].setAttribute('screen_name',username);
			xulAccount.setAttribute('value',value);
			BzTwitter.fetchUserProfile({
				"username":username,
				"password":password,
				"queriedScreenName":username,
				"onSuccess": function(result) { Prefs.getProfileCallback(result); },
			});		
			listbox.appendChild(xulAccount);	
		}
	},

	getProfileCallback : function(result) {
		jsdump('Got the profile callback for ' + result.screen_name);
		document.getElementsByAttribute('screen_name',result.screen_name)[0].setAttribute('value',result.name);
		document.getElementsByAttribute('img_screen_name',result.screen_name)[0].setAttribute('src',result.profile_image_url);
	},

	deleteAccount : function() {
		var selection = document.getElementById('richlistbox_accounts').getSelectedItem(0).value;
		var selIndex = document.getElementById('richlistbox_accounts').selectedIndex;
		var xx = selection.split('|')
		var nsLoginInfo = new Components.Constructor("@mozilla.org/login-manager/loginInfo;1",
			                                          Components.interfaces.nsILoginInfo,
			                                          "init");
		var loginInfo = new nsLoginInfo(xx[3], xx[2], null, xx[0], xx[1],
			                            'username', 'password');
	
		var myLoginManager = Components.classes["@mozilla.org/login-manager;1"]
	                                   .getService(Components.interfaces.nsILoginManager);
	    myLoginManager.removeLogin(loginInfo);
		document.getElementById('richlistbox_accounts').removeItemAt(selIndex);
		dispatch('updateLoginList');
	},

	setSticky : function(name,newState) {
		var checkbox = document.getElementById('checkbox_' + name);
		var sticky = document.getElementById('checkbox_' + name + 'Sticky');
		var label = document.getElementById('checkbox_' + name + 'StickyLabel');
		if (checkbox.hasAttribute('checked') && checkbox.checked) {
			sticky.disabled = newState;
			label.disabled = newState;
		} else {
			sticky.disabled = !newState;
			label.disabled = !newState;
		}
		if (sticky.disabled) {
			sticky.checked = false;
		}
	},

	initSticky : function() {
		Prefs.setSticky('generalVisualAlert',false);
		Prefs.setSticky('mentionVisualAlert',false);
		Prefs.setSticky('directVisualAlert',false);		
	}
}

window.addEventListener("load", Prefs.initLogins, false);
window.addEventListener("load", Prefs.initSticky, false);