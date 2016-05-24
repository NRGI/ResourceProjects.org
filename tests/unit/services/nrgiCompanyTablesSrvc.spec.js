'use strict';

describe('nrgiCompanyTablesSrvc', function () {
    var nrgiCompanyTablesServiceInstance, $httpBackend;

    beforeEach(module('app'));

    beforeEach(inject(function(nrgiTablesSrvc, _$httpBackend_) {
        $httpBackend = _$httpBackend_;
        nrgiCompanyTablesServiceInstance = new nrgiTablesSrvc();
    }));

    it('requests company table data with a type and id', function () {
        var id = 1;
        var type = 'project';
        $httpBackend.expectGET('/api/company_table/' + type + '/' + id).respond('');
        nrgiCompanyTablesServiceInstance.$get({_id: id, type: type});
    });

    afterEach(function() {
        $httpBackend.flush();
    });
});