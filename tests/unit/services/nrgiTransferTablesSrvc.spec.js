'use strict';

describe('nrgiTransferTablesSrvc', function () {
    var nrgiTransferTablesServiceInstance, $httpBackend;

    beforeEach(module('app'));

    beforeEach(inject(function(nrgiTransferTablesSrvc, _$httpBackend_) {
        $httpBackend = _$httpBackend_;
        nrgiTransferTablesServiceInstance = new nrgiTransferTablesSrvc();
    }));

    it('requests transfer table data with a type and id', function () {
        var id = 1;
        var type = 'project';
        $httpBackend.expectGET('/api/transfer_table/' + type + '/' + id).respond('');
        nrgiTransferTablesServiceInstance.$get({_id: id, type: type});
    });

    afterEach(function() {
        $httpBackend.flush();
    });
});