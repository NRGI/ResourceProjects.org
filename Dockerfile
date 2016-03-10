FROM	centos:centos6
MAINTAINER Chris Perry, byndcivilization@gmail.com

# Enable EPEL for Node.js
RUN		rpm -Uvh http://download.fedoraproject.org/pub/epel/6/i386/epel-release-6-8.noarch.rpm
#RUN     curl --silent --location https://rpm.nodesource.com/setup | bash -

# Install Node.js, npm, git and bower
RUN		yum install -y nodejs git npm
RUN		npm install -g bower
RUN     node -v

# Build src
ADD     package.json /tmp/package.json
RUN     cd /tmp && npm install --production
RUN     mkdir -p /src && cp -a /tmp/node_modules /src
RUN		rm -R /tmp/node_modules
COPY	. /src
RUN		cd /src && bower install --allow-root


EXPOSE  80

CMD     ["node", "/src/server.js"]