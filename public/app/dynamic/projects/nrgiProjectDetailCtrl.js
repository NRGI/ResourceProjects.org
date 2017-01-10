'use strict';

angular.module('app')
    .controller('nrgiProjectDetailCtrl', function (
        $scope,
        $rootScope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        nrgiProjectsSrvc,
        $sce,
        usSpinnerService,
        $routeParams,nrgiProjectDataSrvc
    ) {
        $scope.openClose=true;
        usSpinnerService.spin('spinner-filing');

        nrgiProjectsSrvc.get({_id: $routeParams.id}, function (success) {
            if(success.error) {
                $scope.error= success.error;
            }else{
                $scope.id =  success.project._id;
                $scope.url = "http://newaleph.openoil.net/clients/resourceprojects/?project_name="+ success.project.proj_name;
                $scope.project = success.project;
            }
        });
        $scope.$watch('id', function(value) {
            if(value!=undefined) {
                nrgiProjectDataSrvc.get({_id: $scope.id}, function (success) {
                    $scope.data = success;
                });
            }
        });
        $scope.trustSrc = function(src) {
            return $sce.trustAsResourceUrl(src);
        }
        $scope.iframeLoadedCallBack = function(){
            usSpinnerService.stop('spinner-filing');
            angular.element(document.getElementsByTagName('iframe')).addClass('iframedata')
        }
    });





