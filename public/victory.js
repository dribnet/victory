var tiles = new L.TileLayer.Canvas({continuousWorld: true});

// http://stackoverflow.com/questions/4467539/javascript-modulo-not-behaving
Number.prototype.mod = function(n) {
    return ((this%n)+n)%n;
}

var cachedRandomConstant = Math.pow(2, 13)+1;
var cachedRandomMaximum = Math.pow(2, 50);

// adapted from http://michalbe.blogspot.com/2011/02/javascript-random-numbers-with-custom.html
var CustomRandom = function(x,y,s) {  
  
    var seed,  
        constant = cachedRandomConstant;
        prime = 37,  
        maximum = cachedRandomMaximum;

    x += 10000;
    y += 10000;
   
    x = (x < 0) ? -x : x;
    y = (y < 0) ? -y : y;

    seed = (x * y * 13 + 1) + ((y & x) * 13 + 1) + s;

    var nextfn = function() {  
            seed *= constant;  
            seed += prime;  
            seed %= maximum;  
              
            return ~~(1024 * seed / maximum);
        }  
   
    for(var i=0;i<6;i++) {
        nextfn();
    }

    return {  
        next : nextfn
    }  
}

var SlowCustomRandom = function (x, y, s) {
    var rng = new MersenneTwister();
    rng.init_by_array([x, y, s]);
    var nextfn = function() {
        return (rng.genrand_int31() % 1024);
    }
    return {  
        next : nextfn
    }  
}

var getPointAlignedToGrid = function (x, y, s) {
    var gx = x - x.mod(s);
    var gy = y - y.mod(s);
    return [gx, gy];
}

var rememberCellProperty = function (map, x, y, s, k, v) {
    if(!map[s]) map[s] = {};
    if(!map[s][x]) map[s][x] = {};
    if(!map[s][x][y]) map[s][x][y] = {};
    map[s][x][y][k] = v;
}

var recallCellProperty = function (map, x, y, s, k) {
    if(!map[s]) return undefined;
    if(!map[s][x]) return undefined;
    if(!map[s][x][y]) return undefined;
    return map[s][x][y][k];
}

