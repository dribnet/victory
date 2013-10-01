(ns resizer.localfile
  (:import (javax.imageio ImageIO)
           (java.io File IOException))
  (:require [clojure.java.io :as jio]))

(def local-cache "/tmp/fetcher/")

(defn write-file [im s]
  (try
    (ImageIO/write im "png" (File. s))
    (catch IOException e (str "file - " s " - caught exception: " (.getMessage e)))
    ))

(defn write-empty-file [s]
  (spit s "empty"))

(defn remove-file [s]
  (jio/delete-file s))

(defn to-file-name [zoom x y]
  (str local-cache zoom "/" x "/" y ".png"))

(defn file-exists? [s]
  (.exists (jio/as-file s)))

(defn tile-exists? [zoom x y]
  (file-exists? (to-file-name zoom x y)))

(defn delete-file-recursively
  "Delete file f. If it's a directory, recursively delete all its contents.
Raise an exception if any deletion fails unless silently is true."
  [f & [silently]]
  (let [f (jio/file f)]
    (if (.isDirectory f)
      (doseq [child (.listFiles f)]
        (delete-file-recursively child silently)))
    (jio/delete-file f silently)))

(defn clear-cache []
  (delete-file-recursively local-cache true))