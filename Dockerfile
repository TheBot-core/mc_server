FROM debian

RUN apt update
RUN apt install -y nodejs npm

COPY . /app
COPY config.json /app/config.json

WORKDIR /app

RUN npm install

ENTRYPOINT [ "node", "." ]