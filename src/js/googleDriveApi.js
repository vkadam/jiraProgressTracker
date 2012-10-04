var googleClientApi = new(function() {
    var CLIENT_ID = '1074663392007.apps.googleusercontent.com';
    var SCOPES = ["https://www.googleapis.com/auth/drive", "https://spreadsheets.google.com/feeds"].join(" ");
    var _this = this;

    this.onLoad = function() {
        gapi.client.load('drive', 'v2', googleClientApi.drive.onLoad);
        googleClientApi.checkAuth();
    },

    this.checkAuth = function() {
        gapi.auth.authorize({
            'client_id': CLIENT_ID,
            'scope': SCOPES,
            'immediate': true
        }, _this.handleAuthResult);
    },

    this.handleAuthResult = function(authResult) {
        if (authResult && !authResult.error) {
            // Access token has been successfully retrieved, requests can be sent to the API.
            console.log("Google Api Authentication Succeed", authResult)
            // var filePicker = document.getElementById('filePicker');
            // filePicker.style.visibility = '';
            // filePicker.onchange = uploadFile;
        } else {
            console.log("Authenticating Google Api")
            // No access token could be retrieved, force the authorization flow.
            gapi.auth.authorize({
                'client_id': CLIENT_ID,
                'scope': SCOPES,
                'immediate': false
            }, _this.handleAuthResult);
        }
    }

})();

googleClientApi.drive = {
    onLoad: function() {
        googleClientApi.checkAuth();
    },

    createSpreadSheet: function(fileTitle, callback) {
        var request = gapi.client.request({
            'path': '/drive/v2/files',
            'method': 'POST',
            'body': {
                "title": fileTitle,
                "mimeType": "application/vnd.google-apps.spreadsheet"
            }
        });

        request.execute(function(resp) {
            callback.apply(callback, arguments);
        });
    },

    retrieveAllFiles: function(callback) {
        var retrievePageOfFiles = function(request, result) {
                request.execute(function(resp) {
                    result = result.concat(resp.items);
                    var nextPageToken = resp.nextPageToken;
                    if (nextPageToken) {
                        request = gapi.client.drive.files.list({
                            'pageToken': nextPageToken
                        });
                        retrievePageOfFiles(request, result);
                    } else {
                        if (callback) {
                            callback.apply(callback, result);
                        };
                        return result;
                    }
                });
            }
        var initialRequest = gapi.client.drive.files.list();
        retrievePageOfFiles(initialRequest, []);
    }

}