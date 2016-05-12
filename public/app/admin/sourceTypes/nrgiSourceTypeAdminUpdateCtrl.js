angular.module('app')
    .controller('nrgiSourceTypeAdminUpdateCtrl', function(
        $scope,
        $routeParams,
        $location,
        nrgiNotifier,
        nrgiProjectsSrvc,
        nrgiSourceTypesMethodSrvc,
        nrgiSourceTypesSrvc

    ) {
        $scope.sourceType = [];
        $scope.sourceType = nrgiSourceTypesSrvc.get({_id:$routeParams.id});
        $scope.authority =[
            {key:0,name:'authoritative'},
            {key:1,name:'disclosure'},
            {key:2,name:'authoritative'}
        ]
        $scope.type_display =[
            {status:true,name:'Display'},
            {status:false,name:'No Display'}
        ]
        $scope.sourceUpdate = function() {
            nrgiSourceTypesMethodSrvc.updateSourceType($scope.sourceType).then(function() {
                nrgiNotifier.notify('Source has been updated');
                $location.path('/admin/sourceType-admin');
            }, function(reason) {
                nrgiNotifier.error(reason);
            });
        };

        $scope.sourceDelete = function() {
            var source_deletion = $scope.sourceType._id;
            nrgiSourceTypesMethodSrvc.deleteSourceType(source_deletion).then(function() {
                nrgiNotifier.notify('Source has been deleted');
                $location.path('/admin/sourceType-admin');
            }, function(reason) {
                nrgiNotifier.error(reason);
            });
        };
    });