(ns victory
  (:use [blade :only [L]]))


; https://github.com/richhickey/clojure-contrib/blob/2ede388a9267d175bfaa7781ee9d57532eb4f20f/src/main/clojure/clojure/contrib/probabilities/random_numbers.clj#L35

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
                [value (assoc args :seed new-seed)]))
        simplefn (fn [] (swap! state nxt) (first @state))]

          (dotimes [n 10]
            (simplefn))

          simplefn))

(def rng (gen-custom-random 1 2 3))

(dotimes [n 5]
  (.log js/console (rng)))

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
