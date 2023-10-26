/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */
import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import NM from 'gi://NM';
import GLib from 'gi://GLib';

const NMClient = NM.Client.new (null);


import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import {QuickToggle, SystemIndicator} from 'resource:///org/gnome/shell/ui/quickSettings.js';


const QuickSettingsMenu = Main.panel.statusArea.quickSettings;

// Get the phone's hotspot ssid + the phone bluetooth mac address from the user, we can't magically get these.
const settings = new Gio.Settings({schema_id: 'org.gnome.shell.extensions.instanthotspot',});
const hotspot_ssid = settings.get_string('hotspot-ssid')
const phone_mac = settings.get_string('phone-mac')

const HotspotToggle = GObject.registerClass(
class HotspotToggle extends QuickToggle {
    //constructor() {
    //    super({
     //       title: _('Instant Hotspot'),
     //       iconName: 'network-cellular-disabled-symbolic',
     //       toggleMode: true,
     //   });
    //}

    _init() {
        super._init({
            iconName: 'network-cellular-disabled-symbolic',
            toggleMode: true,
        });
        
        this.label = 'Instant Hotspot';

        this.connectObject(
            'clicked', () => this._toggleMode());
            //'notify::is-active', () => this._sync();

        this._settings = new Gio.Settings({schema_id: 'org.gnome.shell.extensions.instanthotspot',});
        this._settings.bind('indicator-visible', this, 'checked', Gio.SettingsBindFlags.DEFAULT);
        this._sync();
    }

    _toggleMode(){
        // If instant hotspot is enabled, then connect, otherwise ensure disconnected
        if (this.checked) {
            GLib.spawn_command_line_async(`bash -c "bluetoothctl connect ${phone_mac} && bluetoothctl disconnect ${phone_mac}"`);
            let hotspot_connection = getConnectionObject();
            NMClient.activate_connection_async(hotspot_connection, null, null, null, null )
            this.set({iconName: `network-cellular-signal-excellent-symbolic`})
        }
        else{
            let active_connection = getActiveConnectionObject();
            NMClient.deactivate_connection(active_connection, null);
            GLib.spawn_command_line_async(`bluetoothctl disconnect ${phone_mac}`);
            this.set({iconName: `network-cellular-disabled-symbolic`})
        }
    }

    // If we are connected to the specified hotspot, then we should indicate the instant hotspot is enabled
    _sync(){
        let active_connection = getActiveConnectionObject();
        if (active_connection){
            this.set({iconName: `network-cellular-signal-excellent-symbolic`, checked : true})
        }
        else{
            this.set({checked : false})
        }
    }
});

const HotspotIndicator = GObject.registerClass(
class HotspotIndicator extends SystemIndicator {
    _init() {
        super._init();

        // Create the icon for the indicator
        this._indicator = this._addIndicator();
        this._indicator.icon_name = 'network-cellular-signal-excellent-symbolic';

        // Showing the indicator when the feature is enabled
        this._settings = new Gio.Settings({
            schema_id: 'org.gnome.shell.extensions.instanthotspot',
        });

        this._settings.bind('indicator-visible',
            this._indicator, 'visible',
            Gio.SettingsBindFlags.DEFAULT);
        
        // Create the toggle and associate it with the indicator, being sure to
        // destroy it along with the indicator
        this.quickSettingsItems.push(new HotspotToggle());

        //QuickSettingsMenu._indicators.insert_child_at_index(this, 0);
        //QuickSettingsMenu._addItems(this.quickSettingsItems);

        // Ensure the tile(s) are above the background apps menu
        //for (const item of this.quickSettingsItems) {
        //    QuickSettingsMenu.menu._grid.set_child_below_sibling(item,
        //        QuickSettingsMenu._bluetooth.quickSettingsItems[0]);
        //}
    }

    destroy() {
        // Set enabled state to false to kill the service on destroy
        this.quickSettingsItems.forEach(item => item.destroy());
        // Destroy the indicator
        this._indicator.destroy();
        super.destroy();
    }
});

export default class InstantHotspotExtension extends Extension {
    enable() {
        this._indicator = new HotspotIndicator();
        Main.panel.statusArea.quickSettings.addExternalIndicator(this._indicator);
    }

    disable() {
        this._indicator.quickSettingsItems.forEach(item => item.destroy());
        this._indicator.destroy();
    }
}

/// Useful functions

// Get the active wifi connection object. This is needed to disconnect from the network.
function getActiveConnectionObject(){
    return NMClient.get_active_connections().find((connection) => connection.get_id() === hotspot_ssid);
}

// Get the non-active wifi connection object. This is needed to connect TO the network.
function getConnectionObject(){
    return NMClient.get_connections().find((connection) => connection.get_id() === hotspot_ssid);
}
