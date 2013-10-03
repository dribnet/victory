(ns resizer.fetcher
  (:import  com.amazonaws.services.s3.model.AmazonS3Exception)
  (:require [clojure.java.io :as jio]
            [defmain.core :refer [defmain]]
            [clojure.java.io :refer [output-stream file copy make-parents]]
            [aws.sdk.s3 :as s3]
            [resizer.localfile :refer [local-cache file-exists?]]
            [environ.core :refer [env]]))

(def aws-creds
  {:access-key (env :aws-access-key)
   :secret-key (env :aws-secret-key)})

(def remote-bucket "tile.drib.net")
(def remote-prefix "victory/")

(defn fetch-file-strict [s]
  "given one file like '60/639/639.png' fetch to local drive"
  (let [obj (s3/get-object aws-creds remote-bucket (str remote-prefix s))
        out (do (make-parents (str local-cache s)) (file local-cache s))]
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
  (println (str "fetchfile: " s))
  (if-not (file-exists? (str local-cache s))
    (try
      (if missing-is-error
        (fetch-file-strict s)
        (fetch-file-allow-missing s))
      (catch Exception e 
        (binding [*out* *err*]
          (println (str "Error fetching " s " with setting " missing-is-error)))
        (throw e)))))
  
(defn fetch-strip [depth xmin xmax ymin ymax]
  "grab all tiles in bounding box and try to grab bordering tiles too"
  (let [load-pairs (for [x (range (- xmin 1) (+ xmax 1)) y (range (- ymin 1) (+ ymax 1))]
          [(str depth "/" x "/" y ".png") (and (< (- xmin 1) x xmax) (< (- ymin 1) y ymax))])]
    (doall (pmap #(apply fetch-file %) load-pairs))))

(defn save-file [s]
  "given one file like '60/639/639.png', push to s3"
  (println (str "savefile: " s))
  (let [src (file local-cache s)]
    (s3/put-object aws-creds remote-bucket (str remote-prefix s) src)))

(defn downsample-upload [depth xmin xmax ymin ymax]
  "upload results of downsampling strip"
  (let [dec-depth (dec depth)
        file-list (for [x (range xmin xmax 2) y (range ymin ymax 2)]
          (str dec-depth "/" (/ x 2) "/" (/ y 2) ".png"))]
    (doall (pmap #(save-file %) file-list))))

(defn upsample-upload [depth xmin xmax ymin ymax]
  "upload results of upsampling strip"
  (let [inc-depth (inc depth)
        file-list (for [x (range xmin xmax) y (range ymin ymax) dx (range 2) dy (range 2)]
          (str inc-depth "/" (+ (* x 2) dx) "/" (+ (* y 2) dy) ".png"))]
    (doall (pmap #(save-file %) file-list))))

(defmain hello [gretee]
  (println (str "hello " gretee)))