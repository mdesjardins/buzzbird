var passwordManager = Components.classes["@mozilla.org/login-manager;1"]
                                .getService(Components.interfaces.nsILoginManager);

var hostname = 'localhost';
var formSubmitURL = 'localhost';  
var httprealm = null;
var user = '';
var password = '';

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
			 		listbox.appendItem(logins[i].username);
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

function forgetCredentials() {
	// Get Login Manager 
   var myLoginManager = Components.classes["@mozilla.org/login-manager;1"]
		                         .getService(Components.interfaces.nsILoginManager);

   // Find users for the given parameters
   var logins = myLoginManager.findLogins({}, 'localhost', 'localhost', null);

   // Find user from returned array of nsILoginInfo objects
   // Will be modified when support for multiple accounts is added.  For now,
   // just use the first one we find.
   if (logins != null && logins.length > 0) {
	 myLoginManager.removeLogin(logins[0]);
   } else {
     jsdump('No saved logins found.');	
   }
	alert('Your screen name and password information was discarded.');
}

window.addEventListener("load", initLogins, false);
