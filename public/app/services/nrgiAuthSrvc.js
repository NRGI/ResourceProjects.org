angular.module('app').factory('nrgiAuthSrvc', function(
	$http,
	$q,
	nrgiIdentitySrvc,
	nrgiUserSrvc
	) {
		return {
			// AUTHENTICATION AND AUTHORIZATION
			//authentication
			authenticateUser: function(username, password) {
				var dfd = $q.defer();
				$http.post('/login', {username:username, password:password}).then(function(response) {
					if(response.data.success) {
						var user = new nrgiUserSrvc();
						angular.extend(user, response.data.user);
						nrgiIdentitySrvc.currentUser = user;
						dfd.resolve(true);
					} else {
						dfd.resolve(false);
					}
				});
				return dfd.promise;
			},
			//logout
			logoutUser: function() {
				var dfd = $q.defer();
				$http.post('/logout', {logout:true}).then(function() {
					nrgiIdentitySrvc.currentUser = undefined;
					dfd.resolve();
				});
				return dfd.promise;
			},
			//authorize for specific route based on role
			authorizeCurrentUserForRoute: function(role) {
				if(nrgiIdentitySrvc.isAuthorized(role)) {
					return true;
				} else {
					return $q.reject('not authorized');
				}
			},
			//limit route to authenticated users
			authorizeAuthenticatedUserForRoute: function() {
				if(nrgiIdentitySrvc.isAuthenticated()) {
					return true;
				} else {
					return $q.reject('not authorized');
				}
			}
		}	
	});