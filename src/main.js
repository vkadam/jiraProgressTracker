/*
 * Authorize and load gsloader.drive.load/gapi.client.load('drive', 'v2', this.onLoad);
 * TODO: Decouple it to authorize and the load rather than client loading to authorize
 */
/**
 * Called when the google drive client library is loaded.
 */

window.googleDriveClientLoaded = function() {
    var GSLoader = require('gsloader'); //,
    // GoogleAuth = require('js/plugins/gsloader-auth');
    // var apiKey = 'AIzaSyDXdPIjEFFXw4l6ENesJ6_agdIFAcWiN1M';
    // gapi.client.setApiKey(apiKey);

    var clientId = '289194207858.apps.googleusercontent.com';
    //	var clientId = '1074663392007.apps.googleusercontent.com';
    //	GoogleAuth.onAuthorize(function(){
    //	console.log('Success');
    //	}, function(){
    //	var authorizeButton = document.getElementById('authorize-button');
    //	authorizeButton.onclick = function(){
    //		GoogleAuth.checkAuth(false);
    //	};
    //	authorizeButton.style.visibility = '';
    //	console.log('error');
    //	})
    GSLoader.setClientId(clientId);
    // return;

    // // var clientId = '837050751313';
    // // var clientId = '1074663392007-cqur8iv9veedkdma3gk5iig584lrn7hu.apps.googleusercontent.com';
    // // var clientId = '1074663392007-j53mqtmu4vc9h2s1ob5malnqapmpftu4.apps.googleusercontent.com';

    // // var apiKey = 'AIzaSyAdjHPT5Pb7Nu56WJ_nlrMGOAgUAtKjiPM';

    // // var scopes = 'https://www.googleapis.com/auth/plus.me';
    // var scopes = 'https://www.googleapis.com/auth/drive https://spreadsheets.google.com/feeds';

    // // function handleClientLoad() {
    // // Step 2: Reference the API key
    // // gapi.client.setApiKey(apiKey);
    // window.setTimeout(checkAuth, 1);
    // // }
    // // checkAuth()

    // function checkAuth() {
    //     gapi.auth.authorize({
    //         client_id: clientId,
    //         redirect_uri: ['https://vkadam.github.io/github-pages/'],
    //         scope: scopes,
    //         immediate: true
    //     }, handleAuthResult);
    // }

    // function handleAuthResult(authResult) {
    //     var authorizeButton = document.getElementById('authorize-button');
    //     if (authResult && !authResult.error) {
    //         authorizeButton.style.visibility = 'hidden';
    //         makeApiCall();
    //     } else {
    //         authorizeButton.style.visibility = '';
    //         // authorizeButton.onclick = handleAuthClick;
    //         handleAuthClick();
    //     }
    // }

    // function handleAuthClick(event) {
    //     // Step 3: get authorization to use private data
    //     gapi.auth.authorize({
    //         client_id: clientId,
    //         scope: scopes,
    //         immediate: false
    //     }, handleAuthResult);
    //     return false;
    // }

    // // Load the API and make an API call.  Display the results on the screen.

    // function makeApiCall() {
    //     // Step 4: Load the Google+ API
    //     gapi.client.load('plus', 'v1', function() {
    //         // Step 5: Assemble the API request
    //         var request = gapi.client.plus.people.get({
    //             'userId': 'me'
    //         });
    //         // Step 6: Execute the API request
    //         request.execute(function(resp) {
    //             var heading = document.createElement('h4');
    //             var image = document.createElement('img');
    //             image.src = resp.image.url;
    //             heading.appendChild(image);
    //             heading.appendChild(document.createTextNode(resp.displayName));

    //             document.getElementById('content').appendChild(heading);
    //         });
    //     });
    // }
};
