'use strict';
angular.module('app', [
    'angular.filter',
    'iso-3166-country-codes',
    'leaflet-directive',
    'ngDialog',
    'ngResource',
    'ngRoute',
    'tableSort',
    'angular-underscore',
    'restangular'
]);

angular.module('app')

angular.module('app')
    .config(function($routeProvider, $locationProvider) {
        // role checks
        var routeRoleChecks = {
            supervisor: {auth: function(nrgiAuthSrvc) {
                return nrgiAuthSrvc.authorizeCurrentUserForRoute('supervisor')
            }},
            //researcher: {auth: function(nrgiAuthSrvc) {
            //    return nrgiAuthSrvc.authorizeCurrentUserForRoute('researcher')
            //}},
            //reviewer: {auth: function(nrgiAuthSrvc) {
            //    return nrgiAuthSrvc.authorizeCurrentUserForRoute('reviewer')
            //}},
            user: {auth: function(nrgiAuthSrvc) {
                return nrgiAuthSrvc.authorizeAuthenticatedUserForRoute()
            }}
        };

        $locationProvider.html5Mode(true);
        $routeProvider
            .when('/', {
                templateUrl: '/partials/main/main',
                controller: 'nrgiMainCtrl'
            })
            // Admin Routes
            .when('/admin/create-user', {
                templateUrl: '/partials/admin/users/create-user',
                controller: 'nrgiUserAdminCreateCtrl',
                resolve: routeRoleChecks.supervisor
            })
            .when('/admin/user-admin', {
                templateUrl: '/partials/admin/users/user-admin',
                controller: 'nrgiUserAdminCtrl',
                resolve: routeRoleChecks.supervisor
            })
            .when('/admin/user-admin/:id', {
                templateUrl: '/partials/admin/users/user-admin-update',
                controller: 'nrgiUserAdminUpdateCtrl',
                resolve: routeRoleChecks.supervisor
            })
            // User Account Routes
            .when('/profile', {
                templateUrl: '/partials/account/profile',
                controller: 'nrgiProfileCtrl',
                resolve: routeRoleChecks.user
            })
            //Entity Routes
            //.when('/contracts', {
            //    templateUrl: '/partials/contracts/contracts',
            //    controller: 'nrgiContractsCtrl'
            //})
            //.when('/contract/:id', {
            //    templateUrl: '/partials/contracts/contract',
            //    controller: 'nrgiContractCtrl'
            //})
            //.when('/concessions', {
            //    templateUrl: '/partials/concessions/concessions',
            //    controller: 'nrgiConcessionsCtrl'
            //})
            //.when('/concessions/:id', {
            //    templateUrl: '/partials/concessions/concession',
            //    controller: 'nrgiConcessionCtrl'
            //})
            //.when('/concessions/map', {
            //    templateUrl: '/partials/projects/map'
            //})
            //.when('/projects', {
            //    templateUrl: '/partials/projects/projects',
            //    controller: 'nrgiProjectsCtrl'
            //})
            //.when('/projects/:id_country/:id', {
            //    templateUrl: '/partials/projects/project',
            //    controller: 'nrgiProjectCtrl'
            //})
            //.when('/projects/map', {
            //    templateUrl: '/partials/projects/map'
            //})
            .when('/companies', {
                templateUrl: '/partials/companies/company-list',
                controller: 'nrgiCompanyListCtrl'
            })
            .when('/companies/:id', {
                templateUrl: '/partials/companies/company-detail',
                controller: 'nrgiCompanyDetailCtrl'
            })
            //
            ////Helper groups
            //.when('/countries', {
            //    templateUrl: '/partials/countries/countries',
            //    controller: 'nrgiCountriesCtrl'
            //})
            //.when('/countries/:id', {
            //    templateUrl: '/partials/countries/country',
            //    controller: 'nrgiCountryCtrl'
            //})
            //.when('/commodities', {
            //    templateUrl: '/partials/commodities/commodities',
            //    controller: 'nrgiCommoditiesCtrl'
            //})
            //.when('/commodities/:id', {
            //    templateUrl: '/partials/commodities/commodity',
            //    controller: 'nrgiCommodityCtrl'
            //})
            //.when('/groups', {
            //    templateUrl: '/partials/companies/groups',
            //    controller: 'nrgiGroupsCtrl'
            //})
            //.when('/groups/:id', {
            //    templateUrl: '/partials/companies/group',
            //    controller: 'nrgiGroupCtrl'
            //})
            //
            ////Transfers and related facts
            //.when('/governmentReceipt/:id', {
            //    templateUrl: '/partials/common/receipt'
            //})
            //.when('/production/:id_country/:id', {
            //    templateUrl: '/partials/common/production'
            //})
            //.when('/governmentreceipt/:id_country/:id', {
            //    templateUrl: '/partials/common/governmentreceipt'
            //})
            //
            ////Other
            //.when('/sources', {
            //    templateUrl: '/partials/sources/sources',
            //    controller: 'nrgiSourcesCtrl'
            //})
            //.when('/sources/:id', {
            //    templateUrl: '/partials/sources/source',
            //    controller: 'nrgiSourceCtrl'
            //})
            //.when('/glossary', {
            //    templateUrl: '/partials/common/glossary'
            //})
            //.when('/contribute', {
            //    templateUrl: '/partials/common/contribute'
            //})
            //.when('/about', {
            //    templateUrl: '/partials/common/about'
            //})
            //.when('/model', {
            //    templateUrl: '/partials/common/dataModel'
            //})
            //.when('/namedGraphs', {
            //    templateUrl: '/partials/common/namedGraphs'
            //})
            //.when('/classes', {
            //    templateUrl: '/partials/main/classes'
            //})
            //.when('/instances/:id', {
            //    templateUrl: '/partials/main/instances'
            //})
    });

angular.module('app').run(function($rootScope, $location,$http) {
    $rootScope.$on('$routeChangeError', function(evt, current, previous, rejection) {
        document.body.scrollTop = document.documentElement.scrollTop = 0;
        if(rejection === 'not authorized') {
            $location.path('/');
        }
    });
    $rootScope.$on('$routeChangeSuccess', function() {
        document.body.scrollTop = document.documentElement.scrollTop = 0;
        //$http.get('/api/countries').then(function (response) {
        //    console.log(response);
        //})
        //$http.get('/api/commodities').then(function (response) {
        //    console.log(response);
        //})
        //$http.get('/api/companies').then(function (response) {
        //    console.log(response);
        //})
        //$http.get('/api/concessions').then(function (response) {
        //    console.log(response);
        //})
        //$http.get('/api/projects').then(function (response) {
        //    console.log(response);
        //})
    })
});