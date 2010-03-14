var passwordManager = Components.classes["@mozilla.org/login-manager;1"]
                                .getService(Components.interfaces.nsILoginManager);

var hostname = 'localhost';
var formSubmitURL = 'localhost';  
var httprealm = null;
var user = '';
var password = '';

function dispatch(eventName) {
	jsdump('prefs is dispatching ' + eventName);
	try {
        var ev = document.createEvent("Events");
        ev.initEvent(eventName, true, false);
        getMainWindow().opener.document.dispatchEvent(ev);
    } catch (e) {
        jsdump("Exception sending '" + eventName + "' event: " + e);
    }		
}

function loginListClicked() {
	var deleteButton = document.getElementById('deleteAccount');
	var listbox = document.getElementById('richlistbox_accounts');
	//alert('x:' + listbox.selectIndex);
	if (listbox.selectedIndex >= 0) {
		deleteButton.disabled = false;
	} else {
		deleteButton.disabled = true;
	}
}

function checkCredentials(aUsername,aPassword) {
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
}

function addAccount() {
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
			document.getElementById('richlistbox_accounts').appendItem(login,newItem);
			dispatch('updateLoginList');
		}
	}
}

function onAddAccountOk() {
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
	var logins = myLoginManager.findLogins({}, hostname, formSubmitURL, httprealm);
	for (i=0; i<logins.length; i++) {
		if (logins[i].username == login) {
			var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
			                        .getService(Components.interfaces.nsIPromptService);
			prompts.alert(window, "Oops!", "That login has already been configured.");
			success = false;
		} 
	}		
	
	// We ran the gauntlet, let's try to authenticate it and add it if we're successful.
	if (!checkCredentials(login,password)) {
		var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
		                        .getService(Components.interfaces.nsIPromptService);
		prompts.alert(window, "Oops!", "That username/password combination didn't match.");
		success = false;
	}
	window.arguments[0].out = {'login':document.getElementById("login").value, 'password':document.getElementById("password").value, 'success':success};
	return true;
}

function onAddAccountCancel() {
	return true;
}

function initLogins() {
	try {
		// Get Login Manager 
		var myLoginManager = Components.classes["@mozilla.org/login-manager;1"]
			                         .getService(Components.interfaces.nsILoginManager);

		// Find users for the given parameters
		var logins = myLoginManager.findLogins({}, hostname, formSubmitURL, httprealm);

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
					var value = logins[i].username + "|" + logins[i].password + "|" + logins[i].hostname + "|" + logins[i].formSubmitURL;
			 		listbox.appendItem(logins[i].username,value);
				}
			} else {
		     	jsdump('No saved logins found.');	
			}
		}
	} catch (e) {
	  // This will only happen if there is no nsILoginManager component class
	  jsdump('Oops - failed at autologin: ' + e);
	}
}

function deleteAccount() {
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
}

function setSticky(name,newState) {
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
}

function initSticky() {
	jsdump('initSticky');
	setSticky('generalVisualAlert',false);
	setSticky('mentionVisualAlert',false);
	setSticky('directVisualAlert',false);		
}

window.addEventListener("load", initLogins, false);
window.addEventListener("load", initSticky, false);