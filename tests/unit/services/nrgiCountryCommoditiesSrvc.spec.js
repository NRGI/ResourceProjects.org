'use strict';

describe('nrgiCountryCommoditiesSrvc', function () {
    var countryCommodityServiceInstance, $httpBackend;

    beforeEach(module('app'));

    beforeEach(inject(function(nrgiCountryCommoditiesSrvc, _$httpBackend_) {
        $httpBackend = _$httpBackend_;
        countryCommodityServiceInstance = new nrgiCountryCommoditiesSrvc();
    }));
    console.error('COUNTRY COMMODITY SERVICE: NO TEST')

    // it('requests country data for a given `countryId`', function () {
    //     var countryId = 1;
    //     $httpBackend.expectGET('/api/countrycommodity/' + countryId).respond('');
    //     countryCommodityServiceInstance.$get({_id: countryId});
    // });

    afterEach(function() {
        $httpBackend.flush();
    });
});