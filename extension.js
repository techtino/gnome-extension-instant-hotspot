const {Gio, NM, GObject, GLib, GnomeBluetooth} = imports.gi;
const QuickSettings = imports.ui.quickSettings;
// This is the live instance of the Quick Settings menu
const QuickSettingsMenu = imports.ui.main.panel.statusArea.quickSettings;
const NMClient = NM.Client.new (null); 

// Get the phone's hotspot ssid + the phone bluetooth mac address from the user, we can't magically get these.
const settings = new Gio.Settings({schema_id: 'org.gnome.shell.extensions.instanthotspot',});
const hotspot_ssid = settings.get_string('hotspot-ssid')
const phone_mac = settings.get_string('phone-mac')

// Define the quick settings toggle object
const FeatureToggle = GObject.registerClass(
class FeatureToggle extends QuickSettings.QuickToggle {
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

const FeatureIndicator = GObject.registerClass(
class FeatureIndicator extends QuickSettings.SystemIndicator {
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
        this.quickSettingsItems.push(new FeatureToggle());

        QuickSettingsMenu._indicators.insert_child_at_index(this, 0);
        QuickSettingsMenu._addItems(this.quickSettingsItems);

        // Ensure the tile(s) are above the background apps menu
        for (const item of this.quickSettingsItems) {
            QuickSettingsMenu.menu._grid.set_child_below_sibling(item,
                QuickSettingsMenu._bluetooth.quickSettingsItems[0]);
        }
    }

    destroy() {
        // Set enabled state to false to kill the service on destroy
        this.quickSettingsItems.forEach(item => item.destroy());
        // Destroy the indicator
        this._indicator.destroy();
        super.destroy();
    }
});

class Extension {
    constructor() {
        this._indicator = null;
    }
    
    enable() {
        this._indicator = new FeatureIndicator();
    }
    
    disable() {
        this._indicator.destroy();
        this._indicator = null;
    }
}

function init() {
    return new Extension();
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