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
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHERWISE
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

/**
 * This is my very own, home-grown AJAX framework that was created for Buzzbird.
 * If you ever think to yourself "hey, I think I'll build my own AJAX framework,"
 * then do yourself a favor... use one of the tons of other ones already available
 * to you.  This was a stupid waste of time.  It still is.
 *
 * It is named for Steely Dan's awesome album, Aja... partly because Steely Dan
 * is cool, and partly because I hate XML and have no problem denying the X a
 * spot in the acronym.
 *
 * The basic code was first based on jx.js, plus some pooling stuff based on 
 * http://drakware.com/?e=3, as well as some Base64 encoding for authorization 
 * from http://www.webtoolkit.info/ (even though the XHR open method has a username
 * and pasword parameter, I thought I was having problems with it, and in a fit
 * on insanity, rolled my own solution)
 */

function Aja() {
	var _that = this;
	var _http = false;
	var _timer = null;
	var _reqPool = new Array();
	
	function callInProgress(http) {
		switch (http.readyState) {
			case 1,2,3:
				return true;
				break;
			default:
				return false;
				break;
		}
	}
	
	function XmlReqWrapper(freed) {
		this.freed = freed; 
		this.http = false; 
		this.timer = false;
		if (window.XMLHttpRequest) { 
			this.http = new XMLHttpRequest(); 
		} else if (window.ActiveXObject) { 
			this.http = new ActiveXObject("Microsoft.XMLHTTP"); 
		} 
	}
	
	function getXmlReqIndex() {
		var pos = -1; 
		for (var i=0; i<_reqPool.length; i++) { 
			if (_reqPool[i].freed == 1) { 
				// Reuse one from the pool
				pos = i; 
				break; 
			} 
		} 
		if (pos == -1) { 
			// Gotta make a new one.
			pos = _reqPool.length; 
			_reqPool[pos] = new XmlReqWrapper(0); 
		} 
		_reqPool[pos].freed = 0;
		_reqPool[pos].timer = window.setTimeout(function() { Aja.reqTimeout(_reqPool[pos]); }, Aja.waitFor);
		jsdump("XMLReq Pool Depth " + _reqPool.length + ", using index " + pos + ".");
		return pos;
	}
	
	function freeXmlReq(pos) {
		jsdump("Freeing " + pos);
		window.clearTimeout(_reqPool[pos].timer);
		_reqPool[pos].freed = 1
	}
	
	function exec(method,url,options) {
		if (options === undefined) {
			options = {};
		}	
		var _reqPoolIndex = getXmlReqIndex()
		var _httpReq = _reqPool[_reqPoolIndex];
		var _http = _httpReq.http;
		var _json = (options.format === undefined || options.format.match(/^[Jj].*/)) ;
		if (_http) {
			if (_json) {
				_http.overrideMimeType('application/json');
			}
			_http.open(method,url,true);	
			if (options.username != undefined && options.username != null && options.username != "" &&
				  options.password != undefined && options.password != null && options.password != "") {
				var tok = options.username + ':' + options.password;
				var hash = Base64.encode(tok);
				_http.setRequestHeader('Authorization', 'Basic ' + hash);
			}
			_http.onreadystatechange = function() {
				if (_http.readyState == 4) {
					if (_http.status == 200 || _http.status == 304) {
						var result = "";
						if (_http.responseText) {
							result = _http.responseText;
							result = result.replace(/[\n\r]/g,"");
							if (_json) {
								result = eval('('+result+')');
							}
						}
						if (options.onSuccess) {
							options.onSuccess(result);
						}
					} else {
						if (options.onError) {
							var status = 100;
							if (_http.status != null && _http.status != undefined) {
								status = _http.status;
							}
							options.onError(status); 
							result = { 'error': status };
						}
					}
					if (options.onComplete) {
						options.onComplete(result);	
					}
					freeXmlReq(_reqPoolIndex);
				}
			}
			try {
				_http.send(null);
			} catch(e) {
				jsdump('Problem calling send: ' + e);
				reqTimeout(_http);
			}
		}
	}

	this.get = function(url,options) {
		return exec("GET",url,options);
	}

	this.post = function(url,options) {
		return exec("POST",url,options);
	}
	
	this.put = function(url,options) {
		return exec("PUT",url,options);
	}
	
	this.delete = function(url,options) {
		return exec("DELETE",url,options);
	}
}

Aja.reqTimeout = function(httpReq) {
	var state = httpReq.http.readyState;
	if (state == 1 || state == 2 || state == 3) {
		jsdump(">>> Timeout.");
		httpReq.http.abort();
		window.clearTimeout(httpReq.timer);
		httpReq.freed = 1
	}
}

Aja.waitFor = 5000;  



