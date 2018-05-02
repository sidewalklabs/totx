# ttx
The Toronto Transit Explorer app visualizes transit, biking and walking accessibility across the city of Toronto.

## Setup
1. Make sure you have Java 8 installed:
`java -version`
1. If not, install Java 8:
`brew tap caskroom/versions && brew cask install java8`

## Start the backend (see sidewalklabs/model-r5 repo)
```
cp ttx_transit_data/toronto/* transit_data/toronto/
mvn package
java -Xmx8g -classpath ./target/r5build.jar com.conveyal.r5.R5Main point --build ./transit_data/toronto one-to-many toronto-das.locations.txt
java -Xmx8g -classpath ./target/r5build.jar com.conveyal.r5.R5Main point --graphs ./transit_data/toronto one-to-many toronto-das.locations.txt
```

## Start the frontend
1. `yarn develop -- transit --router-url http://localhost:8080`
1. Go to http://localhost:1337 in your browser.


## Updating the deployment
The name of the docker image is transit-ttx; the name of the app is ttx.

## 1. Configuring GKE
`gcloud container clusters get-credentials staging --project nyc-tlc-1225 --zone us-east1-b`

## 2. Building the image
Find the most recent tag number.
`docker image list us.gcr.io/nyc-tlc-1225/transit-ttx`

Build the image.
`docker build -t us.gcr.io/nyc-tlc-1225/transit-ttx:<new version number> .`

## 3. Uploading the image
`gcloud docker --project=nyc-tlc-1225 -- push us.gcr.io/nyc-tlc-1225/transit-ttx:<new version number>`

## 4. Updating the Kubernetes deployment
Edit `packages/transit/deploy/deployment-template.yaml` to update the image tag to that of the new image, e.g.
```
containers:
  - name: ttx
    image: us.gcr.io/nyc-tlc-1225/transit-ttx:<new version number>
```

Then run
`kubectl apply -f packages/transit/deploy/deployment-template.yaml`

## 5. Check it's working:
`kubectl get pods`
You should see the new timestamp for the deployment you just updated.

