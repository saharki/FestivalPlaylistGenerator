// find template and compile it
var templateSource = document.getElementById('results-template').innerHTML,
template = Handlebars.compile(templateSource),
resultsPlaceholder = document.getElementById('results'),
playingCssClass = 'playing',
audioObject = null;

var accessToken;
var fetchTracks = function (albumId, callback) {
  $.ajax({
    url: 'https://api.spotify.com/v1/albums/' + albumId,
    success: function (response) {
      callback(response);
    }
  });
};


var searchAlbums = function (query) {
  $.ajax({
    url: 'https://api.spotify.com/v1/search',
    data: {
      q: query,
      type: 'album'
    },
    success: function (response) {
      resultsPlaceholder.innerHTML = template(response);
    }
  });
};


var searchArtist = function (query, handler) {
  $.ajax({
    url: 'https://api.spotify.com/v1/search',
    data: {
      q: query,
      type: 'artist'
    },
    success: function (response) {
      handler(response.artists.items[0].id);
    }
  });
};

var getTopTracks = function (id) {
  $.ajax({
    url: 'https://api.spotify.com/v1/artists/' + id + '/top-tracks',
    data: {
      id: id,
      country: 'US',
      type: 'tracks'
    },
    success: function (response) {
      response.tracks.forEach(function(track){console.log(track.name);});
    }
  });
};

var getLatestSetlistByArtist = function (artistName, callback) {
  $.ajax({
    url: '/get_latest_sestlist',
    data: {
      artistName: artistName,
      type:'GET'
    },
    success: callback
  });
};

results.addEventListener('click', function (e) {
  var target = e.target;
  if (target !== null && target.classList.contains('cover')) {
    if (target.classList.contains(playingCssClass)) {
      audioObject.pause();
    } else {
      if (audioObject) {
        audioObject.pause();
      }
      fetchTracks(target.getAttribute('data-album-id'), function (data) {
        audioObject = new Audio(data.tracks.items[0].preview_url);
        audioObject.play();
        target.classList.add(playingCssClass);
        audioObject.addEventListener('ended', function () {
          target.classList.remove(playingCssClass);
        });
        audioObject.addEventListener('pause', function () {
          target.classList.remove(playingCssClass);
        });
      });
    }
  }
});

var refreshAccessToken = function (code) {
  $.ajax({
    url: 'https://accounts.spotify.com/api/token',
    type: 'POST',
    grant_type: "authorization_code",
    code: 'AQBpfLugETaoo9zpojKNgShcQFq8VcIGKXWhJB7q1jy1tFQvUoprE1bzo7C96hUJdLkVaiwarDZLKCfPUInMNHl-TB1SAwh2d2FGuzamLo7Boed8Buknyh4bu73ruKZXaRj6duAT6hx-16WZfS1loy01nU2v-2tWk3kA6J6ExH5AH0pjL56vvMUH97u5Kim4bjFXOoq2TI7_jLrReVpW6gMXbjY1qiSmoHpqSPOu0xNthsJXdGwy5A',
    redirect_uri: 'http://localhost:8080/callback'

  });
};
var playlistID;
var createPlaylist = function (name, cb) {
  $.ajax({
    url: '/create_playlist',
    data: {name: name},
    success: cb
  });
};

var addToPlaylist = function (tracks, playlist) {
  $.ajax({
    url: '/add_to_playlist',
    data: {
      tracks: tracks,
      playlistID: playlist
    },
    success: function (response) {
      // console.log(response);
    }});
};

var makePlaylist = function(artistsStr) {

  var artists = artistsStr.split('\n').map(function(artist){return artist.trim();});

  createPlaylist('Festival Playlist Generator',  function(playlistResponse){ 
    artists.forEach(function(artist){
      getLatestSetlistByArtist(artist, function (setlistResponse) {
        var tracks = [];
        var songs = setlistResponse.getElementsByTagName("setlist")[0].getElementsByTagName("song");
        for(var index =0; index < songs.length; index++) {
          var songsOriginalArtist = artist;
          if(songs[index].getElementsByTagName("cover").length > 0) {

            songsOriginalArtist = songs[index].getElementsByTagName("cover")[0].getAttribute("name");
          }
          if(songsOriginalArtist.toUpperCase() === artist.toUpperCase()) {

            var name = songs[index].getAttribute("name");
            console.log(name);
            if(name !== undefined && name !== null && artist !== undefined && artist !== null) {


              tracks.push({
                artistName: artist,
                name: name
              });
            }
          }


        }
        addToPlaylist(tracks, playlistResponse.toString());  
        // addToPlaylist(setlistResponse, playlistResponse.toString());  
      });
    });
  });
}

$("document").ready(function(){
  var code = getURLParameters("code");
  $.ajax({
    url: '/get_access_token',
    data: {code: code},
    type: 'GET',
    success: function(response){accessToken = response.toString();}
  });
});

document.getElementById('search-form').addEventListener('submit', function (e) {
  e.preventDefault();
  //searchArtist(document.getElementById('query').value,  getTopTracks);

  $.ajax({
    url: '/refresh_token',
    success: function (response) {
      console.log(response);
    }
  });

  var artistName = $('#query').val();
  makePlaylist(artistName);  




}, false);


function getURLParameters(paramName)
{
  var sURL = window.document.URL.toString();
  if (sURL.indexOf("?") > 0)
  {
    var arrParams = sURL.split("?");
    var arrURLParams = arrParams[1].split("&");
    var arrParamNames = new Array(arrURLParams.length);
    var arrParamValues = new Array(arrURLParams.length);

    var i = 0;
    for (i = 0; i<arrURLParams.length; i++)
    {
      var sParam =  arrURLParams[i].split("=");
      arrParamNames[i] = sParam[0];
      if (sParam[1] != "")
        arrParamValues[i] = unescape(sParam[1]);
      else
        arrParamValues[i] = "No Value";
    }

    for (i=0; i<arrURLParams.length; i++)
    {
      if (arrParamNames[i] == paramName)
      {
                //alert("Parameter:" + arrParamValues[i]);
                return arrParamValues[i];
              }
            }
            return "No Parameters Found";
          }
        }


