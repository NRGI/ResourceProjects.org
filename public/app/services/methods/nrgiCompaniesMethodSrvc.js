angular.module('app')
    .factory('nrgiCompaniesMethodSrvc', function(
        $q,
        nrgiCompaniesSrvc
    ) {
        return {
            createCompany: function(new_company_data) {
                var new_company = new nrgiCompaniesSrvc(new_company_data);
                var dfd = $q.defer();

                new_company.$save().then(function() {
                    dfd.resolve();
                }, function(response) {
                    dfd.reject(response.data.reason);
                });
                return dfd.promise;
            },
            deleteCompany: function(company_deletion) {
                var dfd = $q.defer();
                var delete_ID = new nrgiCompaniesSrvc();
                delete_ID.id = company_deletion;

                delete_ID.$delete().then(function() {
                    dfd.resolve();
                }), function(response) {
                    dfd.reject(response.data.reason);
                };
                return dfd.promise;
            },
            updateCompany: function(new_company_data) {
                var dfd = $q.defer();
                new_company_data.$update().then(function() {
                    dfd.resolve();
                }), function(response) {
                    dfd.reject(response.data.reason);
                };
                return dfd.promise;
            }
        }
    });