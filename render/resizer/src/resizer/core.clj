(ns resizer.core
  (:require [defmain.core :refer [defmain]]
            [resizer.localfile :refer [clear-cache]]
            [resizer.imageops :refer [downsample-strip upsample-strip]]
            [resizer.fetcher  :refer [fetch-strip]]))

(defn down-pyramid [depth xmin xmax ymin ymax]
  (fetch-strip depth xmin xmax ymin ymax)
  (loop [d depth x1 xmin x2 xmax y1 xmin y2 ymax]
    (println (str "checking: " d "," x1 "," x2 "," y1 "," y2))
    (if (and (< x1 x2) (< y1 y2))
      (do
        (println (str "running: " d "," x1 "," x2 "," y1 "," y2))
        (downsample-strip d x1 x2 y1 y2)
        (recur (dec d) (quot x1 2) (quot x2 2) (quot y1 2) (quot y2 2))))))

(defmain testimageops
  "I don't do a whole lot."
  [& args]
  (clear-cache)
  (fetch-strip 60 0 2 0 2)
  (upsample-strip 60 0 2 0 2)
  (downsample-strip 60 0 2 0 2)
  (println "Hello, World!"))
