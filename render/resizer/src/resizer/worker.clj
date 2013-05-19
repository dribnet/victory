(ns resizer.worker
  (:require [resizer.core :refer [down-sample up-sample]]
            [kestrel.client :as kestrel]
            [aws.sdk.s3 :as s3]
            [clojure.tools.reader.edn :refer [read-string]]))

(defn queue-neighbors [action zoom x y])

(def ref-layer 60)
(def last-layer 63)

(defn queue-from [dir zoom x y]
  (case dir
    :down (queue-neighbors :down-sample (- zoom 1) (/ x 2) (/ y 2))
    :up   (queue-neighbors :up-sample (+ zoom 1) (* x 2) (* y 2))))

(defn process-one []
  (print "+") 
  (flush)
  (if-let [{:keys [action zoom x y]} 
            (read-string (kestrel/get-item "tiles" :mode0 "close" :mode1 "open"))]
    (case action
      :downsample (if (down-sample zoom x y) (queue-from :down zoom x y))
      :upsample   (if (up-sample zoom x y) (queue-from :up zoom x y)))
    (do (print ".") (flush) (Thread/sleep 1000))))

(defn -main
  [& args]
  (println "Running tile worker")
  (kestrel/default-client) ;; use default settings
  (while true (process-one)))