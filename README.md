ResourceProjects
===================
[![Run Status](https://api.shippable.com/projects/57193cf42a8192902e1d7e88/badge?branch=master)](https://app.shippable.com/projects/55159b755ab6cc1352ad63c5)
[![Coverage Badge](https://api.shippable.com/projects/57193cf42a8192902e1d7e88/coverageBadge?branch=master)](https://app.shippable.com/projects/55159b755ab6cc1352ad63c5)

##Summary
***
SUMMARY CONTENT


##Installation
***
***Method 1:*** Open terminal and run the following commands (requires (node 4)[install node 4] and a running local mongo instance):

		git clone https://github.com/NRGI/ResourceProjects.org
		cd ResourceProjects.org
		npm install -g bower
		npm install
		bower install
		node server.js


***Method 2:***  Install docker. From commande line run:

		docker pull nrgi/resourceprojects.org
		docker run -d -p 80:80 -e DB_ID="<db user name>" -e DB_KEY="<db pass>" -e NODE_ENV="<environment>" nrgi/resourceprojects.org:master

##Tests

###Unit Tests
####Run
```
$ npm test
```

##TODO
***
-	validation is for admin - make its own page
-	submit always goes to admin
-	email passwords and submit
-	file uplaoad

