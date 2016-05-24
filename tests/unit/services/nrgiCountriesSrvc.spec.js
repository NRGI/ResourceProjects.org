'use strict';

describe('nrgiCountriesSrvc', function () {
    var countryServiceInstance, $httpBackend;

    beforeEach(module('app'));

    beforeEach(inject(function(nrgiCountriesSrvc, _$httpBackend_) {
        $httpBackend = _$httpBackend_;
        countryServiceInstance = new nrgiCountriesSrvc();
    }));

    it('requests country data for a given `countryId`', function () {
        var countryId = 1;
        $httpBackend.expectGET('/api/countries/' + countryId).respond('');
        countryServiceInstance.$get({_id: countryId});
    });
    it('requests country data list with a skip and limit var', function () {
        var limit = 10, skip = 1;
        $httpBackend.expectGET('/api/countries/' + limit + '/' + skip).respond('');
        countryServiceInstance.$get({limit: limit, skip: skip});
    });
    it('requests country update data for a given `countryId`', function () {
        var countryId = 1;
        $httpBackend.expectPUT('/api/countries/' + countryId).respond('');
        countryServiceInstance.$update({_id: countryId});
    });
    afterEach(function() {
        $httpBackend.flush();
    });
});