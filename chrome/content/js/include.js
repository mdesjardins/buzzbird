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

// This is to simplify including the most common javascripts *in browsers*,
// i.e., from an HTML file.  Don't use this to include javascripts in XUL,
// use the common-javascript.xul overlay instead (this method doesn't seem
// to work for XUL files).
//
var Include = {
	
	files : 	 ["account-manager.js",
							"utils.js",
							"aja.js",
							"oauth/oauth.js",
							"oauth/sha1.js",
							"social/social.js",
							"social/twitteresque.js",
							"social/twitter.js",
							"social/statusnet.js",
							"social/identica.js",
							"render.js",
							"jquery-1.4.2.js",
							"jquery.lazyload.js"
	],
	
	addOne : function(element,filename) {
		script = document.createElement('script');
		script.src = filename;
		script.type = 'text/javascript';
		element.appendChild(script)
	},	
	
	all : function(id) {
		var element = document.getElementById(id);
		if (element) {
			for (var i=0,len=Include.files.length; i<len; i++) {
				Include.addOne(element,"chrome://buzzbird/content/js/" + Include.files[i]);
			}
		}
	}
}
