'use strict';

angular.module('app')
    .factory('nrgiCSV', function($filter) {
        var csv=[];
        var commodityName='';
        var companyName='';
        var countryName='';
        var typeName='';
        var name='';
        var transferValue='';
        var id='';
        var str;
        var com =', ';
        return {
         setCsv: function(fields,data) {
             csv=[]
                 angular.forEach(data, function (p, key) {
                     csv[key] = [];
                     angular.forEach(fields, function (field, i) {
                         if (field == 'transfer_value') {
                             transferValue = '';
                             transferValue = $filter('currency')(p[field], '', 0)
                             csv[key].push(transferValue);
                         }
                         if (field == 'country') {
                             countryName = '';
                             if (p[field] != undefined) {
                                 countryName = p[field].name.toString();
                                 countryName = countryName.charAt(0).toUpperCase() + countryName.substr(1);
                             }
                             csv[key].push(countryName);
                         }
                         if (field == 'company') {
                             companyName = '';
                             if (p[field] != undefined) {
                                 companyName = p[field].company_name.toString();
                                 companyName = companyName.charAt(0).toUpperCase() + companyName.substr(1);
                             }
                             csv[key].push(companyName);
                         }
                         if (field == 'proj_site_type' || field == 'production_level') {
                             type = '';
                             if (p.proj_site != undefined && p.proj_site.type != undefined) {
                                 var type = p.proj_site.type.toString();
                             }
                             csv[key].push(type)
                         }
                         if (field == 'proj_site_id') {
                             id = '';
                             if (p.proj_site != undefined && p.proj_site._id != undefined && p.proj_site.type == 'project') {
                                 var id = p.proj_site._id.toString();
                             }
                             csv[key].push(id);
                         }
                         if(field == 'production_commodity'){
                             if (p[field] && p[field].name) {
                                 commodityName = '';
                                 commodityName = p[field].name.toString();
                                 commodityName = commodityName.charAt(0).toUpperCase() + commodityName.substr(1);
                                 csv[key].push(commodityName);
                             }else{
                                 csv[key].push('');
                             }
                         }
                         if (field == 'proj_commodity' || field == 'site_commodity' || field == 'concession_commodities') {
                             if (p[field] && p[field].length > 0) {
                                 str = '';
                                 var commodities = _.uniq(p[field], function (a) {
                                     if (a) {
                                         return a._id;
                                     }
                                 });
                                 angular.forEach(commodities, function (commodity, i) {
                                     commodityName = '';
                                     if (commodity != undefined) {
                                         commodityName = commodity.commodity_name.toString();
                                         commodityName = commodityName.charAt(0).toUpperCase() + commodityName.substr(1);
                                     }
                                     if (i != commodities.length - 1) {
                                         str = str + commodityName + com;
                                     } else {
                                         str = str + commodityName;
                                         csv[key].push(str);
                                     }
                                 })
                             } else {
                                 csv[key].push('');
                             }
                         }
                         if (field == 'proj_status'||field == 'site_status' || field == 'concession_status') {
                             if (p[field] && p[field].timestamp && p[field].string) {
                                 str = '';
                                 var date = new Date(p[field].timestamp);
                                 date = $filter('date')(date, "MM/dd/yyyy @ h:mma");
                                 var statusName = p[field].string.toString();
                                 statusName = statusName.charAt(0).toUpperCase() + statusName.substr(1);
                                 str = str + statusName + ' (true at ' + date + ')';
                                 csv[key].push(str);
                             } else {
                                 csv[key].push('');
                             }
                         }
                         if (field == 'proj_country' || field == 'site_country' || field == 'concession_country') {
                             console.log(p[field])
                             if (p[field] && p[field].length > 0) {
                                 str = '';
                                 angular.forEach(p[field], function (country, i) {
                                     countryName = '';
                                     if (country != undefined) {
                                         countryName = country.name.toString();
                                         countryName = countryName.charAt(0).toUpperCase() + countryName.substr(1);
                                     }
                                     if (i != p[field].length - 1) {
                                         str = str + countryName + com;
                                     } else {
                                         str = str + countryName;
                                         csv[key].push(str);
                                     }
                                 })
                             } else {
                                 csv[key].push('');
                             }
                         }
                         if (field == 'companies') {
                             if (p[field] && p[field].length > 0) {
                                 str = '';
                                 angular.forEach(p[field], function (company, i) {
                                     companyName = '';
                                     if (company != undefined) {
                                         companyName = company.company_name.toString();
                                         companyName = companyName.charAt(0).toUpperCase() + companyName.substr(1);
                                     }
                                     if (i != p[field].length - 1) {
                                         str = str + companyName + com;
                                     } else {
                                         str = str + companyName;
                                         csv[key].push(str);
                                     }
                                 })
                             } else {
                                 csv[key].push('');
                             }
                         }
                         if (field == 'proj_type') {
                             if (p.proj_commodity && p.proj_commodity.length > 0) {
                                 str = '';
                                 var projCommodity = _.uniq(p.proj_commodity, function (a) {
                                     if (a) {
                                         return a.commodity_type;
                                     }
                                 });
                                 angular.forEach(projCommodity, function (type, i) {
                                     typeName = '';
                                     if (type != undefined) {
                                         typeName = $filter('addSpaces')(type.commodity_type);
                                         typeName = typeName.charAt(0).toUpperCase() + typeName.substr(1);
                                     }
                                     if (i != projCommodity.length - 1) {
                                         str = str + typeName + com;
                                     } else {
                                         str = str + typeName;
                                         csv[key].push(str);
                                     }
                                 })
                             } else {
                                 csv[key].push('');
                             }
                         }
                         if (field == 'concession_type') {
                             if (p.concession_commodity && p.concession_commodity.length > 0) {
                                 str = '';
                                 var concessionCommodity = _.uniq(p.concession_commodity, function (a) {
                                     return a.commodity_type;
                                 });
                                 angular.forEach(concessionCommodity, function (type, i) {
                                     typeName = type.commodity_type.toString();
                                     typeName = typeName.charAt(0).toUpperCase() + typeName.substr(1);
                                     if (i != concessionCommodity.length - 1) {
                                         str = str + typeName + com;
                                     } else {
                                         str = str + typeName;
                                         csv[key].push(str);
                                     }
                                 })
                             } else {
                                 csv[key].push('');
                             }
                         }
                         if (field == 'site_commodity_type') {
                             if (p.site_commodity && p.site_commodity.length > 0) {
                                 str = '';
                                 var commodityType = _.uniq(p.site_commodity, function (a) {
                                     return a.commodity_type;
                                 });
                                 angular.forEach(commodityType, function (type, i) {
                                     typeName =  $filter('addSpaces')(type.commodity_type);
                                     typeName = typeName.charAt(0).toUpperCase() + typeName.substr(1);
                                     if (i != commodityType.length - 1) {
                                         str = str + typeName + com;
                                     } else {
                                         str = str + typeName;
                                         csv[key].push(str);
                                     }
                                 })
                             } else {
                                 csv[key].push('');
                             }
                         }
                         if (field == 'proj_id') {
                             id = '';
                             if (p.proj_site != undefined && p.proj_site._id != undefined) {
                                 id = p.proj_site._id.toString();
                             }
                             csv[key].push(id);
                         }
                         if (field == 'proj_site') {
                             name = '';
                             if (p[field] != undefined && p[field].name != undefined) {
                                 name = p[field].name.toString();
                             }
                             csv[key].push(name);
                         }
                         if (field != 'proj_status' && field != 'proj_commodity' && field != 'proj_type' && field != 'proj_country' && field != 'companies' &&
                             field != 'site_status' && field != 'site_commodity' && field != 'site_commodity_type' && field != 'site_country' &&
                             field != 'concession_status' && field != 'concession_commodities' && field != 'concession_type' && field != 'concession_country' &&
                             field != 'production_commodity' && field != 'proj_site' && field != 'production_level' && field != 'proj_id' &&
                             field != 'company' && field != 'country' &&  field != 'proj_site_type' && field != 'proj_site_id' && field != 'transfer_value') {
                             csv[key].push(p[field]);
                         }
                         if (data.length - 1 == key && fields.length - 1 == i) {
                             return csv
                         }
                     });

                 })
         },
            getResult: function() {
                    return csv;
            }
        }
    });

