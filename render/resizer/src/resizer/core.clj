(ns resizer.core
  (:import (javax.imageio ImageIO)
           (java.awt Color RenderingHints)
           (java.awt.image BufferedImage)
           (java.io File IOException))
  (:require [clojure.java.io :as jio])
  (:gen-class))

(defn write-file [im s]
  (try
    (ImageIO/write im "png" (File. s))
    (catch IOException e (str "caught exception: " (.getMessage e)))
    ))

(def prefix "../tiles/")

; resize a file like ../18/0/0.png to ../17/0/0.png
(defn resize [zoom x y]
  (let [im (BufferedImage. 1024 1024 BufferedImage/TYPE_INT_RGB)
        g  (.createGraphics im)
        him (BufferedImage. 512 512 BufferedImage/TYPE_INT_RGB)
        hg (.createGraphics him)
        qim (BufferedImage. 256 256 BufferedImage/TYPE_INT_RGB)
        qg (.createGraphics qim)
        outfile (str prefix (- zoom 1) "/" (/ x 2) "/" (/ y 2) ".png")]
    (doseq [xs (range 4)]
      (let [cx (+ x xs -1)]
        (doseq [ys (range 4)]
          (let [cy (+ y ys -1)
                infile  (str prefix zoom "/" cx "/" cy ".png")]
            ; (println (str "processing " cx "," cy))
            (.drawImage g
              (ImageIO/read (File. infile))
              (* 256 xs) (* 256 ys) Color/black nil)
            ))))
    ; (write-file im "test.png")
    (.setRenderingHint hg RenderingHints/KEY_INTERPOLATION
                       RenderingHints/VALUE_INTERPOLATION_BICUBIC)
    (.drawImage hg im 0 0 512 512 nil)
    ; (write-file him "half.png")
    (.drawImage qg him 0 0 256 256 128 128 384 384 nil)
    (jio/make-parents outfile)
    (write-file qim outfile)
    ; (write-file qim "tile.png")
    ))

; (doseq [i (range -18 18 2)]
;   (doseq [j (range -18 18 2)]
;     (resize 18 i j)))
; (doseq [i (range -8 8 2)]
;   (doseq [j (range -8 8 2)]
;     (resize 17 i j)))
; (doseq [i (range -2 2 2)]
;   (doseq [j (range -2 2 2)]
;     (resize 16 i j)))


(defn -main
  "I don't do a whole lot."
  [& args]
  (resize 18 0 0)
  (println "Hello, World!"))
