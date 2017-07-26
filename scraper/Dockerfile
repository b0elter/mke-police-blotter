FROM node:8.2.1

COPY /assets /
WORKDIR /opt/mke-pd-blt

RUN npm install

ENTRYPOINT ["/opt/mke-pd-blt/forever.sh"]
