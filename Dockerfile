FROM node:16-buster-slim

COPY . /app
COPY config.json /app/config.json

WORKDIR /app

RUN npm install

ENTRYPOINT [ "node", "." ]