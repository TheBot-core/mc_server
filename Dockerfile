FROM debian

RUN apt update
RUN apt install -y nodejs npm

COPY . /app
COPY config.json /app/config.json

RUN npm install

WORKDIR /app

ENTRYPOINT [ "node", "." ]