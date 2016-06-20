angular.module('app')
    .controller('nrgiGlossaryPageUpdateCtrl', function(
        $scope,
        $routeParams,
        $location,
        nrgiNotifier,
        nrgiGlossaryPageContentSrvc,
        nrgiContentMethodSrvc
    ) {
        nrgiGlossaryPageContentSrvc.get(function (success) {
            $scope.content = success;
        }, function(error) {     });
        $scope.glossaryPageUpdate = function (content) {
            nrgiContentMethodSrvc.updateContentPage(content).then(function() {
                nrgiNotifier.notify('Glossary page has been updated');
                //$location.path('/about');
            }, function(reason) {
                nrgiNotifier.error(reason);
            });
        }
    });
