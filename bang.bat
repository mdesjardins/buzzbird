@echo off
xcopy chrome\skin\classic-win\* chrome\skin\classic /Y /S /Q
copy chrome\content\global\windowsOverlay.xul chrome\content\global\platformOverlay.xul
start "buzzbird" "C:\Program Files (x86)\xulrunner\xulrunner.exe" .\application.ini
