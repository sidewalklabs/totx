# ttx
The Toronto Transit Explorer app visualizes transit, biking and walking accessibility across the city of Toronto.

NOTE: These instructions don't work yet; they will once I merge in the TO code for the FE and the model-r5 code to this repo.

## Setup
1. Make sure you have Java 8 installed:
`java -version`
2. If not, install Java 8:
`brew tap caskroom/versions && brew cask install java8`

## Start the backend
1. `mvn package`
5. `java -Xmx8g -classpath ./target/r5build.jar com.conveyal.r5.R5Main point --build ./transit_data/toronto`
6. `java -Xmx8g -classpath ./target/r5build.jar com.conveyal.r5.R5Main point --graphs ./transit_data/toronto`

## Start the frontend
1. `yarn develop -- transit --router-url http://localhost:8080`
2. Go to http://localhost:1337 in your browser.
