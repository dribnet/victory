(ns victory
  (:use [blade :only [L]]))

(def tiles (L.TileLayer.Canvas. {:continuousWorld true}))

(aset tiles "drawTile" (fn [canvas tile zoom]
  (let [ctx (.getContext canvas "2d")]
    (aset ctx "fillStyle" "black")
    (.fillRect ctx 0  0 256 256)
    )
  ))

(L.Map. "mappy" {
  :center [10,10]
  :zoom 7
  :minZoom 0
  :maxZoom 7
  :layers [tiles]
  :attributionControl false
  :crs (-> L .-CRS .-Simple)
})
