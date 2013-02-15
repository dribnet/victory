var tiles = new L.TileLayer.Canvas({continuousWorld: true});

// http://stackoverflow.com/questions/4467539/javascript-modulo-not-behaving
Number.prototype.mod = function(n) {
    return ((this%n)+n)%n;
}

// https://gist.github.com/banksean/300494 
/*
  I've wrapped Makoto Matsumoto and Takuji Nishimura's code in a namespace
  so it's better encapsulated. Now you can have multiple random number generators
  and they won't stomp all over eachother's state.
  
  If you want to use this as a substitute for Math.random(), use the random()
  method like so:
  
  var m = new MersenneTwister();
  var randomNumber = m.random();
  
  You can also call the other genrand_{foo}() methods on the instance.
 
  If you want to use a specific seed in order to get a repeatable random
  sequence, pass an integer into the constructor:
 
  var m = new MersenneTwister(123);
 
  and that will always produce the same random sequence.
 
  Sean McCullough (banksean@gmail.com)
*/
 
/* 
   A C-program for MT19937, with initialization improved 2002/1/26.
   Coded by Takuji Nishimura and Makoto Matsumoto.
 
   Before using, initialize the state by using init_genrand(seed)  
   or init_by_array(init_key, key_length).
 
   Copyright (C) 1997 - 2002, Makoto Matsumoto and Takuji Nishimura,
   All rights reserved.                          
 
   Redistribution and use in source and binary forms, with or without
   modification, are permitted provided that the following conditions
   are met:
 
     1. Redistributions of source code must retain the above copyright
        notice, this list of conditions and the following disclaimer.
 
     2. Redistributions in binary form must reproduce the above copyright
        notice, this list of conditions and the following disclaimer in the
        documentation and/or other materials provided with the distribution.
 
     3. The names of its contributors may not be used to endorse or promote 
        products derived from this software without specific prior written 
        permission.
 
   THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
   "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
   LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
   A PARTICULAR PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL THE COPYRIGHT OWNER OR
   CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
   EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
   PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
   PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
   LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
   NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
   SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 
 
   Any feedback is very welcome.
   http://www.math.sci.hiroshima-u.ac.jp/~m-mat/MT/emt.html
   email: m-mat @ math.sci.hiroshima-u.ac.jp (remove space)
*/
 
var MersenneTwister = function(seed) {
  if (seed == undefined) {
    seed = new Date().getTime();
  } 
  /* Period parameters */  
  this.N = 624;
  this.M = 397;
  this.MATRIX_A = 0x9908b0df;   /* constant vector a */
  this.UPPER_MASK = 0x80000000; /* most significant w-r bits */
  this.LOWER_MASK = 0x7fffffff; /* least significant r bits */
 
  this.mt = new Array(this.N); /* the array for the state vector */
  this.mti=this.N+1; /* mti==N+1 means mt[N] is not initialized */
 
  this.init_genrand(seed);
}  
 
/* initializes mt[N] with a seed */
MersenneTwister.prototype.init_genrand = function(s) {
  this.mt[0] = s >>> 0;
  for (this.mti=1; this.mti<this.N; this.mti++) {
      var s = this.mt[this.mti-1] ^ (this.mt[this.mti-1] >>> 30);
   this.mt[this.mti] = (((((s & 0xffff0000) >>> 16) * 1812433253) << 16) + (s & 0x0000ffff) * 1812433253)
  + this.mti;
      /* See Knuth TAOCP Vol2. 3rd Ed. P.106 for multiplier. */
      /* In the previous versions, MSBs of the seed affect   */
      /* only MSBs of the array mt[].                        */
      /* 2002/01/09 modified by Makoto Matsumoto             */
      this.mt[this.mti] >>>= 0;
      /* for >32 bit machines */
  }
}
 
/* initialize by an array with array-length */
/* init_key is the array for initializing keys */
/* key_length is its length */
/* slight change for C++, 2004/2/26 */
MersenneTwister.prototype.init_by_array = function(init_key, key_length) {
  if (key_length == undefined) {
    key_length = init_key.length;
  } 

  var i, j, k;
  this.init_genrand(19650218);
  i=1; j=0;
  k = (this.N>key_length ? this.N : key_length);
  for (; k; k--) {
    var s = this.mt[i-1] ^ (this.mt[i-1] >>> 30)
    this.mt[i] = (this.mt[i] ^ (((((s & 0xffff0000) >>> 16) * 1664525) << 16) + ((s & 0x0000ffff) * 1664525)))
      + init_key[j] + j; /* non linear */
    this.mt[i] >>>= 0; /* for WORDSIZE > 32 machines */
    i++; j++;
    if (i>=this.N) { this.mt[0] = this.mt[this.N-1]; i=1; }
    if (j>=key_length) j=0;
  }
  for (k=this.N-1; k; k--) {
    var s = this.mt[i-1] ^ (this.mt[i-1] >>> 30);
    this.mt[i] = (this.mt[i] ^ (((((s & 0xffff0000) >>> 16) * 1566083941) << 16) + (s & 0x0000ffff) * 1566083941))
      - i; /* non linear */
    this.mt[i] >>>= 0; /* for WORDSIZE > 32 machines */
    i++;
    if (i>=this.N) { this.mt[0] = this.mt[this.N-1]; i=1; }
  }
 
  this.mt[0] = 0x80000000; /* MSB is 1; assuring non-zero initial array */ 
}
 
