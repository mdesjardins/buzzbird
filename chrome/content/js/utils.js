/*
Copyright (c) 2009 Mike Desjardins

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
// Utility method to return the window object.
//
function getMainWindow() {
	var mainWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
	                   .getInterface(Components.interfaces.nsIWebNavigation)
	                   .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
	                   .rootTreeItem
	                   .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
	                   .getInterface(Components.interfaces.nsIDOMWindow);
	return mainWindow;
}

// Utility method to return the main browser window.
//
function getBrowser() {
	return getMainWindow().document.getElementById('browserid');
}

// Utility method to return the specified UI element.
//
function getChromeElement(id) {
	return getMainWindow().document.getElementById(id);
}

// Returns the username from the UI.
//
function getUsername() {
	return getChromeElement('usernameLabelId').value;
}
function setUsername(username) {
	getChromeElement('usernameLabelId').value=username;
}

// Returns the password from the UI.
//
function getPassword() {
	return getChromeElement('passwordLabelId').value;
}
function setPassword(password) {
	getChromeElement('passwordLabelId').value=password;
}

// Returns the update timer ID from the UI.
//
function getUpdateTimer() {
	return getChromeElement('updateTimerId').value;
}

// Wrappers for fetching/setting a boolean preference.
//
function getBoolPref(prefname,def) {
  try { 
    var pref = Components.classes["@mozilla.org/preferences-service;1"]
                       .getService(Components.interfaces.nsIPrefBranch);
    return pref.getBoolPref(prefname);
  } catch(er) {
    return def;
  }
}
function setBoolPref(prefname,value) {
   var pref = Components.classes["@mozilla.org/preferences-service;1"]
                      .getService(Components.interfaces.nsIPrefBranch);
   return pref.setBoolPref(prefname,value);
}

// Wrappers for fetching/setting a integer preference.
//
function getIntPref(prefname,def) {
  try { 
    var pref = Components.classes["@mozilla.org/preferences-service;1"]
                       .getService(Components.interfaces.nsIPrefBranch);
    return pref.getIntPref(prefname);
  } catch(er) {
    return def;
  }
}
function setIntPref(prefname,value) {
   var pref = Components.classes["@mozilla.org/preferences-service;1"]
                      .getService(Components.interfaces.nsIPrefBranch);
   return pref.setIntPref(prefname,value);
}

// Make stuff "HTML Safe"
//
function sanitize(text) {
	// I'm sure there are far better ways to do this, but I suck at regular expressions...
	var clean = text.replace(/&/g, '&amp;');
	clean = clean.replace(/&amp;lt;/g, '&lt;');
	clean = clean.replace(/&amp;gt;/g, '&gt;');
	clean = clean.replace(/&amp;quot;/g, '&quot;');
	clean = clean.replace(/&amp;apos;/g, '&apos;');
	clean = clean.replace(/</g, '&lt;');
	clean = clean.replace(/>/g, '&gt;');
	clean = clean.replace(/"(?![^<>]*>)/g, '&quot;');
	clean = clean.replace(/'(?![^<>]*>)/g, '&apos;');
	return clean;
}

// Unsafe
//
function desanitize(text) {
	var filthy = text.replace(/&amp;/g, '&');
	filthy = text.replace(/&lt;/g, '<');
	filthy = text.replace(/&rt;/g, '>');
	filthy = text.replace(/&quot;/g, '"');
	filthy = text.replace(/&apos;/g, "'");
	return filthy;
}

// Craptastic logging.
//
function jsdump(str) {
	var d = new Date();
	str = d + ': ' + str;
	Components.classes['@mozilla.org/consoleservice;1']
    		.getService(Components.interfaces.nsIConsoleService)
            .logStringMessage(str);
}
