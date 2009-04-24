#!/bin/sh
sudo rm -fr /Applications/Buzzbird.app 
sudo /Library/Frameworks/XUL.framework/xulrunner-bin --install-app "/Users/mdesjardins/_play/buzzbird" 
sudo cp /Users/mdesjardins/_play/buzzbird/Info.plist /Applications/Buzzbird.app/Contents
sudo mv /Applications/Buzzbird.app/Contents/Resources/chrome/content/global/macOverlay.xul /Applications/Buzzbird.app/Contents/Resources/chrome/content/global/platformOverlay.xul 
sudo rm -fr /Users/mdesjardins/Library/Application\ Support/Buzzbird/Profiles/83kna71l.default/signons3.txt
/Applications/Buzzbird.app/Contents/MacOS/xulrunner -jsconsole -console
