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

Components.utils.import("resource://app/chrome/content/js/global.js");  

// Called to initialize the main window from the browser's onload method.
//
function start() {
	try {
		getMainWindow().document.addEventListener("firstCycleFetch", Fetch.firstFetch, false); 
		getMainWindow().document.addEventListener("cycleFetch", Fetch.go, false); 
		getMainWindow().document.addEventListener("start", start, false); 
		getMainWindow().document.addEventListener("openSpeech", Entry.open, false); 
		getMainWindow().document.addEventListener("closeSpeech", Entry.close, false); 
		getMainWindow().document.addEventListener("updateTweetLength", Statusbar.updateLengthDisplay, false); 
		getMainWindow().document.addEventListener("updateLoginList", Toolbar.updateAccountList, false);
		getMainWindow().document.addEventListener("countUnread", Fetch.countUnread, false);
	} catch(e) {
		jsdump('Problem initializing dispatchable events: ' + e);
	}
	Toolbar.update();
	getChromeElement('toolbarid').collapsed=false;
	getChromeElement('refreshButtonId').collapsed=false;
	getChromeElement('markAllAsReadId').collapsed=false;
	getChromeElement('openSpeechId').collapsed=false;
	var zoom = getIntPref("buzzbird.zoom",100);
	var docViewer = getBrowser().markupDocumentViewer;
	docViewer.fullZoom = zoom/100.0;
	//Lists.update(Ctx.user,Ctx.password);	
	Fetch.setProfile();
	Fetch.firstFetch();
}

// Needs this name, in the global namespace.
function quitApplication(aForceQuit) {
  var appStartup = Components.classes['@mozilla.org/toolkit/app-startup;1'].getService(Components.interfaces.nsIAppStartup);

  // eAttemptQuit will try to close each XUL window, but the XUL window can cancel the quit
  // process if there is unsaved data. eForceQuit will quit no matter what.
  var quitSeverity = aForceQuit ? Components.interfaces.nsIAppStartup.eForceQuit :
                                  Components.interfaces.nsIAppStartup.eAttemptQuit;
  appStartup.quit(quitSeverity);
}

// Needs this name, in the global namespace.
function openAboutDialog() {
	var params = {};
	window.openDialog("chrome://buzzbird/content/about.xul", "",
	    "chrome, dialog, resizable=no",params).focus();
}

// function removeTweetFromDom(id) {
// 	//jsdump('delete ' + id);
// 	el = getBrowser().contentDocument.getElementById('tweet-' + id);
// 	if (el) {
// 		el.parentNode.removeChild(el); 
// 	} else {
// 		jsdump('Could not find element with id tweet-' + id);
// 	}
// }
//

var UI = {
	markAllAsRead : function() {
		Global.unread = 0;
		Global.unreadMentions = 0;
		Global.unreadDirectFrom = 0;
		UI.updateWindowTitle();
		var markers = getBrowser().contentDocument.getElementsByClassName('mark');
		var ids = new Array();
		var len = markers.length;
		for (var i=0; i<len; i++) {
			markers[i].src='chrome://buzzbird/skin/images/actions/read.png'; 
			ids[i] = markers[i].id;
		}
		var len = ids.length;
		for (var i=0; i<len; i++) {
			getBrowser().contentDocument.getElementById(ids[i]).className='marked';
		}
	},
	
	// Puts unread counters in the titlebar.
	//
	updateWindowTitle : function() {
		jsdump("Updating the window title... unread is " + Global.unread + ", direct " + Global.unreadDirectFrom + ", mentions " + Global.unreadMentions);
		var windowTitlePref = getStringPref('buzzbird.window.title','both');
		var windowTitle = "Buzzbird";
		if (windowTitlePref == 'all') {
			if (Global.unread > 0) {
				windowTitle = windowTitle + " (" + Global.unread + " unread)"
			}
		} else if (windowTitlePref == 'both') {
			if (Global.unreadDirectFrom > 0 && Global.unreadMentions > 0) {
				windowTitle = windowTitle + " (" + Global.unreadDirectFrom + " unread direct, " + Global.unreadMentions + " unread mentions)"
			} else if (Global.unreadDirectFrom > 0 && Global.unreadMentions == 0) {
				windowTitle = windowTitle + " (" + Global.unreadDirectFrom + " unread direct)"
			} else if (Global.unreadDirectFrom == 0 && Global.unreadMentions > 0) {
				windowTitle = windowTitle + " (" + Global.unreadMentions + " unread mentions)"
			}
		} else if (windowTitlePref == 'direct') {
			if (Global.unreadDirectFrom > 0) {
				windowTitle = windowTitle + " (" + Global.unreadDirectFrom + " unread direct)"
			}
		} 
		document.title = windowTitle;	
	},
	
	goToUser : function() {
		var params = {};
		window.openDialog("chrome://buzzbird/content/gotouser.xul", "",
		    "chrome, dialog, modal, resizable=no, width=480, height=500",params).focus();
		if (params.out) {
		  var features = "chrome,titlebar,toolbar,centerscreen,modal,scrollbars=yes";
		  if (params.out.handle.match(/^@.*?/)) {
				params.out.handle = params.out.handle.substring(1);
		  }
		  var params = {'userId':params.out.handle, 'username':Ctx.user, 'password':Ctx.password}
		  window.openDialog("chrome://buzzbird/content/user.xul", "", features, params);
		  if (params.out) {
				if (params.out.action == 'friend') {
					var features = "chrome,titlebar,toolbar,centerscreen,modal,scrollbars=yes";
					window.openDialog("chrome://buzzbird/content/friendship.xul", "", features, params.out);
				} else if (params.out.action == 'reply') {
					var text = '@' + desanitize(params.out.replyTo) + ' ';
					getChromeElement('textboxid').value = text;
					getChromeElement('statusid').label = text.length + "/140";
					getChromeElement('textboxid').focus();
					dispatch('openSpeech');
				} else if (params.out.action == 'directTo') {
					var text = 'd ' + desanitize(params.out.directTo) + ' ';
					getChromeElement('textboxid').value = text;
					getChromeElement('statusid').label = text.length + "/140";
					getChromeElement('textboxid').focus();	
					dispatch('openSpeech');
				} else if (params.out.action == 'retweet') {
					var text = params.out.text
					getChromeElement('textboxid').value = text;
					getChromeElement('textboxid').focus();		
					dispatch('openSpeech');
					dispatch('updateTweetLength');
				}
		  }			  
		}
	},
	
	onGoToUserOk : function() {
		window.arguments[0].out = {handle:document.getElementById("handle").value};
		return true;
	},

	onGoToUserCancel : function() {
		return true;
	},
	
	// Called when the user scrolls the main browser window - we enable/disable autoscroll
	// in here to prevent 'jumping' in a user is scrolling through old tweets when an 
	// update occurs.
	//
	browserScrolled : function(e) {	
		var y = getBrowser().contentWindow.scrollY;
		var a = getBrowser().getAttribute('autoscroll');
		if (y==0 && a!='true') {
			getBrowser().setAttribute('autoscroll',true);
			jsdump('autoscroll activated.');		
		} else if (y!=0 && a=='true'){
			getBrowser().setAttribute('autoscroll',false);
			jsdump('autoscroll deactivated.');
		}
	},
	
	openPreferences : function() {
	  var instantApply = getBoolPref("browser.preferences.instantApply", false);
	  jsdump("instantApply is " + instantApply);
	  var features = "chrome,titlebar,toolbar,centerscreen" + (instantApply ? ",dialog=no" : ",modal");
	  window.openDialog("chrome://buzzbird/content/prefs.xul", "", features);
	  Fetch.countUnread();	
	},

	openAccountPreferences : function() {
	  var instantApply = getBoolPref("browser.preferences.instantApply", false);
	  jsdump("instantApply is " + instantApply);
	  var features = "chrome,titlebar,toolbar,centerscreen" + (instantApply ? ",dialog=no" : ",modal");

	  //var features = "chrome,titlebar,toolbar,centerscreen,modal";
	  window.openDialog("chrome://buzzbird/content/prefs.xul", "", features, "paneMultiAccounts");
	},
	
	shortenUrl : function() {
		var shortUrlProvider = getStringPref('buzzbird.shorturl.destination', 'is.gd');
		var params = {inn:{shortUrlProvider:shortUrlProvider},out:null};
		window.openDialog("chrome://buzzbird/content/shorten.xul", "",
		    "chrome, dialog, modal, resizable=no",params).focus();
		if (params.out) {
			var url2shorten = params.out.urlid;
			switch(shortUrlProvider) {
			case "is.gd":
				url = 'http://is.gd/api.php?longurl=' + url2shorten;
				break;
			case "tinyurl.com":
				url = 'http://tinyurl.com/api-create.php?url=' + url2shorten;
				break;
			default:
				//XXX: Should never happen
				url = "http://example.org/wrong-shorten-provider";
				prompts.alert(window, "Sorry.", "We hit a bug! There was an internal error shortning your URL.");
				return;
			}

			var ajax = new Aja();
			ajax.post(url, {
					format: 'raw',
					onSuccess: function(shortenedUrl) {
						Entry.appendText(shortenedUrl);
					},
					onError: function() { 
						var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
					                        .getService(Components.interfaces.nsIPromptService);
						prompts.alert(window, "Sorry.", "There was an error shortning your URL.");
					}
				}
			);
		}
	}
}


