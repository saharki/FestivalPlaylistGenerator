/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var querystring = require('querystring'); 
var cookieParser = require('cookie-parser');
var SpotifyWebApi = require('spotify-web-api-node');
var spotifyHelper = require('./spotifyHelper');
var curl = require('curlrequest');
var async = require('async');
var festivalScraper = require('./FestivalScraper.js');

var PORT = 5000;
var client_id = 'a4b28ff9e82445b0a8e01b66dcae5526'; // Your client id
var client_secret = '025907fe37934da8acf86363070c7ed1'; // Your secret
var redirect_uri = 'http://localhost:5000/test.html'; // Your redirect uri
var PARALLEL_REQUESTS_LIMIT = 1;
/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
 var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

var app = express();

app.set('port', (process.env.PORT || PORT));
app.use(express.static(__dirname + '/public'))
.use(cookieParser());

app.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'playlist-modify-public playlist-modify-private';

  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
        refresh_token = body.refresh_token;

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
          console.log(body);
        });

        // we can also pass the token to the browser to make requests from there
        res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: spotifyApi.setRefreshToken//srefresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });


});

app.get('/get_latest_setlist', function(req, res) {

  spotifyHelper.getLatestSetlistByArtist(req.query.artistName, 
    function(data) {  
      res.setHeader('content-type', 'text/xml');
      res.send(data);
    }
    );
});


var spotifyApi = new SpotifyWebApi({
  clientId : 'a4b28ff9e82445b0a8e01b66dcae5526',
  clientSecret : '025907fe37934da8acf86363070c7ed1',
  redirectUri : 'http://localhost:5000/test.html'
});
app.get('/get_access_token', function(req, res){


  var code = req.query.code;
  spotifyApi.authorizationCodeGrant(code)
  .then(function(data) {
    console.log('The token expires in ' + data.body['expires_in']);
    console.log('The access token is ' + data.body['access_token']);;
    console.log('The refresh token is ' + data.body['refresh_token']);

    // Set the access token on the API object to use it in later calls
    spotifyApi.setAccessToken(data.body['access_token']);
    spotifyApi.setRefreshToken(data.body['refresh_token']);   


    res.send(data.body['access_token']);
  }, function(err) {
    console.log('Something went wrong!', err);
  });

});

app.get('/create_playlist', function(req, res){
  getSpotifyUserInfo(spotifyApi.getAccessToken() , 
    function(err, userResponse, userBody ){
      console.log(userBody)
      var opts = {
        url: 'https://api.spotify.com/v1/users/'+ userBody.id +'/playlists',
        method: 'POST',
        headers: {
          accept: 'application/json',
          Authorization: "Bearer " + spotifyApi.getAccessToken(),
          contentType: 'application/json'
        },

        data: JSON.stringify({
          "name": req.query.name,
          "public": true
        })
      }
      curl.request(opts, function(err, data, meta){res.send(JSON.parse(data).id);} );
});

});
var count =0;
app.get('/add_to_playlist', function(req, res){

  spotifyHelper.addTracksToPlaylist(req.query.playlistID, req.query.tracks, spotifyApi.getAccessToken(), 
    function(response){
      // console.log(response);
      res.send(response);
    });
});


app.get('/festivals_list', function(req, res){
  
  festivalScraper.getFestivalsList(function(response){
    res.send(response);

  });
});



app.get('/get_artists_by_festival', function(req, res){
  
  festivalScraper.getArtistsByFestivalName(req.query.festivalName, function(response){
    res.send(response);

  });
});


console.log('Listening on ' + PORT);
app.listen(PORT);

