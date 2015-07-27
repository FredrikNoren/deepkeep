FROM node:0.12-onbuild

EXPOSE 8095

RUN node build.js
