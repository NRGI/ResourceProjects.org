angular.module('app')
    .factory('nrgiCommoditiesMethodSrvc', function(
        $q,
        nrgiCommoditiesSrvc
    ) {
        return {
            createSource: function(new_commodity_data) {
                var new_commodity = new nrgiCommoditiesSrvc(new_commodity_data);
                var dfd = $q.defer();

                new_commodity.$save().then(function() {
                    dfd.resolve();
                }, function(response) {
                    dfd.reject(response.data.reason);
                });
                return dfd.promise;
            },
            deleteSource: function(commodity_deletion) {
                var dfd = $q.defer();
                var delete_ID = new nrgiCommoditiesSrvc();
                delete_ID.id = commodity_deletion;

                delete_ID.$delete().then(function() {
                    dfd.resolve();
                }), function(response) {
                    dfd.reject(response.data.reason);
                };
                return dfd.promise;
            },
            updateSource: function(new_commodity_data) {
                var dfd = $q.defer();
                new_commodity_data.$update().then(function() {
                    dfd.resolve();
                }), function(response) {
                    dfd.reject(response.data.reason);
                };
                return dfd.promise;
            }
        }
    });