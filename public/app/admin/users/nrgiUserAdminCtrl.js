angular.module('app').controller('nrgiUserAdminCtrl', function($scope, nrgiUserSrvc) {
  	$scope.users = nrgiUserSrvc.query();

	$scope.sort_options = 	[
		{value: "first_name", text: "Sort by First Name"},
		{value: "last_name", text: "Sort by Last Name"},
		{value: "username", text: "Sort by Username"},
		{value: "roles[0]", text: "Sort by Role"}
	];
	$scope.sort_order = $scope.sort_options[1].value;
});