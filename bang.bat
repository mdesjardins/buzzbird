@echo off
xcopy chrome\skin\classic-win\* chrome\skin\classic /Y /S /Q
start "buzzbird" "C:\Program Files (x86)\xulrunner\xulrunner.exe" .\application.ini
