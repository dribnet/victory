Victory
=======

Victory is a design landscape inspired by Mondrian, specifically victory boogie-woogie.

Design landscapes are expansive drawing surfaces. In this case, the surface is actually
infinite in two dimensions with several layers of depth throughout. Mondrain was influenced
by the cityscape around him, and here these themes play out as a navigable map that
stretches in all directions. Some of the familiar themes and colors are present, along
with many new variations.

This work presented many technical challenges. Algorithmically, the visuals are the
result of a dynamic process which is a hand-crafted hybrid of fractal and
simulation. All graphics are generated dynamically, none of the visuals are pre-computed.
The world literally springs to life as you zoom or pan to look at it.

The document you are reading is both the description of the algorithm as well as the
full algoithm itself. The programming language I have used is literate coffeescript,
which was chosen because it allows me to naturally interleave the machinery of
the algorithm with the explanation and context to understand it.

CustomRandom
------------
To obtain the overall effect of predetermined variation, I needed to implement my own
custom random number generator. This generator needed to be full repeatable and take
three arguments which represent the position and depth as the seed. My implementation
is based on
[Michal Budzynski's JavaScript implementation](# adapted from http://michalbe.blogspot.com/2011/02/javascript-random-numbers-with-custom.html)
and forgoes better statistics for speed and initializaiton time because this program
has the somewhat unusual charastic of needing thousands of individual random number
generators as the design unfolds.

By using individual random number generators spatially connected to their environment,
locations are independent of each other given some radius of interaction.

    # these numbers are used again and again, so we cache them for efficiency
    cachedRandomConstant = Math.pow(2, 13)+1
    cachedRandomMaximum = Math.pow(2, 50)

    # when called, returns an object whose next method can be used to generate the random numbers
    # (here random numbers vary between 0 and 1024)
    CustomRandom = (x,y,s) ->
        constant = cachedRandomConstant
        prime = 37
        maximum = cachedRandomMaximum

        x += 10000
        y += 10000
       
        x = Math.abs(x)
        y = Math.abs(y)

        seed = (x * y * 13 + 1) + ((y & x) * 13 + 1) + s

        nextfn = () ->
          seed *= constant
          seed += prime
          seed %= maximum
          ~~(1024 * seed / maximum)
       
        for times in [0...6]
          nextfn

        return {
            next : nextfn
        }  

This mod funciton makes JavaScript behave better with negative numbers. More information
is available [on StackOverflow](http://stackoverflow.com/questions/4467539/javascript-modulo-not-behaving)
and [about.com](http://javascript.about.com/od/problemsolving/a/modulobug.htm)

    Number.prototype.mod = (n) ->
        ((this%n)+n)%n

A utility for snapping an x,y point to the grid, which itself varies as a function of depth.

    getPointAlignedToGrid = (x, y, s) ->
        gx = x - x.mod(s)
        gy = y - y.mod(s)
        [gx, gy]

Utilities for reading/writing values in a lookup table. A key,value is written into the map
object at a specific point and depth on the grid. This is used for collision detection across
layers, etc.

    rememberCellProperty = (map, x, y, s, k, v) ->
        if (!map[s])
          map[s] = {}
        if (!map[s][x])
          map[s][x] = {}
        if (!map[s][x][y])
          map[s][x][y] = {}
        map[s][x][y][k] = v

    recallCellProperty = (map, x, y, s, k) ->
        if (!map[s])
          return undefined
        if (!map[s][x])
          return undefined
        if (!map[s][x][y])
          return undefined
        return map[s][x][y][k]

    zrememberCellProperty = (map, x, y, s, k, v) ->
        map[s] = {} if not map[s]?
        map[s][x] = {} if not map[s][x]?
        map[s][x][y] = {} if not map[s][x][y]?
        map[s][x][y][k] = v

    zrecallCellProperty = (map, x, y, s, k) ->
        if not map[s]? undefined
        else if not map[s][x]? undefined
        else if not map[s][x][y]? undefined
        else map[s][x][y][k]

Layers
------
There are 18 distinct layers. Each layer has twice the detail in width and height as
the previous layer. The layers are numbered from 11 to 28 inclusive. Layer 11 is the
highest level of detail.

Here's a lookup table used in city generation that encodes some of the sizes.

    indexSizeTable =
        14: 8192
        15: 16384
        16: 32768
        17: 65536
        18: 131072

The layers are grouped into lists so that the simulation can be ordered. Layers
within a group can interact with each other in a timeline, but subsequent groups
spring into being after the group before them has completed. In this way large
features can be laid down followed by smaller ones, though sometimes the layers
can interact as they are growing.

Most of the overall design is encoded in these magic constants.

Elements are grown from seeds. Each seed can grow as one of the following primitives.

    LINE   = 1
    CROSS  = 2
    POOL   = 3
    CLOUD  = 4

The layers are defined inline with the groups that contain them. Not all fields are
necessary for all layers, and sometimes debug or other informaiton is added to a layer
for convenience.

The building group represents "large buildings" in the city.

    buildingGroup = [
      {index: 18, size: 131072, thresh: 80, grow: LINE, minDrawSize: 8, minstretch: 1,
      stretch: 3, zcolors:["#000000"], colors:["#5b5c94", "#f50603", "#dba300"], outcolors:["#06f503", "#13f506"]},
      {index: 17, size: 65536, thresh: 100, grow: LINE, minDrawSize: 8, minstretch: 1,
      stretch: 3, zcolors:["#000000"], colors:["#f50603", "#dba300", "#5b5c94", "#dfc4bd"], outcolors:["#06f503", "#13f506"]}
    ]

All the other details of the cities are in the city group.

    cityGroup = [
        {index: 17, size: 65536, thresh: 100, grow: LINE, minDrawSize: 8, minstretch: 1,
        stretch: 2, colors:["#f50603", "#dba300", "#5b5c94", "#dfc4bd"]},
        {index: 16, size: 32768, thresh: 100, grow: LINE, minDrawSize: 8, minstretch: 1,
        stretch: 3, colors:["#f50603", "#dba300", "#5b5c94", "#dfc4bd"]},
        {index: 15, size: 16384, thresh: 7, grow: LINE, minDrawSize: 8, minstretch: 6,
        stretch: 7, colors:["#f50603", "#dba300", "#5b5c94"], outcolors:['#FFFF00']},
        # red, yellow, black, blue, grey
        {index: 14, size: 8192, thresh: 9, grow: LINE,  minDrawSize: 8, minstretch: 22,
        stretch: 24, colors:["#f50603", "#dba300", "#291f20", "#5b5c94", "#dfc4bd"], outcolors:['#FFFF00']}
    ]

Drawn separately are the finest details, which can only exist in open spaces.

    peopleGroup = [
        {index: 11, size: 1024, thresh: 2, grow: LINE,  minDrawSize: 4, minstretch: 1,
        stretch: 2, colors:["#F0E68C", "#EEDC82", "#8B6508", "#EECFA1"]}
    ]

The outer group defines the largest features which are seen when zooming out.

    outerGroup = [
        {index: 28, size: 134217728, thresh: 30, grow: LINE, minDrawSize: 8, minstretch: 1,
        stretch: 4, colors:["#7777ee"]},
        {index: 27, size: 67108864, thresh: 30, grow: LINE, minDrawSize: 8, minstretch: 1,
        stretch: 2, colors:["#8888ee"]},
        {index: 25, size: 16777216, thresh: 8, grow: POOL, minDrawSize: 8, minstretch: 1,
        stretch: 4, colors:["#dfc4bd", "#c4dfbd"]},
        {index: 24, size: 8388608, thresh: 8, grow: POOL, minDrawSize: 8, minstretch: 1,
        stretch: 4, colors:["#dfc4bd", "#c4dfbd"]},
        {index: 22, size: 2097152, thresh: 8, grow: POOL, minDrawSize: 8, minstretch: 1,
        stretch: 5, colors:["#dfc4bd", "#c4dfbd"]},
        {index: 23, size: 4194304, thresh: 1, grow: POOL,  minDrawSize: 4, minstretch: 1,
        stretch: 2, colors:["#fcfffc"]},
        {index: 19, size: 262144, thresh: 5, grow: CROSS, minDrawSize: 8, minstretch: 1,
        stretch: 5, colors:["#f50603"], outcolors:["#46f543", "#63f546"]}
    ]

This is the master list of groups and encodes the order in which they are generated.

    layerGroups = [
        outerGroup,
        buildingGroup,
        cityGroup,
        peopleGroup
    ]

Each layer generates a number of seeds on a timeline, and then grows the feature from the
seed by running the timeline in order. This is the function that grows an individual
seed into a feature. The result is a set of rect objects pushed onto the provided
rects paramater.

    growSeed = (c, x1, y1, scalex, scaley, rects, map, cy) ->
        colors = cy.colors
        if (cy.grow == POOL)
            main_rng = CustomRandom(c.x, c.y, cy.size)
            cindex = main_rng.next() % cy.colors.length
            poolColor = colors[cindex]
            for i in [0-c.extent1 ... c.extent2]
                for j in [0-c.extent1 ... c.extent2]
                    r = {}
                    r.color = poolColor
                    r.rect = [(c.x-x1+i*cy.size)*scalex, (c.y-y1+j*cy.size)*scaley, cy.size*scalex, cy.size*scaley]
                    rects.push(r)
                    rememberCellProperty(map, (c.x+i*cy.size), (c.y+j*cy.size), cy.size, "active", true)
        if (cy.grow == CLOUD)
            rng = CustomRandom(curx, cury, cy.size)
        if(cy.grow == CROSS || (cy.grow == LINE))
            for dual in [0 ... 2]
                abort = false
                start = 0
                inc = 1
                stopat = c.extent1
                if (dual > 0)
                    start = -1
                    inc = -1
                    stopat = 0-c.extent2
                for i in [start ... stopat] by inc
                    colors = cy.colors
                    rng
                    curx
                    cury
                    if (c.dir)
                        curx = (c.x+i*cy.size)
                        cury = c.y
                    else
                        curx = c.x
                        cury = (c.y+i*cy.size)
                    rng = CustomRandom(curx, cury, cy.size)
                    r = {}
                    cindex = rng.next() % cy.colors.length
                    if (cy.index >= 11 && cy.index <= 19)
                        # lookup out of city colors
                        gridPoint = getPointAlignedToGrid(curx, cury, 4194304)
                        onCity = recallCellProperty(map, gridPoint[0], gridPoint[1], 4194304, "active")
                        if (onCity)
                            # TODO - short circuit for(var l=11; !abort && l<=18; l++) {
                            for l in [11 .. 18]
                                break if abort
                                cellSize = indexSizeTable[l]
                                gridPoint = getPointAlignedToGrid(curx, cury, cellSize)
                                onOther = recallCellProperty(map, gridPoint[0], gridPoint[1], cellSize, "active")
                                if (onOther)
                                    abort = true
                                    # colors = cy.outcolors
                        if (cy.index == 19 || cy.index == 18)
                            if(onCity && cy.index == 19)
                                abort = true
                            if(!onCity)
                                colors = cy.outcolors
                    if (!abort)
                        # console.log("Setting to " + cindex + "," + colors[cindex])
                        r.color = colors[cindex]
                        r.rect = [(curx-x1)*scalex, (cury-y1)*scaley, cy.size*scalex, cy.size*scaley]
                        rects.push(r)
                        rememberCellProperty(map, curx, cury, cy.size, "active", true)

This is the core routine of the algorithm. Given a bounding box and level of zoom, it returns
all of the rectangles that are in that bounding box. To do that it must run a full simulation
of the layers and seeds from a radius of causality around the box.

This method is called as needed by the interface as someone moves through the virtual space.
It returns an array of rectangles to be drawn.

    getRectsIn = (x1, y1, x2, y2, s) ->
        # console.log("RECTSIN : " + x1 + "," + y1 + "," + x2 + "," + y2 + "," + s)
        # console.log("RECTDIFF : " + (x2 - x1) + "," + (y2 - y1))
        rects = []
        hs = s / 2

        if x2 < x1
            temp = x2
            x2 = x1
            x1 = temp
        if y2 < y1
            temp = y2
            y2 = y1
            y1 = temp

        scalex = s / (x2 - x1)
        scaley = s / (y2 - y1)

        map = {}

        for lg in layerGroups
            runlist = SortedList.create {
                compare:  (a,b) ->
                    if(a.tstart != b.tstart)
                        return a.tstart - b.tstart
                    if(a.x != b.x)
                        return a.x - b.x
                    return a.y - b.y
            }

            for cy in lg
                # short circuit out if features are too small
                if(cy.size * scalex < cy.minDrawSize)
                    break # skip this loop

                maxstretch = cy.stretch

                # iteration bounds
                gridPoint = getPointAlignedToGrid(x1, y1, cy.size)
                dx = cy.size
                dy = cy.size
                size = cy.size
                xmin = gridPoint[0] - (maxstretch * dx)
                ymin = gridPoint[1] - (maxstretch * dy)
                gridPoint = getPointAlignedToGrid(x2, y2, cy.size)
                xmax = gridPoint[0] + (maxstretch * dx) + dx
                ymax = gridPoint[1] + (maxstretch * dy) + dy

                # i, j, n
                c = {}

                # console.log("xbounds: " + xmin + "," + xmax)

                # first pass, determine the grid of seeds
                # the cells themselves
                grid = new Array((xmax-xmin)/dx)
                # ordered list to run them later
                # https://github.com/shinout/SortedList

                Nthresh = cy.thresh

                stepx = 0
                for i in [xmin...xmax] by dx
                    grid[stepx] = new Array((ymax-ymin)/dy)
                    stepy = 0
                    for j in [ymin...ymax] by dy
                        cellSkip = false
                        # water filter
                        if (!cellSkip && cy.index == 27)
                            # lookup water skip
                            gridPoint = getPointAlignedToGrid(i, j, 134217728)
                            if (!recallCellProperty(map, gridPoint[0], gridPoint[1], 134217728, "active"))
                                cellSkip = true
                        # nothing else on water for now
                        if (!cellSkip && cy.index > 18 && cy.index < 27)
                            # lookup water skip
                            gridPoint = getPointAlignedToGrid(i, j, 134217728)
                            if (recallCellProperty(map, gridPoint[0], gridPoint[1], 134217728, "active"))
                                cellSkip = true
                        # don't cover up cities before layer 18
                        if (!cellSkip && cy.index > 20 && cy.index < 23)
                            # lookup city skip
                            gridPoint = getPointAlignedToGrid(i, j, 4194304)
                            if (recallCellProperty(map, gridPoint[0], gridPoint[1], 4194304, "active"))
                                cellSkip = true
                        # city filter
                        if (!cellSkip && cy.index < 18)
                            # lookup city skip
                            gridPoint = getPointAlignedToGrid(i, j, 4194304)
                            if (!recallCellProperty(map, gridPoint[0], gridPoint[1], 4194304, "active"))
                                cellSkip = true
                        if (!cellSkip)
                            rng = CustomRandom(i, j, cy.size)
                            n = rng.next()
                            if (n < Nthresh)
                                c = {}
                                c.cy = cy
                                c.x = i
                                c.y = j
                                c.size = scalex
                                c.dir = rng.next() < 512 ? 0 : 1
                                c.tstart = rng.next()
                                c.extent1 = cy.minstretch + rng.next().mod(cy.stretch - cy.minstretch)
                                c.extent2 = cy.minstretch + rng.next().mod(cy.stretch - cy.minstretch)
                                grid[stepx][stepy] = c
                                runlist.insert(c)
                        stepy += 1
                    stepx += 1

            r = {}
            # console.log("---")
            for runner in runlist
                growSeed(runner, x1, y1, scalex, scaley, rects, map, runner.cy)

        return rects
    
Map
---
The interface presented is a navigable map. The heavy lifing for this is done by
the [excellent leaflet javascript library](leafletjs.com). This use of leaflet is
slightly unusual in that the map itself is dynamically generated as a result
of the navigation itself. To acheive this, a special subclass of leaflet's
TileLayer class is created. This verison of the class has a custom version of
the leaflet ```drawTile``` method which tranlates coordinate spaces, delegates
all the hard work to the ```getRectsIn``` function above, and then renders
the set of rects on an HTML canvas.

    tiles = new L.TileLayer.Canvas {continuousWorld: true}

    tiles.drawTile = (canvas, tile, zoom) ->
        ctx = canvas.getContext '2d'

        # ctx.fillStyle = '#fefef2'
        ctx.fillStyle = '#eeeee2'
        ctx.fillRect(0, 0, 256, 256)

        ctx.fillStyle = 'black'
        ###
        ctx.fillText('x: ' + tile.x + ', y: ' + tile.y + ', zoom:' + zoom, 20, 20)
        ctx.fillText('LL: ' + this._map.layerPointToLatLng(tile), 20, 50)
        ###
        tileCount = 1 << zoom
        XStart = 0
        XDiff = 268435456      
        MinX = XStart + XDiff * tile.x / tileCount
        MaxX = MinX + XDiff / tileCount
        YStart = 0
        YDiff = 268435456
        MinY = YStart + YDiff * tile.y / tileCount
        MaxY = MinY + YDiff / tileCount

        # console.log("MaxX: " + MaxX)

        rects = getRectsIn(MinX, MinY, MaxX, MaxY, 256)

        for r in rects
            ctx.fillStyle=r.color
            ctx.fillRect.apply(ctx, r.rect)

        # ctx.fillRect.apply(ctx, [ -40, -40, 100, 100])

Finally, we provide settings for the map and start it working.
I use the mlevans excellent [leaflet-hash](https://github.com/mlevans/leaflet-hash)
plugin to provide links to specific views, though I have to do some
custom initializaiton to make sure the map starts in the right place.

    defaultStart =
        center: new L.LatLng 584.8926, 1106.5347
        zoom: 10
    start = L.Hash.prototype.parseHash(location.hash) || defaultStart
    map = new L.Map 'map', {
        center: start.center, 
        zoom: start.zoom, 
        minZoom: 0,
        maxZoom: 14,
        layers: [tiles],
        attributionControl: false,
        crs: L.CRS.Simple
    }
    hash = new L.Hash map
