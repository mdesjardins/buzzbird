//@line 37 "/builds/tinderbox/Fx-Mozilla1.9-Release/Darwin_8.8.4_Depend/mozilla/toolkit/content/macWindowMenu.js"

function checkFocusedWindow()
{
  var windowManagerDS =
    Components.classes['@mozilla.org/rdf/datasource;1?name=window-mediator']
              .getService(Components.interfaces.nsIWindowDataSource);

  var sep = document.getElementById("sep-window-list");
  // Using double parens to avoid warning
  while ((sep = sep.nextSibling)) {
    var url = sep.getAttribute('id');
    var win = windowManagerDS.getWindowForResource(url);
    if (win == window) {
      sep.setAttribute("checked", "true");
      break;
    }
  }
}

function toOpenWindow( aWindow )
{
  aWindow.document.commandDispatcher.focusedWindow.focus();
}

function ShowWindowFromResource( node )
{
  var windowManagerDS =
    Components.classes['@mozilla.org/rdf/datasource;1?name=window-mediator']
              .getService(Components.interfaces.nsIWindowDataSource);

  var desiredWindow = null;
  var url = node.getAttribute('id');
  desiredWindow = windowManagerDS.getWindowForResource( url );
  if (desiredWindow)
    toOpenWindow(desiredWindow);
}

function zoomWindow()
{
  if (window.windowState == STATE_NORMAL)
    window.maximize();
  else
    window.restore();
}
