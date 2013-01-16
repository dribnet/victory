L.MandelbrotSet = L.TileLayer.Canvas.extend({
    tileSize: 256,
    
    initialize: function (options) {
        L.Util.setOptions(this, options);
        this.drawTile = function (canvas, tilePoint) {
            var ctx = {
                canvas: canvas,
                tile: tilePoint
            };
            this._draw(ctx);
        };
    },

    _data: function(ctx) {
        var tileCount = 1 << this._map._zoom;        
        var ReStart = -2.0;
        var ReDiff = 3.0;          
        var MinRe = ReStart + ReDiff * ctx.tile.x / tileCount;
        var MaxRe = MinRe + ReDiff / tileCount;                
        var ImStart = -1.2;
        var ImDiff = 2.4;        
        var MinIm = ImStart + ImDiff * ctx.tile.y / tileCount;
        var MaxIm = MinIm + ImDiff / tileCount;                
        var Re_factor = (MaxRe - MinRe) / (this.tileSize - 1);
        var Im_factor = (MaxIm - MinIm) / (this.tileSize - 1);        
        var MaxIterations = 32;
        
        var data = [];       
        for (var y = 0, i = 0; y < this.tileSize; ++y) {
            var c_im = MinIm + y * Im_factor;
            for (var x = 0; x < this.tileSize; ++x) {
                var c_re = MinRe + x * Re_factor;
                var Z_re = c_re;
                var Z_im = c_im;
                var isInside = true;
                var n = 0;
                for (n = 0; n < MaxIterations; ++n) {
                    var Z_re2 = Z_re * Z_re;
                    var Z_im2 = Z_im * Z_im;
                    if (Z_re2 + Z_im2 > 4) {
                        isInside = false;
                        break;
                    }
                    Z_im = 2 * Z_re * Z_im + c_im;
                    Z_re = Z_re2 - Z_im2 + c_re;
                }
                if (isInside) {
                    data[i++] = data[i++] = data[i++] = 0;
                } else if (n < MaxIterations / 2) {
                    data[i++] = 255 / (MaxIterations / 2) * n;
                    data[i++] = data[i++] = 0;
                } else {
                    data[i++] = 255;
                    data[i++] = data[i++] = (n - MaxIterations / 2) * 255 / (MaxIterations / 2);
                }
                data[i++] = 255;
            }
        }        
        return data;
    },
    
    _draw: function (ctx) {
        var data = this._data(ctx);        
        var g = ctx.canvas.getContext('2d');
        var d = g.createImageData(this.tileSize, this.tileSize);                
        for (var i = 0, n = this.tileSize * this.tileSize * 4; i < n; i++)  {
            d.data[i] = data[i];
        }
        g.putImageData(d, 0, 0);  
    }    
});

var attr = 'Adapted from a <a target="_blank" href="http://polymaps.org/ex/mandelbrot.html">polymaps sample</a>'
var map = L.map('map');
map.attributionControl.addAttribution(attr);
map.addLayer(new L.MandelbrotSet());
map.setView(new L.LatLng(0, 0), 2);
