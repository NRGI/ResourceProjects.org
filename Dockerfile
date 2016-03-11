FROM	centos:centos7
MAINTAINER Chris Perry, byndcivilization@gmail.com

# Enable EPEL for Node.js
RUN     rpm -Uvh https://rpm.nodesource.com/pub_4.x/el/7/x86_64/nodesource-release-el7-1.noarch.rpm

# Install Node.js, npm, git and bower
RUN     yum update -y
RUN     yum install -y nodejs \
                        npm \
                        git
RUN		npm install -g bower

# Build src
ADD     package.json /tmp/package.json
RUN     cd /tmp && npm install --production
RUN     mkdir -p /src && cp -a /tmp/node_modules /src
RUN		rm -R /tmp/node_modules
COPY	. /src
RUN		cd /src && bower install --allow-root

RUN     node -v

EXPOSE  80

#CMD     ["node", "/src/server.js"]
CMD     ["/src/node_modules/forever/bin/forever","/src/server.js"]