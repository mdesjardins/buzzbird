
function onOk() {
	return true;
}

function oneTweetOnLoad() {
	var id = window.arguments[0];
	var username = window.arguments[1];
	var password = window.arguments[2];
	
	jsdump('Getting tweet ' + id);
	url = 'http://twitter.com/statuses/show/' + id + '.json';
	new Ajax.Request(url,
		{
			method:'get',
			httpUserName: username,
			httpPassword: password,
			onSuccess: function(transport) { oneTweetCallback(transport); },
			onFailure: function() { 
					var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
					                        .getService(Components.interfaces.nsIPromptService);
					prompts.alert(window, "Sorry.", "There was an error processing this request.");
			}
		});	
}

function oneTweetCallback(transport) {
	var tweet = eval('(' + transport.responseText + ')');
	jsdump('transport.responseText: ' + transport.responseText);
    jsdump('response: ' + tweet);
	var newText = formatTweet(tweet);
	jsdump('newText: ' + newText);
	var doc = parser.parseFromString('<div xmlns="http://www.w3.org/1999/xhtml">' + newText + '</div>', 'application/xhtml+xml');
	if (doc.documentElement.nodeName != "parsererror" ) {
		var root = doc.documentElement;
		for (var j=0; j<root.childNodes.length; ++j) {
			window.content.document.body.insertBefore(document.importNode(root.childNodes[j], true),window.content.document.body.firstChild);
		}
	} else {
		jsdump("Couldn't render the tweet.");
	}
}
