'use strict';

describe('nrgiContractTablesSrvc', function () {
    var nrgiContractTablesServiceInstance, $httpBackend;

    beforeEach(module('app'));

    beforeEach(inject(function(nrgiContractTablesSrvc, _$httpBackend_) {
        $httpBackend = _$httpBackend_;
        nrgiContractTablesServiceInstance = new nrgiContractTablesSrvc();
    }));

    it('requests contract table data with a type and id', function () {
        var id = 1;
        var type = 'country';
        $httpBackend.expectGET('/api/contract_table/' + type + '/' + id).respond('');
        nrgiContractTablesServiceInstance.$get({_id: id, type: type});
    });

    afterEach(function() {
        $httpBackend.flush();
    });
});