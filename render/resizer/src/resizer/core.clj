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

; resize a file like ../18/0/0.png to ../17/0/0.png
(defn down-sample [zoom x y]
  (let [im (BufferedImage. 1024 1024 BufferedImage/TYPE_INT_RGB)
        g  (.createGraphics im)
        him (BufferedImage. 512 512 BufferedImage/TYPE_INT_RGB)
        hg (.createGraphics him)
        qim (BufferedImage. 256 256 BufferedImage/TYPE_INT_RGB)
        qg (.createGraphics qim)
        outfile (str prefix (- zoom 1) "/" (/ x 2) "/" (/ y 2) ".png")
        outfile-existed (file-exists? outfile)
        partfile (str outfile "_part")
        part-existed (file-exists? partfile)
        core-tiles (for [cx (range (- x 0) (+ x 2)) cy (range (- y 0) (+ y 2))] [zoom cx cy])
        in-tiles (for [cx (range (- x 1) (+ x 3)) cy (range (- y 1) (+ y 3))] [zoom cx cy])]
    (println (str "downsample: " zoom "," x "," y))
    ; if even x,y and no final outfile and all 4 core pieces are there...
    (if (and (even? x)
             (even? y)
             (or part-existed (not outfile-existed))
             (every? (partial apply tile-exists?) core-tiles))
      (do
        (.setColor g Color/lightGray)
        (.fillRect g 0 0 1024 1024)
        (doseq [xs (range 4)]
          (let [cx (+ x xs -1)]
            (doseq [ys (range 4)]
              (let [cy (+ y ys -1)
                    infile  (str prefix zoom "/" cx "/" cy ".png")]
                ; (println (str "processing " cx "," cy))
                (if (file-exists? infile)
                  (.drawImage g
                    (ImageIO/read (File. infile))
                    (* 256 xs) (* 256 ys) Color/black nil)
                  )))))
        ; (write-file im "test.png")
        (.setRenderingHint hg RenderingHints/KEY_INTERPOLATION
                           RenderingHints/VALUE_INTERPOLATION_BICUBIC)
        (.drawImage hg im 0 0 512 512 nil)
        ; (write-file him "half.png")
        (.drawImage qg him 0 0 256 256 128 128 384 384 nil)
        (println (str "Writing: " outfile))
        (jio/make-parents outfile)
        (write-file qim outfile)
        ; note if this is the 'final version'
        (if (every? (partial apply tile-exists?) in-tiles)
          ; remove part file if there
          (if part-existed (remove-file partfile))
          ; put there if missing
          (if-not part-existed (write-empty-file partfile)))
        true)
      false)
    ; (write-file qim "tile.png")
    ))

; resize a file like ../18/0/0.png to ../19/[01]/[01].png
(defn up-sample [zoom x y]
  (let [im (BufferedImage. 512 512 BufferedImage/TYPE_INT_RGB)
        g  (.createGraphics im)
        him (BufferedImage. 256 256 BufferedImage/TYPE_INT_RGB)
        hg (.createGraphics him)
        infile (str prefix zoom "/" x "/" y ".png")
        nzoom (inc zoom)
        out-tiles [ [nzoom      (* x 2)       (* y 2)]
                    [nzoom      (* x 2)  (inc (* y 2))]
                    [nzoom (inc (* x 2))      (* y 2)]
                    [nzoom (inc (* x 2)) (inc (* y 2))]] ] 
    (if (not (every? (partial apply tile-exists?) out-tiles))
      (do

        (.setRenderingHint hg RenderingHints/KEY_INTERPOLATION
                           RenderingHints/VALUE_INTERPOLATION_NEAREST_NEIGHBOR)
        ; (println (str "reading " infile))
        (.drawImage g (ImageIO/read (File. infile))
          0 0 512 512 nil)

        ; make two images at zoom+1, x*2
        (jio/make-parents (str prefix nzoom "/" (* x 2) "/out.png"))
        (.drawImage hg im 0 0 256 256 0 0 256 256 nil)
        (write-file him (str prefix nzoom "/" (* x 2) "/" (* y 2) ".png"))
        (.drawImage hg im 0 0 256 256 0 256 256 512 nil)
        (write-file him (str prefix nzoom "/" (* x 2) "/" (inc (* y 2)) ".png"))

        ; make two images at zoom+1, x*2+1
        (jio/make-parents (str prefix nzoom "/" (inc (* x 2)) "/out.png"))
        (.drawImage hg im 0 0 256 256 256 0 512 256 nil)
        (write-file him (str prefix nzoom "/" (inc (* x 2)) "/" (* y 2) ".png"))
        (.drawImage hg im 0 0 256 256 256 256 512 512 nil)
        (write-file him (str prefix nzoom "/" (inc (* x 2)) "/" (inc (* y 2)) ".png"))
        true)
      false)))

; (doseq [i (range -1 4)]
;   (doseq [j (range -1 4)]
;     (up-sample 60 i j)))
; (doseq [i (range -2 8)]
;   (doseq [j (range -2 8)]
;     (up-sample 61 i j)))
; (doseq [i (range -4 16)]
;   (doseq [j (range -4 16)]
;     (up-sample 62 i j)))
; (doseq [i (range -8 32)]
;   (doseq [j (range -8 32)]
;     (up-sample 63 i j)))

; (doseq [i (range -18 18 2)]
;   (doseq [j (range -18 18 2)]
;     (down-sample 18 i j)))
; (doseq [i (range -8 8 2)]
;   (doseq [j (range -8 8 2)]
;     (down-sample 17 i j)))
; (doseq [i (range -2 2 2)]
;   (doseq [j (range -2 2 2)]
;     (down-sample 16 i j)))


(defn -main
  "I don't do a whole lot."
  [& args]
  (up-sample 18 0 0)
  (down-sample 18 0 0)
  (println "Hello, World!"))
