# NYC Transit Explorer

This tool shows a visualization of travel times from one location to every other location in NYC:

<img src="https://cloud.githubusercontent.com/assets/98301/20543486/fe89c2e8-b0d3-11e6-844e-753f9afb7b74.png" alt="Transit Accessibility Map">

See our blog post, [New map demo: How the L train shutdown will impact your commute][2].

### Development

The transit visualization needs access to a transit router and (optionally) an instance of
OpenTripPlanner. The easiest way to get this is to set up a proxy to the instances running
in Google Container Engine (GKE):

    kube-setenv staging
    kubectl proxy &

Then point the transit server at them:

    yarn develop -- transit \
    --router-url http://localhost:8001/api/v1/proxy/namespaces/default/services/router:http \
    --otp-endpoint http://localhost:8001/api/v1/proxy/namespaces/default/services/opentripplanner:http/otp

#### Development using a local instance of the transit router

First, start the [router server][1]:

    git clone https://github.com/sidewalklabs/router-internal.git
    cd router-internal
    npm install
    # (download NYC GTFS feed)
    npm run start

This exposes a REST API on `localhost:4567` that the transit accessibility server uses.

Now start the transit server:

    yarn develop -- transit --router-url http://localhost:4567

Now you should be able to access the visualization at http://localhost:1337/.

### Deployment

The transit explorer runs at transit.sidewalklabs.com.

To update:

- Cut a GitHub release of sidewalklabs/router-internal (if necessary) and onemap.
- If you update anything relating to the router, you'll want to update the `caches.json` file as well. Here's how:
  - Run the router (with the full ensemble of GTFS feeds) locally. (See commands in *Development*, above)
  - Run transit locally (See `yarn develop` command, above).
  - Step through all the "scenarios" on the bottom to populate the cache.
  - Open the JS console and run `dumpCache()`. This will pop up a text box in the web app.
  - Copy the JSON in that text box into `caches.json`.
  - If the map shows blue census block groups when you load the page, that means you need to update the cache.
- To update the GTFS feeds, zip them up and put them in `gs://sidewalk-datasets/nyc-gtfs.zip`.
  - Save a copy of the old GTFS feeds in case you need to roll back.
  - Remember that we have a modified copy of `stops.txt` for the subway. It's been augmented with wheelchair accessibility information. Don't blow this away or we'll lose the ADA view!
  - Updating the GTFS feeds will require an update to `caches.json` (see above).
- After deploying, flush the Google CDN cache. You can do this via the GCP Console's [Networking → Cloud CDN][3] page. Just invalidate `/*`.

[1]: https://github.com/sidewalklabs/router-internal/
[2]: https://medium.com/sidewalk-talk/new-map-demo-how-the-l-train-shutdown-will-impact-your-commute-6a1dc74f65f5#.wgwen6ixg
[3]: https://console.cloud.google.com/networking/cdn/details/k8s-um-default-transit--prod?project=nyc-tlc-1225&duration=PT1H
