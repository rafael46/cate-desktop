import * as electron from 'electron';

const app = electron.app;

function ifDarwinOrElse(darwinValue, elseValue) {
    if (process.platform == 'darwin')
        return darwinValue;
    else
        return elseValue;
}

//noinspection JSUnusedLocalSymbols
export const actions = {

    /* app (Darwin only ) ###########################################################*/

    about: {
        role: 'about',
        category: 'app',
    },

    services: {
        role: 'services',
        category: 'app',
        submenu: []
    },

    hide: {
        role: 'hide',
        category: 'app',
    },

    hideOthers: {
        role: 'hideothers',
        category: 'app',
    },

    unhide: {
        role: 'unhide',
        category: 'app',
    },

    quit: {
        label: 'Quit ' + electron.app.getName(),
        accelerator: 'Command+Q',
        click: function () {
            electron.app.quit();
        },
        category: 'app',
    },

    /* file ###########################################################*/

    newWorkspace: {
        label: 'New Workspace',
        category: "file",
    },

    openWorkspace: {
        label: 'Open Workspace',
        category: "file",
    },

    closeWorkspace: {
        label: 'Close Workspace',
        category: "file",
    },

    saveWorkspace: {
        label: 'Save Workspace',
        category: "file",
    },

    saveWorkspaceAs: {
        label: 'Save Workspace As...',
        category: "file",
    },

    /* ---------------------------------- */

    preferences: {
        label: 'Preferences...',
        accelerator: ifDarwinOrElse('Command+,', null),
        category: 'file',
    },

    /* ---------------------------------- */

    exit: {
        label: 'Exit',
        click: function () {
            electron.app.quit();
        },
        category: 'file',
    },

    /* edit ###########################################################*/

    undo: {
        role: 'undo',
        category: 'edit',
    },

    redo: {
        role: 'redo',
        category: 'edit',
    },

    cut: {
        role: 'cut',
        category: 'edit',
    },

    copy: {
        role: 'copy',
        category: 'edit',
    },

    paste: {
        role: 'paste',
        category: 'edit',
    },

    pasteAndMatchStyle: {
        role: 'pasteandmatchstyle',
        category: 'edit',
    },

    deleteSel: {
        role: 'delete',
        category: 'edit',
    },

    /* ---------------------------------- */

    /* Darwin only */
    startSpeaking: {
        role: 'startspeaking',
        category: 'edit',
    },

    /* Darwin only */
    stopSpeaking: {
        role: 'stopspeaking',
        category: 'edit',
    },

    /* ---------------------------------- */

    selectAll: {
        role: 'selectall',
        category: 'edit',
    },

    /* view ###########################################################*/

    reload: {
        label: 'Reload',
        accelerator: 'CmdOrCtrl+R',
        click (_item, focusedWindow) {
            if (focusedWindow) focusedWindow.reload()
        }
    },


    toggleDevTools: {
        label: 'Toggle Developer Tools',
        accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
        click (_item, focusedWindow) {
            if (focusedWindow) focusedWindow.webContents.toggleDevTools()
        },
        category: 'tools',
    },

    resetPageZoom: {
        role: 'resetzoom',
        category: 'view',
    },

    zoomInPage: {
        role: 'zoomin',
        category: 'view',
    },

    zoomOutPage: {
        role: 'zoomout',
        category: 'view',
    },

    toggleFullScreen: {
        role: 'togglefullscreen',
        category: 'view',
    },

    /* tools ###########################################################*/

    addPOI: {
        label: 'Add POI',
        role: 'add_poi',
        accelerator: 'CmdOrCtrl+P',
        click: function (item, window) {
            if (window)
                window.webContents.send('add-point-of-interest');
        },
        category: 'tools',
    },

    removePOI: {
        label: 'Remove POI',
        role: 'remove_poi',
        click: function (item, window) {
            if (window)
                window.webContents.send('remove-point-of-interest');
        },
        category: 'tools',
    },

    removeAllPOIs: {
        label: 'Remove All POIs',
        role: 'remove_all_pois',
        click: function (item, window) {
            if (window)
                window.webContents.send('remove-all-points-of-interest');
        },
        category: 'tools',
    },

    /* window ###########################################################*/

    minimize: {
        role: 'minimize',
        category: 'window',
    },

    close: {
        role: 'close',
        category: 'window',
    },

    /* Darwin only */
    zoom: {
        role: 'zoom',
        category: 'window',
    },

    /* Darwin only */
    front: {
        role: 'front',
        category: 'window',
    },

    /* help #############################################################*/

    openUserGuide: {
        label: 'User Guide',
        click: function () {
            electron.shell.openExternal('http://ect-core.readthedocs.io/en/latest/')
        },
        category: 'help',
    },

    openEsaCCI: {
        label: 'ESA CCI',
        click: function () {
            electron.shell.openExternal('http://cci.esa.int/')
        },
        category: 'help',
    },

    openAboutWindow: {
        label: 'About ' + electron.app.getName(),
        role: 'about',
        category: 'help',
    },
};