var getRectsIn = function(x1, y1, x2, y2, s) {
    // console.log("RECTSIN : " + x1 + "," + y1 + "," + x2 + "," + y2 + "," + s);
    // console.log("RECTDIFF : " + (x2 - x1) + "," + (y2 - y1));
    var rects = [];
    var hs = s / 2;

    var temp;
    if(x2 < x1) {
        temp = x2;
        x2 = x1;
        x1 = temp;
    }
    if(y2 < y1) {
        temp = y2;
        y2 = y1;
        y1 = temp;
    }

    /* 12 zooms deep */
    var cycles = [
        {index: 28, size: 134217728, thresh: 30, stretch: 4, colors:["#7777ee"]},
        {index: 27, size: 67108864, thresh: 30, stretch: 2, colors:["#8888ee"]},
        {index: 23, size: 4194304, thresh: 2, stretch: 2, colors:["#fcfffc"]},
        {index: 22, size: 2097152, thresh: 30, stretch: 8, colors:["#dfc4bd", "#c4dfbd"]},
        {index: 18, size: 131072, thresh: 20, stretch: 2, colors:["#f50603"]},
        {index: 17, size: 65536, thresh: 40, stretch: 3, colors:["#f50603", "#dba300", "#5b5c94", "#dfc4bd"]},
        {index: 16, size: 32768, thresh: 18, stretch: 3, colors:["#f50603", "#dba300", "#5b5c94", "#dfc4bd"]},
        {index: 15, size: 16384, thresh: 30, stretch: 4, colors:["#f50603", "#dba300", "#5b5c94"]},
        // red, yellow, black, blue, grey
        {index: 14, size: 8192, thresh: 14, stretch: 18, colors:["#f50603", "#dba300", "#291f20", "#5b5c94", "#dfc4bd"]},
        {index: 11, size: 1024, thresh: 2, stretch: 4, colors:["#000000", "#dddddd", "#bbbbbb", "#999999"]},
    ];

    var scalex = s / (x2 - x1);
    var scaley = s / (y2 - y1);

    var map = {};
    cycles.forEach(function(cy) {
        // short circuit out if features are too small
        if(cy.size * scalex < 8) {
            return;
        }

        var maxstretch = cy.stretch;


        //?
        // var size = cy.cize;
        // var color = cy.color;

        // iteration bounds
        // var xmin = cy.size * Math.floor(x1 / cy.size);
        // var xmax = cy.size * Math.floor((x2 + cy.size) / cy.size);
        var gridPoint = getPointAlignedToGrid(x1, y1, cy.size);
        var dx = cy.size;
        var dy = cy.size;
        xmin = gridPoint[0] - (maxstretch * dx);
        ymin = gridPoint[1] - (maxstretch * dy);
        gridPoint = getPointAlignedToGrid(x2, y2, cy.size);
        xmax = gridPoint[0] + (maxstretch * dx) + dx;
        ymax = gridPoint[1] + (maxstretch * dy) + dy;

        // var xmin = x1 - (maxstretch * cy.size) - x1.mod(cy.size);
        // var xmax = x2 + (maxstretch * cy.size) - x2.mod(cy.size) + cy.size;
        // var dx = cy.size;
        // // var dx = (xmin < xmax) ? 10 : -10;
        // // var ymin = cy.size * Math.floor(y1 / cy.size);
        // // var ymax = cy.size * Math.floor((y2 + cy.size) / cy.size);
        // var ymin = y1 - (maxstretch * cy.size) - y1.mod(cy.size);
        // var ymax = y2 + (maxstretch * cy.size) - y2.mod(cy.size) + cy.size;
        // var dy = cy.size;
        // // var dy = (ymin < ymax) ? 10 : -10;

        var i, j, n;
        var c = {};

        console.log("xbounds: " + xmin + "," + xmax);

        // first pass, determine the grid of seeds
        // the cells themselves
        var grid = new Array((xmax-xmin)/dx);
        // ordered list to run them later
        // https://github.com/shinout/SortedList

        // todo: runlist should exist across some layers
        var runlist = SortedList.create({
            compare:  function(a,b) {
                if(a.tstart != b.tstart)
                    return a.tstart - b.tstart
                if(a.x != b.x)
                    return a.x - b.x
                return a.y - b.y
            }
        });

        var Nthresh = cy.thresh;

        var stepx = 0;
        for(i=xmin; i<xmax; i+=dx) {
            grid[stepx] = new Array((ymax-ymin)/dy);
            var stepy = 0;
            for(j=ymin; j<ymax; j+=dy) {
                var cellSkip = false;
                // water filter
                if(!cellSkip && cy.index == 27) {
                    // lookup water skip
                    var gridPoint = getPointAlignedToGrid(i, j, 134217728);
                    if(!recallCellProperty(map, gridPoint[0], gridPoint[1], 134217728, "active"))
                        cellSkip = true;
                }
                // nothing else on water for now
                if(!cellSkip && cy.index > 20 && cy.index < 27) {
                    // lookup water skip
                    var gridPoint = getPointAlignedToGrid(i, j, 134217728);
                    if(recallCellProperty(map, gridPoint[0], gridPoint[1], 134217728, "active"))
                        cellSkip = true;
                }
                // don't cover up cities before layer 18
                if(!cellSkip && cy.index > 20 && cy.index < 23) {
                    // lookup city skip
                    var gridPoint = getPointAlignedToGrid(i, j, 4194304);
                    if(recallCellProperty(map, gridPoint[0], gridPoint[1], 4194304, "active"))
                        cellSkip = true;
                }
                // city filter
                if(!cellSkip && cy.index < 20) {
                    // lookup city skip
                    var gridPoint = getPointAlignedToGrid(i, j, 4194304);
                    if(!recallCellProperty(map, gridPoint[0], gridPoint[1], 4194304, "active"))
                        cellSkip = true;
                }
                if(!cellSkip) {
                    var rng = CustomRandom(i, j, cy.size);
                    var n = rng.next();
                    if(n < Nthresh) {
                        c = {};
                        c.x = i;
                        c.y = j;
                        c.size = scalex;
                        c.dir = rng.next() < 512 ? 0 : 1;
                        c.tstart = rng.next();
                        c.extent1 = rng.next().mod(cy.stretch);
                        c.extent2 = rng.next().mod(cy.stretch);
                        grid[stepx][stepy] = c;
                        runlist.insert(c);
                    }
                }
                stepy += 1;
            }
            stepx += 1;
        }

        var r = {};
        // console.log("---");
        for(n=0;n<runlist.length;n++) {
            var c = runlist[n];
            if(c.dir) {
                for(i=0-c.extent1;i<c.extent2;i++) {
                    var rng = CustomRandom((c.x+i*dx), c.y, cy.size); 
                    r = {};
                    cindex = rng.next() % cy.colors.length;
                    // cindex = rng.next() < 512 ? 0 : 1;
                    // console.log("cindex is " + cindex);
                    // c.color= cy.color;
                    r.color = cy.colors[cindex];
                    r.rect = [(c.x-x1+i*dx)*scalex, (c.y-y1)*scaley, dx*scalex, dy*scaley];
                    rects.push(r);                
                    rememberCellProperty(map, (c.x+i*dx), c.y, dx, "active", true);
                }
            }
            else {
                for(j=0-c.extent1;j<c.extent2;j++) {
                    var rng = CustomRandom(c.x, (c.y+j*dy), cy.size); 
                    r = {};
                    cindex = rng.next() % cy.colors.length;
                    // cindex = rng.next() < 512 ? 0 : 1;
                    // console.log("cindex is " + cindex);
                    // c.color= cy.color;
                    r.color = cy.colors[cindex];
                    r.rect = [(c.x-x1)*scalex, (c.y-y1+j*dy)*scaley, dx*scalex, dy*scaley];
                    rects.push(r);                
                    rememberCellProperty(map, c.x, (c.y+j*dy), dx, "active", true);
                }
            }
            // console.log(c.tstart);
        }
    })

    return rects;
}

