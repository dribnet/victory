(ns resizer.core
  (:require [defmain.core :refer [defmain]]
            [cemerick.bandalore :as sqs]
            [clojure.tools.reader.edn :as edn]
            [resizer.localfile :refer [clear-cache]]
            [resizer.imageops :refer [downsample-strip upsample-strip]]
            [resizer.fetcher  :refer [aws-creds fetch-strip upsample-upload downsample-upload]]))

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
  (if-not (nil? command)
    (do
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
        (println (str "unknown command: " command))))))

(defn make-client []
  (sqs/create-client (:access-key aws-creds) (:secret-key aws-creds)))

(defmain createq [qname]
  (let [client (make-client)]
    (println (pr-str (sqs/create-queue client qname)))))

(defmain listqs []
  (println (str "OK " (:access-key aws-creds)))
  (let [client (make-client)]
    (println (pr-str (sqs/list-queues client)))))

(defmain delq [qname]
  (let [client (make-client)]
    (println (pr-str (sqs/delete-queue client qname)))))

(def qname "https://sqs.us-east-1.amazonaws.com/864287020871/victory")

(defmain processQueue []
  (let [client (make-client)]
    (while true
      (let [mes (first (sqs/receive client qname))]
        (if (nil? mes)
          (do
            (println "queue is finally empty")
            (System/exit 0))
          (do
            (println (str "processing message " (:body mes)))
            (process-request (edn/read-string (:body mes)))
            (sqs/delete client qname mes)))))))

(defmain populateQueue []
  (let [client (make-client)]
    (doall (for [x (range -640 640 32) y (range -640 640 32)]
      (sqs/send client qname (pr-str {
      ; (println (pr-str {
        :command :downsample
        :depth 60
        :xmin x
        :xmax (+ x 32)
        :ymin y
        :ymax (+ y 32)
        }))))))

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
