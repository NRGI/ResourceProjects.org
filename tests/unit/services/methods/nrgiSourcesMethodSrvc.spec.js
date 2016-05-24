'use strict';

describe('nrgiSourcesMethodSrvc', function () {
    beforeEach(module('app'));

    var nrgiSourcesMethodSrvc;
    var $q, nrgiSourcesSrvc;
    var $qDeferStub, $qDeferSpy, expectedPromise;

    beforeEach(inject(function (_nrgiSourcesMethodSrvc_, _$q_, _nrgiSourcesSrvc_) {
        $q = _$q_;
        nrgiSourcesSrvc = _nrgiSourcesSrvc_;
        nrgiSourcesMethodSrvc = _nrgiSourcesMethodSrvc_;
    }));

    describe('#createSources', function () {
        var nrgiSourceSrvcStub;

        it('resolves the deferred in positive case', function () {
            expectedPromise = 'POSITIVE';

            nrgiSourceSrvcStub = sinon.stub(nrgiSourcesSrvc.prototype, '$save', function () {
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

            nrgiSourcesMethodSrvc.createSource([expectedPromise]).should.be.equal(expectedPromise);
            $qDeferSpy.called.should.be.equal(true);
        });

        it('resolves the deferred in positive case', function () {
            expectedPromise = 'NEGATIVE';
            var REJECT_RESPONSE = {
                data: {reason: 'REJECT_INSERTION'}
            };

            nrgiSourceSrvcStub = sinon.stub(nrgiSourcesSrvc.prototype, '$save', function () {
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

            nrgiSourcesMethodSrvc.createSource([expectedPromise]).should.be.equal(expectedPromise);
            $qDeferSpy.should.have.been.calledWith(REJECT_RESPONSE.data.reason);
        });

        afterEach(function () {
            nrgiSourceSrvcStub.restore();
        });
    });

    describe('#updateSources', function () {
        it('resolves the deferred in positive case', function () {
            expectedPromise = 'POSITIVE';

            $qDeferSpy = sinon.spy();
            $qDeferStub = sinon.stub($q, 'defer', function () {
                return {
                    resolve: $qDeferSpy,
                    promise: expectedPromise
                };
            });

            nrgiSourcesMethodSrvc.updateSource({
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

        //console.log('SOURCES METHOD SERVICE: MISSING NEGATIVE UPDATE CASE')

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

            nrgiSourcesMethodSrvc.updateSource({
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

    describe('#deleteSources', function () {
        var nrgiSourceSrvcStub;

        it('resolves the deferred in positive case', function () {
            expectedPromise = 'POSITIVE';

            nrgiSourceSrvcStub = sinon.stub(nrgiSourcesSrvc.prototype, '$delete', function () {
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

            nrgiSourcesMethodSrvc.deleteSource([expectedPromise]).should.be.equal(expectedPromise);
            $qDeferSpy.called.should.be.equal(true);
        });

        //console.log('SOURCE METHOD SERVICE: MISSING NEGATIVE DELETE CASE')

        it('resolves the deferred in negative case', function () {
            expectedPromise = 'NEGATIVE';
            var REJECT_RESPONSE = {
                data: {reason: 'REJECT_INSERTION'}
            };

            nrgiSourceSrvcStub = sinon.stub(nrgiSourcesSrvc.prototype, '$delete', function () {
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

            nrgiSourcesMethodSrvc.deleteSource([expectedPromise]).should.be.equal(expectedPromise);
            $qDeferSpy.should.have.been.calledWith(REJECT_RESPONSE.data.reason);
        });

        afterEach(function () {
            $qDeferStub.restore();
            // nrgiSourcesSrvc.restore();
        });
    });


    afterEach(function () {
        $qDeferStub.restore();
    });
});