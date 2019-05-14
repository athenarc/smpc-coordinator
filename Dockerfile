FROM node:10-stretch

RUN apt-get update && apt-get upgrade -y

RUN apt-get install -y \
  gnupg2 \
  python \
  curl \
  wget \
  apt-transport-https \
  zip \
  unzip \
  curl \
  vim

RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN apt-get update && apt-get install yarn -y

COPY . /smpc-coordinator

WORKDIR /smpc-coordinator

RUN mkdir -p certs

RUN ./install.sh

CMD ["node", "server.js"]
