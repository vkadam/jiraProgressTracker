/*
 * Authorize and load gsloader.drive.load/gapi.client.load('drive', 'v2', this.onLoad);
 * TODO: Decouple it to authorize and the load rather than client loading to authorize
 */
/**
 * Called when the google drive client library is loaded.
 */
window.googleDriveClientLoaded = function() {
    var GSLoaderAuth = require('js/plugins/gsloader-auth'),
        GSLoaderDrive = require('js/plugins/gsloader-drive');

    GSLoaderAuth.setClientId('1074663392007.apps.googleusercontent.com').onLoad(GSLoaderDrive.load, GSLoaderDrive);
};