@echo off
rmdir /S /Q .\pkg
mkdir .\pkg
xcopy chrome\* pkg\chrome\ /Y /S /Q
xcopy pkg\chrome\skin\classic-win\* pkg\chrome\skin\classic /Y /S /Q
copy pkg\chrome\content\global\windowsOverlay.xul pkg\chrome\content\global\platformOverlay.xul
del pkg\chrome\content\global\windowsOverlay.xul
del pkg\chrome\content\global\macOverlay.xul
del pkg\chrome\content\global\linuxOverlay.xul
rmdir /S /Q pkg\chrome\skin\classic-win
rmdir /S /Q pkg\chrome\skin\classic-mac
rmdir /S /Q pkg\chrome\skin\classic-linux
xcopy defaults\* pkg\defaults\ /Y /S /Q
xcopy "C:\Program Files (x86)\xulrunner\*" pkg\xulrunner\* /Y /S /Q
copy buzzbird.exe .\pkg\
copy application.ini .\pkg\