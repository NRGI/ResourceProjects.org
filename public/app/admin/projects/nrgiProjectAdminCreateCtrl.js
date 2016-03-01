angular.module('app')
    .controller('nrgiProjectAdminCreateCtrl', function(
        $scope,
        $location,
        nrgiNotifier,
        nrgiIdentitySrvc,
        nrgiProjectsSrvc,
        nrgiProjectsMethodSrvc,
        nrgiCountriesSrvc,
        nrgiCommoditiesSrvc,$sce
    ) {
        $scope.project=[];
        $scope.country = nrgiCountriesSrvc.query({skip: 0, limit: 0});
        $scope.commodity = nrgiCommoditiesSrvc.query({skip: 0, limit: 0});
        $scope.projectCreate = function() {
            console.log($scope.project);
            nrgiProjectsMethodSrvc.createProject($scope.project).then(function() {
                nrgiNotifier.notify('Project created!');
            }, function(reason) {
                nrgiNotifier.error(reason);
            })
        };
    });