#!/bin/sh
LOCALDIR=~/_play
if [ "`uname`" = "Linux" ] ; then
	[ -d ./chrome/skin/classic ] || mkdir ./chrome/skin/classic
	cp -fr ./chrome/skin/classic-linux/* ./chrome/skin/classic/
	cp -fr ./chrome/content/platform/linux/* ./chrome/content/
	cp ./chrome/content/notifications/notify-linux.sh	./chrome/content/notifications/notify.sh
	cp ./chrome/content/js/notify/notify-linux.js chrome/content/js/notify/notify.js
	/opt/xulrunner/xulrunner ./application.ini -jsconsole -console & 
else
	sudo rm -fr /Applications/Buzzbird.app 
	sudo /Library/Frameworks/XUL.framework/xulrunner-bin --install-app "${LOCALDIR}/buzzbird" 
	sudo cp ${LOCALDIR}/buzzbird/Info.plist /Applications/Buzzbird.app/Contents
	sudo cp /Applications/Buzzbird.app/Contents/Resources/chrome/content/platform/mac/* /Applications/Buzzbird.app/Contents/Resources/chrome/content

	sudo mv /Applications/Buzzbird.app/Contents/Resources/chrome/skin/classic-mac /Applications/Buzzbird.app/Contents/Resources/chrome/skin/classic
	sudo mv /Applications/Buzzbird.app/Contents/Resources/chrome/content/notifications/notify-mac.sh /Applications/Buzzbird.app/Contents/Resources/chrome/content/notifications/notify.sh
	sudo mv /Applications/Buzzbird.app/Contents/Resources/chrome/content/js/notify/notify-mac.js /Applications/Buzzbird.app/Contents/Resources/chrome/content/js/notify/notify.js

	sudo sh -c "echo \"pref('browser.preferences.animateFadeIn', false);\" > /Applications/Buzzbird.app/Contents/Resources/defaults/preferences/mac.js"
	sudo sh -c "echo \"pref('browser.preferences.instantApply', true);\" >> /Applications/Buzzbird.app/Contents/Resources/defaults/preferences/mac.js"

	sudo rm -fr /Applications/Buzzbird.app/Contents/Resources/chrome/skin/classic-win
	sudo rm -fr /Applications/Buzzbird.app/Contents/Resources/chrome/skin/classic-linux
	sudo rm -fr /Applications/Buzzbird.app/Contents/Resources/chrome/skin/classic-mac
	sudo rm -fr /Applications/Buzzbird.app/Contents/Resources/chrome/content/platform

	# Cleanup
	sudo rm -fr /Applications/Buzzbird.app/Contents/Resources/.git
	sudo rm -fr /Applications/Buzzbird.app/Contents/Resources/*.sh
	sudo rm -fr /Applications/Buzzbird.app/Contents/Resources/*.bat
	sudo rm -fr /Applications/Buzzbird.app/Contents/Resources/*.aip
	sudo rm -fr /Applications/Buzzbird.app/Contents/Resources/*.exe
	sudo rm -fr /Applications/Buzzbird.app/Contents/Resources/*.ico
	sudo rm -fr /Applications/Buzzbird.app/Contents/Resources/git-remote-branch
	sudo rm -fr /Applications/Buzzbird.app/Contents/Resources/graphics
	sudo rm -fr /Applications/Buzzbird.app/Contents/Resources/wordpress*.xml

	/Applications/Buzzbird.app/Contents/MacOS/xulrunner -jsconsole -console
fi
