'use strict';

describe('nrgiUserMethodSrvc', function () {
    beforeEach(module('app'));

    var nrgiUserMethodSrvc;
    var $q, nrgiUserSrvc;
    var $qDeferStub, $qDeferSpy, expectedPromise;

    beforeEach(inject(function (_nrgiUserMethodSrvc_, _$q_, _nrgiUserSrvc_) {
        $q = _$q_;
        nrgiUserSrvc = _nrgiUserSrvc_;
        nrgiUserMethodSrvc = _nrgiUserMethodSrvc_;
    }));

    describe('#createUsers', function () {
        var nrgiUserSrvcStub;

        it('resolves the deferred in positive case', function () {
            expectedPromise = 'POSITIVE';

            nrgiUserSrvcStub = sinon.stub(nrgiUserSrvc.prototype, '$save', function() {
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

            nrgiUserMethodSrvc.createUser([expectedPromise]).should.be.equal(expectedPromise);
            $qDeferSpy.called.should.be.equal(true);
        });

        it('resolves the deferred in positive case', function () {
            expectedPromise = 'NEGATIVE';
            var REJECT_RESPONSE = {
                data: {reason: 'REJECT_INSERTION'}
            };

            nrgiUserSrvcStub = sinon.stub(nrgiUserSrvc.prototype, '$save', function() {
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

            nrgiUserMethodSrvc.createUser([expectedPromise]).should.be.equal(expectedPromise);
            $qDeferSpy.should.have.been.calledWith(REJECT_RESPONSE.data.reason);
        });

        afterEach(function () {
            nrgiUserSrvcStub.restore();
        });
    });

    describe('#updateUsers', function () {
        it('resolves the deferred in positive case', function () {
            expectedPromise = 'POSITIVE';

            $qDeferSpy = sinon.spy();
            $qDeferStub = sinon.stub($q, 'defer', function() {
                return {
                    resolve: $qDeferSpy,
                    promise: expectedPromise
                };
            });

            nrgiUserMethodSrvc.updateUser({
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

        console.log('USER METHOD SERVICE: MISSING NEGATIVE UPDATE CASE')

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
        //     nrgiUserSrvcStub.updateUser({
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

    describe('#deleteUsers', function () {
        var nrgiUserSrvcStub;

        it('resolves the deferred in positive case', function () {
            expectedPromise = 'POSITIVE';

            nrgiUserSrvcStub = sinon.stub(nrgiUserSrvc.prototype, '$delete', function() {
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

            nrgiUserMethodSrvc.deleteUser([expectedPromise]).should.be.equal(expectedPromise);
            $qDeferSpy.called.should.be.equal(true);
        });

        console.log('USER METHOD SERVICE: MISSING NEGATIVE DELETE CASE')

        // it('resolves the deferred in negative case', function () {
        //     expectedPromise = 'NEGATIVE';
        //     var REJECT_RESPONSE = {
        //         data: {reason: 'REJECT_INSERTION'}
        //     };
        //
        //     nrgiUserSrvcStub = sinon.stub(nrgiCommoditiesSrvc.prototype, '$delete', function() {
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
        //     nrgiUserMethodSrvc.deleteUser([expectedPromise]).should.be.equal(expectedPromise);
        //     $qDeferSpy.should.have.been.calledWith(REJECT_RESPONSE.data.reason);
        // });

        afterEach(function () {
            $qDeferStub.restore();
            // nrgiUserSrvc.restore();
        });
    });


    afterEach(function () {
        $qDeferStub.restore();
    });
});