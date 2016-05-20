'use strict';

describe('nrgiProjectsMethodSrvc', function () {
    beforeEach(module('app'));

    var nrgiProjectsMethodSrvc;
    var $q, nrgiProjectsSrvc;
    var $qDeferStub, $qDeferSpy, expectedPromise;

    beforeEach(inject(function (_nrgiProjectsMethodSrvc_, _$q_, _nrgiProjectsSrvc_) {
        $q = _$q_;
        nrgiProjectsSrvc = _nrgiProjectsSrvc_;
        nrgiProjectsMethodSrvc = _nrgiProjectsMethodSrvc_;
    }));

    describe('#createProjects', function () {
        var nrgiProjectSrvcStub;

        it('resolves the deferred in positive case', function () {
            expectedPromise = 'POSITIVE';

            nrgiProjectSrvcStub = sinon.stub(nrgiProjectsSrvc.prototype, '$save', function() {
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

            nrgiProjectsMethodSrvc.createProject([expectedPromise]).should.be.equal(expectedPromise);
            $qDeferSpy.called.should.be.equal(true);
        });

        it('resolves the deferred in positive case', function () {
            expectedPromise = 'NEGATIVE';
            var REJECT_RESPONSE = {
                data: {reason: 'REJECT_INSERTION'}
            };

            nrgiProjectSrvcStub = sinon.stub(nrgiProjectsSrvc.prototype, '$save', function() {
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

            nrgiProjectsMethodSrvc.createProject([expectedPromise]).should.be.equal(expectedPromise);
            $qDeferSpy.should.have.been.calledWith(REJECT_RESPONSE.data.reason);
        });

        afterEach(function () {
            nrgiProjectSrvcStub.restore();
        });
    });

    describe('#updateProjects', function () {
        it('resolves the deferred in positive case', function () {
            expectedPromise = 'POSITIVE';

            $qDeferSpy = sinon.spy();
            $qDeferStub = sinon.stub($q, 'defer', function() {
                return {
                    resolve: $qDeferSpy,
                    promise: expectedPromise
                };
            });

            nrgiProjectsMethodSrvc.updateProject({
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

        console.log('PROJECTS METHOD SERVICE: MISSING NEGATIVE UPDATE CASE')

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
        //     nrgiProjectSrvcStub.updateProject({
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

    describe('#deleteProjects', function () {
        var nrgiProjectSrvcStub;

        it('resolves the deferred in positive case', function () {
            expectedPromise = 'POSITIVE';

            nrgiProjectSrvcStub = sinon.stub(nrgiProjectsSrvc.prototype, '$delete', function() {
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

            nrgiProjectsMethodSrvc.deleteProject([expectedPromise]).should.be.equal(expectedPromise);
            $qDeferSpy.called.should.be.equal(true);
        });

        console.log('PROJECTS METHOD SERVICE: MISSING NEGATIVE DELETE CASE')

        // it('resolves the deferred in negative case', function () {
        //     expectedPromise = 'NEGATIVE';
        //     var REJECT_RESPONSE = {
        //         data: {reason: 'REJECT_INSERTION'}
        //     };
        //
        //     nrgiProjectSrvcStub = sinon.stub(nrgiCommoditiesSrvc.prototype, '$delete', function() {
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
        //     nrgiProjectsMethodSrvc.deleteProject([expectedPromise]).should.be.equal(expectedPromise);
        //     $qDeferSpy.should.have.been.calledWith(REJECT_RESPONSE.data.reason);
        // });

        afterEach(function () {
            $qDeferStub.restore();
            // nrgiProjectsSrvc.restore();
        });
    });


    afterEach(function () {
        $qDeferStub.restore();
    });
});