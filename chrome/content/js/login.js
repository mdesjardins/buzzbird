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
	username = $('username').value;
	password = $('password').value;
	saveCreds = $('saveCredentials').checked;
	authenticate(username,password,saveCreds);	
}
