#!/bin/sh
if [ "`uname`" = "Linux" ] ; then
	sudo rm -fr ./pkg
	mkdir ./pkg
	mkdir ./pkg/chrome/
	cp -fr ./chrome/* ./pkg/chrome
	rm -fr ./pkg/chrome/skin/classic
	mkdir ./pkg/chrome/skin/classic
	cp -fr ./chrome/skin/classic-linux/* ./pkg/chrome/skin/classic
	rm -fr ./pkg/chrome/skin/classic-win
	rm -fr ./pkg/chrome/skin/classic-mac
	rm -fr ./pkg/chrome/skin/classic-linux
	cp ./pkg/chrome/content/global/linuxOverlay.xul ./pkg/chrome/content/global/platformOverlay.xul  
	rm ./pkg/chrome/content/global/linuxOverlay.xul
	rm ./pkg/chrome/content/global/windowsOverlay.xul
	rm ./pkg/chrome/content/global/macOverlay.xul
	mkdir ./pkg/defaults
	cp -fr ./defaults/* ./pkg/defaults
	mkdir ./pkg/xulrunner
	cp -fr /opt/xulrunner/* ./pkg/xulrunner
	mv ./pkg/xulrunner/xulrunner-stub ./pkg/xulrunner-stub
	mv ./pkg/xulrunner-stub ./pkg/buzzbird
	cp application.ini ./pkg
	cp ./graphics/Buzzbird.png ./pkg/buzzbird.png
	sudo find ./pkg/* -exec chgrp root {} \;
	sudo find ./pkg/* -exec chown root {} \;
else
	LOCALDIR=~/_play

	sudo rm -fr ./pkg
	sudo rm -fr /Applications/Buzzbird.app 
	sudo /Library/Frameworks/XUL.framework/xulrunner-bin --install-app "${LOCALDIR}/buzzbird" 
	sudo cp ${LOCALDIR}/buzzbird/Info.plist /Applications/Buzzbird.app/Contents
	sudo mv /Applications/Buzzbird.app/Contents/Resources/chrome/content/global/macOverlay.xul /Applications/Buzzbird.app/Contents/Resources/chrome/content/global/platformOverlay.xul 
 	sudo mv /Applications/Buzzbird.app/Contents/Resources/chrome/skin/classic-mac /Applications/Buzzbird.app/Contents/Resources/chrome/skin/classic

	sudo sh -c "echo \"pref('browser.preferences.animateFadeIn', false);\" > /Applications/Buzzbird.app/Contents/Resources/defaults/preferences/mac.js"
	sudo sh -c "echo \"pref('browser.preferences.instantApply', true);\" >> /Applications/Buzzbird.app/Contents/Resources/defaults/preferences/mac.js"

	sudo rm -fr /Applications/Buzzbird.app/Contents/Resources/chrome/skin/classic-win
	sudo rm -fr /Applications/Buzzbird.app/Contents/Resources/chrome/skin/classic-linux
	sudo rm -fr /Applications/Buzzbird.app/Contents/Resources/chrome/skin/classic-mac
	
	sudo rm -fr /Applications/Buzzbird.app/Contents/Resources/defaults/preferences/debug.js 
	sudo rm -fr /Applications/Buzzbird.app/Contents/Resources/distribution
	sudo rm -fr /Applications/Buzzbird.app/Contents/Resources/extensions
	
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
	
	sudo rm -fr ./pkg
	mkdir ./pkg
	sudo mv /Applications/Buzzbird.app ./pkg/
	sudo mkdir ./pkg/Buzzbird.app/Contents/Frameworks
	sudo mkdir ./pkg/Buzzbird.app/Contents/Frameworks/XUL.framework
	cd ./pkg/Buzzbird.app/Contents/Frameworks/XUL.framework
	sudo rsync -rl /Library/Frameworks/XUL.framework/Versions/Current/ .
	cd ../../../../../pkg
	zip -r -9 buzzbird-osx-X.X.zip Buzzbird.app
fi