/* generates a random number on [0,0xffffffff]-interval */
MersenneTwister.prototype.genrand_int32 = function() {
  var y;
  var mag01 = new Array(0x0, this.MATRIX_A);
  /* mag01[x] = x * MATRIX_A  for x=0,1 */
 
  if (this.mti >= this.N) { /* generate N words at one time */
    var kk;
 
    if (this.mti == this.N+1)   /* if init_genrand() has not been called, */
      this.init_genrand(5489); /* a default initial seed is used */
 
    for (kk=0;kk<this.N-this.M;kk++) {
      y = (this.mt[kk]&this.UPPER_MASK)|(this.mt[kk+1]&this.LOWER_MASK);
      this.mt[kk] = this.mt[kk+this.M] ^ (y >>> 1) ^ mag01[y & 0x1];
    }
    for (;kk<this.N-1;kk++) {
      y = (this.mt[kk]&this.UPPER_MASK)|(this.mt[kk+1]&this.LOWER_MASK);
      this.mt[kk] = this.mt[kk+(this.M-this.N)] ^ (y >>> 1) ^ mag01[y & 0x1];
    }
    y = (this.mt[this.N-1]&this.UPPER_MASK)|(this.mt[0]&this.LOWER_MASK);
    this.mt[this.N-1] = this.mt[this.M-1] ^ (y >>> 1) ^ mag01[y & 0x1];
 
    this.mti = 0;
  }
 
  y = this.mt[this.mti++];
 
  /* Tempering */
  y ^= (y >>> 11);
  y ^= (y << 7) & 0x9d2c5680;
  y ^= (y << 15) & 0xefc60000;
  y ^= (y >>> 18);
 
  return y >>> 0;
}
 
/* generates a random number on [0,0x7fffffff]-interval */
MersenneTwister.prototype.genrand_int31 = function() {
  return (this.genrand_int32()>>>1);
}
 
/* generates a random number on [0,1]-real-interval */
MersenneTwister.prototype.genrand_real1 = function() {
  return this.genrand_int32()*(1.0/4294967295.0); 
  /* divided by 2^32-1 */ 
}
 
/* generates a random number on [0,1)-real-interval */
MersenneTwister.prototype.random = function() {
  return this.genrand_int32()*(1.0/4294967296.0); 
  /* divided by 2^32 */
}
 
/* generates a random number on (0,1)-real-interval */
MersenneTwister.prototype.genrand_real3 = function() {
  return (this.genrand_int32() + 0.5)*(1.0/4294967296.0); 
  /* divided by 2^32 */
}
 
/* generates a random number on [0,1) with 53-bit resolution*/
MersenneTwister.prototype.genrand_res53 = function() { 
  var a=this.genrand_int32()>>>5, b=this.genrand_int32()>>>6; 
  return(a*67108864.0+b)*(1.0/9007199254740992.0); 
} 
 
/* These real versions are due to Isaku Wada, 2002/01/09 added */

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

var SlowCustomRandom = function(x, y, s) {
    var rng = new MersenneTwister();
    rng.init_by_array([x, y, s]);
    var nextfn = function() {
        return (rng.genrand_int31() % 1024);
    }
    return {  
        next : nextfn
    }  
}

