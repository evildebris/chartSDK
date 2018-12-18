/**
 * @description appSDK的前后端交互接口服务
 * */
"use strict";

// 模块引用
var $ = require('./zepto');
var host = window.config.nodeServer ;
var cases;
var comMap = {};
/*var defer = new $.Deferred();
$.get('./config.json').then(function (data) {
   host = data.nodeServer;
});*/
var service = {
    jsonp: function (url) {
        return $.ajax({
            url : url,
            type : 'get',
            dataType : 'jsonp'
        })
    },
    getAppDataById: function (id) {
        return this.jsonp(host + '/rest/getAppById'+'?appId='+id);
    },
    getAppByAppName: function (appName,userName) {
        return this.jsonp(host + '/rest/getAppByAppName'+'?appName='+appName+'&userName='+userName);
    },
    runApp: function (id,paramSetting) {
        return this.jsonp(host + '/rest/runAppGetChartData'+'?appId='+id+'&params='+JSON.stringify(paramSetting));
    },
    runLinkage: function (id,linkageId,selectedData) {
        return this.jsonp(host + '/rest/runLinkage'+'?appId='+id+'&linkageId='+linkageId+'&selectedData='+JSON.stringify(selectedData));
    },
    refreshCase: function () {
        return this.jsonp(host + '/rest/getCase').then(function (result) {
            if(result.status === 'OK' && result.data){
                cases = result.data;
            }else {
                console.error('获取图元信息错误!');
            }
            return result;
        });
    },
    getCaseCharts: function (name) {
        var cases = service.getCases();
        var result = {};
        var arr = [];
        if(cases) {
            for (var mark in cases) {
                if (mark && cases[mark]) {
                    var chcases = cases[mark];
                    for (var cn in chcases) {
                        if (cn === name && chcases[cn]) {
                            var chartIds = chcases[cn];
                            for (var i = 0; i < chartIds.length; i++) {
                                //console.log(chartIds[i]);
                                var chart = comMap[chartIds[i]];
                                if (chart) {
                                    //过滤，仅保留最新版本的图元
                                    if (!result[chart.sn]) {
                                        result[chart.sn] = {};
                                        result[chart.sn] = chart;
                                    } else {
                                        if (chart.version > result[chart.sn].version) {
                                            result[chart.sn] = chart;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            //转成数组
            for (var sn in result) {
                if (result[sn] && typeof(result[sn]) === "object") {
                    arr.push(result[sn]);
                }
            }
        }else {
            service.refreshCase();
            console.warn('图元cases信息读取错误!');
        }
        return arr;
    },
    getCases:function () {
        return cases;
    },
    setHost: function (_host) {
        if(_host) {
            host = _host;
            service.refreshCase();
        }
    },
    setComMap: function (_comMap) {
        $.extend(comMap,_comMap);
    },
    getComMap: function () {
        return comMap;
    }
};
service.refreshCase();
module.exports = service;