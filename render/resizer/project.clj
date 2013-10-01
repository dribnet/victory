(defproject resizer "0.1.0-SNAPSHOT"
  :description "FIXME: write description"
  :url "http://example.com/FIXME"
  :license {:name "Eclipse Public License"
            :url "http://www.eclipse.org/legal/epl-v10.html"}
  :dependencies [[org.clojure/clojure "1.5.1"]
  				 [clj-aws-s3 "0.3.7"]
           [environ "0.4.0"]
           [com.cemerick/bandalore "0.0.3"]
           [org.clojure/tools.reader "0.7.8"]
           [net.drib/defmain "0.1.0"]
           [kestrel-client/kestrel-client "0.1.0"]
  				 ; [zookeeper-clj "0.9.1"]
           ]
  :aot [resizer.fetcher resizer.imageops resizer.core]
  :main resizer.finder)
