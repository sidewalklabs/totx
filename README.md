# TOTX
The Toronto Transit Explorer app visualizes transit, biking and walking accessibility across the city of Toronto.

[Screen recording][youtube] (YouTube):

[![Screen recording of the Toronto Transit Explorer](https://img.youtube.com/vi/VveSoRjVW8I/0.jpg)][youtube]

## Setup (Instructions for Mac)
1. Install Homebrew (https://brew.sh/) if you don't have it.
1. Make sure you have Java 8 installed:
`java -version`
If not, install it:
`brew tap caskroom/versions && brew cask install java8`
1. Install yarn and Node (4<= version <=9). You can use [NVM](https://github.com/creationix/nvm) to manage your Node versions.
`brew install yarn`
`nvm install --lts`

## Start the router
The router is our fork of Conveyal's R5 transit router. This lives at [sidewalklabs/totx-r5](https://github.com/sidewalklabs/totx-r5/tree/totx-r5).

Clone the repo and check out the `totx-r5` branch.
```
git clone https://github.com/sidewalklabs/totx-r5.git
git checkout totx-r5
```
Then run:
```
mvn package
java -Xmx8g -classpath ./target/r5build.jar com.conveyal.r5.R5Main point --build ./totx_transit_data one-to-many toronto-das.locations.txt
java -Xmx8g -classpath ./target/r5build.jar com.conveyal.r5.R5Main point --graphs ./totx_transit_data one-to-many toronto-das.locations.txt
```
You should see something like:
```
9200 [Thread-1] INFO org.eclipse.jetty.server.Server - Started @9326ms
```
Congrats! Your router is up!

## Start the frontend
1. `yarn`
This will install all required dependencies.
1. `yarn develop -- transit --router-url http://localhost:8080`
1. Go to http://localhost:1337 in your browser.

Congrats! You're running your very own TOTX.

[youtube]: https://www.youtube.com/watch?v=VveSoRjVW8I
