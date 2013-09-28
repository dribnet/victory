(ns resizer.s3file
  (:import (javax.imageio ImageIO)
           (java.io File IOException))
  (:require [clojure.java.io :as jio]
                [aws.sdk.s3 :as s3])
  (:gen-class))

(defn write-file [im s]
  (try
    (ImageIO/write im "png" (File. s))
    (catch IOException e (str "file - " s " - caught exception: " (.getMessage e)))
    ))

(defn write-empty-file [s]
  (spit s "empty"))

(defn remove-file [s]
  (jio/delete-file s))

(def prefix "/NoBackup/test/")

(defn to-file-name [zoom x y]
  (str prefix zoom "/" x "/" y ".png"))

(defn file-exists? [s]
  (.exists (jio/as-file s)))

(defn tile-exists? [zoom x y]
  (file-exists? (to-file-name zoom x y)))