FROM node:0.12-onbuild

COPY . /app

RUN cd /app; npm install

EXPOSE 8095

CMD ["node", "/app/index.js"]
