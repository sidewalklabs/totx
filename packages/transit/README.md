# Toronto Transit Explorer

This tool shows a visualization of travel times from one location to every other location in Toronto.

To run it, you'll need to set up R5.
-> Insert instructions for R5

Visit http://localhost:8080/ to make sure it can visit plausible routes. You may need to set the date to
sometime in April (say April 18th) to generate routes.

Next you'll need to set up the visualization:

    cd ttx
    yarn
    yarn develop -- transit --router-url http://localhost:8080/

And then visit http://localhost:1337 to use the Toronto Transit Explorer!

-----

### Deployment

The transit explorer runs at transit.sidewalklabs.com.

To update:

- Cut a GitHub release of sidewalklabs/model-r5 (if necessary) and ttx.
- If you update anything relating to the router, you'll want to update the `caches.json` file as well. Here's how:
  - Run the router (with the full ensemble of GTFS feeds) locally. (See commands in *Development*, above)
  - Run transit locally (See `yarn develop` command, above).
  - Step through all the "scenarios" on the bottom to populate the cache.
  - Open the JS console and run `dumpCache()`. This will pop up a text box in the web app.
  - Copy the JSON in that text box into `caches.json`.
  - If the map shows blue census block groups when you load the page, that means you need to update the cache.
- To update the GTFS feeds, zip them up and put them in `gs://sidewalk-datasets/nyc-gtfs.zip`.
  - UPDATE THIS
  - Save a copy of the old GTFS feeds in case you need to roll back.
  - Remember that we have a modified copy of `stops.txt` for the subway. It's been augmented with wheelchair accessibility information. Don't blow this away or we'll lose the ADA view!
  - Updating the GTFS feeds will require an update to `caches.json` (see above).
- After deploying, flush the Google CDN cache. You can do this via the GCP Console's [Networking → Cloud CDN][3] page. Just invalidate `/*`.

[2]: https://medium.com/sidewalk-talk/new-map-demo-how-the-l-train-shutdown-will-impact-your-commute-6a1dc74f65f5#.wgwen6ixg
[3]: https://console.cloud.google.com/networking/cdn/details/k8s-um-default-transit--prod?project=nyc-tlc-1225&duration=PT1H
