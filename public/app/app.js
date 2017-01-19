'use strict';
angular.module('app', [
    'angular.filter',
    'angular-underscore',
    'iso-3166-country-codes',
    'angular-google-analytics',
    'leaflet-directive',
    'ngDialog',
    'ngResource',
    'ngRoute',
    'tableSort',
    'ngCsv',
    'ngSanitize',
    'angularSpinner',
    'infinite-scroll',
    'nvd3',
    'textAngular'
]);

angular.module('app')
    .config(function($routeProvider, $locationProvider, AnalyticsProvider) {

        AnalyticsProvider
            .setAccount([{ tracker: 'UA-59246536-4', name: "resourceprojects.org" }])
            .logAllCalls(true)
            .startOffline(true);
        // role checks
        var routeRoleChecks = {
            supervisor: {auth: function(nrgiAuthSrvc) {
                return nrgiAuthSrvc.authorizeCurrentUserForRoute('admin')
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
            ///////////////////
            ////ADMIN ROUTES///
            ///////////////////
            // Data Management
            .when('/admin/etl/datasets', {
                templateUrl: '/partials/admin/etl/datasets',
                controller: 'nrgiEtlCtrl'/*,
                resolve: routeRoleChecks.supervisor -- TODO */
            })
            .when('/admin/etl/datasets/new', {
                templateUrl: '/partials/admin/etl/create-dataset',
                controller: 'nrgiDatasetCreateCtrl'/*,
                resolve: routeRoleChecks.supervisor -- TODO */
            })
            .when('/admin/reconcile', {
                templateUrl: '/partials/admin/etl/reconcile',
                controller: 'nrgiReconcileCtrl'/*,
                 resolve: routeRoleChecks.supervisor -- TODO */
            })
            // Users
            .when('/admin/create-user', {
                templateUrl: '/partials/admin/users/create-user',
                controller: 'nrgiUserAdminCreateCtrl',
                //resolve: routeRoleChecks.supervisor
            })
            .when('/admin/user-admin', {
                templateUrl: '/partials/admin/users/user-admin',
                controller: 'nrgiUserAdminCtrl',
                //resolve: routeRoleChecks.supervisor
            })
            .when('/admin/user-admin/:id', {
                templateUrl: '/partials/admin/users/user-admin-update',
                controller: 'nrgiUserAdminUpdateCtrl',
                //resolve: routeRoleChecks.supervisor
            })
            // Entity Management
            .when('/admin/sourceType-admin', {
                templateUrl: '/partials/admin/sourceTypes/sourceType-admin',
                controller: 'nrgiSourceTypeAdminCtrl',
                //resolve: routeRoleChecks.supervisor
            })
            .when('/admin/create-sourceType', {
                templateUrl: '/partials/admin/sourceTypes/create-sourceType',
                controller: 'nrgiSourceTypeAdminCreateCtrl',
                //resolve: routeRoleChecks.supervisor
            })
            .when('/admin/sourceType-admin/:id', {
                templateUrl: '/partials/admin/sourceTypes/sourceType-admin-update',
                controller: 'nrgiSourceTypeAdminUpdateCtrl',
                //resolve: routeRoleChecks.supervisor
            })
            .when('/admin/edit-about-page', {
                templateUrl: '/partials/admin/cms/aboutPage/edit-about-page',
                controller: 'nrgiAboutPageUpdateCtrl',
                //resolve: routeRoleChecks.supervisor
            })
            .when('/admin/edit-glossary-page', {
                templateUrl: '/partials/admin/cms/glossaryPage/edit-glossary-page',
                controller: 'nrgiGlossaryPageUpdateCtrl',
                //resolve: routeRoleChecks.supervisor
            })
            .when('/admin/edit-landing-page', {
                templateUrl: '/partials/admin/cms/landingPage/edit-landing-page',
                controller: 'nrgiLandingPageUpdateCtrl',
                //resolve: routeRoleChecks.supervisor
            })

            //////////////////////////
            ////User Account Routes///
            //////////////////////////
            .when('/login', {
                templateUrl: '/partials/account/login',
                controller: 'nrgiLoginCtrl'
            })
            .when('/profile', {
                templateUrl: '/partials/account/profile',
                controller: 'nrgiProfileCtrl',
                resolve: routeRoleChecks.supervisor
            })
            //Entity Routes
            .when('/companies', {
                templateUrl: '/partials/dynamic/companies/company-list',
                controller: 'nrgiCompanyListCtrl'
            })
            .when('/company/:id', {
                templateUrl: '/partials/dynamic/companies/company-detail',
                controller: 'nrgiCompanyDetailCtrl'
            })
            .when('/concessions', {
                templateUrl: '/partials/dynamic/concessions/concession-list',
                controller: 'nrgiConcessionListCtrl'
            })
            .when('/concession/:id', {
                templateUrl: '/partials/dynamic/concessions/concession-detail',
                controller: 'nrgiConcessionDetailCtrl'
            })
            .when('/contracts', {
                templateUrl: '/partials/dynamic/contracts/contract-list',
                controller: 'nrgiContractListCtrl'
            })
            .when('/contract/:id', {
                templateUrl: '/partials/dynamic/contracts/contract-detail',
                controller: 'nrgiContractDetailCtrl'
            })
            .when('/fields', {
                templateUrl: '/partials/dynamic/sites/site-list',
                controller: 'nrgiSiteListCtrl'
            })
            .when('/field/:id', {
                templateUrl: '/partials/dynamic/sites/site-detail',
                controller: 'nrgiSiteDetailCtrl'
            })
            .when('/fields/map', {
                templateUrl: '/partials/dynamic/sites/mapSiteAndProject',
                controller: 'nrgiMapSiteCtrl'
            })
            .when('/projects', {
                templateUrl: '/partials/dynamic/projects/project-list',
                controller: 'nrgiProjectListCtrl'
            })
            .when('/all-projects', {
                templateUrl: '/partials/dynamic/projects/all-project-list',
                controller: 'nrgiAllProjectListCtrl'
            })
            .when('/project/:id', {
                templateUrl: '/partials/dynamic/projects/project-detail',
                controller: 'nrgiProjectDetailCtrl'
            })
            .when('/sites', {
                templateUrl: '/partials/dynamic/sites/site-list',
                controller: 'nrgiSiteListCtrl'
            })
            .when('/site/:id', {
                templateUrl: '/partials/dynamic/sites/site-detail',
                controller: 'nrgiSiteDetailCtrl'
            })
            .when('/sites/map', {
                templateUrl: '/partials/dynamic/sites/mapSiteAndProject',
                controller: 'nrgiMapSiteCtrl'
            })
            .when('/transfers', {
                templateUrl: '/partials/dynamic/transfers/transfer-list',
                controller: 'nrgiTransferListCtrl'
            })
            .when('/transfers_by_gov', {
                templateUrl: '/partials/dynamic/transfersByGovEntity/transferByGov-list',
                controller: 'nrgiTransferByGovListCtrl'
            })

            /////////////////////
            ////Helper groups////
            /////////////////////
            .when('/commodities', {
                templateUrl: '/partials/dynamic/commodities/commodity-list',
                controller: 'nrgiCommodityListCtrl'
            })
            .when('/commodity/:id', {
                templateUrl: '/partials/dynamic/commodities/commodity-detail',
                controller: 'nrgiCommodityDetailCtrl'
            })
            .when('/countries', {
                templateUrl: '/partials/dynamic/countries/country-list',
                controller: 'nrgiCountryListCtrl'
            })
            .when('/country/:id', {
                templateUrl: '/partials/dynamic/countries/country-detail',
                controller: 'nrgiCountryDetailCtrl'
            })
            .when('/groups', {
                templateUrl: '/partials/dynamic/groups/group-list',
                controller: 'nrgiGroupListCtrl'
            })
            .when('/group/:id', {
                templateUrl: '/partials/dynamic/groups/group-detail',
                controller: 'nrgiGroupDetailCtrl'
            })
           .when('/sources', {
                templateUrl: '/partials/dynamic/sources/source-list',
                controller: 'nrgiSourceListCtrl'
            })
            .when('/source/:id', {
                templateUrl: '/partials/dynamic/sources/source-detail',
                controller: 'nrgiSourceDetailCtrl'
            })

            /////////////
            ////Other////
            /////////////
            .when('/glossary', {
                templateUrl: '/partials/static/glossary/glossary',
                controller: 'nrgiGlossaryCtrl'
            })
            .when('/contribute', {
                templateUrl: '/partials/static/contribute'
            })
            .when('/about', {
                templateUrl: '/partials/static/about/about',
                controller: 'nrgiAboutCtrl'
            })
            .when('/pie-chart', {
                templateUrl: '/partials/dynamic/pieChart/pie-chart',
                controller: 'nrgiPieChartCtrl'
            })
            .when('/treemap', {
                templateUrl: '/partials/dynamic/treemap/tree-map'
            })
            .when('/sunburst-chart', {
                templateUrl: '/partials/dynamic/sunburstChart/sunburst-chart'
            })
            .when('/sunburst-chart-by-gov', {
                templateUrl: '/partials/dynamic/sunburstChartByGovEntity/sunburst-chart'
            })
            .when('/map', {
                templateUrl: '/partials/dynamic/map/map'
            })
            .otherwise('/', {
                templateUrl: '/partials/main/main',
                controller: 'nrgiMainCtrl'
            })
    });

angular.module('app')
    .run(function(
        $rootScope,
        $routeParams,
        $location,
        $window
    ) {
        $rootScope._ = _;
        $rootScope.Object = Object;
        $rootScope.keys = $rootScope.Object.keys;
        $rootScope.$on('$routeChangeError', function(evt, current, previous, rejection) {
            document.body.scrollTop = document.documentElement.scrollTop = 0;
            if(rejection === 'not authorized') {
                $location.path('/');
            }
        });
        $rootScope.$on('$routeChangeSuccess', function() {
            document.body.scrollTop = document.documentElement.scrollTop = 0;
            var output=$location.path()+"?";
            angular.forEach($routeParams,function(value,key){
                output+=key+"="+value+"&";
            });
            output=output.substr(0,output.length-1);
            $window.ga(['_trackPageview', output]);
        });
    });