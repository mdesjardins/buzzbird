@echo off
cd %~dp0
xcopy chrome\skin\classic-win\* chrome\skin\classic /Y /S /Q
xcopy chrome\content\platform\windows\* chrome\content /Y /S /Q
copy chrome\content\js\notify\notify-win.js chrome\content\js\notify\notify.js
start "buzzbird" "%PROGRAMFILES%\xulrunner\xulrunner.exe" application.ini -jsconsole
