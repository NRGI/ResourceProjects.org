'use strict';

describe('nrgiGroupDataSrvc', function () {
    var companyGroupDataServiceInstance, $httpBackend;

    beforeEach(module('app'));

    beforeEach(inject(function(nrgiGroupDataSrvc, _$httpBackend_) {
        $httpBackend = _$httpBackend_;
        companyGroupDataServiceInstance = new nrgiGroupDataSrvc();
    }));

    it('requests company data for a given `companyId`', function () {
        var companyGroupId = 1;
        $httpBackend.expectGET('/api/companyGroupData/' + companyGroupId).respond('');
        companyGroupDataServiceInstance.$get({_id: companyGroupId});
    });

    afterEach(function() {
        $httpBackend.flush();
    });
});