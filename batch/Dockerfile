FROM node:16-slim

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --only=production

COPY . ./

ENV GOOGLE_APPLICATION_CREDENTIALS /usr/src/app/sa.json

CMD [ "node", "src/index.js" ]