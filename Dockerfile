FROM node:0.12-onbuild

ADD package.json /app/package.json
WORKDIR /app
RUN npm install

ADD . /app

EXPOSE 8095

CMD ["node", "index.js"]
