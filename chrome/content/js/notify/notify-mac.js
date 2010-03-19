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
var Notify = {
	notify : function(type,sticky,image,title,description) {
		jsdump('experimental notification');
		
		var imageData = this._getImage(image);
		var imagePath = "";
		if (imageData != null) {
			var imagePath = "file://" + imageData.path;
		}
		var chromeDirectory = Components.classes["@mozilla.org/file/directory_service;1"].  
		                      getService(Components.interfaces.nsIProperties).  
		                      get("AChrom", Components.interfaces.nsIFile).
							  path;
	
		var file = Components.classes["@mozilla.org/file/local;1"]
		                     .createInstance(Components.interfaces.nsILocalFile);
		file.initWithPath(chromeDirectory + "/content/notifications/notify.sh");

		var process = Components.classes["@mozilla.org/process/util;1"]
		                        .createInstance(Components.interfaces.nsIProcess);
		process.init(file);

		var stickyYesNo = sticky ? "yes" : "no";
		var args = [type,imagePath,stickyYesNo,title,description];
		process.run(false, args, args.length);
		
		// Clean up after ourselves. Give Growl 60 seconds to use the image.
		if (imageData != null) {
			setTimeout( function() {
				imageData.remove(false);
			}, 60000);
		}
	},
	
	_getImage : function(url) {
	 	try {
			var file = Components
						.classes["@mozilla.org/file/directory_service;1"]
						.getService(Components.interfaces.nsIProperties)
						.get("TmpD", Components.interfaces.nsIFile);  
			var re = /.*?\/profile_images\/.*?\/(.*?)$/;
			var f = re.exec(url)[1]
			file.append(f);  
			file.createUnique(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 0666);  
	   		var uri = Components.classes["@mozilla.org/network/standard-url;1"]
	                .getService(Components.interfaces.nsIURI);
	   		uri.spec = url;
	   		var wbp = Components.interfaces.nsIWebBrowserPersist;
	   		var persist = Components.classes["@mozilla.org/embedding/browser/nsWebBrowserPersist;1"]
	                	.createInstance(wbp);
			persist.persistFlags = wbp.PERSIST_FLAGS_REPLACE_EXISTING_FILES;
	   		persist.saveURI(uri, null, null, null, null, file);
	   		return file;
	 	} catch (e) {
			jsdump("Exception fetching the avatar for the notification: " + e.name + " - " + e.message);
	   		return null;
	 	}
	}
}