'use strict';

describe('nrgiConcessionTablesSrvc', function () {
    var nrgiConcessionTablesServiceInstance, $httpBackend;

    beforeEach(module('app'));

    beforeEach(inject(function(nrgiConcessionTablesSrvc, _$httpBackend_) {
        $httpBackend = _$httpBackend_;
        nrgiConcessionTablesServiceInstance = new nrgiConcessionTablesSrvc();
    }));

    it('requests concession table data with a type and id', function () {
        var id = 1;
        var type = 'site';
        $httpBackend.expectGET('/api/concession_table/' + type + '/' + id).respond('');
        nrgiConcessionTablesServiceInstance.$get({_id: id, type: type});
    });

    afterEach(function() {
        $httpBackend.flush();
    });
});