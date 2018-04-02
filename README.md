# ttx
The Toronto Transit Explorer app visualizes transit, biking and walking accessibility across the city of Toronto.

## Setup
1. Make sure you have Java 8 installed:
`java -version`
1. If not, install Java 8:
`brew tap caskroom/versions && brew cask install java8`

## Start the backend (see sidewalklabs/model-r5 repo)
1. Copy transit and street data from ttx_transit_data/toronto to transit_data/toronto:
`cp ttx_transit_data/toronto/* transit_data/toronto/`
1. `mvn package`
1. `java -Xmx8g -classpath ./target/r5build.jar com.conveyal.r5.R5Main point --build ./transit_data/toronto`
1. `java -Xmx8g -classpath ./target/r5build.jar com.conveyal.r5.R5Main point --graphs ./transit_data/toronto one-to-many toronto-das.locations.txt`

## Start the frontend
1. `yarn develop -- transit --router-url http://localhost:8080`
1. Go to http://localhost:1337 in your browser.