var Entry = {
	// Runs on each key press in the tweet-authoring text area.
	//
	keyPressed : function(e) {
		if (e.which == 13) {
			if (getBoolPref('buzzbird.post.return',false)) {
				var content = getChromeElement('textboxid').value;
				if (content.length > 0) {
					var textbox = getChromeElement('textboxid');
					textbox.disabled = true;
					Post.go();
				} else {
					e.preventDefault();
					return false;
				}
			}
		}
	},

	// Runs on each key up in the tweet-authoring text ara.
	//
	keyUp : function(e) {
		var content = getChromeElement('textboxid').value;
		getChromeElement('postbuttonid').disabled = (content.length <= 0);
		if (content.length <= 0 || content.substring(0,1) != "@") {
			getChromeElement('replyTweetId').value = "0";
			getChromeElement('replycheckboxid').hidden = true;
			getChromeElement('replycheckboxid').checked = false;		
		}
		Statusbar.updateLengthDisplay();

		// if (e.which == 50 && e.shiftKey) {
		// 	jsdump('it is an @!');
		// 	var m = getChromeElement('completionsMenu');
		// 	// var m = getMainWindow().document.createElement('popup');
		// 	// m.setAttribute('id','popupid');
		// 	// getMainWindow().document.appendChild(m);
		// 	var x = getMainWindow().document.createElement('menuitem');
		// 	x.setAttribute('id','number-1');
		// 	x.setAttribute('label','@mdesjardins');
		// 	m.appendChild(x);
		// 
		// 	var y = getMainWindow().document.createElement('menuitem');
		// 	y.setAttribute('id','number-2');
		// 	y.setAttribute('label','@cereslogic');
		// 	m.appendChild(y);
		// 	
		// 	var z = getMainWindow().document.createElement('menuitem');
		// 	z.setAttribute('id','number-3');
		// 	z.setAttribute('label','@rodomontade');
		// 	m.appendChild(z);
		// 	
		// 	jsdump('opening the popup, e.clientXY is ' + e.clientX + ', ' + e.clientY)
		// 	m.openPopupAtScreen(0,140);
		// }
	},

	// Called from onblur on tweet textfield
	//
	postTextChanged : function () {
		Statusbar.updateLengthDisplay(); 
		getChromeElement('postbuttonid').disabled = (getChromeElement('textboxid').value.length <= 0);
	},
	
	visible : function(val) {
		var currentState = getChromeElement('textboxid').collapsed;
		if (val) {
			if (!currentState) {
				// collapse
				var h = 45;
				function doWork() {
					var hh = h + 'px'
					getChromeElement('textboxid').style.height=hh;
					h = h - 10;
					if (h > 0) {
						setTimeout(doWork,1);
					} else {
						getChromeElement('textboxid').collapsed=true;		
						getChromeElement('speechheaderid').collapsed=true;		
						getChromeElement('shortenUrlId').collapsed=true;		
						getChromeElement('symbolButtonId').collapsed=true;
					}
				}
				setTimeout(doWork,1);
			}
		} else {
			if (currentState) {
				// expand
				getChromeElement('textboxid').style.height='0px';
				getChromeElement('textboxid').collapsed=false;
				var h = 0
				function doWork() {
					var hh = h + 'px'
					getChromeElement('textboxid').style.height=hh;
					h = h + 10;
					if (h < 50) {
						setTimeout(doWork,1);
					} else {
						getChromeElement('textboxid').collapsed=false;		
						getChromeElement('speechheaderid').collapsed=false;		
						getChromeElement('shortenUrlId').collapsed=false;		
						getChromeElement('symbolButtonId').collapsed=false;
						getChromeElement('textboxid').focus();
					}
				}
				setTimeout(doWork,1);
			}
		}

		var replyTweetId = getChromeElement('replyTweetId').value;
		jsdump('replyTweetId is ' + replyTweetId);
		if (replyTweetId > 0) {
			jsdump('Showing Reply Checkbox');
			getChromeElement('replycheckboxid').hidden = false;
			getChromeElement('replycheckboxid').checked = true;
		} else {
			jsdump('Hiding Reply Checkbox');
			getChromeElement('replycheckboxid').hidden = true;
			getChromeElement('replycheckboxid').checked = false;
		}
		if (val) {
			getChromeElement('openSpeechId').image = Toolbar.normalIcon('comment-add');
		} else {
			getChromeElement('openSpeechId').image = Toolbar.clickedIcon('comment-add');
		}
	},

	toggleVisible : function() {
		var collapsed = getChromeElement('textboxid').collapsed;
		if (collapsed) {
			Entry.visible(false);
		} else {
			Entry.visible(true);
		}
	},

	open : function() {
		jsdump('openSpeech called');
		Entry.visible(false);
		getChromeElement('textboxid').focus();	
	},

	close : function() {
		Entry.visible(true);
	},
	
	appendText : function(symbol) {
		var caret = getChromeElement('textboxid').selectionStart;
		var t = getChromeElement('textboxid').value;
		if (caret == null || caret == undefined) {
			getChromeElement('textboxid').value = t + symbol;
		} else {
			var pre = t.substring(0,caret);
			var post = t.substring(caret);
			var t = pre + symbol + post;
			getChromeElement('textboxid').value = t;
		}
		var len = getChromeElement('textboxid').value.length;
		getChromeElement('statusid').label = len + '/140';
	}
}

