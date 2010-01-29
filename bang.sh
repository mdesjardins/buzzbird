#!/bin/sh
LOCALDIR=~/_play
if [ "`uname`" = "Linux" ] ; then
  [ -d ./chrome/skin/classic ] || mkdir ./chrome/skin/classic
  cp -fr ./chrome/skin/classic-linux/* ./chrome/skin/classic/
  /opt/xulrunner/xulrunner ./application.ini &
else
  sudo rm -fr /Applications/Buzzbird.app 
  sudo /Library/Frameworks/XUL.framework/xulrunner-bin --install-app "${LOCALDIR}/buzzbird" 
  sudo cp ${LOCALDIR}/buzzbird/Info.plist /Applications/Buzzbird.app/Contents
  sudo mv /Applications/Buzzbird.app/Contents/Resources/chrome/content/global/macOverlay.xul /Applications/Buzzbird.app/Contents/Resources/chrome/content/global/platformOverlay.xul 

  sudo mv /Applications/Buzzbird.app/Contents/Resources/chrome/skin/classic-mac /Applications/Buzzbird.app/Contents/Resources/chrome/skin/classic
  #sudo mv /Applications/Buzzbird.app/Contents/Resources/chrome/skin/classic-linux /Applications/Buzzbird.app/Contents/Resources/chrome/skin/classic
  #sudo mv /Applications/Buzzbird.app/Contents/Resources/chrome/skin/classic-mac /Applications/Buzzbird.app/Contents/Resources/chrome/skin/classic

  sudo rm -fr /Applications/Buzzbird.app/Contents/Resources/chrome/skin/classic-win
  sudo rm -fr /Applications/Buzzbird.app/Contents/Resources/chrome/skin/classic-linux
  sudo rm -fr /Applications/Buzzbird.app/Contents/Resources/chrome/skin/classic-mac

  /Applications/Buzzbird.app/Contents/MacOS/xulrunner -jsconsole -console
fi
