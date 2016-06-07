'use strict';

describe('nrgiCompaniesSrvc', function () {
    var companyServiceInstance, $httpBackend;

    beforeEach(module('app'));

    beforeEach(inject(function(nrgiCompaniesSrvc, _$httpBackend_) {
        $httpBackend = _$httpBackend_;
        companyServiceInstance = new nrgiCompaniesSrvc();
    }));

    it('requests company data for a given `companyId`', function () {
        var companyId = 1;
        $httpBackend.expectGET('/api/companies/' + companyId).respond('');
        companyServiceInstance.$get({_id: companyId});
    });
    it('requests company data list with a skip and limit var', function () {
        var limit = 10, skip = 1;
        $httpBackend.expectGET('/api/companies/' + limit + '/' + skip).respond('');
        companyServiceInstance.$get({limit: limit, skip: skip});
    });
    it('requests company update data for a given `companyId`', function () {
        var companyId = 1;
        $httpBackend.expectPUT('/api/companies/' + companyId).respond('');
        companyServiceInstance.$update({_id: companyId});
    });
    //console.info('COMPANY SERVICE: UPDATE MISSING')

    afterEach(function() {
        $httpBackend.flush();
    });
});