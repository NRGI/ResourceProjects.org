angular.module('app')
    .factory('nrgiSitesMethodSrvc', function(
        $q,
        nrgiSitesSrvc
    ) {
        return {
            createSite: function(new_site_data) {
                var new_site = new nrgiSitesSrvc(new_site_data);
                var dfd = $q.defer();

                new_site.$save().then(function() {
                    dfd.resolve();
                }, function(response) {
                    dfd.reject(response.data.reason);
                });
                return dfd.promise;
            },
            updateSite: function(new_site_data) {
                var dfd = $q.defer();
                new_site_data.$update().then(function() {
                    dfd.resolve();
                }, function(response) {
                    dfd.reject(response.data.reason);
                });
                return dfd.promise;
            },
            deleteSite: function(site_deletion) {
                var dfd = $q.defer();
                var delete_ID = new nrgiSitesSrvc();
                delete_ID.id = site_deletion;

                delete_ID.$delete().then(function() {
                    dfd.resolve();
                }, function(response) {
                    dfd.reject(response.data.reason);
                });
                return dfd.promise;
            }
        }
    });