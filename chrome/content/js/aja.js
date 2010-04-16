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


// First based on jx.js
// Pooling based on http://drakware.com/?e=3
function Aja() {
	this.waitFor = 5000;  
	var _that = this;
	var _http = false;
	var _timer = null;
	var _reqPool = new Array();
	
	function reqTimeout(httpReq) {
		if (callInProgress(httpReq.http)) {
			jsdump(">>> Timeout.");
			httpReq.http.abort();
			window.clearTimeout(httpReq.timer);
			httpReq.freed = 1
		}
	}

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
		_reqPool[pos].timer = window.setTimeout(function() { reqTimeout(_reqPool[pos]); }, _that.waitFor);
		jsdump("XMLReq Pool Depth " + _reqPool.length + ", using index " + pos + ".");
		return pos;
	}
	
	function freeXmlReq(pos) {
		jsdump("Freeing " + pos);
		window.clearTimeout(_reqPool[pos].timer);
		_reqPool[pos].freed = 1
	}
	
	
	function exec(username,password,url,callback,error,method) {
		var _reqPoolIndex = getXmlReqIndex()
		var _httpReq = _reqPool[_reqPoolIndex];
		var _http = _httpReq.http;
		if (_http) {
			_http.overrideMimeType('application/json');
			jsdump('_ajax opening ===> ' + url);
			_http.open(method,url,true);	
			
			if (username != null && username != undefined && username != "" &&
				  password != null && password != undefined && password != "") {
				//_http.open(method,url,true,username,password);	
				var tok = username + ':' + password;
				var hash = Base64.encode(tok);
				_http.setRequestHeader('Authorization', 'Basic ' + hash);
			} //else {
				//_http.open(method,url,true);	
			//}
			_http.onreadystatechange = function() {
				if (_http.readyState == 4) {
					if (_http.status == 200 || _http.status == 304) {
						var result = "";
						if (_http.responseText) {
							result = _http.responseText;
							result = result.replace(/[\n\r]/g,"");
							result = eval('('+result+')');
						}
						if (callback) {
							callback(result);
						}
					} else {
						if (error) {
							var status = 100;
							if (_http.status != null && _http.status != undefined) {
								status = _http.status;
							}
							result = { 'error': status };
							if (callback) {
								callback(result);	
							}
							error(status); 
						}
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

	this.get = function(username,password,url,callback,error) {
		return exec(username,password,url,callback,error,"GET");
	}

	this.post = function(username,password,url,callback,error) {
		return exec(username,password,url,callback,error,"POST");
	}
}
