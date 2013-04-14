// http://stackoverflow.com/questions/133925/javascript-post-request-like-a-form-submit
function post_to_url(path, params, method) {
    method = method || "post"; // Set method to post by default, if not specified.

    // The rest of this code assumes you are not using a library.
    // It can be made less wordy if you use one.
    var form = document.createElement("form");
    form.setAttribute("method", method);
    form.setAttribute("action", path);

    for(var key in params) {
        if(params.hasOwnProperty(key)) {
            var hiddenField = document.createElement("input");
            hiddenField.setAttribute("type", "hidden");
            hiddenField.setAttribute("name", key);
            hiddenField.setAttribute("value", params[key]);

            form.appendChild(hiddenField);
         }
    }

    document.body.appendChild(form);
    form.submit();
}

var home = {
  x:  553,
  y: -293
};

var renderToCanvas = function (x, y) {
    var buffer = document.createElement('canvas');
    buffer.width = 256;
    buffer.height = 256;
    renderTile(buffer, {x:(x + home.x), y:(y + home.y)}, 7);
    return buffer;
};

var c = renderToCanvas(0,0);
var dataURL = c.toDataURL("image/png");
post_to_url("/save", {x:0, y:0, data:dataURL});
// console.log(dataURL);

for(var x=0; x<3; x++) {
  for(var y=0; y<3; y++) {
    console.log("Saving tile " + x + "," + y);
    var canvas = renderToCanvas(x,y);
    var dataURL = c.toDataURL("image/png");
    post_to_url("/save", {x:x, y:y, data:dataURL});
    // post_to_url("/save", JSON.stringify({x:x, y:y, data:canvas.toDataURL("image/png")}));
    // saveToServer(x,y,canvas.toDataURL("image/png"));
  }
}
