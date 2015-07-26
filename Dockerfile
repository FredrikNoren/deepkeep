FROM node:0.12-onbuild

COPY . /app

WORKDIR /app

RUN npm install

EXPOSE 8095

CMD ["node", "index.js"]
