/**
 * @description appSDK 必须使用原生js封装和实现所有功能生成最小的sdk
 * @author cai.liao
 * @Date 2018.11.19
 * */
"use strict";

// 模块引用
var zepto = require('./module/zepto');
var appServer = require('./module/appServer');
var comClass = require('./module/comClass');
var ChartLib = require('./module/Chart');
var zzjzAppLib = {};
var appMap = {};
var comMap = appServer.getComMap();

zzjzAppLib.version = '0.0.0.1';
//zzjzAppLib.initPromise = appServer.defer;
window.angular = {
    element:zepto
};

function Error(msg) {
    this.message = msg;
    console.error(msg);
}
/**
 * @class APP
 * @description 实现app类完成基础App相关图元操作和参数
 * */
function App(app,dom) {
    if(!app||!app.id){
        throw new TypeError("App 初始化参数错误!");
    }
    if(!app.chartMap){
        console.warn("没有获取到chart错误数据");
    }
    this.id = app.id;
    this.name = app.name;
    this.paramSetting = app.paramSetting;

    // 解析初始化所需要初始化的算子
    if(app.viewComMap) {
        for(var comId in app.viewComMap) {
            if(!comMap[comId]) {
                comClass.initChartComRenderFuncObj(app.viewComMap[comId]);
                comMap[comId] = app.viewComMap[comId];
            }
        }
    }

    //初始化app chart
    this.chartList = ChartLib.createChartList(app.chartMap,dom,app.id);
}
App.prototype = {
    getAppById: function(id){
        if(id && typeof id === 'string') {
            return zzjzAppLib.apps[id];
        }
    },
    reload: function (tables) {
        if(tables && typeof tables === 'object') {
            this.chartList && this.chartList.forEach(function (chart) {
                chart.reload(tables);
            });
        }
    }
};
zzjzAppLib.apps = {};
/**
 * @method initApp
 * @description 根据传入appid从后台接口获取初始化app参数
 * @param appId {string} 对应app的id
 * @param dom {HTMLElement} 父集dom
 * */
zzjzAppLib.initApp = function (appId,dom) {
    var defer =new zepto.Deferred();
    if(appId === undefined || appId === "" || appId === null){
        defer.reject(new Error('initApp error: 请传入appId！'));
    }else {
        appServer.getAppDataById(appId).then(function (result) {
            if(result.status === 'OK' && result.data){
                zzjzAppLib.apps[appId] = new App(result.data,dom);
                defer.resolve(zzjzAppLib.apps[appId]);
            }else {
                defer.reject(result);
            }
        },function (error) {
            defer.reject(new Error(error.message));
        });
    }
    return defer.promise();
};
/**
 * @method initAppByName
 * @description 根据传入appName和userName从后台接口获取初始化app参数
 * @param appId {string} 对应app的id
 * @param dom {HTMLElement} 父集dom
 * */
zzjzAppLib.initAppByName = function (appName,userName,dom) {
    var defer =new zepto.Deferred();
    if(appName === undefined || appName === "" || appName === null){
        defer.reject(new Error('initApp error: appName is empty！'));
    }else if(userName === undefined || userName === "" || userName === null){
        defer.reject(new Error('initApp error: userName is empty！'));
    }else {
        appServer.getAppByAppName(appName,userName).then(function (result) {
            if(result.status === 'OK' && result.data){
                zzjzAppLib.apps[appId] = new App(result.data,dom);
                defer.resolve(zzjzAppLib.apps[appId]);
            }else {
                defer.reject(result);
            }
        },function (error) {
            defer.reject(new Error(error.message));
        });
    }
    return defer.promise();
};
/**
 * @method runApp
 * @description 执行app返回对应的table数据和相应的需要刷新的chart
 * @param appId {string} 对应app的id
 * */
zzjzAppLib.runApp = function(appId,paramSetting){
    var defer =new zepto.Deferred();
    if(appId === undefined || appId === "" || appId === null){
        defer.reject(new Error('initApp error: 请传入appId！'));
    }else {
        appServer.runApp(appId,paramSetting).then(function (result) {
            if(result.status === 'OK' && result.data){
                ChartLib.refreshChart(result.data);
                defer.resolve(result.data);
            }else {
                defer.reject(result);
            }
        },function (error) {
            defer.reject(new Error(error.message));
        });
    }
    return defer.promise();
};


module.exports = zzjzAppLib;