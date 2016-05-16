'use strict';

describe('nrgiCountryCoordinatesSrvc', function () {
    var countryCoordinateServiceInstance, $httpBackend;

    beforeEach(module('app'));

    beforeEach(inject(function(nrgiCountryCoordinatesSrvc, _$httpBackend_) {
        $httpBackend = _$httpBackend_;
        countryCoordinateServiceInstance = new nrgiCountryCoordinatesSrvc();
    }));

    it('requests country coordinates for a given `countryId`', function () {
        var companyId = 1;
        var type = 'project';
        $httpBackend.expectGET('/api/coordinate/' + type + '/' + companyId).respond('');
        countryCoordinateServiceInstance.$get({_id: companyId, type: type});
    });

    afterEach(function() {
        $httpBackend.flush();
    });
});