var Show = {
	// This one is written funkily because it could take a while, and
	// we don't want to lock up the browser.  We might want to consider
	// doing this to showOrHide as well.
	//
	all : function() {
		getChromeElement('filterbuttonid').disabled=true;
		getChromeElement('filtermenupopupid').disabled=true;
		var elements = getBrowser().contentDocument.getElementsByClassName('tweetBox');
		var i = 0;
		function doWork() {
			if (elements[i].style.display != 'inline') {
				elements[i].style.display = 'inline';
			}
			i++;
			if (i < elements.length) {
				setTimeout(doWork, 1);
			} else {
				getChromeElement('filtermenupopupid').disabled=false;
				getChromeElement('filterbuttonid').disabled=false;
			}
		}
		setTimeout(doWork,1);
		getChromeElement('filterbuttonid').label = strings.get("Showing_timeline");
		getChromeElement('filter-alltweets').setAttribute("checked","true");
		getChromeElement('filter-responses').setAttribute("checked","false");
		getChromeElement('filter-direct').setAttribute("checked","false");
	},

	mentions : function() {
		Show.showOrHide('tweet','none');
		Show.showOrHide('mine','none');
		Show.showOrHide('direct-to','none');
		Show.showOrHide('direct-from','none');
		Show.showOrHide('reply','inline');	
		getChromeElement('filterbuttonid').label = strings.get("Showing_mentions");
		getChromeElement('filter-alltweets').setAttribute("checked","false");
		getChromeElement('filter-responses').setAttribute("checked","true");
		getChromeElement('filter-direct').setAttribute("checked","false");
	},
	
	direct : function() {
		Show.showOrHide('tweet','none');
		Show.showOrHide('mine','none');
		Show.showOrHide('direct-to','inline');
		Show.showOrHide('direct-from','inline');
		Show.showOrHide('reply','none');	
		getChromeElement('filterbuttonid').label = strings.get("Showing_direct_messages");
		getChromeElement('filter-alltweets').setAttribute("checked","false");
		getChromeElement('filter-responses').setAttribute("checked","false");
		getChromeElement('filter-direct').setAttribute("checked","true");

	},
	
	showOrHide : function(tweetType,disp) {
		getChromeElement('filtermenupopupid').disabled=true;
		getChromeElement('filterbuttonid').disabled=true;
		var elements = getBrowser().contentDocument.getElementsByName(tweetType);
		for (var i=elements.length-1; i>=0; i--) {
			element = elements[i];
			element.style.display = disp;
		}
		getChromeElement('filtermenupopupid').disabled=false;
		getChromeElement('filterbuttonid').disabled=false;
	}
}

// Zoom stuff for blind people like Thales. :)
//
//
var Zoom = {
	bigger : function() {
		var docViewer = getBrowser().markupDocumentViewer;
		docViewer.fullZoom = docViewer.fullZoom * 1.25;
		setIntPref("buzzbird.zoom", docViewer.fullZoom * 100);
	},

	smaller : function() {
		var docViewer = getBrowser().markupDocumentViewer;
		docViewer.fullZoom = docViewer.fullZoom * 0.8;	
		setIntPref("buzzbird.zoom", docViewer.fullZoom * 100);
	},

	reset : function() {
		var docViewer = getBrowser().markupDocumentViewer;
		docViewer.fullZoom = 1.0;
		setIntPref("buzzbird.zoom", 100);
	}
}

