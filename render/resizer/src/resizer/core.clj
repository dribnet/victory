(ns resizer.core
  (:require [defmain.core :refer [defmain]]
            [resizer.localfile :refer [clear-cache]]
            [resizer.imageops :refer [downsample-strip upsample-strip]]
            [resizer.fetcher  :refer [fetch-strip upsample-upload downsample-upload]]))

(defn down-pyramid [depth xmin xmax ymin ymax]
  (fetch-strip depth xmin xmax ymin ymax)
  (loop [d depth x1 xmin x2 xmax y1 xmin y2 ymax]
    (println (str "checking: " d "," x1 "," x2 "," y1 "," y2))
    (if (and (< x1 x2) (< y1 y2))
      (do
        (println (str "running: " d "," x1 "," x2 "," y1 "," y2))
        (downsample-strip d x1 x2 y1 y2)
        (recur (dec d) (quot x1 2) (quot x2 2) (quot y1 2) (quot y2 2))))))

(defn process-request [{:keys [command depth xmin xmax ymin ymax]}]
  (println (str "processing: " command ":" xmin " -> " xmax "," ymin " -> " ymax))
  (fetch-strip depth xmin xmax ymin ymax)
  (case command
    :downsample 
      (do
        (println "downsampling")
        (downsample-strip depth xmin xmax ymin ymax)
        (downsample-upload depth xmin xmax ymin ymax))
    :upsample
      (do
        (println "upsampling")
        (upsample-strip depth xmin xmax ymin ymax)
        (upsample-upload depth xmin xmax ymin ymax))
    (println (str "unknown command: " command))))

(defmain testrequest
  [& args]
  (clear-cache)
  (process-request {:command :downsample :depth 60 :xmin 0 :xmax 4 :ymin 0 :ymax 4})
  (shutdown-agents))

(defmain testimageops
  [& args]
  (clear-cache)
  (fetch-strip 60 0 2 0 2)
  (upsample-strip 60 0 2 0 2)
  (downsample-strip 60 0 2 0 2)
  (shutdown-agents)
  (println "Hello, World!"))