tiles.drawTile = function(canvas, tile, zoom) {
    var ctx = canvas.getContext('2d');

    // ctx.fillStyle = '#fefef2';
    ctx.fillStyle = '#eeeee2';
    ctx.fillRect(0, 0, 256, 256);

    ctx.fillStyle = 'black';
/*
    ctx.fillText('x: ' + tile.x + ', y: ' + tile.y + ', zoom:' + zoom, 20, 20);
    ctx.fillText('LL: ' + this._map.layerPointToLatLng(tile), 20, 50);
*/
    var tileCount = 1 << zoom;        
    var XStart = 0;
    var XDiff = 67108864;          
    var MinX = XStart + XDiff * tile.x / tileCount;
    var MaxX = MinX + XDiff / tileCount;                
    var YStart = 0;
    var YDiff = 67108864;        
    var MinY = YStart + YDiff * tile.y / tileCount;
    var MaxY = MinY + YDiff / tileCount;                

    // console.log("MaxX: " + MaxX);

    var rects = getRectsIn(MinX, MinY, MaxX, MaxY, 256);

    rects.forEach(function (r) {
        ctx.fillStyle=r.color;
        // if(r.rect[2] == 8) {
        //     ctx.globalAlpha = 0.3;
        // }
        // else {
        //     ctx.globalAlpha = 1.0;            
        // }
        // console.log("Drawing " + r.rect);
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
    zoom: 1, 
    minZoom: 0,
    maxZoom: 12,
    layers: [tiles],
    attributionControl: false,    
    crs: L.CRS.Simple
});