var getRectsIn = function(x1, y1, x2, y2, s) {
    console.log("RECTSIN : " + x1 + "," + y1 + "," + x2 + "," + y2 + "," + s);
    console.log("RECTDIFF : " + (x2 - x1) + "," + (y2 - y1));
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
        // {size: 8388608, color:"#e20800", colors:["#e20800", "#2d1e17"]},
        // {size: 4194304, color:"#e20800", colors:["#e20800", "#2d1e17"]},
        // {size: 2097152, color:"#2d1e17", colors:["#2d1e17", "#f2af00"]},
        // {size: 1048576, color:"#2d1e17", colors:["#2d1e17", "#f2af00"]},
        // {size: 524288,  color:"#f2af00", colors:["#f2af00", "#2f4f9a"]},
        // {size: 262144,  color:"#f2af00", colors:["#f2af00", "#2f4f9a"]},
        // {size: 131072,  color:"#2f4f9a", colors:["#2f4f9a", "#c6bace"]},
        // {size: 65536,   color:"#2f4f9a", colors:["#2f4f9a", "#c6bace"]},
        // {size: 32768,   color:"#c6bace", colors:["#c6bace", "#e20800"]},
        // {size: 16384,   color:"#c6bace", colors:["#c6bace", "#e20800"]},
        // {size: 8192,    color:"#e20800", colors:["#e20800", "#2d1e17"]},
        // {size: 4096,    color:"#e20800", colors:["#e20800", "#2d1e17"]},
        // {size: 2048,    color:"#2d1e17", colors:["#2d1e17", "#f2af00"]},
        // {size: 1024,    color:"#2d1e17", colors:["#2d1e17", "#f2af00"]}

        // {size: 8388608, thresh: 40, stretch: 3, colors:["#fafffa", "#fffafa", "#fafaff", "#ffffff", "#fafafa"]},
        {size: 134217728, thresh: 30, stretch: 4, colors:["#7777ee"]},
        {size: 67108864, thresh: 30, stretch: 4, colors:["#8888ee"]},
        {size: 4194304, thresh: 20, stretch: 2, colors:["#fcfffc"]},
        {size: 2097152, thresh: 30, stretch: 8, colors:["#dfc4bd"]},
        {size: 131072, thresh: 20, stretch: 2, colors:["#f50603"]},
        {size: 65536, thresh: 40, stretch: 3, colors:["#f50603", "#dba300", "#5b5c94", "#dfc4bd"]},
        {size: 32768, thresh: 18, stretch: 3, colors:["#f50603", "#dba300", "#5b5c94", "#dfc4bd"]},
        {size: 16384, thresh: 30, stretch: 4, colors:["#f50603", "#dba300", "#5b5c94"]},
        // red, yellow, black, blue, grey
        {size: 8192, thresh: 14, stretch: 18, colors:["#f50603", "#dba300", "#291f20", "#5b5c94", "#dfc4bd"]},
        {size: 1024, thresh: 2, stretch: 4, colors:["#000000", "#dddddd", "#bbbbbb", "#999999"]},

    ];

    var scalex = s / (x2 - x1);
    var scaley = s / (y2 - y1);

    cycles.forEach(function(cy) {
        // short circuit out if features are too small
        if(cy.size * scalex < 4) {
            return;
        }

        var maxstretch = cy.stretch;


        //?
        // var size = cy.cize;
        // var color = cy.color;

        // iteration bounds
        // var xmin = cy.size * Math.floor(x1 / cy.size);
        // var xmax = cy.size * Math.floor((x2 + cy.size) / cy.size);
        var xmin = x1 - (maxstretch * cy.size) - x1.mod(cy.size);
        var xmax = x2 + (maxstretch * cy.size) - x2.mod(cy.size) + cy.size;
        var dx = cy.size;
        // var dx = (xmin < xmax) ? 10 : -10;
        // var ymin = cy.size * Math.floor(y1 / cy.size);
        // var ymax = cy.size * Math.floor((y2 + cy.size) / cy.size);
        var ymin = y1 - (maxstretch * cy.size) - y1.mod(cy.size);
        var ymax = y2 + (maxstretch * cy.size) - y2.mod(cy.size) + cy.size;
        var dy = cy.size;
        // var dy = (ymin < ymax) ? 10 : -10;

        var i, j, n;
        var c = {};

        console.log("xbounds: " + xmin + "," + xmax);

        // first pass, determine the grid of seeds
        // the cells themselves
        var grid = new Array((xmax-xmin)/dx);
        // ordered list to run them later
        // https://github.com/shinout/SortedList
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
                }
            }
            // console.log(c.tstart);
        }
        // console.log("===");
        // now render rects from seeds

                // if((i % (2*cy.size) == 0) && (j % (2*cy.size) == 0)) {
                // if(((i + j) % (2*cy.size)) == 0) {
        //             var rng = CustomRandom(i, j, cy.size); 
        //             c = {};
        //             cindex = rng.next() < 512 ? 0 : 1;
        //             // console.log("cindex is " + cindex);
        //             // c.color= cy.color;
        //             c.color = cy.colors[cindex];
        //             c.rect = [(i-x1)*scalex, (j-y1)*scaley, dx*scalex, dy*scaley];
        //             if(rng.next() < 100)
        //                 rects.push(c);                
        //         // }
        //     }
        // }
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
    zoom: 7, 
    minZoom: 0,
    maxZoom: 14,
    layers: [tiles],
    attributionControl: false,    
    crs: L.CRS.Simple
});
