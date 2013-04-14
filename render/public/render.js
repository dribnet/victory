var home = {
  x:  553,
  y: -293
};

var saveToServer = function(x, y, data) {
  var r = new XMLHttpRequest();
  r.open("POST", "/save", true);
  // r.setRequestHeader("Content-type","application/x-www-form-urlencoded");  
  r.onreadystatechange = function () {
    if (r.readyState != 4 || r.status != 200) {
      // console.log("Failure: " + r.readyState + "," + r.status);
      return;
    }
    console.log("Success: " + r.responseText);
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

// warm up with -32 to 32
// for(var x=-448; x<64; x++) {
//   for(var y=-256; y<256; y++) {
for(var x=-448; x<-448+64; x++) {
  for(var y=-256; y<-256+64; y++) {
  // for(var y=-192; y<-192+64; y++) {
  // for(var y=-128; y<-128+64; y++) {
  // for(var y=-64; y<-64+64; y++) {
  // for(var y=0; y<0+64; y++) {
  // for(var y=64; y<64+64; y++) {
    console.log("Saving tile " + x + "," + y);
    var canvas = renderToCanvas(x,y);
    var dataURL = canvas.toDataURL("image/png");
    saveToServer(x, y, dataURL);
    // post_to_url("/save", JSON.stringify({x:x, y:y, data:canvas.toDataURL("image/png")}));
    // saveToServer(x,y,canvas.toDataURL("image/png"));
  }
  // pausecomp(10000);
}

