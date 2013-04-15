var home = {
  x:  553,
  y: -293
};

var saveToServer = function(x, y, data, callback) {
  var r = new XMLHttpRequest();
  r.open("POST", "/save", true);
  // r.setRequestHeader("Content-type","application/x-www-form-urlencoded");  
  r.onreadystatechange = function () {
    console.log("Callback success: " + r.responseText);
    if (r.readyState === 4) {
      if (r.status < 300) callback(null, null);
      else callback(r.status);
    }
    // if (r.readyState != 4 || r.status != 200) {
    //   // console.log("Failure: " + r.readyState + "," + r.status);
    //   return;
    // }
  };
  var d = JSON.stringify({x:x, y:y, data:data});
  r.setRequestHeader("Content-type","application/json");  
  r.send(d);
}

var renderToCanvas = function (x, y) {
    var buffer = document.createElement('canvas');
    buffer.width = 256;
    buffer.height = 256;
    renderTile(buffer, {x:(x + home.x), y:(y + home.y)}, 7);
    return buffer;
};

function processResponse(response) {
  console.log("Response: " + response);
}

// var canvas = renderToCanvas(0,0);
// var dataURL = canvas.toDataURL("image/png");
// saveToServer(0, 0, dataURL);
// post_to_url("/save", JSON.stringify({x:0, y:0, data:dataURL}), "post");

function pausecomp(millis)
 {
  var date = new Date();
  var curDate = null;
  do { curDate = new Date(); }
  while(curDate-date < millis);
}

var mainq = queue(2);

// warm up with -32 to 32
// for(var x=-448; x<64; x++) {
//   for(var y=-256; y<256; y++) {
for(var lx=-448; lx<-448+64; lx++) {
  mainq.defer(function(x, callback) {
    console.log("Running mainq column " + x);
    var colq = queue(8);
    for(var y=-256; y<-256+64; y++) {
    // for(var y=-192; y<-192+64; y++) {
    // for(var y=-128; y<-128+64; y++) {
    // for(var y=-64; y<-64+64; y++) {
    // for(var y=0; y<0+64; y++) {
    // for(var y=64; y<64+64; y++) {
      console.log("Queing tile " + x + "," + y);
      var canvas = renderToCanvas(x,y);
      var dataURL = canvas.toDataURL("image/png");
      colq.defer(saveToServer, x, y, dataURL);
      // saveToServer(x, y, dataURL);
      // post_to_url("/save", JSON.stringify({x:x, y:y, data:canvas.toDataURL("image/png")}));
      // saveToServer(x,y,canvas.toDataURL("image/png"));
    }
    colq.awaitAll(function(error, results) {
      console.log("all done with column " + x);
      callback(null);
    });
  }, lx);
  // pausecomp(10000);
}

mainq.awaitAll(function(error, results) {
  console.log("all done all rows");
});

