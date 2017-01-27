var request = require('request');
var curl = require('curlrequest');
var async = require('async');
var $;
require("jsdom").env("", function(err, window) {
  if (err) {
    console.error(err);
    return;
  }

  $ = require("jquery")(window);
});

var PARALLEL_REQUESTS_LIMIT = 1;


module.exports.getLatestSetlistByArtist = getLatestSetlistByArtist = function (artistName, callback) {

  var options = {
    url: 'https://api.setlist.fm',
    path: '/rest/0.1/search/setlists',
    method: 'GET',
    qs: {artistName: artistName}
  }

  // request.get(options, function(err, response, body) {
  //   // console.log (response);
  //   // var DOMParser = require('xmldom').DOMParser;
  //   // var doc = new DOMParser().parseFromString(body.toString());
  //   var xmldom = $.parseXML(body);
  //   res.send(xmldom);


  // });

  // var parseString = xml2js.parseString;
  var https = require('https'); 
  var data = '';
  https.get('https://api.setlist.fm/rest/0.1/search/setlists?artistName='+ artistName, function(httpres) {
   if (httpres.statusCode >= 200 && httpres.statusCode < 400) {
     httpres.on('data', function(data_) { data += data_.toString(); });
     httpres.on('end', function() {
       // console.log('data', data);
      //  parseString(data, function (err, XMLResult){
      //   var tracks = [];
      //   var setlists = XMLResult.getElementsByTagName("setlist");
      //   for(var setIndex = 0; setIndex < setlists.length; ++setIndex) {
      //     var songs = setlists[setIndex].getElementsByTagName("song");
      //     if(songs.length >= 5) {

      //       for(var index =0; index < songs.length; index++) {
      //         var songsOriginalArtist = artist;
      //         if(songs[index].getElementsByTagName("cover").length > 0) {

      //           songsOriginalArtist = songs[index].getElementsByTagName("cover")[0].getAttribute("name");
      //         }
      //         if(songsOriginalArtist.toUpperCase() === artist.toUpperCase()) {

      //           var name = songs[index].getAttribute("name");
      //           console.log(name);
      //           if(name !== undefined && name !== null && artist !== undefined && artist !== null) {


      //             tracks.push({
      //               artistName: artist,
      //               name: name
      //             });
      //           }
      //         }
      //       }
      //       res.send(tracks);
      //       return; 
      //     }
      //   }
      // });
      //  res.send();
      callback(data);
    });
   }
 });
};


module.exports.getSpotifyUserInfo =  getSpotifyUserInfo = function (access_token, callback) {
  var options = {
    url: 'https://api.spotify.com/v1/me',
    headers: { 'Authorization': 'Bearer ' + access_token },
    json: true
  };

  // use the access token to access the Spotify Web API
  request.get(options, callback);
};

module.exports.postTracksToPlaylist = postTracksToPlaylist = function(userID, playlistID, tracksURIs, accessToken, callback){

  var opts = {
    url: 'https://api.spotify.com/v1/users/' + userID + '/playlists/'+ playlistID +'/tracks?position=0&uris='+ tracksURIs.toString(),
    method: 'POST',
    headers: {
      accept: 'application/json',
      Authorization: "Bearer " + accessToken
    }
  }

  curl.request(opts, callback);
};


module.exports.addTracksToPlaylist = function(playlistID, tracks, accessToken, callback) {

 console.log(tracks);
  if(tracks === undefined || tracks === null || tracks.length <= 0) {
    console.log("No tracks Available.");
    callback();
    return;
  }
  tracks = Object.keys(tracks).map(function(k) { return tracks[k];   });
  console.log(tracks);
  
  var tracksURIs = [];
  console.log(tracks.length);
  async.eachLimit(tracks, PARALLEL_REQUESTS_LIMIT, function(track, cb){
     // async.each([{name: 'all my life', artistName: 'foo fighters'},{name: 'desert island disk', artistName: 'radiohead'}],function(track, callback){
      console.log('\n===============================================');
      console.log(track.name);
      var name = track.name;
      var artistName = track.artistName;
      if(name === undefined || name === null || artistName === undefined || artistName === null) {
        cb();
        return;
      }
      fetchTrackURI(name, artistName, function(response){
        if(response !== undefined && response !== null) {

          tracksURIs.push(response);
          console.log(track.name+" - "+response);
        }
        cb();
     });
    }, function(err){
    
    if(err) console.log(err);
// console.log(accessToken+"\n"+ playlistID+"\n"+ tracksURIs+"\n")
    getSpotifyUserInfo(accessToken , 
      function(err, userResponse, userBody ){
        // console.log(userBody.id +"\n"+ playlistID+"\n"+ tracksURIs+"\n"+ accessToken+"\n"+ callback)
        postTracksToPlaylist(userBody.id, playlistID, tracksURIs, accessToken, callback);
        console.log("Added to playlist.");
      });
    });

};


var fetchTrackURI= function (trackName, artistName, callback) {
  var realCallback = callback;



  if(callback === undefined) {
    realCallback = artistName;
    artistName = undefined;
  }

  $.ajax({
    url: 'https://api.spotify.com/v1/search' + "?q=" + trackName + '&type=track' + '&limit=50',
    timeout: 10000,
    success: function(response) {
    // console.log(response);
    if(artistName === undefined) {
     realCallback(response.tracks.items[0].uri);
     return;
   }
   var tracks = Object.keys(response.tracks.items).map(function(k) { return response.tracks.items[k] });
    // console.log(tracks.length);
    for(var index = 0; index<tracks.length; ++index) {
      console.log(tracks[index].artists[0].name);
      if(tracks[index].artists[0].name.toUpperCase() === artistName.toUpperCase()) {
       // consol  e.log(++count);
      // console.log(track.artists[0].name);
      realCallback(tracks[index].uri);
      return;
      } 

    }
  realCallback();
  },
  error: function(xhr, ajaxOptions, err) {console.log("Fetch Error: "+err); realCallback();}

  });
};