// Twitter list support.  This code has atrophied.
//
//
var Lists = {
	update : function(username,password) {
		Lists.addToLists("timeline");
		Social.service(Ctx.service).fetchLists({
			'username': username,
			'password': password,
			'token': Ctx.token,
			'tokenSecret': Ctx.tokenSecret,
			onSuccess: function(result) { 
				jsdump("Content of this list is below. List length is " + result.lists.length);
				for (var j=0, len=result.lists.length; j<len; j++) {
					Lists.addToLists(result.lists[j].slug);
				}		
			},
			onError: function(status) { jsdump("Error fetching lists: " + status); }
		});		
	},

	add : function(listname) {
		const XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
		var item = listname;
		var menuitem = document.createElementNS(XUL_NS, "menuitem");
		menuitem.setAttribute("label", listname);
		menuitem.setAttribute("value", item);
		var f = "switchList('" + listname + "');";
		menuitem.setAttribute("oncommand", f);
		menuitem.setAttribute("checked","false");
		menuitem.setAttribute("type","checkbox");
		menuitem.setAttribute("id","listmenu-" + listname);
		menuitem.setAttribute("class","accountmenu-account");  
		getChromeElement('listbuttonmenuid').appendChild(menuitem);
	}
}

// Account management junk.
//
//
var Account = {
	login : function(username,password,service) {
		jsdump('in login.');
		var token = Social.service(service).verifyCredentials(username,password);
		if (token == null) {
			return false;
		} else {
			Ctx.user = username;
			Ctx.password = password;
			Ctx.list = null;
			Ctx.service = service;
			if (token.accessToken !== undefined) {
				Ctx.token = token.accessToken;
			}
			if (token.accessTokenSecret !== undefined) {
				Ctx.tokenSecret = token.accessTokenSecret;
			}
			return token;	
		}
	},
	
	reauth : function() {
		var params = {inn:{'username':Ctx.user}, out:{}};
		window.openDialog("chrome://buzzbird/content/reauth-account.xul", "",
		    "chrome, dialog, modal, resizable=no, width=450, height=180",params).focus();
		if (params.out) {
		  var features = "chrome,titlebar,toolbar,centerscreen,modal,scrollbars=yes";
			var am = new AccountManager();
			var token = Account.login(Ctx.user, params.out.password, Ctx.service);
			if (token) {
				var accessToken = null;
				var accessTokenSecret = null;
				if (Social.service(Ctx.service).support.xAuth) {
					accessToken = token.accessToken;
					accessTokenSecret = token.accessTokenSecret;
				}
				var am = new AccountManager();
				am.addAccount({
					'username':Ctx.user,
					'password':params.out.password,
					'service':Ctx.service,
					'token':accessToken,
					'tokenSecret':accessTokenSecret
				});
				Global.mostRecentUpdate = null;
				Global.mostRecentDirect = null;
				getBrowser().loadURI("chrome://buzzbird/content/main.html",null,"UTF-8");
			} else {
				jsdump('No token returned.');
				var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
				                        .getService(Components.interfaces.nsIPromptService);
				prompts.alert(window, "Sorry.", "Unable to re-authorize your account.");
			}
		}
	},
	
	onReauthAccountOk : function() {
		window.arguments[0].out = {
			'password':document.getElementById("password").value,
		};
	},
	
	onReauthAccountCancel : function() {
		var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
		                        .getService(Components.interfaces.nsIPromptService);
		prompts.alert(window, "Sorry.", "Unable to re-authorize your account.");
	},
	
	switch : function(username,password,service) {	
		jsdump('switch(' + username + ',' + password + ',' + service + ')');
		var oldusername = Ctx.user;
		var oldservice = Ctx.service;
		if (Social.service(service).support.xAuth) {
			var am = new AccountManager();
			var account = am.getAccount(username,service);
			Ctx.setAccount(account);
			Global.resetCounters();
			Fetch.setProfile();
		} else if (!Account.login(username,password,service)) {	
			return;
		}
		var loginButton = getChromeElement('accountbuttonid');
		loginButton.label = username + '@' + service;
		if (oldusername != null && oldusername != undefined && oldusername != "") {
			getChromeElement('accountmenu-' + oldusername + '@' + oldservice).setAttribute("checked","false");
		}
		getChromeElement('accountmenu-' + username + '@' + service).setAttribute("checked","true");
		getBrowser().loadURI("chrome://buzzbird/content/main.html",null,"UTF-8");
	}
}

// Statusbar UI Junk
//
//
var Statusbar = {
	// Writes a message to the statusbar.
	//
	message : function(text) {
		getChromeElement('statusid').value = text;	
	},

	// Writes the length of the tweet entry field to the statusbar.
	//
	updateLengthDisplay : function() {
		var textbox = getChromeElement('textboxid');
		var length = textbox.value.length;
		var status = getChromeElement('statusid');
		if (length != 0) {
			status.value = length + '/140';
		} else {
			status.value = '';
		}

		// TODO:should be a class, not hard coded here.
		if (length>140) {
			textbox.style.color = '#D00';
			status.style.color = '#F00'
		} else {
			textbox.style.color = '#000';
			status.style.color = '#222';
		}
	}
}

