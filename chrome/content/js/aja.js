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
	var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
	
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
	
	// public method for encoding
	function encode(input) {
		var output = "";
		var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
		var i = 0;
 
		input = utf8_encode(input);
 
		while (i < input.length) {
			chr1 = input.charCodeAt(i++);
			chr2 = input.charCodeAt(i++);
			chr3 = input.charCodeAt(i++);
 
			enc1 = chr1 >> 2;
			enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
			enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
			enc4 = chr3 & 63;
 
			if (isNaN(chr2)) {
				enc3 = enc4 = 64;
			} else if (isNaN(chr3)) {
				enc4 = 64;
			}
 
			output = output +
			_keyStr.charAt(enc1) + _keyStr.charAt(enc2) +
			_keyStr.charAt(enc3) + _keyStr.charAt(enc4);
		}
		return output;
	}
 
	// public method for decoding
	function decode(input) {
		var output = "";
		var chr1, chr2, chr3;
		var enc1, enc2, enc3, enc4;
		var i = 0;
 
		input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
 
		while (i < input.length) {
			enc1 = _keyStr.indexOf(input.charAt(i++));
			enc2 = _keyStr.indexOf(input.charAt(i++));
			enc3 = _keyStr.indexOf(input.charAt(i++));
			enc4 = _keyStr.indexOf(input.charAt(i++));
 
			chr1 = (enc1 << 2) | (enc2 >> 4);
			chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
			chr3 = ((enc3 & 3) << 6) | enc4;
 
			output = output + String.fromCharCode(chr1);
 
			if (enc3 != 64) {
				output = output + String.fromCharCode(chr2);
			}
			if (enc4 != 64) {
				output = output + String.fromCharCode(chr3);
			}
		}
 
		output = utf8_decode(output);
		return output;
	}
 
	function utf8_encode(string) {
		string = string.replace(/\r\n/g,"\n");
		var utftext = "";
 
		for (var n = 0; n < string.length; n++) {
			var c = string.charCodeAt(n);
			if (c < 128) {
				utftext += String.fromCharCode(c);
			}
			else if((c > 127) && (c < 2048)) {
				utftext += String.fromCharCode((c >> 6) | 192);
				utftext += String.fromCharCode((c & 63) | 128);
			}
			else {
				utftext += String.fromCharCode((c >> 12) | 224);
				utftext += String.fromCharCode(((c >> 6) & 63) | 128);
				utftext += String.fromCharCode((c & 63) | 128);
			}
		}
		return utftext;
	}
 
	// private method for UTF-8 decoding
	function utf8_decode(utftext) {
		var string = "";
		var i = 0;
		var c = c1 = c2 = 0;
 
		while ( i < utftext.length ) {
			c = utftext.charCodeAt(i);
 
			if (c < 128) {
				string += String.fromCharCode(c);
				i++;
			}
			else if((c > 191) && (c < 224)) {
				c2 = utftext.charCodeAt(i+1);
				string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
				i += 2;
			}
			else {
				c2 = utftext.charCodeAt(i+1);
				c3 = utftext.charCodeAt(i+2);
				string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
				i += 3;
			}
		}
		return string;
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
				var hash = encode(tok);
				_http.setRequestHeader('Authorization', 'Basic ' + hash);
			}
			for (var i=0, len=options.parameters.length; i<len; i+=2) {
				var key = options.parameters[i];
				var value = options.parameters[i+1];
				jsdump('SETTING ' + key + ' TO ' + value);
				_http.setRequestHeader(key,value);
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

Aja.waitFor = 10000;  



