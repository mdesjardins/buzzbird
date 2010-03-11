@echo off
xcopy chrome\skin\classic-win\* chrome\skin\classic /Y /S /Q
copy chrome\content\global\windowsOverlay.xul chrome\content\global\platformOverlay.xul
copy chrome\content\js\notify\notify-win.js chrome\content\js\notify\notify.js
start "buzzbird" "%PROGRAMFILES%\xulrunner\xulrunner.exe" %~dp0\application.ini -jsconsole
