var tiles = new L.TileLayer.Canvas({continuousWorld: true});

function get_random_color() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.round(Math.random() * 15)];
    }
    return color;
}

var lerp = function(t, a, b) {
    return ( a + t * (b - a) );
}

// given a number x between x1 and x2, scale to 0..s
var lerp_scale = function(x, x1, x2, s) {
    return s * (x - x1) / (x2 - x1);
}

var getRectsIn = function(x1, y1, x2, y2, s) {
    var rects = [];
    var hs = s / 2;

    var cycles = [
        {size: 10, color:"#f2af00"},
        {size: 5, color:"#2d1e17"},
        {size: 0.25, color:"#e20800"},
        {size: 0.125, color:"#2f4f9a"},
        {size: 0.03125, color:"#c6bace"}
    ];

    var scalex = s / (x2 - x1);
    var scaley = s / (y2 - y1);

    cycles.forEach(function(cy) {
        // short circuit out if features are too small
        if(cy.size * scalex < 2) {
            return;
        }
        //?
        // var size = cy.cize;
        // var color = cy.color;

        // iteration bounds
        var xmin = cy.size * Math.floor(x1 / cy.size);
        var xmax = cy.size * Math.floor((x2 + cy.size) / cy.size);
        var dx = cy.size;
        // var dx = (xmin < xmax) ? 10 : -10;
        var ymin = cy.size * Math.floor(y1 / cy.size);
        var ymax = cy.size * Math.floor((y2 + cy.size) / cy.size);
        var dy = cy.size;
        // var dy = (ymin < ymax) ? 10 : -10;

        var i, j;
        var c = {};

        for(i=xmin; i<xmax; i+=dx) {
            for(j=ymin; j<ymax; j+=dy) {
                if((i % (2*cy.size) == 0) && (j % (3*cy.size) == 0)) {
                // if(((i + j) % (2*cy.size)) == 0) {
                    c = {};
                    c.color= cy.color;
                    c.rect = [(i-x1)*scalex, (j-y1)*scaley, dx*scalex, dy*scaley];
                    rects.push(c);                
                }
            }
        }
    })


/*
    c.color="#2d1e17";
    c.rect = [0, 0, hs, hs];
    rects.push(c);

    c = {};
    c.color="#f2af00";
    c.rect = [0, hs, hs, s];
    rects.push(c);

    c = {};
    c.color="#f2af00";
    c.rect = [hs, 0, s, hs];
    rects.push(c);

    c = {};
    c.color="#e20800";
    c.rect = [hs, hs, s, s];
    rects.push(c);
*/

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
    var XDiff = 100;          
    var MinX = XStart + XDiff * tile.x / tileCount;
    var MaxX = MinX + XDiff / tileCount;                
    var YStart = 0;
    var YDiff = 100;        
    var MinY = YStart + YDiff * tile.y / tileCount;
    var MaxY = MinY + YDiff / tileCount;                

    var rects = getRectsIn(MinX, MinY, MaxX, MaxY, 256);

    rects.forEach(function (r) {
        ctx.fillStyle=r.color;
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
    center: new L.LatLng(0,0), 
    zoom: 2, 
    minZoom: 0,
    maxZoom: 16,
    layers: [tiles],
    attributionControl: false,    
    crs: L.CRS.Simple
});
