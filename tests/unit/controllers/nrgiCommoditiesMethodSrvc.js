// describe("Unit: Testing Modules", function() {
//     beforeEach(module('app'));
//     it('should contain an nrgiCommoditiesMethodSrvc service', inject(function(nrgiCommoditiesMethodSrvc) {
//         expect(nrgiCommoditiesMethodSrvc).not.toBeNull();
//     }));
//     it('should have a working nrgiCommoditiesMethodSrvc service',
//         inject(['nrgiCommoditiesMethodSrvc',function($srvc) {
//             expect($srvc.createCommodity).not.toBeNull();
//             expect($srvc.deleteCommodity).not.toBeNull();
// //             expect($srvc.updateCommodity).not.toBeNull();
// //         }]));
// // });
// 'use strict'
// describe('nrgiCommoditiesMethodSrvc', function () {
//     var nrgiCommoditiesMethodSrvc,
//         httpBackend,
//         result;
//
//     beforeEach(function (){
//         module('app');
//
//         inject(function($httpBackend, _nrgiCommoditiesMethodSrvc_) {
//             nrgiCommoditiesMethodSrvc = _nrgiCommoditiesMethodSrvc_;
//             httpBackend = $httpBackend;
//         });
//     });
//
//     afterEach(function() {
//         httpBackend.verifyNoOutstandingExpectation();
//         httpBackend.verifyNoOutstandingRequest();
//     });
//
//     it('should create Commodity and return the response.', function () {
//         var returnData = {
//             "success": true
//         };
//         var commodity_data = {commodity_name: "Commodity_test"}
//
//
//         httpBackend.expectPOST('/api/commodities', commodity_data).respond(returnData);
//
//         var createCommodity = nrgiCommoditiesMethodSrvc.createCommodity(commodity_data);
//
//         createCommodity.then(function () {
//             result = true;
//         }, function (reason) {
//             result = false;
//         })
//
//         httpBackend.flush();
//
//         expect(result).toBeTruthy();
//     });
//
//     it('should delete Commodity.', function (){
//         var returnData = {
//             "success": true
//         };
//         var id = "56a13e9942c8bef50ec2e9e8"
//
//         httpBackend.expectDELETE('/api/commodities/'+id).respond(returnData);
//
//         var deleteCommodity = nrgiCommoditiesMethodSrvc.deleteCommodity(id);
//
//         deleteCommodity.then(function() {
//             result=true;
//         }, function(reason) {
//             result=false;
//         })
//
//         httpBackend.flush();
//
//         expect(result).toBeTruthy();
//     });
// });