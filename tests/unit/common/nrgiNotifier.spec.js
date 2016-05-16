'use strict';

describe('nrgiNotifier', function () {
    beforeEach(module('app'));
    var nrgiNotifier, nrgiToastr, nrgiToastrMock;
    var message = 'MESSAGE';

    beforeEach(inject(function (_nrgiNotifier_, _nrgiToastr_) {
        nrgiToastr = _nrgiToastr_;
        nrgiNotifier = _nrgiNotifier_;
        nrgiToastrMock = sinon.mock(nrgiToastr);
    }));

    describe('#notify', function () {
        it('calls nrgiNotifier.notify', function () {
            nrgiToastrMock.expects('success').withArgs(message);
            nrgiNotifier.notify(message);
        });
    });

    describe('#error', function () {
        it('calls nrgiNotifier.error', function () {
            nrgiToastrMock.expects('error').withArgs(message);
            nrgiNotifier.error(message);
        });
    });

    afterEach(function () {
        nrgiToastrMock.verify();
        nrgiToastrMock.restore();
    });

});