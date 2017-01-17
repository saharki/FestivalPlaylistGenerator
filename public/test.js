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

var fetchTrackURI= function (trackName, artistName, callback) {
  var realCallback = callback;
// console.log(callback);
  if(callback === undefined) {
    realCallback = artistName;
  }

  $.ajax({
    url: 'https://api.spotify.com/v1/search' + "?q=" + trackName + '&type=track' + '&limit=50',
    success: function(response) {
      if(artistName === undefined) {
       realCallback(response.tracks.items[0].uri);
       return;
     }

     response.tracks.items.forEach(function(track){
      // console.log(track.artists[0].name);
      if(track.artists[0].name === artistName) {
        realCallback(track.uri);
        return;
      }
     });
   },
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
    url: '/result',
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

var addToPlaylist = function (trackURI, playlist) {
  $.ajax({
    url: '/add_to_playlist',
    data: {
      trackURI: trackURI,
      playlistID: playlist
    },
    success: function (response) {
      // console.log(response);
    }});
};

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

  
  var tracksNames = [];
  getLatestSetlistByArtist($('#query').val(), function (response) {
    // response.forEach(function(elem){console.log(elem);});
    console.log(response);


    createPlaylist('Festival generator',  function(playlistResponse){ 
      var songs = response.getElementsByTagName("setlist")[0].getElementsByTagName("song");
      for(var index =0; index < songs.length; index++) {
        var name = songs[index].getAttribute("name");
        console.log(name);

        tracksNames.push(name);


      }

      var songsURI = "spotify:track:4CzTgOmc3Sdm4EgKQWzjQl,spotify:track:1uRxyAup7OYrlh2SHJb80N,spotify:track:3dAxzv7hkxipbuWJaOMzAl,spotify:track:4dPKQxaraW6CG1rTBzV6DW,spotify:track:5CKHhg31HcYYhwUeeGqvhq,spotify:track:1M0g1beKC4H9gbrOiSayHW,spotify:track:1bSpwPhAxZwlR2enJJsv7U,spotify:track:3A9vIxzGBjEfqmDK7H9exS,spotify:track:41yIvlFgvGwxq8qTqAR7eG,spotify:track:3LhtqibvTtjOUrzKs7Vsz1,spotify:track:5xwpXWWkfJRqg1S27oVxh4,spotify:track:7JSdsfOoM8ueAuqPOrjc4T,spotify:track:4m0Vgr48VFaMYw0Sp1ozJu,spotify:track:3agr7Xjyimvb3EmSgsXvQy,spotify:track:4Iyo50UoYhuuYORMLrGDci,spotify:track:5k7VKj1Xwy5DjO4B0PdAOb,spotify:track:7xqeIdLJSf3bgmZ7vUvHrE,spotify:track:4eruRiSfDY1jdT03hjyi0i,spotify:track:56Z7hbyMrndw1naxb6I5Oi,spotify:track:5AiNZnMDCWwujIENPj9PV9,spotify:track:2nTsKOXIVGDf2iPeVQO2Gm,spotify:track:1i1fxkWeaMmKEB4T7zqbzK,spotify:track:045sp2JToyTaaKyXkGejPy,spotify:track:5lLuArl5DPSd0pYVl9KOWD".split(',');
      tracksNames.forEach(function(trackName) {
        fetchTrackURI(trackName,function(URIResponse){
        // console.log(response);
        console.log(URIResponse.tracks.items[0].uri);
        // songsURI.push(URIResponse.tracks.items[0].uri);

      });

      });
      addToPlaylist(songsURI, playlistResponse.toString());  
    });
  });




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


