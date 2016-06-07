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
        nrgiSourceTypesSrvc.get({_id: $routeParams.id}, function (success) {
            $scope.sourceType = success;
            if($scope.sourceType.source_type_display==true){
                $scope.sourceType.source_type_display = {status:true,name:'Display'};
            } else{
                $scope.sourceType.source_type_display = {status:false,name:'No Display'}
            }
        });
        $scope.authority =[
            {key:0,name:'authoritative'},
            {key:1,name:'non-authoritative'},
            {key:2,name:'disclosure'}
        ]
        $scope.type_display =[
            {status:true,name:'Display'},
            {status:false,name:'No Display'}
        ]
        $scope.sourceUpdate = function() {
            $scope.sourceType.source_type_display = $scope.sourceType.source_type_display.status;
            nrgiSourceTypesMethodSrvc.updateSourceType($scope.sourceType).then(function() {
                nrgiNotifier.notify('Source Type has been updated');
                $location.path('/admin/sourceType-admin');
            }, function(reason) {
                nrgiNotifier.error(reason);
            });
        };

        $scope.sourceDelete = function() {
            var source_deletion = $scope.sourceType._id;
            nrgiSourceTypesMethodSrvc.deleteSourceType(source_deletion).then(function() {
                nrgiNotifier.notify('Source Type has been deleted');
                $location.path('/admin/sourceType-admin');
            }, function(reason) {
                nrgiNotifier.error(reason);
            });
        };
    });