// Toolbar UI junk.
//
//
var Toolbar = {
	// Sets the checkboxes correctly on the toolbar's context menu.
	//
	onContextMenuOpen : function() {
		var icon = getBoolPref('buzzbird.toolbar.show-icons');
		var text = getBoolPref('buzzbird.toolbar.show-text');
		var small = getBoolPref('buzzbird.toolbar.small-size');

		getChromeElement('toolbar-context-menu-icon-and-text').setAttribute("checked","false");
		getChromeElement('toolbar-context-menu-icon-only').setAttribute('checked','false');
		getChromeElement('toolbar-context-menu-text-only').setAttribute('checked','false');

		if (icon && text) {
			getChromeElement('toolbar-context-menu-icon-and-text').setAttribute("checked","true");
		} else {
			if (icon) {
				getChromeElement('toolbar-context-menu-icon-only').setAttribute('checked','true');
			} else {
				getChromeElement('toolbar-context-menu-text-only').setAttribute('checked','true');
			}
		}
		if (small) {
			getChromeElement('toolbar-context-menu-use-small-size').setAttribute('checked','true');
		} else {
			getChromeElement('toolbar-context-menu-use-small-size').setAttribute('checked','false');
		}
		return true;
	},
	
	setMode: function(mode) {
		if (mode == 'icons-and-text') {
			setBoolPref('buzzbird.toolbar.show-icons',true);
			setBoolPref('buzzbird.toolbar.show-text',true);
		} else if (mode == 'icons-only') {
			setBoolPref('buzzbird.toolbar.show-icons',true);
			setBoolPref('buzzbird.toolbar.show-text',false);
		} else if (mode == 'text-only') {
			setBoolPref('buzzbird.toolbar.show-icons',false);
			setBoolPref('buzzbird.toolbar.show-text',true);
		}
		Toolbar.update();
	},
	
	toggleIconSize : function() {
		var small = getBoolPref('buzzbird.toolbar.small-size');
		if (small) {
			setBoolPref('buzzbird.toolbar.small-size',false);
		} else {
			setBoolPref('buzzbird.toolbar.small-size',true);		
		}
		Toolbar.update();
	},

	update : function() {
		var icon = getBoolPref('buzzbird.toolbar.show-icons');
		var text = getBoolPref('buzzbird.toolbar.show-text');
		var small = getBoolPref('buzzbird.toolbar.small-size');

		var refreshButton = getChromeElement('refreshButtonId');
		var markAllAsReadButton = getChromeElement('markAllAsReadId');
		var openSpeechButton = getChromeElement('openSpeechId');
		var shortenUrlButton = getChromeElement('shortenUrlId');
		var emojiButton = getChromeElement('symbolButtonId');
		var imagePath = 'chrome://buzzbird/skin/images/buttons/';
		var fontSize = '11px';
		if (small) {
			imagePath += 'small/';
			fontSize = '10px';
		} else {
			imagePath += 'large/';
		}

		refreshButton.setAttribute('image',imagePath + 'refresh.png');
		refreshButton.style.fontSize = fontSize;
		markAllAsReadButton.setAttribute('image',imagePath + 'mark-all.png');
		markAllAsReadButton.style.fontSize = fontSize;
		openSpeechButton.setAttribute('image',imagePath + 'comment-add.png');
		openSpeechButton.style.fontSize = fontSize;

		var width = '60px';
		if (text) {
			if (small) {
				width = '55px';
			} else {
				width = '60px';
			}
		} else {
			if (small) {
				width = '30px';
			} else {
				width = '45px';
			}
		}
		refreshButton.style.width = width;
		markAllAsReadButton.style.width = width;
		openSpeechButton.style.width = width;

		if (text) {
			refreshButton.setAttribute('label','Refresh');
			markAllAsReadButton.setAttribute('label','Mark All');
			openSpeechButton.setAttribute('label','Post');
		} else {
			refreshButton.removeAttribute('label');
			markAllAsReadButton.removeAttribute('label');
			openSpeechButton.removeAttribute('label');
		}

		if (icon) {
			refreshButton.setAttribute('image',Toolbar.normalIcon('refresh'));
			markAllAsReadButton.setAttribute('image',Toolbar.normalIcon('mark-all'));
			openSpeechButton.setAttribute('image',Toolbar.normalIcon('comment-add'));
		} else {
			refreshButton.removeAttribute('image');
			markAllAsReadButton.removeAttribute('image');
			openSpeechButton.removeAttribute('image');
		}
	},
	
	iconPath : function(name) {
		var small = getBoolPref('buzzbird.toolbar.small-size');
		var imagePath = 'chrome://buzzbird/skin/images/buttons/';
		if (small) {
			imagePath += 'small/';
		} else {
			imagePath += 'large/';
		}
		imagePath += name;
		return imagePath;
	},
	
	clickedIcon : function(name) {
		var show = getBoolPref('buzzbird.toolbar.show-icons');
		return show ? Toolbar.iconPath(name) + "-clicked.png" : null;
	},

	disabledIcon : 	function(name) {
		var show = getBoolPref('buzzbird.toolbar.show-icons');
		return show ? Toolbar.iconPath(name) + "-disabled.png" : null;
	},

	normalIcon : 	function(name) {
		var show = getBoolPref('buzzbird.toolbar.show-icons');
		return show ? Toolbar.iconPath(name) + ".png" : null;
	},
	
	updateAccountList : function() {
		jsdump('Updating the login list.');
		var am = new AccountManager();
		var logins = am.getAccounts();

		var loginButton = getChromeElement('accountbuttonid');
		loginButton.label = logins[0].username + '@' + logins[0].service;
		var loginMenu = getChromeElement('accountbuttonmenuid'); 
		while (loginMenu.hasChildNodes()) {
			loginMenu.removeChild(loginMenu.lastChild);
		}

		if (logins.length > 0) {
			loginButton.collapsed=false;
		}

		const XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
		for (var i=0; i<logins.length; i++) {
			var item = logins[i].username + '|' + logins[i].password + '|' + logins[i].token + '|' + logins[i].tokenSecret + '|' + logins[i].service;
			var menuitem = document.createElementNS(XUL_NS, "menuitem");
			menuitem.setAttribute("label", logins[i].username + '@' + logins[i].service);
			menuitem.setAttribute("value", item);
			var f = "Account.switch('" + logins[i].username + "','" + logins[i].password + "', '" + logins[i].service + "');";
			menuitem.setAttribute("oncommand", f);
			menuitem.setAttribute("checked","false");
			menuitem.setAttribute("type","checkbox");
			menuitem.setAttribute("id","accountmenu-" + logins[i].username + '@' + logins[i].service);
			menuitem.setAttribute("class","accountmenu-account");  
			getChromeElement('accountbuttonmenuid').appendChild(menuitem);
		}

		var separator = document.createElementNS(XUL_NS, "menuseparator")
		getChromeElement('accountbuttonmenuid').appendChild(separator);
		var menuitem = document.createElementNS(XUL_NS, "menuitem");
		menuitem.setAttribute("label", "Configure Accounts...");
		menuitem.setAttribute("value", "");
		menuitem.setAttribute("oncommand", "UI.openAccountPreferences();");
		getChromeElement('accountbuttonmenuid').appendChild(menuitem);
		getChromeElement('accountmenu-' + Ctx.user + '@' + Ctx.service).setAttribute("checked","true");
	},
	
	// Enables/disables the refresh button.
	//
	refreshAllowed : function(allowed) {
		if (allowed) {
			getChromeElement('refreshButtonId').disabled = false;
			getChromeElement('refreshButtonId').image = Toolbar.normalIcon('refresh');
		} else {
			getChromeElement('refreshButtonId').disabled = true;
			getChromeElement('refreshButtonId').image = Toolbar.disabledIcon('refresh');
		}
	},
	
	// Allows the user to click the whole button instead of just the triangle.
	//
	showFilterMenu : function() {
		var x = getChromeElement("filtermenupopupid");
		if (x.state === 'closed') {
			x.showPopup();
		} else {
			x.hidePopup();
		}
	},
	showAccountMenu : function() {
		var x = getChromeElement("accountbuttonmenuid");
		if (x.state === 'closed') {
			x.showPopup();
		} else {
			x.hidePopup();
		}
	},
	showListMenu : function() {
		var x = getChromeElement("listbuttonmenuid");
		if (x.state === 'closed') {
			x.showPopup();
		} else {
			x.hidePopup();
		}
	}
}

