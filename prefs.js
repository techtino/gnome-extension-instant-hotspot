'use strict';

const { Adw, Gio, Gtk } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();


function init() {
}
const settings = new Gio.Settings({schema_id: 'org.gnome.shell.extensions.instanthotspot',});
function fillPreferencesWindow(window) {
    // Use the same GSettings schema as in `extension.js`
    
    // Create a preferences page and group
    const page = new Adw.PreferencesPage();
    const group = new Adw.PreferencesGroup();
    page.add(group);
    let title = "SSID of hotspot"
    createTextbox(group,title,"hotspot-ssid");
    title = "Phone MAC Address"
    createTextbox(group,title,"phone-mac");

    // Add our page to the window
    window.add(page);
}

function createTextbox(group,title,gsettings_key){
    const row = new Adw.ActionRow({ title });
    group.add(row);

    let messageText = new Gtk.EntryBuffer({ text: settings.get_string(gsettings_key) })

    let messageEntry = new Gtk.Entry({
        buffer: messageText,
        hexpand: true,
        halign: Gtk.Align.CENTER,
        valign:Gtk.Align.CENTER
    });
    settings.bind(
        gsettings_key,
        messageEntry,
        'text',
        Gio.SettingsBindFlags.DEFAULT
    )
    
    // Add the switch to the row
    row.add_suffix(messageEntry);
    row.activatable_widget = messageEntry;
    return messageEntry;
}