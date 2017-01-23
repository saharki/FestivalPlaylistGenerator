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
  var xml2js = require('xml2js');
  var parseString = xml2js.parseString;
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