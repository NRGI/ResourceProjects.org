angular.module('app')
    .controller('nrgiProjectAdminUpdateCtrl', function(
        $scope,
        $routeParams,
        $location,
        nrgiNotifier,
        nrgiProjectsSrvc,
        nrgiProjectsMethodSrvc,
        nrgiCountriesSrvc,
        nrgiCommoditiesSrvc
    ) {
        $scope.project = nrgiProjectsSrvc.get({_id:$routeParams.id});

        $scope.country = nrgiCountriesSrvc.query({skip: 0, limit: 0});
        $scope.commodity = nrgiCommoditiesSrvc.query({skip: 0, limit: 0});
        $scope.projectUpdate = function() {
            console.log($scope.project);
            nrgiProjectsMethodSrvc.updateProject($scope.project).then(function() {
                nrgiNotifier.notify('Project has been updated');
            }, function(reason) {
                nrgiNotifier.error(reason);
            });
        };

        $scope.projectDelete = function() {
            var project_deletion = $scope.project._id;
            nrgiProjectsMethodSrvc.deleteProject(project_deletion).then(function() {
                nrgiNotifier.notify('Project has been deleted');
            }, function(reason) {
                nrgiNotifier.error(reason);
            });
        };
    });