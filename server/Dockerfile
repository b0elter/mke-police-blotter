FROM node:8.2.1

COPY /assets /
WORKDIR /opt/mke-pd-blt

RUN npm install

EXPOSE 3000

ENTRYPOINT ["node"]
CMD ["/opt/mke-pd-blt/server.js"]
