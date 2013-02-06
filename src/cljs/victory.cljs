(ns victory
  (:use [blade :only [L]]))


; :https//github.com/richhickey/clojure-contrib/blob/2ede388a9267d175bfaa7781ee9d57532eb4f20f/src/main/clojure/clojure/contrib/probabilities/random_numbers.clj#L35

; (deftype ::lcg lcg
;   "Create a linear congruential generator"
;   {:arglists '([modulus multiplier increment seed])}
;   (fn [modulus multiplier increment seed]
;     {:m modulus :a multiplier :c increment :seed seed})
;   (fn [s] (map s (list :m :a :c :seed))))

; (defstream ::lcg
;   [lcg-state]
;   (let [{m :m a :a c :c seed :seed} lcg-state
;         value (/ (float seed) (float m))
;         new-seed (rem (+ c (* a seed)) m)]
;     [value (assoc lcg-state :seed new-seed)]))

(defn gen-custom-random [x y s]
  (let [seed (+ (* x 13 13) (* y 13) s 1)
        cnst (+ (Math/pow 2 13) 1)
        prim 37
        mx (Math/pow 2 50)
        state (atom [0 {:seed seed :cnst cnst :prime prim :mx mx}])
        nxt (fn [[v {:keys [seed cnst prim mx] :as args}]]
              (let [value (/ seed mx)
                    new-seed (rem (+ prim (* cnst seed)) mx)]
                [(* value 1024) (assoc args :seed new-seed)]))
        simplefn (fn [] (swap! state nxt) (first @state))]

          ; it helps to warm up the rng
          (dotimes [n 10]
            (simplefn))

          simplefn))

(def rng (gen-custom-random 1 2 3))

(dotimes [n 10]
  (.log js/console (rng)))

(def cycles [
  {:size 8388608  :colors ["#e20800" "#2d1e17"]}
  {:size 4194304  :colors ["#e20800" "#2d1e17"]}
  {:size 2097152  :colors ["#2d1e17" "#f2af00"]}
  {:size 1048576  :colors ["#2d1e17" "#f2af00"]}
  {:size 524288   :colors ["#f2af00" "#2f4f9a"]}
  {:size 262144   :colors ["#f2af00" "#2f4f9a"]}
  {:size 131072   :colors ["#2f4f9a" "#c6bace"]}
  {:size 65536    :colors ["#2f4f9a" "#c6bace"]}
  {:size 32768    :colors ["#c6bace" "#e20800"]}
  {:size 16384    :colors ["#c6bace" "#e20800"]}
  {:size 8192     :colors ["#e20800" "#2d1e17"]}
  {:size 4096     :colors ["#e20800" "#2d1e17"]}
  {:size 2048     :colors ["#2d1e17" "#f2af00"]}
  {:size 1024     :colors ["#2d1e17" "#f2af00"]}
])

; (defn rects-in-cell [xmin xmax ymin ymax size]

;   )

(defn get-rects-in [x1 y1 x2 y2 s]
  (.log js/console (str "RECTSIN: " x1 "," y1 "," x2 "," y2 "," s))
  (.log js/console (str "RECTDIFF: " (- x2 x1) "," (- y2 y1)))
  (let [hs (/ s 2)
        scalex (/ s (- x2 x1))
        scaley (/ s (- y2 y1))
        cy (last cycles)]

    (let [size (:size cy)
          xmin (- x1 (mod x1 size))
          xmax (+ (- x2 (mod x2 size)) size)
          dx   size
          ymin (- y1 (mod y1 size))
          ymax (+ (- y2 (mod y2 size)) size)
          dy   size]

          (.log js/console (str "xbounds: " xmin "," xmax))

          (for [x (range xmin xmax dx)
                y (range ymin ymax dy)
               :let [rng (gen-custom-random x y size)]
               :when (< (rng) 100)]
            {:color ((:colors cy) (if (< (rng) 512) 0 1))
             :rect (array (* (- x x1) scalex) (* (- y y1) scaley) 
                    (* dx scalex) (* dy scaley))
            }
           ))))

; (.log js/console (str "rects " (get-rects-in 163840,-196608,196608,-163840,256)))

(def tiles (L.TileLayer.Canvas. {:continuousWorld true}))

(aset tiles "drawTile" (fn [canvas tile zoom]
  (let [ctx (.getContext canvas "2d")
        tile-count (bit-shift-left 1 zoom)
        x (aget tile "x")
        y (aget tile "y")
        x-start 0
        x-diff 4194304
        min-x (+ x-start (/ (* x-diff x) tile-count))
        max-x (+ min-x (/ x-diff tile-count))
        y-start 0
        y-diff 4194304
        min-y (+ y-start (/ (* y-diff y) tile-count))
        max-y (+ min-y (/ y-diff tile-count))
        rects (get-rects-in min-x min-y max-x max-y 256)]
    ; (.log js/console (str "MinX: " max-x))
    (aset ctx "fillStyle" "white")
    (.fillRect ctx 0  0 256 256)
    (aset ctx "fillStyle" "black")
    (.apply (.-fillRect ctx) ctx [0 0 100 100])
    ; (.fillRect ctx 0  0 100.1 100.0)
    (doseq [r rects]
      ; (.log js/console (str "Drawing " (:rect r) "," (:color r)))
      (aset ctx "fillStyle" (:color r))
      ; (.fillRect ctx (get-in r [:rect 0]) (get-in r [:rect 1]) 
      ;                (get-in r [:rect 2]) (get-in r [:rect 3]))
      (.apply (.-fillRect ctx) ctx (:rect r))
      ))))

(L.Map. "mappy" {
  :center [10,10]
  :zoom 7
  :minZoom 0
  :maxZoom 7
  :layers [tiles]
  :attributionControl false
  :crs (-> L .-CRS .-Simple)
})
