'use strict';

describe('nrgiDatasetMethodSrvc', function () {
    beforeEach(module('app'));

    var nrgiDatasetMethodSrvc;
    var $q, nrgiDatasetSrvc;
    var $qDeferStub, $qDeferSpy, expectedPromise;

    beforeEach(inject(function (_nrgiDatasetMethodSrvc_, _$q_, _nrgiDatasetSrvc_) {
        $q = _$q_;
        nrgiDatasetSrvc = _nrgiDatasetSrvc_;
        nrgiDatasetMethodSrvc = _nrgiDatasetMethodSrvc_;
    }));

    describe('#createDataset', function () {
        var nrgiDatasetSrvcStub;

        it('resolves the deferred in positive case', function () {
            expectedPromise = 'POSITIVE';

            nrgiDatasetSrvcStub = sinon.stub(nrgiDatasetSrvc.prototype, '$save', function () {
                return {
                    then: function (callback) {
                        callback();
                    }
                };
            });

            $qDeferSpy = sinon.spy();
            $qDeferStub = sinon.stub($q, 'defer', function () {
                return {
                    resolve: $qDeferSpy,
                    promise: expectedPromise
                };
            });

            nrgiDatasetMethodSrvc.createDataset([expectedPromise]).should.be.equal(expectedPromise);
            $qDeferSpy.called.should.be.equal(true);
        });

        it('resolves the deferred in positive case', function () {
            expectedPromise = 'NEGATIVE';
            var REJECT_RESPONSE = {
                data: {reason: 'REJECT_INSERTION'}
            };

            nrgiDatasetSrvcStub = sinon.stub(nrgiDatasetSrvc.prototype, '$save', function () {
                return {
                    then: function (callbackPositive, callbackNegative) {
                        callbackNegative(REJECT_RESPONSE);
                    }
                };
            });

            $qDeferSpy = sinon.spy();
            $qDeferStub = sinon.stub($q, 'defer', function () {
                return {
                    reject: $qDeferSpy,
                    promise: expectedPromise
                };
            });

            nrgiDatasetMethodSrvc.createDataset([expectedPromise]).should.be.equal(expectedPromise);
            $qDeferSpy.should.have.been.calledWith(REJECT_RESPONSE.data.reason);
        });

        afterEach(function () {
            nrgiDatasetSrvcStub.restore();
        });
    });

    describe('#updateDataset', function () {
        it('resolves the deferred in positive case', function () {
            expectedPromise = 'POSITIVE';

            $qDeferSpy = sinon.spy();
            $qDeferStub = sinon.stub($q, 'defer', function () {
                return {
                    resolve: $qDeferSpy,
                    promise: expectedPromise
                };
            });

            nrgiDatasetMethodSrvc.updateDataset({
                $update: function () {
                    return {
                        then: function (callbackPositive) {
                            callbackPositive();
                        }
                    };
                }
            }).should.be.equal(expectedPromise);

            $qDeferSpy.called.should.be.equal(true);
        });

        //console.log('DATASETS METHOD SERVICE: MISSING NEGATIVE UPDATE CASE')

        it('rejects the deferred in negative case', function () {
            expectedPromise = 'NEGATIVE';
            var REASON = 'REASON';

            $qDeferSpy = sinon.spy();
            $qDeferStub = sinon.stub($q, 'defer', function () {
                return {
                    reject: $qDeferSpy,
                    promise: expectedPromise
                };
            });

            nrgiDatasetMethodSrvc.updateDataset({
                $update: function () {
                    return {
                        then: function (uselessCallbackPositive, callbackNegative) {
                            callbackNegative({
                                data: {reason: REASON}
                            });
                        }
                    };
                }
            }).should.be.equal(expectedPromise);

            $qDeferSpy.should.have.been.calledWith(REASON);
        });
    });

    describe('#deleteDatasets', function () {
        var nrgiDatasetSrvcStub;

        it('resolves the deferred in positive case', function () {
            expectedPromise = 'POSITIVE';

            nrgiDatasetSrvcStub = sinon.stub(nrgiDatasetSrvc.prototype, '$delete', function () {
                return {
                    then: function (callback) {
                        callback();
                    }
                };
            });

            $qDeferSpy = sinon.spy();
            $qDeferStub = sinon.stub($q, 'defer', function () {
                return {
                    resolve: $qDeferSpy,
                    promise: expectedPromise
                };
            });

            nrgiDatasetMethodSrvc.deleteDataset([expectedPromise]).should.be.equal(expectedPromise);
            $qDeferSpy.called.should.be.equal(true);
        });

        //console.log('COUNTRIES METHOD SERVICE: MISSING NEGATIVE DELETE CASE');

        it('resolves the deferred in negative case', function () {
            expectedPromise = 'NEGATIVE';
            var REJECT_RESPONSE = {
                data: {reason: 'REJECT_INSERTION'}
            };

            nrgiDatasetSrvcStub = sinon.stub(nrgiDatasetSrvc.prototype, '$delete', function () {
                return {
                    then: function (callbackPositive, callbackNegative) {
                        callbackNegative(REJECT_RESPONSE);
                    }
                };
            });

            $qDeferSpy = sinon.spy();
            $qDeferStub = sinon.stub($q, 'defer', function () {
                return {
                    reject: $qDeferSpy,
                    promise: expectedPromise
                };
            });

            nrgiDatasetMethodSrvc.deleteDataset([expectedPromise]).should.be.equal(expectedPromise);
            $qDeferSpy.should.have.been.calledWith(REJECT_RESPONSE.data.reason);
        });

        afterEach(function () {
            $qDeferStub.restore();
            // nrgiDatasetSrvc.restore();
        });
    });
    console.log('COUNTRIES METHOD SERVICE: CREATE ACTION NOT TESTED');


    afterEach(function () {
        $qDeferStub.restore();
    });
});