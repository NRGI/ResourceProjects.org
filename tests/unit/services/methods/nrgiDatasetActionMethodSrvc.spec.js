'use strict';

describe('nrgiDatasetActionMethodSrvc', function () {
    beforeEach(module('app'));

    var nrgiDatasetActionMethodSrvc;
    var $q, nrgiDatasetActionSrvc;
    var $qDeferStub, $qDeferSpy, expectedPromise;

    beforeEach(inject(function (_nrgiDatasetActionMethodSrvc_, _$q_, _nrgiDatasetActionSrvc_) {
        $q = _$q_;
        nrgiDatasetActionSrvc = _nrgiDatasetActionSrvc_;
        nrgiDatasetActionMethodSrvc = _nrgiDatasetActionMethodSrvc_;
    }));

    describe('#createAction', function () {
        var nrgiDatasetActionSrvcStub;

        it('resolves the deferred in positive case', function () {
            expectedPromise = 'POSITIVE';

            nrgiDatasetActionSrvcStub = sinon.stub(nrgiDatasetActionSrvc.prototype, '$save', function() {
                return {
                    then: function(callback) {
                        callback();
                    }
                };
            });

            $qDeferSpy = sinon.spy();
            $qDeferStub = sinon.stub($q, 'defer', function() {
                return {
                    resolve: $qDeferSpy,
                    promise: expectedPromise
                };
            });

            nrgiDatasetActionMethodSrvc.createAction([expectedPromise]).should.be.equal(expectedPromise);
            $qDeferSpy.called.should.be.equal(true);
        });

        it('resolves the deferred in positive case', function () {
            expectedPromise = 'NEGATIVE';
            var REJECT_RESPONSE = {
                data: {reason: 'REJECT_INSERTION'}
            };

            nrgiDatasetActionSrvcStub = sinon.stub(nrgiDatasetActionSrvc.prototype, '$save', function() {
                return {
                    then: function(callbackPositive, callbackNegative) {
                        callbackNegative(REJECT_RESPONSE);
                    }
                };
            });

            $qDeferSpy = sinon.spy();
            $qDeferStub = sinon.stub($q, 'defer', function() {
                return {
                    reject: $qDeferSpy,
                    promise: expectedPromise
                };
            });

            nrgiDatasetActionMethodSrvc.createAction([expectedPromise]).should.be.equal(expectedPromise);
            $qDeferSpy.should.have.been.calledWith(REJECT_RESPONSE.data.reason);
        });

        afterEach(function () {
            nrgiDatasetActionSrvcStub.restore();
        });
    });


    afterEach(function () {
        $qDeferStub.restore();
    });
});