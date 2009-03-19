

// AJAX timeout functions.
//
function callInProgress(xmlhttp) {
	switch (xmlhttp.readyState) {
		case 1: case 2: case 3:
			return true;
			break;
		// Case 4 and 0
		default:
			return false;
			break;
	}
}

// Register global responders that will occur on all AJAX requests.  This is a way
// I found online to gracefully handle AJAX timeouts.  When we make a request, we
// set up a timer which will come back and make sure we processed the request, if not,
// we indicate a failure occured.
//
Ajax.Responders.register({
	onCreate: function(request) {
		var mainWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
		                   .getInterface(Components.interfaces.nsIWebNavigation)
		                   .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
		                   .rootTreeItem
		                   .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
		                   .getInterface(Components.interfaces.nsIDOMWindow);

		request['timeoutId'] = mainWindow.setTimeout(
			function() {
				// If we have hit the timeout and the AJAX request is active, abort it and let the user know
				if (callInProgress(request.transport)) {
					request.transport.abort();
					message('Timeout');
					refreshAllowed(true);
					progress(false);
					
					// Run the onFailure method if we set one up when creating the AJAX object
					if (request.options['onFailure']) {
						request.options['onFailure'](request.transport, request.json);
					}
				}
			},
			10000 // Ten seconds
		);
	},
	onComplete: function(request) {
		var mainWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
		                   .getInterface(Components.interfaces.nsIWebNavigation)
		                   .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
		                   .rootTreeItem
		                   .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
		                   .getInterface(Components.interfaces.nsIDOMWindow);
		
		// Clear the timeout, the request completed ok
		mainWindow.clearTimeout(request['timeoutId']);
	}
});