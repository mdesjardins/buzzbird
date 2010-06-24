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

	addAccount : function() {
		var params = {};
		window.openDialog("chrome://buzzbird/content/add-account.xul", "",
		    "chrome, dialog, modal, resizable=no",params).focus();
		if (params.out) {
			var success = params.out.success;
			if (success) {
				var username = params.out.username;
				var password = params.out.password;
				var service = params.out.service;
				var accessToken = params.out.accessToken;
				var accessTokenSecret = params.out.accessTokenSecret;
				var account = {
					'username': username,
					'password': password,
					'service': service,
					'token': accessToken,
					'tokenSecret': accessTokenSecret
				};
				var am = new AccountManager();
				am.addAccount(account);
				var newItem = username + '|' + password + '|' + accessToken + '|' + accessTokenSecret + '|' + service;
				var listbox = document.getElementById('richlistbox_accounts');
				Prefs.addAccountToList(listbox,account);
				Prefs.dispatch('updateLoginList');
			}			
		}
	},

	onAddAccountOk : function() {
		var success = true;

		var username = document.getElementById("login").value;
		var password = document.getElementById("password").value;
		var service = document.getElementById("service").value;;

		document.documentElement.getButton('accept').disabled=true;
		document.documentElement.getButton('cancel').disabled=true;
		document.getElementById("authenticating").collapsed=false;

		jsdump("Authenticating " + username + "," + password + "," + service);
		
		token = false;
		try {
			token = Social.service(service).verifyCredentials(username,password);
		} catch (e) {
			jsdump("Caught exception: " + e);
		}
		if (token) {
			var accessToken = null;
			var accessTokenSecret = null;
			if (Social.service(service).support.xAuth) {
				accessToken = token.accessToken;
				accessTokenSecret = token.accessTokenSecret;
			}
			window.arguments[0].out = {
				 'username': username, 
				 'password': password, 
				 'service': service, 
				 'accessToken': accessToken,
				 'accessTokenSecret': accessTokenSecret,
				 'success': success
			};			
		} else {
			jsdump('failed');
			var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
			                        .getService(Components.interfaces.nsIPromptService);
			prompts.alert(window, "Oops!", "That username/password combination didn't match.");
			success = false;
		}
		return true;
	},

	onAddAccountCancel : function() {
		return true;
	},

	initLogins : function() {
		var am = new AccountManager();
		var logins = am.getAccounts();
		
		var listbox = document.getElementById('richlistbox_accounts');
		if (listbox == null || listbox == undefined) {
	    	jsdump("Where's the listbox?");
		} else {
			var len = logins.length;
	   	if (logins != null && len > 0) {
				for (i=0; i<len; i++) {
					Prefs.addAccountToList(listbox,logins[i]);
				}
			} else {
		     	jsdump('No saved logins found.');	
			}
		}
	},

	addAccountToList : function(listbox,account) {
		var value = account.username + "|" + account.password + "|" + account.token + "|" + account.tokenSecret + '|' + account.service;
		var template = document.getElementById('account_template');
		if (template == null || template == undefined) {
			jsdump('Where is the template?');
		} else {
			var xulAccount = template.cloneNode(true);
			xulAccount.setAttribute('hidden','false');
			xulAccount.getElementsByAttribute('field','image')[0].setAttribute('src','http://a1.twimg.com/profile_images/687800820/Buzzbird.png');
			xulAccount.getElementsByAttribute('field','image')[0].setAttribute('img_screen_name',account.username);
			xulAccount.getElementsByAttribute('field','screen_name')[0].setAttribute('value',account.username + '@' + account.service);
			xulAccount.getElementsByAttribute('field','real_name')[0].setAttribute('screen_name',account.username);
			xulAccount.setAttribute('value',value);
			Social.service("twitter").fetchUserProfile({
				"username":account.username,
				"password":account.password,
				"token":account.token,
				"tokenSecret":account.tokenSecret,
				"queriedScreenName":account.username,
				"onSuccess": Prefs.getProfileCallback
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
		var am = new AccountManager();
		am.removeAccount({
			'username':xx[0],
			'password':xx[1],
			'token':xx[2],
			'tokenSecret':xx[3],
			'service':xx[4]
		});
		document.getElementById('richlistbox_accounts').removeItemAt(selIndex);
		Prefs.dispatch('updateLoginList');
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

//
// Below was ripped off from Firefox and tweaked, so all the stuff below 
// this line is licensed under the MPL.
//
var Proxy = {
  beforeAccept: function ()
  {
    var proxyTypePref = document.getElementById("network.proxy.type");
    if (proxyTypePref.value == 2) {
      this.doAutoconfigURLFixup();
      return true;
    }

    if (proxyTypePref.value != 1)
      return true;

    var httpProxyURLPref = document.getElementById("network.proxy.http");
    var httpProxyPortPref = document.getElementById("network.proxy.http_port");
    return true;
  },

  checkForSystemProxy: function ()
  {
    if ("@mozilla.org/system-proxy-settings;1" in Components.classes)
      document.getElementById("systemPref").removeAttribute("hidden");
  },
  
  proxyTypeChanged: function ()
  {
    var proxyTypePref = document.getElementById("network.proxy.type");
    
    // Update http
    var httpProxyURLPref = document.getElementById("network.proxy.http");
    httpProxyURLPref.disabled = proxyTypePref.value != 1;
    var httpProxyPortPref = document.getElementById("network.proxy.http_port");
    httpProxyPortPref.disabled = proxyTypePref.value != 1;

    // Now update the other protocols
    this.updateProtocolPrefs();

    var autoconfigURLPref = document.getElementById("network.proxy.autoconfig_url");
    autoconfigURLPref.disabled = proxyTypePref.value != 2;

    this.updateReloadButton();
  },

  updateReloadButton: function ()
  {
    // Disable the "Reload PAC" button if the selected proxy type is not PAC or
    // if the current value of the PAC textbox does not match the value stored
    // in prefs.  Likewise, disable the reload button if PAC is not configured
    // in prefs.

    var typedURL = document.getElementById("networkProxyAutoconfigURL").value;
    var proxyTypeCur = document.getElementById("network.proxy.type").value;

    var prefs =
        Components.classes["@mozilla.org/preferences-service;1"].
        getService(Components.interfaces.nsIPrefBranch);
    var pacURL = prefs.getCharPref("network.proxy.autoconfig_url");
    var proxyType = prefs.getIntPref("network.proxy.type");

    var disableReloadPref =
        document.getElementById("pref.advanced.proxies.disable_button.reload");
    disableReloadPref.disabled =
        (proxyTypeCur != 2 || proxyType != 2 || typedURL != pacURL);
  },
  
  readProxyType: function ()
  {
    this.proxyTypeChanged();
    return undefined;
  },
  
  updateProtocolPrefs: function ()
  {
    var proxyTypePref = document.getElementById("network.proxy.type");
    var proxyPrefs = ["ssl"];
    for (var i = 0; i < proxyPrefs.length; ++i) {
      var proxyServerURLPref = document.getElementById("network.proxy." + proxyPrefs[i]);
      var proxyPortPref = document.getElementById("network.proxy." + proxyPrefs[i] + "_port");
      proxyServerURLPref.updateElements();
      proxyPortPref.updateElements();
      proxyServerURLPref.disabled = proxyTypePref.value != 1;
      proxyPortPref.disabled = proxyServerURLPref.disabled;
    }
    var socksVersionPref = document.getElementById("network.proxy.socks_version");
    socksVersionPref.disabled = proxyTypePref.value != 1;
    
    return undefined;
  },
  
  reloadPAC: function ()
  {
    Components.classes["@mozilla.org/network/protocol-proxy-service;1"].
        getService().reloadPAC();
  },
  
  doAutoconfigURLFixup: function ()
  {
    var autoURL = document.getElementById("networkProxyAutoconfigURL");
    var autoURLPref = document.getElementById("network.proxy.autoconfig_url");
    var URIFixup = Components.classes["@mozilla.org/docshell/urifixup;1"]
                             .getService(Components.interfaces.nsIURIFixup);
    try {
      autoURLPref.value = autoURL.value = URIFixup.createFixupURI(autoURL.value, 0).spec;
    } catch(ex) {}
  },
  
  readHTTPProxyServer: function ()
  {
    this.updateProtocolPrefs();
    return undefined;
  },
  
  readHTTPProxyPort: function ()
  {
    this.updateProtocolPrefs();
    return undefined;
  }
};

window.addEventListener("load", Prefs.initLogins, false);
window.addEventListener("load", Prefs.initSticky, false);