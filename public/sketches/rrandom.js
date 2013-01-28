var tiles = new L.TileLayer.Canvas({continuousWorld: true});

// http://stackoverflow.com/questions/4467539/javascript-modulo-not-behaving
Number.prototype.mod = function(n) {
    return ((this%n)+n)%n;
}

// adapted from http://michalbe.blogspot.com/2011/02/javascript-random-numbers-with-custom.html
var CustomRandom = function(x,y,s) {  
  
    var seed,  
        constant = Math.pow(2, 13)+1,  
        prime = 37,  
        maximum = Math.pow(2, 50);  
   
    x = (x < 0) ? -x : x;
    y = (y < 0) ? -y : y;

    seed = (x * 13 * 13 + 1) + (y * 13 + 1) + s;

    var nextfn = function() {  
            seed *= constant;  
            seed += prime;  
            seed %= maximum;  
              
            return ~~(1024 * seed / maximum);
        }  
   
    for(var i=0;i<10;i++) {
        nextfn();
    }

    return {  
        next : nextfn
    }  
}

var getRectsIn = function(x1, y1, x2, y2, s) {
    var rects = [];
    var hs = s / 2;

    /* 12 zooms deep */
    var cycles = [
        {size: 8388608, color:"#e20800", colors:["#e20800", "#2d1e17"]},
        {size: 4194304, color:"#e20800", colors:["#e20800", "#2d1e17"]},
        {size: 2097152, color:"#2d1e17", colors:["#2d1e17", "#f2af00"]},
        {size: 1048576, color:"#2d1e17", colors:["#2d1e17", "#f2af00"]},
        {size: 524288,  color:"#f2af00", colors:["#f2af00", "#2f4f9a"]},
        {size: 262144,  color:"#f2af00", colors:["#f2af00", "#2f4f9a"]},
        {size: 131072,  color:"#2f4f9a", colors:["#2f4f9a", "#c6bace"]},
        {size: 65536,   color:"#2f4f9a", colors:["#2f4f9a", "#c6bace"]},
        {size: 32768,   color:"#c6bace", colors:["#c6bace", "#e20800"]},
        {size: 16384,   color:"#c6bace", colors:["#c6bace", "#e20800"]},
        {size: 8192,    color:"#e20800", colors:["#e20800", "#2d1e17"]},
        {size: 4096,    color:"#e20800", colors:["#e20800", "#2d1e17"]},
        {size: 2048,    color:"#2d1e17", colors:["#2d1e17", "#f2af00"]},
        {size: 1024,    color:"#2d1e17", colors:["#2d1e17", "#f2af00"]}
    ];

    var scalex = s / (x2 - x1);
    var scaley = s / (y2 - y1);

    cycles.forEach(function(cy) {
        // short circuit out if features are too small
        if(cy.size * scalex < 8) {
            return;
        }
        //?
        // var size = cy.cize;
        // var color = cy.color;

        // iteration bounds
        // var xmin = cy.size * Math.floor(x1 / cy.size);
        // var xmax = cy.size * Math.floor((x2 + cy.size) / cy.size);
        var xmin = x1 - x1.mod(cy.size);
        var xmax = x2 - x2.mod(cy.size) + cy.size;
        var dx = cy.size;
        // var dx = (xmin < xmax) ? 10 : -10;
        // var ymin = cy.size * Math.floor(y1 / cy.size);
        // var ymax = cy.size * Math.floor((y2 + cy.size) / cy.size);
        var ymin = y1 - y1.mod(cy.size);
        var ymax = y2 - y2.mod(cy.size) + cy.size;
        var dy = cy.size;
        // var dy = (ymin < ymax) ? 10 : -10;

        var i, j;
        var c = {};

        for(i=xmin; i<xmax; i+=dx) {
            for(j=ymin; j<ymax; j+=dy) {
                // if((i % (2*cy.size) == 0) && (j % (2*cy.size) == 0)) {
                // if(((i + j) % (2*cy.size)) == 0) {
                    var rng = CustomRandom(i, j, cy.size); 
                    c = {};
                    cindex = rng.next() < 512 ? 0 : 1;
                    // c.color= cy.color;
                    c.color = cy.colors[cindex];
                    c.rect = [(i-x1)*scalex, (j-y1)*scaley, dx*scalex, dy*scaley];
                    if(rng.next() < 100)
                        rects.push(c);                
                // }
            }
        }
    })

    return rects;
}

tiles.drawTile = function(canvas, tile, zoom) {
    var ctx = canvas.getContext('2d');

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 256, 256);

    ctx.fillStyle = 'black';
/*
    ctx.fillText('x: ' + tile.x + ', y: ' + tile.y + ', zoom:' + zoom, 20, 20);
    ctx.fillText('LL: ' + this._map.layerPointToLatLng(tile), 20, 50);
*/
    var tileCount = 1 << zoom;        
    var XStart = 0;
    var XDiff = 4194304;          
    var MinX = XStart + XDiff * tile.x / tileCount;
    var MaxX = MinX + XDiff / tileCount;                
    var YStart = 0;
    var YDiff = 4194304;        
    var MinY = YStart + YDiff * tile.y / tileCount;
    var MaxY = MinY + YDiff / tileCount;                

    var rects = getRectsIn(MinX, MinY, MaxX, MaxY, 256);

    rects.forEach(function (r) {
        ctx.fillStyle=r.color;
        // if(r.rect[2] == 8) {
        //     ctx.globalAlpha = 0.3;
        // }
        // else {
        //     ctx.globalAlpha = 1.0;            
        // }
        ctx.fillRect.apply(ctx, r.rect);
    });
    // ctx.fillRect.apply(ctx, [ -40, -40, 100, 100]);

/*
    ctx.fillStyle = 'black';
    ctx.fillText('rx: ' + MinX + ' - ' + MaxX, 20, 80);
    ctx.fillText('ry: ' + MinY + ' - ' + MaxY, 20, 90);

    ctx.strokeStyle = 'red';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(255, 0);
    ctx.lineTo(255, 255);
    ctx.lineTo(0, 255);
    ctx.closePath();
    ctx.stroke();
*/
}

var map = new L.Map('map', {
    center: new L.LatLng(10,10), 
    zoom: 7, 
    minZoom: 0,
    maxZoom: 7,
    layers: [tiles],
    attributionControl: false,    
    crs: L.CRS.Simple
});
