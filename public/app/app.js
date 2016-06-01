'use strict';
angular.module('app', [
    'angular.filter',
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
    'infinite-scroll'
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
            // Admin Routes
            .when('/login', {
                templateUrl: '/partials/account/login',
                controller: 'nrgiLoginCtrl'
            })
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
            .when('/admin/reconcile', {
                templateUrl: '/partials/admin/reconcile/reconcile',
                controller: 'nrgiReconcileCtrl'/*,
                resolve: routeRoleChecks.supervisor -- TODO */
            })
            // User Account Routes
            .when('/profile', {
                templateUrl: '/partials/account/profile',
                controller: 'nrgiProfileCtrl',
                resolve: routeRoleChecks.supervisor
            })
            //Entity Routes
            .when('/contracts', {
                templateUrl: '/partials/contracts/contract-list',
                controller: 'nrgiContractListCtrl'
            })
            .when('/contract/:id', {
                templateUrl: '/partials/contracts/contract-detail',
                controller: 'nrgiContractDetailCtrl'
            })
            .when('/concessions', {
                templateUrl: '/partials/concessions/concession-list',
                controller: 'nrgiConcessionListCtrl'
            })
            .when('/concession/:id', {
                templateUrl: '/partials/concessions/concession-detail',
                controller: 'nrgiConcessionDetailCtrl'
            })
            .when('/admin/concession-admin', {
                templateUrl: '/partials/admin/concessions/concession-admin',
                controller: 'nrgiConcessionAdminCtrl',
                resolve: routeRoleChecks.supervisor
            })
            .when('/admin/create-concession', {
                templateUrl: '/partials/admin/concessions/create-concession',
                controller: 'nrgiConcessionAdminCreateCtrl',
                resolve: routeRoleChecks.supervisor
            })
            .when('/admin/concession-admin/:id', {
                templateUrl: '/partials/admin/concessions/concession-admin-update',
                controller: 'nrgiConcessionAdminUpdateCtrl',
                resolve: routeRoleChecks.supervisor
            })
            //.when('/concessions/map', {
            //    templateUrl: '/partials/projects/map'
            //})
            .when('/projects', {
                templateUrl: '/partials/projects/project-list',
                controller: 'nrgiProjectListCtrl'
            })
            .when('/project/:id', {
                templateUrl: '/partials/projects/project-detail',
                controller: 'nrgiProjectDetailCtrl'
            })
            .when('/projects/map', {
                templateUrl: '/partials/projects/map',
                controller: 'nrgiMapCtrl'
            })
            .when('/admin/project-admin', {
                templateUrl: '/partials/admin/projects/project-admin',
                controller: 'nrgiProjectAdminCtrl',
                resolve: routeRoleChecks.supervisor
            })
            .when('/admin/create-project', {
                templateUrl: '/partials/admin/projects/create-project',
                controller: 'nrgiProjectAdminCreateCtrl',
                resolve: routeRoleChecks.supervisor
            })
            .when('/admin/project-admin/:id', {
                templateUrl: '/partials/admin/projects/project-admin-update',
                controller: 'nrgiProjectAdminUpdateCtrl',
                resolve: routeRoleChecks.supervisor
            })
            .when('/companies', {
                templateUrl: '/partials/companies/company-list',
                controller: 'nrgiCompanyListCtrl'
            })
            .when('/company/:id', {
                templateUrl: '/partials/companies/company-detail',
                controller: 'nrgiCompanyDetailCtrl'
            })
            .when('/admin/company-admin', {
                templateUrl: '/partials/admin/companies/company-admin',
                controller: 'nrgiCompanyAdminCtrl',
                resolve: routeRoleChecks.supervisor
            })
            .when('/admin/create-company', {
                templateUrl: '/partials/admin/companies/create-company',
                controller: 'nrgiCompanyAdminCreateCtrl',
                resolve: routeRoleChecks.supervisor
            })
            .when('/admin/company-admin/:id', {
                templateUrl: '/partials/admin/companies/company-admin-update',
                controller: 'nrgiCompanyAdminUpdateCtrl',
                resolve: routeRoleChecks.supervisor
            })
            //
            ////Helper groups
            .when('/countries', {
                templateUrl: '/partials/countries/country-list',
                controller: 'nrgiCountryListCtrl'
            })
            .when('/country/:id', {
                templateUrl: '/partials/countries/country-detail',
                controller: 'nrgiCountryDetailCtrl'
            })
            .when('/admin/country-admin', {
                templateUrl: '/partials/admin/countries/country-admin',
                controller: 'nrgiCountryAdminCtrl',
                resolve: routeRoleChecks.supervisor
            })
            .when('/admin/create-country', {
                templateUrl: '/partials/admin/countries/create-country',
                controller: 'nrgiCountryAdminCreateCtrl',
                resolve: routeRoleChecks.supervisor
            })
            .when('/admin/country-admin/:id', {
                templateUrl: '/partials/admin/countries/country-admin-update',
                controller: 'nrgiCountryAdminUpdateCtrl',
                resolve: routeRoleChecks.supervisor
            })
            .when('/commodities', {
                templateUrl: '/partials/commodities/commodity-list',
                controller: 'nrgiCommodityListCtrl'
            })
            .when('/commodity/:id', {
                templateUrl: '/partials/commodities/commodity-detail',
                controller: 'nrgiCommodityDetailCtrl'
            })
            .when('/admin/commodity-admin', {
                templateUrl: '/partials/admin/commodities/commodity-admin',
                controller: 'nrgiCommodityAdminCtrl',
                resolve: routeRoleChecks.supervisor
            })
            .when('/admin/create-commodity', {
                templateUrl: '/partials/admin/commodities/create-commodity',
                controller: 'nrgiCommodityAdminCreateCtrl',
                resolve: routeRoleChecks.supervisor
            })
            .when('/admin/commodity-admin/:id', {
                templateUrl: '/partials/admin/commodities/commodity-admin-update',
                controller: 'nrgiCommodityAdminUpdateCtrl',
                resolve: routeRoleChecks.supervisor
            })
            .when('/groups', {
                templateUrl: '/partials/groups/group-list',
                controller: 'nrgiGroupListCtrl'
            })
            .when('/group/:id', {
                templateUrl: '/partials/groups/group-detail',
                controller: 'nrgiGroupDetailCtrl'
            })
            .when('/admin/group-admin', {
                templateUrl: '/partials/admin/groups/group-admin',
                controller: 'nrgiGroupAdminCtrl',
                resolve: routeRoleChecks.supervisor
            })
            .when('/admin/create-group', {
                templateUrl: '/partials/admin/groups/create-group',
                controller: 'nrgiGroupAdminCreateCtrl',
                resolve: routeRoleChecks.supervisor
            })
            .when('/admin/group-admin/:id', {
                templateUrl: '/partials/admin/groups/group-admin-update',
                controller: 'nrgiGroupAdminUpdateCtrl',
                resolve: routeRoleChecks.supervisor
            })
           .when('/sources', {
                templateUrl: '/partials/sources/source-list',
                controller: 'nrgiSourceListCtrl'
            })
            .when('/source/:id', {
                templateUrl: '/partials/sources/source-detail',
                controller: 'nrgiSourceDetailCtrl'
            })
            .when('/admin/source-admin', {
                templateUrl: '/partials/admin/sources/source-admin',
                controller: 'nrgiSourceAdminCtrl',
                resolve: routeRoleChecks.supervisor
            })
            .when('/admin/create-source', {
                templateUrl: '/partials/admin/sources/create-source',
                controller: 'nrgiSourceAdminCreateCtrl',
                resolve: routeRoleChecks.supervisor
            })
            .when('/admin/source-admin/:id', {
                templateUrl: '/partials/admin/sources/source-admin-update',
                controller: 'nrgiSourceAdminUpdateCtrl',
                resolve: routeRoleChecks.supervisor
            })

            .when('/sites', {
                templateUrl: '/partials/sites/site-list',
                controller: 'nrgiSiteListCtrl'
            })
            .when('/site/:id', {
                templateUrl: '/partials/sites/site-detail',
                controller: 'nrgiSiteDetailCtrl'
            })
            .when('/sites/map', {
                templateUrl: '/partials/sites/mapSiteAndProject',
                controller: 'nrgiMapSiteCtrl'
            })
            .when('/fields', {
                templateUrl: '/partials/sites/site-list',
                controller: 'nrgiSiteListCtrl'
            })
            .when('/field/:id', {
                templateUrl: '/partials/sites/site-detail',
                controller: 'nrgiSiteDetailCtrl'
            })
            .when('/fields/map', {
                templateUrl: '/partials/sites/mapSiteAndProject',
                controller: 'nrgiMapSiteCtrl'
            })
            .when('/source_types', {
                templateUrl: '/partials/sourceTypes/sourceType-list',
                controller: 'nrgiSourceTypeListCtrl'
            })
            .when('/source_type/:id', {
                templateUrl: '/partials/sourceTypes/sourceType-detail',
                controller: 'nrgiSourceTypeDetailCtrl'
            })
            .when('/admin/sourceType-admin', {
                templateUrl: '/partials/admin/sourceTypes/sourceType-admin',
                controller: 'nrgiSourceTypeAdminCtrl',
                resolve: routeRoleChecks.supervisor
            })
            .when('/admin/create-sourceType', {
                templateUrl: '/partials/admin/sourceTypes/create-sourceType',
                controller: 'nrgiSourceTypeAdminCreateCtrl',
                resolve: routeRoleChecks.supervisor
            })
            .when('/admin/sourceType-admin/:id', {
                templateUrl: '/partials/admin/sourceTypes/sourceType-admin-update',
                controller: 'nrgiSourceTypeAdminUpdateCtrl',
                resolve: routeRoleChecks.supervisor
            })
            //.when('/admin/site-admin', {
            //    templateUrl: '/partials/admin/sites/site-admin',
            //    controller: 'nrgiSiteAdminCtrl',
            //    resolve: routeRoleChecks.supervisor
            //})
            //.when('/admin/create-site', {
            //    templateUrl: '/partials/admin/sites/create-site',
            //    controller: 'nrgiSiteAdminCreateCtrl',
            //    resolve: routeRoleChecks.supervisor
            //})
            //.when('/admin/site-admin/:id', {
            //    templateUrl: '/partials/admin/sites/site-admin-update',
            //    controller: 'nrgiSiteAdminUpdateCtrl',
            //    resolve: routeRoleChecks.supervisor
            //})
            .when('/glossary', {
                templateUrl: '/partials/main/glossary'
            })
            .when('/contribute', {
                templateUrl: '/partials/main/contribute'
            })
            .when('/about', {
                templateUrl: '/partials/main/about'
            })
            //
            ////Transfers and related facts
            //.when('/governmentReceipt/:id', {
            //    templateUrl: '/partials/common/receipt'
            //})
            //.when('/production/:id_country/:id', {
            //    templateUrl: '/partials/main/production'
            //})
            //.when('/governmentreceipt/:id_country/:id', {
            //    templateUrl: '/partials/main/governmentreceipt'
            //})
            //
            ////Other
            //.when('/model', {
            //    templateUrl: '/partials/main/dataModel'
            //})
            //.when('/namedGraphs', {
            //    templateUrl: '/partials/main/namedGraphs'
            //})
            //.when('/classes', {
            //    templateUrl: '/partials/main/classes'
            //})
            //.when('/instances/:id', {
            //    templateUrl: '/partials/main/instances'
            //})
            .otherwise('/', {
                templateUrl: '/partials/main/main',
                controller: 'nrgiMainCtrl'
            })
    });
    // .run(['$rootScope', '$location', '$window', function(
    // $rootScope,
    // $location,
    // $window
    // ){
    //
    // }

angular.module('app')
    .run(function(
        $rootScope,
        $routeParams,
        $location,
        $window,
        $http,
        nrgiAuthSrvc,
        nrgiNotifier
    ) {
        // nrgiAuthSrvc.authenticateUser('jcust', 'admin')
        //     .then(function(success) {
        //
        //     });
        $rootScope._ = _;
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

            console.log(output);
            $window.ga(['_trackPageview', output]);
        });
    });