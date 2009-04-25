
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