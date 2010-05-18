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

var EXPORTED_SYMBOLS = ["Ctx","Global","strings"];  

// Current Context
var Ctx = {
	user:"",
	password:"",
	service:"",
	token:"",
	tokenSecret:"",
	list:"",
	profile:null,
	setAccount : function(account) {
		Ctx.user = account.username;
		Ctx.password = account.password;
		Ctx.list = null;
		Ctx.service = account.service;
		Ctx.token = account.token;
		Ctx.tokenSecret = account.tokenSecret;
		Ctx.profile = null;
	}
};

// Other Global junk
var Global = {
	updateTimer:null,
	unread:0,
	unreadDirectFrom:0,
	unreadMentions:0,
	mostRecentDirect:null,
	mostRecentUpdate:null,
	mostRecentMention:null,
	supportedServices: ['twitter','identi.ca'],
	resetCounters : function() {
		Global.updateTimer = null;
		Global.unread = 0;
		Global.unreadDirectFrom = 0;
		Global.unreadMentions = 0;
		Global.mostRecentDirect = null;
		Global.mostRecentUpdate = null;
		Global.mostRecentMention = null;
	}
}

function Strings() { 
	var stringBundleService =
	    Components.classes["@mozilla.org/intl/stringbundle;1"]
	    .getService(Components.interfaces.nsIStringBundleService);
	var stringProps = stringBundleService.createBundle("chrome://buzzbird/locale/strings.properties");

  this.get = function(name) {
		var result = name.replace(/_/g," ");
		try {
			x = stringProps.GetStringFromName(name);
			if (x != null && x != "") {
				result = x;
			}
		} catch (e) {	}
		return result;
	}
}

var strings = new Strings();
