#!/bin/sh
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
