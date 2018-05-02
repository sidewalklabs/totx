FROM node:9.8.0 as builder

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install dependencies (but not devDependencies)
# So long as no dependencies have changed, this step will be cached.
COPY package.json /usr/src/app/package.json
COPY yarn.lock /usr/src/app/yarn.lock

COPY . /usr/src/app

RUN yarn install --production

# Tell node and webpack that this is a production setting.
# This will enable caching and produce minified JS.
ENV NODE_ENV production

RUN yarn webpack
RUN ./scripts/compress-all.sh

EXPOSE 1337

CMD ["yarn", "serve", "--router-url", "http://localhost:8080" ]
