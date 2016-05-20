'use strict';

describe('nrgiCompanyDataSrvc', function () {
    var companyDataServiceInstance, $httpBackend;

    beforeEach(module('app'));

    beforeEach(inject(function(nrgiCompanyDataSrvc, _$httpBackend_) {
        $httpBackend = _$httpBackend_;
        companyDataServiceInstance = new nrgiCompanyDataSrvc();
    }));

    it('requests company data for a given `companyId`', function () {
        var companyId = 1;
        $httpBackend.expectGET('/api/companydata/' + companyId).respond('');
        companyDataServiceInstance.$get({_id: companyId});
    });

    afterEach(function() {
        $httpBackend.flush();
    });
});