
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , fs = require('fs')
  , mkdirp = require('mkdirp')
  , async = require('async')
  , bagpipe = require('bagpipe')
  , path = require('path');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3006);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/users', user.list);

var bag = new bagpipe(10);

app.use(express.bodyParser());
app.post('/save', function(req, res) {
  var b = req.body;
  var base64Data = b.data.replace(/^data:image\/png;base64,/,"");
  var fileBase = "tile_" + b.x + "_" + b.y + ".png";
  var path = "x" + (64 * Math.floor(b.x / 64)) + "_y" + (64 * Math.floor(b.y / 64));
  var fileName = path + "/" + fileBase;
  console.log("saving file " + fileName);
  bag.push(fs.writeFile, fileName, base64Data, 'base64', function(err) {
    console.log(err);
  // bag.push(function () {
    // mkdirp(path, function(err) {
      // if (err) console.error(err)
      // else

      // fs.writeFile(fileName, base64Data, 'base64', function(err) {
      //   console.log(err);
      // });

    // });
  });
  // console.dir(req.body);
  res.send("done: " + fileName);
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
