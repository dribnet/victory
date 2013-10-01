(ns resizer.fetcher
  (:import  com.amazonaws.services.s3.model.AmazonS3Exception)
  (:require [clojure.java.io :as jio]
            [defmain.core :refer [defmain]]
            [clojure.java.io :refer [output-stream file copy make-parents]]
            [aws.sdk.s3 :as s3]
            [environ.core :refer [env]]))

(def aws-creds
  {:access-key (env :aws-access-key)
   :secret-key (env :aws-secret-key)})

(def remote-bucket "tile.drib.net")
(def remote-prefix "victory/")
(def local-prefix "/tmp/fetcher/")

(defn fetch-file-strict [s]
  "given one file like '60/639/639.png' fetch to local drive"
  (let [obj (s3/get-object aws-creds remote-bucket (str remote-prefix s))
        out (do (make-parents (str local-prefix s)) (file local-prefix s))]
    (copy (:content obj) out)
    (.close (:content obj))))

(defn fetch-file-allow-missing [s]
  "wrapper around fetch-file that allows s3 not found exceptions"
  (try
    (fetch-file-strict s)
    (catch AmazonS3Exception e 
      (if-not (re-matches #".*key does not exist.*" (.getMessage e))
        (throw e)))))

(defn fetch-file [s missing-is-error]
  "fetch a file optionally allowing it to be missing"
  (try
    (if missing-is-error
      (fetch-file-strict s)
      (fetch-file-allow-missing s))
    (catch Exception e 
      (binding [*out* *err*]
        (println (str "Error fetching " s " with setting " missing-is-error)))
      (throw e))))
  
(defn fetch-strip [depth xmin xmax ymin ymax]
  "grab all tiles in bounding box and try to grab bordering tiles too"
  (for [x (range (- xmin 1) (+ xmax 1)) y (range (- ymin 1) (+ ymax 1))]
    (fetch-file (str depth "/" x "/" y ".png") (and (< (- xmin 1) x xmax) (< (- ymin 1) y ymax)))))

(defmain hello [gretee]
  (println (str "hello " gretee)))