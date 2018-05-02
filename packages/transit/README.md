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
- After deploying, flush the Google CDN cache. You can do this via the GCP Console's [Networking → Cloud CDN][3] page. Just invalidate `/*`.

[2]: https://medium.com/sidewalk-talk/new-map-demo-how-the-l-train-shutdown-will-impact-your-commute-6a1dc74f65f5#.wgwen6ixg
[3]: https://console.cloud.google.com/networking/cdn/details/k8s-um-default-transit--prod?project=nyc-tlc-1225&duration=PT1H
