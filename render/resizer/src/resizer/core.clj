(ns resizer.core
  (:require [defmain.core :refer [defmain]]
            [resizer.localfile :refer [clear-cache]]
            [resizer.imageops :refer [downsample-strip upsample-strip]]
            [resizer.fetcher  :refer [fetch-strip]]))

(defmain testimageops
  "I don't do a whole lot."
  [& args]
  (clear-cache)
  (fetch-strip 60 0 2 0 2)
  (upsample-strip 60 0 2 0 2)
  (downsample-strip 60 0 2 0 2)
  (println "Hello, World!"))
