angular.module('app')
    .controller('nrgiLandingPageUpdateCtrl', function(
        $scope,
        $routeParams,
        $location,
        nrgiNotifier,
        nrgiLandingPageContentSrvc,
        nrgiContentMethodSrvc
    ) {
        nrgiLandingPageContentSrvc.get(function (success) {
            $scope.content = success;
        }, function(error) {     });
        $scope.landingPageUpdate = function (content) {
            nrgiContentMethodSrvc.updateContentPage(content).then(function() {
                nrgiNotifier.notify('Landing page has been updated');
                $location.path('/main');
            }, function(reason) {
                nrgiNotifier.error(reason);
            });
        }
    });
