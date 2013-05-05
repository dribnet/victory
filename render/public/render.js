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

/* should be -640 -> 640 in x and y */

/* initial extent -640 < x < 128
                  -256 < y < 128
                   4,947,802,324,992 px -> 9 * 2^39 */

// adding -640 < x < 128
//         128 < y < 192
//         192 < y < 320
//         320 < y < 512

// now adding 128 < x < 640
          // -640 < y < 640

for(var ly=512; ly<640; ly++) {
  mainq.defer(function(y, callback) {
    console.log("Running mainq row " + y);
    var colq = queue(640+128);
      for(var x=-640; x<640; x++) {
      console.log("Queing tile " + x + "," + y);
      var canvas = renderToCanvas(x,y);
      var dataURL = canvas.toDataURL("image/png");
      colq.defer(saveToServer, x, y, dataURL);
      // saveToServer(x, y, dataURL);
      // post_to_url("/save", JSON.stringify({x:x, y:y, data:canvas.toDataURL("image/png")}));
      // saveToServer(x,y,canvas.toDataURL("image/png"));
    }
    colq.awaitAll(function(error, results) {
      console.log("all done with row " + y);
      callback(null);
    });
  }, ly);
  // pausecomp(10000);
}

mainq.awaitAll(function(error, results) {
  console.log("all done all rows");
});

