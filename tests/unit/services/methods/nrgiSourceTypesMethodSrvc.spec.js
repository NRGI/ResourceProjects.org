'use strict';

describe('nrgiSourceTypesMethodSrvc', function () {
    beforeEach(module('app'));

    var nrgiSourceTypesMethodSrvc;
    var $q, nrgiSourceTypesSrvc;
    var $qDeferStub, $qDeferSpy, expectedPromise;

    beforeEach(inject(function (_nrgiSourceTypesMethodSrvc_, _$q_, _nrgiSourceTypesSrvc_) {
        $q = _$q_;
        nrgiSourceTypesSrvc = _nrgiSourceTypesSrvc_;
        nrgiSourceTypesMethodSrvc = _nrgiSourceTypesMethodSrvc_;
    }));

    describe('#createSourceTypes', function () {
        var nrgiSourceTypeSrvcStub;

        it('resolves the deferred in positive case', function () {
            expectedPromise = 'POSITIVE';

            nrgiSourceTypeSrvcStub = sinon.stub(nrgiSourceTypesSrvc.prototype, '$save', function() {
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

            nrgiSourceTypesMethodSrvc.createSourceType([expectedPromise]).should.be.equal(expectedPromise);
            $qDeferSpy.called.should.be.equal(true);
        });

        it('resolves the deferred in positive case', function () {
            expectedPromise = 'NEGATIVE';
            var REJECT_RESPONSE = {
                data: {reason: 'REJECT_INSERTION'}
            };

            nrgiSourceTypeSrvcStub = sinon.stub(nrgiSourceTypesSrvc.prototype, '$save', function() {
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

            nrgiSourceTypesMethodSrvc.createSourceType([expectedPromise]).should.be.equal(expectedPromise);
            $qDeferSpy.should.have.been.calledWith(REJECT_RESPONSE.data.reason);
        });

        afterEach(function () {
            nrgiSourceTypeSrvcStub.restore();
        });
    });

    describe('#updateSourceTypes', function () {
        it('resolves the deferred in positive case', function () {
            expectedPromise = 'POSITIVE';

            $qDeferSpy = sinon.spy();
            $qDeferStub = sinon.stub($q, 'defer', function() {
                return {
                    resolve: $qDeferSpy,
                    promise: expectedPromise
                };
            });

            nrgiSourceTypesMethodSrvc.updateSourceType({
                $update: function() {
                    return {
                        then: function(callbackPositive) {
                            callbackPositive();
                        }
                    };
                }
            }).should.be.equal(expectedPromise);

            $qDeferSpy.called.should.be.equal(true);
        });

        console.log('SOURCES TYPE METHOD SERVICE: MISSING NEGATIVE UPDATE CASE')

        // it('rejects the deferred in negative case', function () {
        //     expectedPromise = 'NEGATIVE';
        //     var REASON = 'REASON';
        //
        //     $qDeferSpy = sinon.spy();
        //     $qDeferStub = sinon.stub($q, 'defer', function() {
        //         return {
        //             reject: $qDeferSpy,
        //             promise: expectedPromise
        //         };
        //     });
        //
        //     nrgiSourceTypeSrvcStub.updateSourceType({
        //         $update: function() {
        //             return {
        //                 then: function(uselessCallbackPositive, callbackNegative) {
        //                     callbackNegative({
        //                         data: {reason: REASON}
        //                     });
        //                 }
        //             };
        //         }
        //     }).should.be.equal(expectedPromise);
        //
        //     $qDeferSpy.should.have.been.calledWith(REASON);
        // });
    });

    describe('#deleteSourceTypes', function () {
        var nrgiSourceTypeSrvcStub;

        it('resolves the deferred in positive case', function () {
            expectedPromise = 'POSITIVE';

            nrgiSourceTypeSrvcStub = sinon.stub(nrgiSourceTypesSrvc.prototype, '$delete', function() {
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

            nrgiSourceTypesMethodSrvc.deleteSourceType([expectedPromise]).should.be.equal(expectedPromise);
            $qDeferSpy.called.should.be.equal(true);
        });

        console.log('SOURCE TYPE METHOD SERVICE: MISSING NEGATIVE DELETE CASE')

        // it('resolves the deferred in negative case', function () {
        //     expectedPromise = 'NEGATIVE';
        //     var REJECT_RESPONSE = {
        //         data: {reason: 'REJECT_INSERTION'}
        //     };
        //
        //     nrgiSourceTypeSrvcStub = sinon.stub(nrgiCommoditiesSrvc.prototype, '$delete', function() {
        //         return {
        //             then: function(callbackPositive, callbackNegative) {
        //                 callbackNegative(REJECT_RESPONSE);
        //             }
        //         };
        //     });
        //
        //     $qDeferSpy = sinon.spy();
        //     $qDeferStub = sinon.stub($q, 'defer', function() {
        //         return {
        //             reject: $qDeferSpy,
        //             promise: expectedPromise
        //         };
        //     });
        //
        //     nrgiSourceTypesMethodSrvc.deleteSourceType([expectedPromise]).should.be.equal(expectedPromise);
        //     $qDeferSpy.should.have.been.calledWith(REJECT_RESPONSE.data.reason);
        // });

        afterEach(function () {
            $qDeferStub.restore();
            // nrgiSourceTypesSrvc.restore();
        });
    });


    afterEach(function () {
        $qDeferStub.restore();
    });
});