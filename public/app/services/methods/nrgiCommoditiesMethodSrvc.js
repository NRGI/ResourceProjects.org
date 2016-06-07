angular.module('app')
    .factory('nrgiCommoditiesMethodSrvc', function(
        $q,
        nrgiCommoditiesSrvc
    ) {
        return {
            createCommodity: function(new_commodity_data) {
                var new_commodity = new nrgiCommoditiesSrvc(new_commodity_data);
                var dfd = $q.defer();

                new_commodity.$save().then(function() {
                    dfd.resolve();
                }, function(response) {
                    dfd.reject(response.data.reason);
                });
                return dfd.promise;
            },
            updateCommodity: function(new_commodity_data) {
                var dfd = $q.defer();
                new_commodity_data.$update().then(function() {
                    dfd.resolve();
                }, function(response) {
                    dfd.reject(response.data.reason);
                });
                return dfd.promise;
            },
            deleteCommodity: function(commodity_deletion) {
                var dfd = $q.defer();
                var delete_ID = new nrgiCommoditiesSrvc();
                delete_ID.id = commodity_deletion;

                delete_ID.$delete().then(function() {
                    dfd.resolve();
                }, function(response) {
                    dfd.reject(response.data.reason);
                });
                return dfd.promise;
            }
        }
    });