// Stuff related to fetching new status updates.
//
//
var Fetch = {
	setProfile : function() {
		jsdump('Fetch.setProfile, user ' + Ctx.user);
		Social.service(Ctx.service).fetchUserProfile({
			username: Ctx.user,
			password: Ctx.password,
			token: Ctx.token,
			tokenSecret: Ctx.tokenSecret,
			onSuccess: Fetch.setProfileCallback,
			onError: Fetch.error,
			queriedScreenName: Ctx.user
		});	
	},
	
	setProfileCallback : function(profile) {
		jsdump('Fetch.setProfileCallback, user ' + Ctx.user);
		Ctx.profile = profile;
		if (Social.service(Ctx.service).support.fetchFollowerIds == true) {
			Social.service(Ctx.service).fetchFollowerIds({
				username: Ctx.user,
				password: Ctx.password,
				token: Ctx.token,
				tokenSecret: Ctx.tokenSecret,
				onSuccess: Fetch.fetchFollowerIdsCallback,
				onError: Fetch.error,
			});	
		}
	},

	fetchFollowerIdsCallback : function(data) {
		Ctx.followers=data.ids;
		if (Social.service(Ctx.service).support.fetchFriendTimelines == true) {
			Social.service(Ctx.service).fetchFriendTimelines({
				username: Ctx.user,
				password: Ctx.password,
				cursor: -1,
				token: Ctx.token,
				tokenSecret: Ctx.tokenSecret,
				onSuccess: Fetch.fetchFriendTimelinesCallback,
				onError: Fetch.error,
			});	
		}
	},
	
	fetchFriendTimelinesCallback : function(data) {
		if (Ctx.friendScreenNames == null) {
			Ctx.friendScreenNames = new Array();
		}
		for (var i=0,len=data.users.length; i<len; i++) {
			Ctx.friendScreenNames.push(data.users[i].screen_name)
		}
		if (data.next_cursor !== undefined && data.next_cursor > 0) {
			Social.service(Ctx.service).fetchFriendTimelines({
				username: Ctx.user,
				password: Ctx.password,
				cursor: data.next_cursor,
				token: Ctx.token,
				tokenSecret: Ctx.tokenSecret,
				onSuccess: Fetch.fetchFollowersCallback,
				onError: Fetch.error,
			});	
		} else {
			jsdump("Done fetching screen names of friends, size = " + Ctx.friendScreenNames.length);
		}
	},
	
	firstFetch : function() {
		jsdump('Fetch.firstFetch, list: ' + Ctx.list);
		Social.service(Ctx.service).fetchDirectTo({
			username: Ctx.user,
			password: Ctx.password,
			token: Ctx.token,
			tokenSecret: Ctx.tokenSecret,
			onSuccess: Fetch.firstDirectCallback,
			onError: Fetch.error,
			count: 50,
			since: Global.mostRecentDirect,
		});	
	},

	firstDirectCallback : function(tweets) {
		jsdump('Fetch.firstDirectCallback, list: ' + Ctx.list);
		Fetch.renderNewTweets(tweets,false);
		Social.service(Ctx.service).fetchMentions({
			username: Ctx.user,
			password: Ctx.password,
			token: Ctx.token,
			tokenSecret: Ctx.tokenSecret,
			onSuccess: Fetch.firstMentionsCallback,
			onError: Fetch.error,
			count: 50,
			timelineSince: Global.mostRecentUpdate,
		});		
	},

	firstMentionsCallback : function(tweets) {
		jsdump('Fetch.firstMentionsCallback, list: ' + Ctx.list);
		Fetch.renderNewTweets(tweets,false);
		Social.service(Ctx.service).fetchTimeline({
			username: Ctx.user,
			password: Ctx.password,
			token: Ctx.token,
			tokenSecret: Ctx.tokenSecret,
			onSuccess: Fetch.firstTimelineCallback,
			onError: Fetch.error,
			count: 50,
			timelineSince: Global.mostRecentUpdate,
		});		
	},

	firstTimelineCallback : function(tweets) {
		jsdump('Fetch.firstTimelineCallback, list: ' + Ctx.list);
		Fetch.renderNewTweets(tweets,false);
		Fetch.finished();
	},

	go : function() {
		jsdump('Fetch.go, list: ' + Ctx.list);
		Toolbar.refreshAllowed(false);
		getChromeElement('accountbuttonid').disable=true;
		Social.service(Ctx.service).fetchDirectTo({
			username: Ctx.user,
			password: Ctx.password,
			token: Ctx.token,
			tokenSecret: Ctx.tokenSecret,
			onSuccess: Fetch.directCallback,
			onError: Fetch.error,
			count: 50,
			timelineSince: Global.mostRecentUpdate,
			directSince: Global.mostRecentDirect,
		});	
	},

	directCallback : function(tweets) {
		jsdump('Fetch.directCallback, list: ' + Ctx.list);
		Fetch.renderNewTweets(tweets,true);
		Social.service(Ctx.service).fetchTimeline({
			username: Ctx.user,
			password: Ctx.password,
			token: Ctx.token,
			tokenSecret: Ctx.tokenSecret,
			onSuccess: Fetch.timelineCallback,
			onError: Fetch.error,
			count: 50,
			timelineSince: Global.mostRecentUpdate,
		});		
	},

	timelineCallback : function(tweets) {
		jsdump('Fetch.timelineCallback, list: ' + Ctx.list);
		Fetch.renderNewTweets(tweets,true);
		Social.service(Ctx.service).fetchMentions({
			username: Ctx.user,
			password: Ctx.password,
			token: Ctx.token,
			tokenSecret: Ctx.tokenSecret,
			onSuccess: Fetch.mentionsCallback,
			onError: Fetch.error,
			count: 50,
			timelineSince: Global.previousMostRecentUpdate,
		});		
	},

	mentionsCallback : function(tweets) {
		jsdump('Fetch.mentionsCallback, list: ' + Ctx.list);
		Fetch.renderNewTweets(tweets,true);
		Fetch.finished();
	},

	finished : function() {
		var d = new Date();
		var mins = d.getMinutes()
		if (mins < 10) {
			mins = '0' + mins;
		}
		Statusbar.updateLengthDisplay();		
		Toolbar.refreshAllowed(true);
		getChromeElement('accountbuttonid').disable=false;
		setTimeout("function proxy(that) {that.Fetch.updateTimestamps()}; proxy(getMainWindow());",1000);
	},

	error : function(errorCode) {
		var msg = "Fetch Error: " + errorCode;
		if (errorCode == 401) {
			msg = "Fetch Error: Bad Credentials";
			Account.reauth();
		} else if (errorCode == 403 || errorCode == 420) {
			msg = "Fetch Error: API Rate Limit Exceeded";
		} else if (errorCode == 500 || errorCode == 502) {
			msg = "Fetch Error: Server Error";
		} else if (errorCode == 503) {
			msg = "Fetch Error: Over Capacity";
		}
		getChromeElement('accountbuttonid').disable=false;
		Statusbar.message(msg);
	},
	
	force : function() {
		jsdump('Fetch.force called.');
		Fetch.go();
	},
	
	// Update timestamps on individual tweets
	//
	updateTimestamps : function() {
		var ONE_SECOND = 1000;
		var ONE_MINUTE = 60 * ONE_SECOND;
		var ONE_HOUR = 60 * ONE_MINUTE;
		var ONE_DAY = 24 * ONE_HOUR;

		jsdump('updating timestamps.');
		var timestamps = getBrowser().contentDocument.getElementsByName('timestamp');
		var now = new Date();
		for (var i=0; i<timestamps.length; i++) {
			tweetid = timestamps[i].id;
			when = getBrowser().contentDocument.getElementById(tweetid).innerHTML;
			var then = new Date(parseFloat(when));
			var delta = now - then;
			var prettyWhen = "just now";
			if (delta > ONE_MINUTE && delta < ONE_HOUR) {
				// between 1m and 59m, inclusive
				var prettyWhen = "about " + parseInt(delta/ONE_MINUTE) + "m ago"
			} else  if (delta >= ONE_HOUR && delta < ONE_DAY) {
				// less than 24h ago
				var prettyWhen = "about " + parseInt(delta/ONE_HOUR) + "h " + parseInt((delta%ONE_HOUR)/ONE_MINUTE) + "m ago"
			} else if (delta >= ONE_DAY) {
				var prettyWhen = "more than " + parseInt(delta/(ONE_DAY)) + "d ago";
			}
			var elid = 'prettytime-' + tweetid.substring(tweetid.indexOf('-')+1);
			el = getBrowser().contentDocument.getElementById(elid)
			if (el) {
			  el.innerHTML = prettyWhen;
			}
		}
		jsdump('finished updating timestamps.');
	},

	// Iterates over newly fetched tweets to add them to the browser window.
	//
	renderNewTweets : function(newTweets,doNotifications) {
		jsdump('renderNewTweets, number of tweets: ' + newTweets.length);
		if (newTweets.length == 0) {
			jsdump('renderNewTweets: Nothing to do, skipping.');
		} else {
			// Save the scrollbar position so we can set it back when we're done.  This reduces the "jumpiness"
			// that happens if you're scrolling through old tweets when an update takes place.
			var x = getBrowser().contentWindow.scrollX;
			var y = getBrowser().contentWindow.scrollY;
			var max_y = getBrowser().contentWindow.scrollMaxY;
			var newCount = 0;
			var newText = '';
			var unread = {'tweet': 0, 'mentions': 0, 'directFrom': 0};

			for (var i=0; i<newTweets.length; i++) {
				var tweet = newTweets[i]
				var type = tweetType(tweet,Ctx.user,Ctx.password);
				if ((type == 'tweet' || type == 'reply' || type == 'mine') &&
				    (Global.mostRecentUpdate == null || Global.mostRecentUpdate < tweet.id)) {
					Global.mostRecentUpdate = tweet.id;
					jsdump('mostRecentTweet:' + Global.mostRecentUpdate);
					if ((type == 'reply')) {
						Global.previousMostRecentMention = Global.mostRecentMention;
						Global.mostRecentMention = tweet.id;
					}
				} else if ((type == 'direct-from' || type == 'direct-to') && 
				           (Global.mostRecentDirect == null || Global.mostRecentDirect < tweet.id)) {
					Global.mostRecentDirect = newTweets[i].id;
					jsdump('mostRecentDirect:' + Global.mostRecentDirect);
				} 

				var chk = window.content.document.getElementById('tweet-' + tweet.id);
				if (chk == null) {
					if (doNotifications) {
						if (type == 'reply' && getBoolPref("buzzbird.alert.visual.mention",true)) {
							var sticky = getBoolPref("buzzbird.alert.visual.mention.sticky",false)
							Notify.notify("Mention", sticky, tweet.user.profile_image_url, "Mentioned by @" + tweet.user.screen_name, tweet.text);
						} else if (type == 'direct-from' && getBoolPref("buzzbird.alert.visual.direct",true)) {
							var sticky = getBoolPref("buzzbird.alert.visual.direct.sticky",false)						
							Notify.notify("Direct Message", sticky, tweet.sender.profile_image_url, "Direct Message from @" + tweet.sender.screen_name, tweet.text);
						}
					}

					Global.unread = Global.unread + 1;
					if (type == "direct-from") {
						Global.unreadDirectFrom++;
					} else if (type == "reply") {
						Global.unreadMentions++;
					}

					Global.rawTweets[tweet.id] = tweet.text;
					
					newCount++;
					newText = Render.formatTweet(tweet,Ctx.user,Ctx.password) + newText;
				}
			}
			Render.insertAtTop(newText);

			if (doNotifications && newCount > 0 && getBoolPref("buzzbird.alert.visual.general",true)) {
				var sticky = getBoolPref("buzzbird.alert.visual.general.sticky",false)
				var messageText = "You have " + newCount;
				if (newCount == 1) {
					messageText += " new status update."
				} else {
					messageText += " new status updates."
				}
				Notify.notify("Tweet", sticky, null, "New updates received", messageText);
			}

			// Restore the scrollbar position.
			if (y!=0) {
				var new_max_y = getBrowser().contentWindow.scrollMaxY;
				var difference = new_max_y - max_y;
				getBrowser().contentWindow.scrollTo(x,y + difference);
			}
			UI.updateWindowTitle();
		}
	},
	
	// Counts unread tweets by category.  This uses way too much CPU.  :(
	//
	countUnread : function() {
		var markers = getBrowser().contentDocument.getElementsByClassName('mark');
		var len = markers.length;
		var unread = {'tweet': 0, 'mentions': 0, 'directFrom': 0};
		if (len > 0) {
			jsdump('Counting.');
			var i = 0;
			function doWork() {
				if (markers !== undefined && markers[i] !== undefined) {
					if (markers[i].src == 'chrome://buzzbird/skin/images/actions/unread.png') {
						Global.unread = Global.unread + 1;
						if (markers[i].getAttribute('tweetType') == "direct-from") {
							Global.unreadDirectFrom++;
						} else if (markers[i].getAttribute('tweetType') == "reply") {
							Global.unreadMentions++;
						}
					}
					i++;
					if (i < len) {
						setTimeout(doWork,10);
					} else {
						UI.updateWindowTitle();
					}
				}
			}
			setTimeout(doWork,10);
		} else {
			jsdump('None unread?');
			Global.unread = 0;
			Global.unreadMentions = 0;
			Global.unreadDirectFrom = 0;
			UI.updateWindowTitle();
		}
	}
}

