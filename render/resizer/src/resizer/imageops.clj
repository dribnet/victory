(ns resizer.imageops
  (:import (javax.imageio ImageIO)
           (java.awt Color RenderingHints)
           (java.awt.image BufferedImage)
           (java.io File IOException))
  (:require [clojure.java.io :as jio]
            [resizer.localfile :refer [write-file write-empty-file local-cache
              remove-file to-file-name file-exists? tile-exists?]]
            ))

; resize a file like ../18/0/0.png to ../17/0/0.png
(defn down-sample [zoom x y]
  (let [im (BufferedImage. 1024 1024 BufferedImage/TYPE_INT_RGB)
        g  (.createGraphics im)
        him (BufferedImage. 512 512 BufferedImage/TYPE_INT_RGB)
        hg (.createGraphics him)
        qim (BufferedImage. 256 256 BufferedImage/TYPE_INT_RGB)
        qg (.createGraphics qim)
        outfile (str local-cache (- zoom 1) "/" (/ x 2) "/" (/ y 2) ".png")
        draft-marker (str outfile "_draft")
        core-tiles (for [cx (range (- x 0) (+ x 2)) cy (range (- y 0) (+ y 2))] [zoom cx cy])
        in-tiles (for [cx (range (- x 1) (+ x 3)) cy (range (- y 1) (+ y 3))] [zoom cx cy])]
    (println (str "downsample: " zoom "," x "," y " to " outfile))

    ; if even x,y and no final outfile and all 4 core pieces are there...
    (if (or (odd? x) (odd? y))
      (throw (Exception. (str "Cannot down-sample tile with odd index (" x "," y ")"))))
    (if-not (every? (partial apply tile-exists?) core-tiles)
      (throw (Exception. (str "Cannot down-sample - missing tiles in " (pr-str core-tiles)))))

    (.setColor g Color/lightGray)
    (.fillRect g 0 0 1024 1024)
    (doseq [xs (range 4)]
      (let [cx (+ x xs -1)]
        (doseq [ys (range 4)]
          (let [cy (+ y ys -1)
                infile  (str local-cache zoom "/" cx "/" cy ".png")]
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
    ; (println (str "Writing: " outfile))
    (jio/make-parents outfile)
    (write-file qim outfile)
    ; note if this is the 'final version'
    (if-not (every? (partial apply tile-exists?) in-tiles)
      (write-empty-file draft-marker))
    true
))

; resize a file like ../18/0/0.png to ../19/[01]/[01].png
(defn up-sample [zoom x y]
  (let [im (BufferedImage. 512 512 BufferedImage/TYPE_INT_RGB)
        g  (.createGraphics im)
        him (BufferedImage. 256 256 BufferedImage/TYPE_INT_RGB)
        hg (.createGraphics him)
        infile (str local-cache zoom "/" x "/" y ".png")
        nzoom (inc zoom)
        out-tiles [ [nzoom      (* x 2)       (* y 2)]
                    [nzoom      (* x 2)  (inc (* y 2))]
                    [nzoom (inc (* x 2))      (* y 2)]
                    [nzoom (inc (* x 2)) (inc (* y 2))]] ] 
    (if (not (every? (partial apply tile-exists?) out-tiles))
      (do

        (println (str "Upsampling: " zoom "," x "," y))
        (.setRenderingHint hg RenderingHints/KEY_INTERPOLATION
                           RenderingHints/VALUE_INTERPOLATION_NEAREST_NEIGHBOR)
        ; (println (str "reading " infile))
        (.drawImage g (ImageIO/read (File. infile))
          0 0 512 512 nil)

        ; make two images at zoom+1, x*2
        (jio/make-parents (str local-cache nzoom "/" (* x 2) "/out.png"))
        (.drawImage hg im 0 0 256 256 0 0 256 256 nil)
        (write-file him (str local-cache nzoom "/" (* x 2) "/" (* y 2) ".png"))
        (.drawImage hg im 0 0 256 256 0 256 256 512 nil)
        (write-file him (str local-cache nzoom "/" (* x 2) "/" (inc (* y 2)) ".png"))

        ; make two images at zoom+1, x*2+1
        (jio/make-parents (str local-cache nzoom "/" (inc (* x 2)) "/out.png"))
        (.drawImage hg im 0 0 256 256 256 0 512 256 nil)
        (write-file him (str local-cache nzoom "/" (inc (* x 2)) "/" (* y 2) ".png"))
        (.drawImage hg im 0 0 256 256 256 256 512 512 nil)
        (write-file him (str local-cache nzoom "/" (inc (* x 2)) "/" (inc (* y 2)) ".png"))
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

(defn downsample-strip [depth xmin xmax ymin ymax]
  "grab all tiles in bounding box and try to grab bordering tiles too"
  (doall (for [x (range xmin xmax 2) y (range ymin ymax 2)]
    (down-sample depth x y))))

(defn upsample-strip [depth xmin xmax ymin ymax]
  "grab all tiles in bounding box and try to grab bordering tiles too"
  (doall (for [x (range xmin xmax) y (range ymin ymax)]
    (up-sample depth x y))))

