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
	notify : function() {
		jsdump('experimental notification');
		var chromeDirectory = Components.classes["@mozilla.org/file/directory_service;1"].  
		                      getService(Components.interfaces.nsIProperties).  
		                      get("AChrom", Components.interfaces.nsIFile).
							  path;
	
		var file = Components.classes["@mozilla.org/file/local;1"]
		                     .createInstance(Components.interfaces.nsILocalFile);
		jsdump("PATH: " + chromeDirectory + "/content/notifications/notify.sh")
		file.initWithPath(chromeDirectory + "/content/notifications/notify.sh");

		var process = Components.classes["@mozilla.org/process/util;1"]
		                        .createInstance(Components.interfaces.nsIProcess);
		process.init(file);

		var args = ["argument1", "argument2"];
		//process.run(false, args, args.length);
	}
}