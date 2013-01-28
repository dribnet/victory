(defproject victory "0.0.1-SNAPSHOT"
  :description "victory: experimental thinger"
  :dependencies [[org.clojure/clojure "1.4.0"]
                 [net.drib/strokes "0.2.0"]]
  :min-lein-version "2.0.0"
  :source-paths ["src/clj" "src/cljs"]

  :plugins [[lein-cljsbuild "0.2.10"]]

  :cljsbuild {
    :builds [{
      :source-path "src/cljs"
      :compiler {
        :output-to "public/out/victory.js"
        :optimizations :whitespace
        :pretty-print true 
        ; :optimizations :simple
        }}]})
