// start window
pref("toolkit.defaultChromeURI", "chrome://buzzbird/content/main.xul");
//pref("toolkit.defaultChromeURI", "chrome://buzzbird/content/template.xul");

// suppress external-load warning for standard browser schemes
pref("network.protocol-handler.warn-external.http", false);
pref("network.protocol-handler.warn-external.https", false);
pref("network.protocol-handler.warn-external.ftp", false);

// this doesn't seem to make the tooltips show up.  :(
pref("browser.chrome.tooltips.attrlist.enabled", true);
pref("browser.chrome.tooltips.attrlist", "alt|src|data|title|href|cite|action|onclick|onmouseover|onsubmit");

// Needed for preferences window (see https://developer.mozilla.org/en/Preferences_System, or mozilla bug 302509)
pref("browser.preferences.animateFadeIn", false);
pref("browser.preferences.instantApply", true);

// enable password manager
pref("signon.rememberSignons", true);
pref("signon.expireMasterPassword", false);
pref("signon.SignonFileName", "signons.txt");

// enable extension installers
pref("xpinstall.dialog.confirm", "chrome://mozapps/content/xpinstall/xpinstallConfirm.xul");
pref("xpinstall.dialog.progress.skin", "chrome://mozapps/content/extensions/extensions.xul?type=themes");
pref("xpinstall.dialog.progress.chrome", "chrome://mozapps/content/extensions/extensions.xul?type=extensions");
pref("xpinstall.dialog.progress.type.skin", "Extension:Manager-themes");
pref("xpinstall.dialog.progress.type.chrome", "Extension:Manager-extensions");
pref("extensions.update.enabled", true);
pref("extensions.update.interval", 86400);
pref("extensions.dss.enabled", false);
pref("extensions.dss.switchPending", false);
pref("extensions.ignoreMTimeChanges", false);
pref("extensions.logging.enabled", false);
pref("general.skins.selectedSkin", "classic/1.0");
// NB these point at AMO
pref("extensions.update.url", "chrome://mozapps/locale/extensions/extensions.properties");
pref("extensions.getMoreExtensionsURL", "chrome://mozapps/locale/extensions/extensions.properties");
pref("extensions.getMoreThemesURL", "chrome://mozapps/locale/extensions/extensions.properties");

// defaults
pref("buzzbird.update.interval", 180000);