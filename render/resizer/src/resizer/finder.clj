(ns resizer.finder
  (:require [resizer.core :refer [down-sample up-sample]]
            [resizer.localfile :refer [tile-exists?]]
            [clojure.edn]
  )
  (:import (javax.imageio ImageIO)
           (java.awt Color RenderingHints)
           (java.awt.image BufferedImage)
           (java.io File IOException))
  (:require [clojure.java.io :as jio])
  (:gen-class))

(defn process-exists1 [z x y]
  (if (and (< -3 x 3) (< -3 y 3))
    (do
      (println (str "processing " z "," x "," y))
      true)
    false))

(def ref-layer 60)
(def last-layer 63)

(defn process-exists [z x y]
  (if (tile-exists? z x y)
    (do
      (println (str "processing " z "," x "," y))
      (if (<= z ref-layer)
        (down-sample z x y))
      (if (>= z ref-layer)
        (up-sample z x y))
      true)
    false))

(defn sweep-row [z x y xf]
  (loop [cx x sum 0]
    (if (process-exists z cx y)
      (recur (xf cx) (inc sum))
      ;else
      sum)))

(defn sweep-quadrant [z x y xf yf]
  (loop [cy y sum 0]
    (let [rowcnt (sweep-row z x cy xf)]
      (if-not (zero? rowcnt)
        (recur (yf cy) (+ sum rowcnt))
        ;else
        sum))))

(defn layer-sweep [z]
  (println (str "layer sweep: " z))
  (+ (sweep-quadrant z  0  0 inc inc)
     (sweep-quadrant z -1  0 dec inc)
     (sweep-quadrant z  0 -1 inc dec)
     (sweep-quadrant z -1 -1 dec dec)))

(defn full-sweep []
  (loop [dx ref-layer]
    (if (not (zero? (layer-sweep dx)))
      (recur (dec dx))))
  (loop [ix (inc ref-layer)]
    (if (and (<= ix last-layer)
             (not (zero? (layer-sweep ix))))
      (recur (inc ix)))))

(defn -main
  "I don't do a whole lot."
  [& args]
  (if (> (count args) 0)
    (layer-sweep (clojure.edn/read-string (first args)))
    (full-sweep)))
