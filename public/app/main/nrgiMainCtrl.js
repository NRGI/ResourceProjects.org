angular.module('app').controller('nrgiMainCtrl', function($scope, nrgiAuthSrvc, nrgiIdentitySrvc) {
	// bring in current user data to customize front page
	if(nrgiIdentitySrvc=='') {
		$scope.fullName = nrgiIdentitySrvc.currentUser.firstName + " " + nrgiIdentitySrvc.currentUser.lastName;
		$scope.roles = nrgiIdentitySrvc.currentUser.roles;
	}
});