  // $.ajax({
  // 	url: 'http://www.efestivals.co.uk/festivals/rockwerchter',
  // 	timeout: 10000,
  // 	success: function(response) {
  // 		console.log(response);
  // 	},
  // 	error: function(xhr, ajaxOptions, err) {console.log("Fetch Error: "+err);}

  // });

var request = require('request'); // "Request" library
var cheerio = require('cheerio');
var async = require('async');

var BASE_URL = 'http://www.efestivals.co.uk';
var FESTIVAL_NAME = process.argv[2];

var festivalsList = [];
var festivalsStracture;

var getArtistsByFestivalPath = function (festivalPath, callback) {

  var options = {
  	url: BASE_URL + festivalPath
  };

  // use the access token to access the Spotify Web API
  request.get(options, function(error, response, body) {
  	var $ = cheerio.load(body);
    // console.log(body);
    var festivalPath = $('#content').find('li').find('a').first().attr('href');
    options.url = BASE_URL + festivalPath + '/lineup.shtml';
    // console.log(options.url);


    request.get(options, function (error, response, body){
      $ = cheerio.load(body);
      var artistsStrcture = $('.panel').last().find('.band').find('a').text().trim().split('(C)').slice(1);
      // a = a[a.length - 1].trim();
      var artistsList = [];
      artistsStrcture.forEach(function(elem){artistsList.push(elem.trim());});
      if(callback !== undefined && callback !== null) {
        callback(artistsList);
      }
    }); 
  });
};



var getFestivalPathByName = function (festivalName) {

  if(festivalsList === undefined || festivalsList === null || festivalsList.length < 1) {

    return;
  }

  return getFestivalPathByIndex(festivalsList.indexOf(festivalName.toUpperCase()));
};


var getFestivalPathByIndex = function (index) {

  if(festivalsList === undefined || festivalsList === null || festivalsList.length < 1) {

    return;
  }
  return festivalsStracture.eq(index).attr('value');
};

module.exports.getFestivalsList = getFestivalsList  = function (callback) {

  request.get({url: BASE_URL},function(err, response, body){
    var $ = cheerio.load(body);
    festivalsStracture = $('#content').find('table').first().find('form').first().find('option');
    // console.log(festivalsStracture.first().text())
    festivalsStracture.each(function(i,elem){
      // console.log(elem.children[0]);
      var festivalName = elem.children[0].data.toUpperCase();
      festivalsList.push(festivalName);
    });

    if(callback !== undefined && callback !== null) {
      callback(festivalsList);
    }
  });
};
// getFestivalsList(function (){ console.log(festivalsList.indexOf('ROCK WERCHTER 2017'));});

module.exports.getArtistsByFestivalName = getArtistsByFestivalName = function (festivalName, artistsCallback) {
  async.series([
    function(callback){

      getFestivalsList(function(festivalsList){
        // console.log(festivalsList); 
        callback(null, festivalsList);
      });
    }, 
    function(callback){

      var i = getFestivalPathByName(festivalName);
      // console.log(i);
      callback(null, i);
    }
    ], 

  function(err, res) {

    if(err !== undefined && err !== null) {
      console.log(err);
    }
    // console.log(res[1]);
    getArtistsByFestivalPath(res[1], function(artistsList) {
      if(artistsCallback !== undefined && artistsCallback !== null) {
        artistsCallback(artistsList);
      }
    });
  });
};


