# gnome-extension-instant-hotspot
A WIP gnome extension which replicates the 'instant hotspot' behaviour under chrome os, except for gnome!

I felt like learning how to make a gnome extension, no other reason for this to exist other than 'eh lazy'.

Since we have no way to trigger our phone's hotspot to enable itself if it's disabled, this makes use of tasker on the phone's end.

Within tasker on android, I have a profile setup which enables mobile hotspot if the phone's bluetooth connects to my laptop.

This extension basically does a few minor things:
1. If not already connected to hotspot, connect to phone's bluetooth, which triggers the hotspot to enable via tasker.
2. Start connecting to the saved wifi network corresponding to the SSID of the phone's hotspot.
3. Disconnect bluetooth (because who needs their phone connected via bluetooth...)

When wanting to disconnect, you toggle it off, it disconnects the bluetooth just in-case it's still connected, then disconnects wifi.

Users will need to set their hotspot ssid and phone bluetooth mac address in the extensions settings before using, and also ensure that bluetooth is paired, and the hotspot has already been saved/connected to at least once.