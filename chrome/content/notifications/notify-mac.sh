#!/bin/sh
#
# Copyright (c) 2010 Mike Desjardins
# 
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
# 
# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.
# 
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
# THE SOFTWARE.
# 
# For OSX, shell script wrapper around GrowlHelper.
# Lots of this was borrowed from 
#   http://www.macosxhints.com/dlfiles/growl_sh.txt
# and
#   http://growl.info/documentation/applescript-support.php
#
#
G_APPLICATION_NAME="Buzzbird"
G_ALL_NAMES="\"Tweet\",\"Mention\",\"Direct Message\""
G_WITH_NAME="Tweet" # default notification
G_TITLE="Buzzbird"         # default title
G_APPLICATION_ICON="Buzzbird.app" # default icon to use
G_STICKY="no"                      # default sticky setting
G_PRIORITY="0"                    # default priority (normal)

notification_type=$1
image=$2
sticky=$3
title=$4
description=$5

#echo "===============================" >> ~/notify.log
#echo "Notificication Type : ${notification_type}" >> ~/notify.log
#echo "Image: ${image}" >> ~/notify.log
#echo "Sticky: ${sticky}" >> ~/notify.log
#echo "Title: ${title}" >> ~/notify.log
#echo "Description: ${description}" >> ~/notify.log

if [ ! "$image" == "" ] ; then 
	osascript <<EOD >> /dev/null 2>&1
	  -- From <http://growl.info/documentation/applescript-support.php>
	  --
	  tell application "GrowlHelperApp"
	     -- Make a list of all the notification types that this script will ever send:
	     set the allNotificationsList to {${G_ALL_NAMES}}

	     -- Make a list of the notifications that will be enabled by default.      
	     -- Those not enabled by default can be enabled later in the 'Applications'
	     -- tab of the growl prefpane.
	     set the enabledNotificationsList to {"${G_WITH_NAME}"}

	     -- Register our script with growl.  You can optionally (as here) set a
	     -- default icon for this script's notifications.
	     register as application "${G_APPLICATION_NAME}" all notifications allNotificationsList default notifications enabledNotificationsList icon of application "${G_APPLICATION_ICON}"
             
	     -- Send a Notification...
	     notify with name "${G_WITH_NAME}" title "${title}" description "${description}" application name "${G_APPLICATION_NAME}" sticky ${sticky} priority ${G_PRIORITY} image from location "${image}"
	  end tell
EOD
else
	osascript <<EOD >> /dev/null 2>&1
	  tell application "GrowlHelperApp"
	     -- Make a list of all the notification types that this script will ever send:
	     set the allNotificationsList to {${G_ALL_NAMES}}

	     -- Make a list of the notifications that will be enabled by default.      
	     -- Those not enabled by default can be enabled later in the 'Applications'
	     -- tab of the growl prefpane.
	     set the enabledNotificationsList to {"${G_WITH_NAME}"}

	     -- Register our script with growl.  You can optionally (as here) set a
	     -- default icon for this script's notifications.
	     register as application "${G_APPLICATION_NAME}" all notifications allNotificationsList default notifications enabledNotificationsList icon of application "${G_APPLICATION_ICON}"
             
	     -- Send a Notification...
	     notify with name "${G_WITH_NAME}" title "${title}" description "${description}" application name "${G_APPLICATION_NAME}" sticky ${sticky} priority ${G_PRIORITY}
	  end tell
EOD
fi