'use strict';

describe('nrgiConcessionsMethodSrvc', function () {
    beforeEach(module('app'));

    var nrgiConcessionsMethodSrvc;
    var $q, nrgiConcessionsSrvc;
    var $qDeferStub, $qDeferSpy, expectedPromise;

    beforeEach(inject(function (_nrgiConcessionsMethodSrvc_, _$q_, _nrgiConcessionsSrvc_) {
        $q = _$q_;
        nrgiConcessionsSrvc = _nrgiConcessionsSrvc_;
        nrgiConcessionsMethodSrvc = _nrgiConcessionsMethodSrvc_;
    }));

    describe('#createConcession', function () {
        var nrgiConcessionSrvcStub;

        it('resolves the deferred in positive case', function () {
            expectedPromise = 'POSITIVE';

            nrgiConcessionSrvcStub = sinon.stub(nrgiConcessionsSrvc.prototype, '$save', function() {
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

            nrgiConcessionsMethodSrvc.createConcession([expectedPromise]).should.be.equal(expectedPromise);
            $qDeferSpy.called.should.be.equal(true);
        });

        it('resolves the deferred in positive case', function () {
            expectedPromise = 'NEGATIVE';
            var REJECT_RESPONSE = {
                data: {reason: 'REJECT_INSERTION'}
            };

            nrgiConcessionSrvcStub = sinon.stub(nrgiConcessionsSrvc.prototype, '$save', function() {
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

            nrgiConcessionsMethodSrvc.createConcession([expectedPromise]).should.be.equal(expectedPromise);
            $qDeferSpy.should.have.been.calledWith(REJECT_RESPONSE.data.reason);
        });

        afterEach(function () {
            nrgiConcessionSrvcStub.restore();
        });
    });

    describe('#updateConcession', function () {
        it('resolves the deferred in positive case', function () {
            expectedPromise = 'POSITIVE';

            $qDeferSpy = sinon.spy();
            $qDeferStub = sinon.stub($q, 'defer', function() {
                return {
                    resolve: $qDeferSpy,
                    promise: expectedPromise
                };
            });

            nrgiConcessionsMethodSrvc.updateConcession({
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

        //console.log('CONCESSIONS METHOD SERVICE: MISSING NEGATIVE UPDATE CASE')

        it('rejects the deferred in negative case', function () {
             expectedPromise = 'NEGATIVE';
             var REASON = 'REASON';

             $qDeferSpy = sinon.spy();
             $qDeferStub = sinon.stub($q, 'defer', function() {
                 return {
                     reject: $qDeferSpy,
                     promise: expectedPromise
                 };
             });

             nrgiConcessionsMethodSrvc.updateConcession({
                 $update: function() {
                     return {
                         then: function(uselessCallbackPositive, callbackNegative) {
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

    describe('#deleteConcession', function () {
        var nrgiConcessionSrvcStub;

        it('resolves the deferred in positive case', function () {
            expectedPromise = 'POSITIVE';

            nrgiConcessionSrvcStub = sinon.stub(nrgiConcessionsSrvc.prototype, '$delete', function() {
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

            nrgiConcessionsMethodSrvc.deleteConcession([expectedPromise]).should.be.equal(expectedPromise);
            $qDeferSpy.called.should.be.equal(true);
        });

        //console.log('CONCESSIONS METHOD SERVICE: MISSING NEGATIVE DELETE CASE')

        it('resolves the deferred in negative case', function () {
            expectedPromise = 'NEGATIVE';
            var REJECT_RESPONSE = {
                data: {reason: 'REJECT_INSERTION'}
            };

            nrgiConcessionSrvcStub = sinon.stub(nrgiConcessionsSrvc.prototype, '$delete', function () {
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

            nrgiConcessionsMethodSrvc.deleteConcession([expectedPromise]).should.be.equal(expectedPromise);
            $qDeferSpy.should.have.been.calledWith(REJECT_RESPONSE.data.reason);
        });

        afterEach(function () {
            $qDeferStub.restore();
            // nrgiConcessionsSrvc.restore();
        });
    });


    afterEach(function () {
        $qDeferStub.restore();
    });
});