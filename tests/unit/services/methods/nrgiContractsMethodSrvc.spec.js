'use strict';

describe('nrgiContractsMethodSrvc', function () {
    beforeEach(module('app'));

    var nrgiContractsMethodSrvc;
    var $q, nrgiContractsSrvc;
    var $qDeferStub, $qDeferSpy, expectedPromise;

    beforeEach(inject(function (_nrgiContractsMethodSrvc_, _$q_, _nrgiContractsSrvc_) {
        $q = _$q_;
        nrgiContractsSrvc = _nrgiContractsSrvc_;
        nrgiContractsMethodSrvc = _nrgiContractsMethodSrvc_;
    }));

    describe('#createContract', function () {
        var nrgiContractSrvcStub;

        it('resolves the deferred in positive case', function () {
            expectedPromise = 'POSITIVE';

            nrgiContractSrvcStub = sinon.stub(nrgiContractsSrvc.prototype, '$save', function () {
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

            nrgiContractsMethodSrvc.createContract([expectedPromise]).should.be.equal(expectedPromise);
            $qDeferSpy.called.should.be.equal(true);
        });

        it('resolves the deferred in positive case', function () {
            expectedPromise = 'NEGATIVE';
            var REJECT_RESPONSE = {
                data: {reason: 'REJECT_INSERTION'}
            };

            nrgiContractSrvcStub = sinon.stub(nrgiContractsSrvc.prototype, '$save', function () {
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

            nrgiContractsMethodSrvc.createContract([expectedPromise]).should.be.equal(expectedPromise);
            $qDeferSpy.should.have.been.calledWith(REJECT_RESPONSE.data.reason);
        });

        afterEach(function () {
            nrgiContractSrvcStub.restore();
        });
    });

    describe('#updateContract', function () {
        it('resolves the deferred in positive case', function () {
            expectedPromise = 'POSITIVE';

            $qDeferSpy = sinon.spy();
            $qDeferStub = sinon.stub($q, 'defer', function () {
                return {
                    resolve: $qDeferSpy,
                    promise: expectedPromise
                };
            });

            nrgiContractsMethodSrvc.updateContract({
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

            nrgiContractsMethodSrvc.updateContract({
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

    describe('#deleteContract', function () {
        var nrgiContractSrvcStub;

        it('resolves the deferred in positive case', function () {
            expectedPromise = 'POSITIVE';

            nrgiContractSrvcStub = sinon.stub(nrgiContractsSrvc.prototype, '$delete', function () {
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

            nrgiContractsMethodSrvc.deleteContract([expectedPromise]).should.be.equal(expectedPromise);
            $qDeferSpy.called.should.be.equal(true);
        });


        it('resolves the deferred in negative case', function () {
            expectedPromise = 'NEGATIVE';
            var REJECT_RESPONSE = {
                data: {reason: 'REJECT_INSERTION'}
            };

            nrgiContractSrvcStub = sinon.stub(nrgiContractsSrvc.prototype, '$delete', function () {
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

            nrgiContractsMethodSrvc.deleteContract([expectedPromise]).should.be.equal(expectedPromise);
            $qDeferSpy.should.have.been.calledWith(REJECT_RESPONSE.data.reason);
        });

        afterEach(function () {
            $qDeferStub.restore();
        });
    });


    afterEach(function () {
        $qDeferStub.restore();
    });
});