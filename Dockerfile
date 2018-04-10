FROM node:9.8.0 as builder

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install dependencies (but not devDependencies)
# So long as no dependencies have changed, this step will be cached.
COPY package.json /usr/src/app/package.json
COPY yarn.lock /usr/src/app/yarn.lock

COPY . /usr/src/app

RUN yarn

EXPOSE 1337

ENTRYPOINT ["yarn", "develop", "--", "transit", "router-url", "http://localhost:8080" ]
