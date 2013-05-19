(ns resizer.deposit
  (:require [resizer.core :refer [down-sample up-sample]]
            [kestrel.client :as kestrel]
            [aws.sdk.s3 :as s3]
            [clojure.tools.reader.edn :refer [read-string]]))

(def ref-layer 60)
(def last-layer 63)

(defn queue-task []
  (print "+") 
  (flush)
  (doseq [x (range -640 (+ -640 16))]
    (doseq [y (range 16)]
      (kestrel/set-item "tiles" (pr-str {
          :action :downsample,
          :zoom 60
          :x x
          :y y
          :neighbors false
        })))))

(defn show-task []
  (let [x (read-string (kestrel/get-item "tiles"))]
    (println (str "item is: " x))))

(defn -main
  [& args]
  (println "Running deposit/fetch")
  (kestrel/default-client) ;; use default settings
  (if (> (count args) 0)
    (do
      (println "Deposit")
      (kestrel/flush-all)
      (queue-task))
    ; else
    (do
      (println "Fetch")
      (show-task)))
  (System/exit 0))
