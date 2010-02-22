#!/bin/sh
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
G_APPLICATION_ICON="Buzzbird.app}" # default icon to use
G_STICKY="no"                      # default sticky setting
G_PRIORITY="0"                    # default priority (normal)

description=$@

osascript <<EOD
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
     notify with name "${G_WITH_NAME}" title "${G_TITLE}" description "${description}" application name "${G_APPLICATION_NAME}" sticky ${G_STICKY} priority ${G_PRIORITY}

  end tell
EOD
