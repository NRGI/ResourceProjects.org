'use strict';

angular.module('app')
    .controller('nrgiProjectDetailCtrl', function (
        $scope,
        $rootScope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        nrgiProjectsSrvc,
        $routeParams
    ) {
        nrgiProjectsSrvc.get({_id: $routeParams.id}, function (success) {
            var _ = $rootScope._;
            $scope.project = success;
            // console.log(success.proj_operated_by);
            _.each($scope.project.companies, function(company) {
                company.operator = false;
                _.each($scope.project.proj_company_share, function(company_share) {
                    if (company._id==company_share.company) {
                        company.stake = {share: company_share.number, timestamp: company_share.timestamp}
                    }
                });

                // _.each($scope.project.proj_operated_by, function(company_op) {
                //     if (company._id==company_op.company) {
                //         company.operator = true;
                //     }
                // })
            });
        });
    });





