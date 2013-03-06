Victory
=======

Victory is a design landscape inspired by Mondrian, specifically [Victory Boogie-Woogie](http://en.wikipedia.org/wiki/Victory_Boogie-Woogie).

Design landscapes are expansive drawing surfaces. In this case, the surface is actually
infinite in two dimensions with several layers of depth throughout. Mondrain was influenced
by the cityscape around him, and here these themes play out as a navigable map that
stretches in all directions.

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
custom random number generator. This generator needs to be fully repeatable and takes
three arguments which represent the position and depth as the seed. This implementation
is based on
[Michal Budzynski's JavaScript implementation](http://michalbe.blogspot.com/2011/02/javascript-random-numbers-with-custom.html)
and forgoes better statistics for speed and initializaiton time because this program
has the somewhat unusual characteristic of needing thousands of individual random number
generators as the design unfolds.

By using individual random number generators spatially connected to their environment,
locations are independent of each other given some radius of interaction, which allows
the image tiles to be generated any order.

these numbers are used again and again, so we cache them for efficiency

    cachedRandomConstant = Math.pow(2, 13)+1
    cachedRandomMaximum = Math.pow(2, 50)

when called, returns an object whose next method can be used to generate the random numbers
(here random numbers vary between 0 and 1024)

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

This additional mod funciton provides correct results with negative numbers. (more information
is available [on StackOverflow](http://stackoverflow.com/questions/4467539/javascript-modulo-not-behaving)
and [about.com](http://javascript.about.com/od/problemsolving/a/modulobug.htm))

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
      map[s] = {} if not map[s]?
      map[s][x] = {} if not map[s][x]?
      map[s][x][y] = {} if not map[s][x][y]?
      map[s][x][y][k] = v

    recallCellProperty = (map, x, y, s, k) ->
      if map[s]? && map[s][x]? && map[s][x][y]?
        map[s][x][y][k]
      else
        undefined

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

Color definitions.

    mYellow = '#f7bf00'
    dullYellow = '#dba300'
    mBlue = '#37508a'
    dullBlue = '#5b5c94'
    mRed = '#f50603'
    dullGrey = '#dfc4bd'
    mGrey = '#ded5d3'
    mBlack = '#291f20'
    mBackground = '#fcfffc'
    forestGreen = '#0b9600'
    darkForestGreen = '#006a02'
    darkBlueGreen = '#006a50'
    darkerBlueGreen = '#004d39'
    veryDarkYellow = '#243300'
    forestWoods = '#964e00'
    sageStreak = '#00ce91'
    darkBackground = '#0a4d00'

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
      {index: 18, size: 131072, thresh: 25, grow: LINE,
      minDrawSize: 4, minstretch: 1, stretch: 3, 
      colors: [mBlue, mRed, mYellow], 
      outcolors: [forestWoods, forestGreen]},

      {index: 17, size: 65536, thresh: 100, grow: LINE,
      minDrawSize: 8, minstretch: 1, stretch: 3, 
      colors: [mRed, mYellow, mBlue, mGrey],
      outcolors:['#000000']}
    ]

All the other details of the cities are in the city group.

    cityGroup = [
      {index: 17, size: 65536, thresh: 100, grow: LINE,
      minDrawSize: 8, minstretch: 1, stretch: 2,
      colors:[mRed, mYellow, mBlue, mGrey]},

      {index: 16, size: 32768, thresh: 100, grow: LINE,
      minDrawSize: 8, minstretch: 1, stretch: 3,
      colors:[mRed, mYellow, mBlue, mGrey]},

      {index: 15, size: 16384, thresh: 7, grow: LINE,
      minDrawSize: 8, minstretch: 6, stretch: 7,
      colors:[mRed, mYellow, mBlue],
      outcolors:['#FFFF00']},

      {index: 14, size: 8192, thresh: 9, grow: LINE,
      minDrawSize: 8, minstretch: 22, stretch: 24,
      colors:[mRed, mYellow, mBlack, mBlue, mGrey],
      outcolors:['#FFFF00']}
    ]

Drawn separately are the finest details, which can only exist in open spaces.
(This layer does not appear in the final version)

    peopleGroup = [
      {index: 11, size: 1024, thresh: 1, grow: CLOUD,
      minDrawSize: 4, minstretch: 1, cloudThresh: 40, stretch: 9,
      colors:['#d8ad00', '#a68500', '#735c00', '#403300']}
    ]

The outer group defines the largest features which are seen when zooming out. waterGroup
is the furtherst out so that it is established on its own timeline.

    waterGroup = [
      {index: 28, size: 134217728, thresh: 30, grow: POOL,
      minDrawSize: 8, minstretch: 1, stretch: 4, colors:['#7777ee']},

      {index: 27, size: 67108864, thresh: 30, grow: POOL,
      minDrawSize: 8, minstretch: 1, stretch: 2, colors:['#8888ee']}
    ]

    outerGroup = [
      {index: 25, size: 16777216, thresh: 20, grow: POOL,
      minDrawSize: 8, minstretch: 2, stretch: 6,
      colors:[darkBlueGreen, veryDarkYellow, darkerBlueGreen]},

      {index: 24, size: 8388608, thresh: 16, grow: POOL,
      minDrawSize: 8, minstretch: 1, stretch: 4,
      colors:[darkForestGreen, darkBlueGreen]},

      {index: 22, size: 2097152, thresh: 8, grow: POOL,
      minDrawSize: 4, minstretch: 1, stretch: 5,
      colors:[forestGreen, darkForestGreen]},

      {index: 23, size: 4194304, thresh: 1, grow: POOL,
      minDrawSize: 4, minstretch: 1, stretch: 2, colors:[mBackground]},

      {index: 19, size: 262144, thresh: 5, grow: CROSS,
      minDrawSize: 4, minstretch: 1, stretch: 5, colors:[mRed],
      outcolors:[sageStreak]}
    ]

This is the master list of groups and encodes the order in which they are generated.

    layerGroups = [
      waterGroup,
      outerGroup,
      buildingGroup,
      cityGroup
    ]

Each layer generates a number of seeds on a timeline, and then grows the feature from the
seed by running the timeline in order. This is the function that grows an individual
seed into a feature. The result is a set of rectangle objects pushed onto the provided
rects array.

    growSeed = (c, x1, y1, scalex, scaley, rects, map, cy) ->
      colors = cy.colors

A POOL is a spreading group of squares.

      if (cy.grow == POOL)
        main_rng = CustomRandom(c.x, c.y, cy.size)
        cindex = main_rng.next() % cy.colors.length
        poolColor = colors[cindex]
        for i in [0-c.extent1 ... c.extent2]
          for j in [0-c.extent1 ... c.extent2]
            r = {}
            r.color = poolColor
            r.rect = [(c.x-x1+i*cy.size)*scalex, (c.y-y1+j*cy.size)*scaley,
                cy.size*scalex, cy.size*scaley]
            rects.push(r)
            rememberCellProperty(map, (c.x+i*cy.size), (c.y+j*cy.size),
                cy.size, "active", true)

A CLOUD is a group of scattered squares

      if (cy.grow == CLOUD)
        main_rng = CustomRandom(c.x, c.y, cy.size)
        cindex = main_rng.next() % cy.colors.length
        poolColor = colors[cindex]
        for i in [0-c.extent1 ... c.extent2]
          curx = (c.x+i*cy.size)
          for j in [0-c.extent1 ... c.extent2]
            cury = (c.y+i*cy.size)
            abort = false;
            rng = CustomRandom(curx, cury, cy.size)
            # abort randomly to get that cloud effect
            n = main_rng.next()
            if (n > cy.cloudThresh)
                abort = true

Checks are done here to not draw on top of other layers.

            if (!abort && cy.index >= 11 && cy.index <= 19)
              # lookup out of city colors
              gridPoint = getPointAlignedToGrid(curx, cury, 4194304)
              onCity = recallCellProperty(map, gridPoint[0], gridPoint[1],
                  4194304, "active")
              if (onCity)
                for l in [12 .. 18]
                  break if abort
                  cellSize = indexSizeTable[l]
                  gridPoint = getPointAlignedToGrid(curx, cury, cellSize)
                  onOther = recallCellProperty(map, gridPoint[0], gridPoint[1],
                      cellSize, "active")
                  if (onOther)
                    abort = true
            if (!abort)
              r = {}
              cindex = rng.next() % cy.colors.length
              r.color = cy.colors[cindex]
              r.rect = [(c.x-x1+i*cy.size)*scalex, (c.y-y1+j*cy.size)*scaley,
                  cy.size*scalex, cy.size*scaley]
              rects.push(r)
              rememberCellProperty(map, (c.x+i*cy.size), (c.y+j*cy.size),
                  cy.size, "active", true)

LINE is a row of squares and a CROSS is two lines and shares logic

      if(cy.grow == CROSS || (cy.grow == LINE))
        for isVertical in [true, false]
          # line skips one part of the cross
          if (cy.grow == LINE && isVertical != c.dir)
            continue
          for dual in [0 ... 2]
            abort = false
            start = 0
            inc = 1
            stopat = c.extent1
            if (dual > 0)
              start = -1
              inc = -1
              stopat = 0-c.extent2

Lines are drawn from the center out so that they can be stopped upon
hitting a barrier.

            for i in [start ... stopat] by inc
              colors = cy.colors
              rng
              curx
              cury
              if (isVertical)
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
                onCity = recallCellProperty(map, gridPoint[0], gridPoint[1],
                    4194304, "active")
                if (onCity)
                  for l in [11 .. 18]
                    break if abort
                    cellSize = indexSizeTable[l]
                    gridPoint = getPointAlignedToGrid(curx, cury, cellSize)
                    onOther = recallCellProperty(map, gridPoint[0], 
                        gridPoint[1], cellSize, "active")
                    if (onOther)
                      abort = true
                if (cy.index == 19 || cy.index == 18)
                  if(onCity && cy.index == 19)
                    abort = true
                  if(!onCity)
                    colors = cy.outcolors
              if (!abort)
                # console.log("Setting to " + cindex + "," + colors[cindex])
                r.color = colors[cindex]
                r.rect = [(curx-x1)*scalex, (cury-y1)*scaley,
                    cy.size*scalex, cy.size*scaley]
                rects.push(r)
                rememberCellProperty(map, curx, cury, cy.size, "active", true)

This is the core routine of the algorithm. Given a bounding box and level of zoom, it returns
all of the rectangles that are in that bounding box. To do that it must run a full simulation
of the seeds of all layers from a radius of causality around the provided box.

This method is called as needed by the interface as someone moves through the virtual space.
It returns an array of rectangles to be drawn.

    getRectsIn = (x1, y1, x2, y2, s) ->
      rects = []
      hs = s / 2

      if x2 < x1
        [x1, x2] = [x2, x1]

      scalex = s / (x2 - x1)
      scaley = s / (y2 - y1)

      map = {}

We iterate through each of the layerGroups. Layers within a layerGroups
share a timeline and can interact as they grow.

      for lg in layerGroups

The runlist is a growing in-order list of scheduled tasks. Here I'm
using shinout's [SortedList](https://github.com/shinout/SortedList)
javascript container class.

          runlist = SortedList.create {
            compare:  (a,b) ->
              if(a.tstart != b.tstart)
                return a.tstart - b.tstart
              if(a.x != b.x)
                return a.x - b.x
              return a.y - b.y
          }

Iterate through all layers in the group and build up
list of pending tasks.

          for cy in lg
            # short circuit out if features are too small
            if(cy.size * scalex < cy.minDrawSize)
              continue 

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

            c = {}

            # the cells themselves
            grid = new Array((xmax-xmin)/dx)

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
                  if (!recallCellProperty(map, gridPoint[0], gridPoint[1],
                      134217728, "active"))
                    cellSkip = true
                # nothing else on water
                if (!cellSkip && cy.index < 27)
                  # lookup water skip
                  gridPoint = getPointAlignedToGrid(i, j, 134217728)
                  if (recallCellProperty(map, gridPoint[0], gridPoint[1],
                      134217728, "active"))
                    cellSkip = true
                # don't cover up cities before layer 18
                if (!cellSkip && cy.index > 20 && cy.index < 23)
                  # lookup city skip
                  gridPoint = getPointAlignedToGrid(i, j, 4194304)
                  if (recallCellProperty(map, gridPoint[0], gridPoint[1],
                      4194304, "active"))
                    cellSkip = true
                # city filter
                if (!cellSkip && cy.index < 18)
                  # lookup city skip
                  gridPoint = getPointAlignedToGrid(i, j, 4194304)
                  if (!recallCellProperty(map, gridPoint[0], gridPoint[1],
                      4194304, "active"))
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
                    c.extent1 = cy.minstretch + 
                        rng.next().mod(cy.stretch - cy.minstretch)
                    c.extent2 = cy.minstretch + 
                        rng.next().mod(cy.stretch - cy.minstretch)
                    grid[stepx][stepy] = c
                    runlist.insert(c)
                stepy += 1
              stepx += 1

Whew. Now that we have a sorted list of tasks from the layers, we can
run each in order.

          for runner in runlist
            growSeed(runner, x1, y1, scalex, scaley, rects, map, runner.cy)

And finally we return the aggregated list of rects to draw.

      return rects

Map
---
The interface presented is a navigable map. The map interface itself is provided by
the [excellent leaflet javascript library](leafletjs.com). This use of leaflet is
slightly unusual in that the map itself is dynamically generated as a result
of the navigation itself. To acheive this, a special subclass of leaflet's
TileLayer class is created. This verison of the class has a custom version of
the leaflet ```drawTile``` method which tranlates coordinate spaces, delegates
all the hard work to the ```getRectsIn``` function above, and then renders
the set of rects on an HTML canvas.

    tiles = new L.TileLayer.Canvas {continuousWorld: true}

    tiles.drawTile = (canvas, tile, zoom) ->
      analytics.track('DrawTile', {
        x: tile.x
        y: tile.y
        zoom: zoom
      });
      ctx = canvas.getContext '2d'
      ctx.fillStyle = darkBackground
      ctx.fillRect(0, 0, 256, 256)
      ctx.fillStyle = 'black'

      tileCount = 1 << zoom
      XStart = 0
      XDiff = 268435456      
      MinX = XStart + XDiff * tile.x / tileCount
      MaxX = MinX + XDiff / tileCount
      YStart = 0
      YDiff = 268435456
      MinY = YStart + YDiff * tile.y / tileCount
      MaxY = MinY + YDiff / tileCount

      rects = getRectsIn(MinX, MinY, MaxX, MaxY, 256)
      for r in rects
        ctx.fillStyle=r.color
        ctx.fillRect.apply(ctx, r.rect)

Provide settings for the map and start it working.
I use mlevans' useful [leaflet-hash](https://github.com/mlevans/leaflet-hash)
plugin to allow links to specific views, though I have to do some
custom initializaiton to make sure the map is created in the right place.

    defaultStart =
      center: new L.LatLng 584.8926, 1106.5347
      zoom: 10
    start = L.Hash.prototype.parseHash(location.hash) || defaultStart
    # TODO this added for debugging... remove
    this.map = new L.Map 'map', {
      center: start.center, 
      zoom: start.zoom, 
      minZoom: 0,
      maxZoom: 14,
      layers: [tiles],
      attributionControl: false,
      crs: L.CRS.Simple
    }
    hash = new L.Hash map

    analytics.track('Running', {});

And lastly, some external controls for navigation.

    attrib = new L.Control.Attribution
    attrib.setPrefix ""
    attrStr = '<a href="#" onclick="javascript:clickDemo();">tour</a> | '
    attrStr += '<a href="#" onclick="javascript:clickHome();">home</a> | '
    attrStr += '<a href="https://github.com/dribnet/victory/">code</a>'
    attrib.addAttribution attrStr
    map.addControl attrib

    curLinkIndex = 1;
    linkPath = [
      "#10/584.8931/1106.5347",  # home
      "#9/584.885/1106.920",
      "#7/584.398/1107.727",
      "#4/581.66/1111.84",
      "#0/572.1/1127.6",
      "#0/448/1374",
      "#2/398.4/1492.8",
      "#4/376.78/1544.72",
      "#6/369.914/1552.977",
      "#8/369.908/1552.982",
      "#10/370.0034/1552.8345",
      "#12/370.0756/1552.8522",
      "#9/370.0752/1552.8545",
      "#5/370.078/1552.859",
      "#1/370/1553",
      "#1/186/1521",
      "#3/156.6/1558.0",
      "#5/148.141/1580.500",
      "#7/148.129/1580.500",
      "#10/147.8325/1580.6621",
      "#10/147.5903/1580.8340",
      "#10/147.0483/1581.2158",
      "#10/146.8130/1581.2773",
      "#7/147.145/1580.320",
      "#4/148.66/1575.88",
      "#1/167/1536",
      "#0/403/1158",
      "#2/584.8931/1106.5347"
      "#7/584.8931/1106.5347"
    ]

    this.clickHome = () ->
      analytics.track('ClickHome', {});
      curLinkIndex = 0;
      location.hash = linkPath[0]
      hash.update()

    this.clickDemo = () ->
      analytics.track('ClickTour', {
        index: curLinkIndex
      });
      curLinkIndex = (curLinkIndex + 1) % linkPath.length;
      location.hash = linkPath[curLinkIndex]
      console.log("at " + curLinkIndex + " of " + linkPath.length);
      hash.update()
