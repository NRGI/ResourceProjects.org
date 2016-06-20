angular.module('app')
    .controller('nrgiAboutPageUpdateCtrl', function(
        $scope,
        $routeParams,
        $location,
        nrgiNotifier,
        nrgiAboutPageContentSrvc,
        nrgiContentMethodSrvc
    ) {
        nrgiAboutPageContentSrvc.get(function (success) {
            $scope.content = success;
        }, function(error) {     });
        $scope.aboutPageUpdate = function (content) {
            nrgiContentMethodSrvc.updateContentPage(content).then(function() {
                nrgiNotifier.notify('About page has been updated');
                //$location.path('/about');
            }, function(reason) {
                nrgiNotifier.error(reason);
            });
        }
    });
