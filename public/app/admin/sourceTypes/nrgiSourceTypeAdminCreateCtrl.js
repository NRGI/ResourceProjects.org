angular.module('app')
    .controller('nrgiSourceTypeAdminCreateCtrl', function(
        $scope,
        $location,
        nrgiNotifier,
        nrgiSourceTypesMethodSrvc
    ) {
        var user = [];
        $scope.sourceType =[];
        $scope.sourceType.source_type_display = {status:false, name:'No Display'};
        $scope.sourceType.source_type_authority = 'authoritative';
        $scope.type_display =[
            {status:false, name:'No Display'},
            {status:true, name:'Display'}
        ]
        $scope.authority =[
            {key:0,name:'authoritative'},
            {key:1,name:'non-authoritative'},
            {key:2,name:'disclosure'}
        ]
        $scope.sourceCreate = function() {
            $scope.sourceType.source_type_display = $scope.sourceType.source_type_display.status;
            $scope.sourceType.create_author = user._id;
            nrgiSourceTypesMethodSrvc.createSourceType($scope.sourceType).then(function() {
                nrgiNotifier.notify('Source Type created!');
                $location.path('/admin/sourceType-admin');
            }, function(reason) {
                nrgiNotifier.error(reason);
            })
        };
    });