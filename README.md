# wwxr

wwxr was an experiment in crawling the Web for WebXR and XR content. It used crawl data from [Common Crawl](https://commoncrawl.org/) and [Elastic Map Reduce](https://aws.amazon.com/emr/) via [cc-mrjob](https://github.com/commoncrawl/cc-mrjob), to scrape the web for `<a-frame>` and `<model-viewer>` scenes. 
Crawled data was ingested into a MongoDB instance, and made available via a simple nodejs search and browse interface.

wwxr was useful as an experiment, and showed that it was valuable to have central access to XR content from across the web, with a search index of keywords, but the Common Crawl data source was limited. Future projects ought to consider using a live on-going crawl of the Web, using something like [Nutch](https://nutch.apache.org/).

Ideally, WebXR content could also be published with meta data for easier crawling. See a discussion about this here: https://github.com/immersive-web/proposals/issues/73

The community also suggested crawling for [3D models via SERP, Structured Data](https://samuelschmitt.com/google-serp-3d-augmented-reality/), [used by Google](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data), the [:xr-overlay](https://www.w3.org/TR/webxr-dom-overlays-1/) CSS pseudo-class used by the WebXR spec, and [JanusVR tags](https://janusvr.com/docs/build/introtojml/index.html).

See this post for more info: [About wwxr](/site/blog/2021-12-27T04:43--About-wwxr.io-alpha.md)

The `seed/` directory in this repo contains a docker container and scripts for downloading and crawling Common Crawl data.

The repo also contains terraform modules for provisioning a base AWS instance, ops scripts for spinning up the nodejs/mongo site. Though there's nothing particularly special about this part of it.

https://user-images.githubusercontent.com/79419/190876780-35e6859e-fb83-4625-aa5c-207a8bc6b741.mp4
