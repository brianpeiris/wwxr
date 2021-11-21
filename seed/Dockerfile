FROM alpine:3.14
VOLUME /seed
WORKDIR /seed
RUN apk add python3-dev
RUN python3 -m ensurepip
RUN apk add git
RUN apk add g++
RUN apk add zlib-dev
RUN apk add lz4-dev
COPY requirements.txt .
COPY install-requirements.sh ./
RUN python3 -m venv /home/env
RUN sh install-requirements.sh
CMD sleep infinity
