'use strict';

describe('nrgiPaymentsSrvc', function () {
    var paymentServiceInstance, $httpBackend;

    beforeEach(module('app'));

    beforeEach(inject(function(nrgiPaymentsSrvc, _$httpBackend_) {
        $httpBackend = _$httpBackend_;
        paymentServiceInstance = new nrgiPaymentsSrvc();
    }));

    it('requests payment data for a given `paymentId`', function () {
        var paymentId = 1;
        $httpBackend.expectGET('/api/payments/' + paymentId).respond('');
        paymentServiceInstance.$get({_id: paymentId});
    });
    it('requests payment data list with a skip and limit var', function () {
        var limit = 10, skip = 1;
        $httpBackend.expectGET('/api/payments/' + limit + '/' + skip).respond('');
        paymentServiceInstance.$get({limit: limit, skip: skip});
    });
    it('requests payment update data for a given `paymentId`', function () {
        var paymentId = 1;
        $httpBackend.expectPUT('/api/payments/' + paymentId).respond('');
        paymentServiceInstance.$update({_id: paymentId});
    });

    afterEach(function() {
        $httpBackend.flush();
    });
});