// Stuff related to posting a status update.
//
//
var Post = {
	// Called on successful tweet postation
	//
	success : function(tweet) {	
		var textbox = getChromeElement('textboxid');
		textbox.reset();
		textbox.disabled = false;
		getChromeElement('statusid').label = Statusbar.updateLengthDisplay();
		getChromeElement('replyTweetId').value = "0";
		getChromeElement('replycheckboxid').hidden = true;
		getChromeElement('replycheckboxid').checked = false;
		var closeIt = getBoolPref('buzzbird.autoclose.post');
		if (closeIt) {
			Entry.close();
		}
		Post.complete(tweet);
	},

	// Called on a failure to post.
	// 
	error : function(errorCode) {
		var textbox = getChromeElement('textboxid');
		textbox.disabled = false;
		getChromeElement('postbuttonid').disabled = false;
		var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
		                        .getService(Components.interfaces.nsIPromptService);
		prompts.alert(window, "Sorry.", "There was an error posting that status update.");
		Statusbar.message("Post Error: " + errorCode);
		Post.complete(null); 	
	},

	// Called when a DM is successfully posted.
	//
	directSuccess : function(tweet) {
		var fakeTweet = {
			id : 0,
			text : "",
			created_at : new Date(),
			sender : "",
			user : {
			 	screen_name : "",
				profile_image_url : "",
				name : ""
			},
			source : ""
		};
		
		// TODO: This is an incredibly cheesy way to do this. Just sayin'
		fakeTweet.text = "Directly to " + tweet.substring(2);
		fakeTweet.sender = Ctx.user;
		fakeTweet.user.screen_name = Ctx.user;
		// TODO: Fixme. :(
		fakeTweet.user.profile_image_url = Ctx.profile.profile_image_url;
		fakeTweet.user.name = Ctx.profile.name
		fakeTweet.in_reply_to_screen_name = "";
		fakeTweet.sender = undefined;
		Render.insertAtTop(Render.formatTweet(fakeTweet,Ctx.user,Ctx.password));
	},

	// Called by success and error
	//
	complete : function(transport) {
		getChromeElement('textboxid').disabled = false;
		getChromeElement('postbuttonid').style.backgroundImage='url(chrome://buzzbird/skin/images/post-button-background.png)';
		Fetch.force();	
	},

	// Posts a status update.
	//
	go : function() {
		var tweet = getChromeElement('textboxid').value;
		if (tweet.length > 0) {
			getChromeElement('postbuttonid').style.backgroundImage='url(chrome://buzzbird/skin/images/post-button-background-inverse.png)';
			getChromeElement('postbuttonid').disabled = true;
			getChromeElement('textboxid').disabled = true;
			var replyTweetId = getChromeElement('replyTweetId').value;
			var replyCheckHidden = getChromeElement('replycheckboxid').hidden;
			var replyChecked = getChromeElement('replycheckboxid').checked;
			var isDirect = tweet.match(/^d(\s){1}(\w+?)(\s+)(\w+)/);	
			if (!replyCheckHidden && replyChecked && replyTweetId > 0) {
				jsdump("Replying");
				Social.service(Ctx.service).postReply({
					username: Ctx.user,
					password: Ctx.password,
					token: Ctx.token,
					tokenSecret: Ctx.tokenSecret,
					onSuccess: Post.success,
					onError: Post.error,	
					text: tweet,
					replyingToId: replyTweetId
				});
			} else if (isDirect) {
				jsdump("Posting (direct)");
				Social.service(Ctx.service).postUpdate({
					username: Ctx.user,
					password: Ctx.password,
					token: Ctx.token,
					tokenSecret: Ctx.tokenSecret,
					onSuccess: function(response) { Post.directSuccess(tweet); Post.success(response); },
					onError: Post.error,	
					text: tweet		
				});				
			} else {
				jsdump("Posting (no reply not direct)");
				Social.service(Ctx.service).postUpdate({
					username: Ctx.user,
					password: Ctx.password,
					token: Ctx.token,
					tokenSecret: Ctx.tokenSecret,
					onSuccess: Post.success,
					onError: Post.error,	
					text: tweet		
				});		
			}
		}
	}
}



// Stuff for the debugger.
//
function toOpenWindowByType(inType, uri) {
  var winopts = "chrome,extrachrome,menubar,resizable,scrollbars,status,toolbar";
  window.open(uri, "_blank", winopts);
}
function showDebugger() {
	start_venkman();
}

