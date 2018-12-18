var $ = require('./zepto');
//图元入口文件
function ctnInit(plugins){
    // code...
    console.log(plugins);

    var defer = $.Deferred(); //创建defer对象

    if($.isObject(plugins)){
        var multiFileObj = {};
        var jsTplArr = [];
        var pluginStr = plugins.plugin;
        var idx = plugins.variables.indexOf(",");
        var variablesArr = [];
        var flag = 0;

        if(idx > 0){
            variablesArr = plugins.variables.split(",");
        }else{
            variablesArr.push(plugins.variables);
        }

        if(plugins.js && plugins.js.length > 0){
            plugins.js.forEach( function (node, num) {
                //异步操作
                getChartPlugin(pluginStr + node.param.url).then(function(res){
                    console.debug("res object is %o", res);
                    flag++;
                    jsTplArr[num] = res;

                    //判断是否执行完所有Promise异步操作
                    if(flag === plugins.js.length){
                        var chartLib = new chartLibPlugin(jsTplArr, variablesArr);
                        console.debug("pluginObj object is %o", chartLib);
                        multiFileObj = chartLib.pluginObj;
                        console.debug("multiFileObj object is %o", multiFileObj);
                        defer.resolve(multiFileObj);
                    }
                }, function error(res){
                    console.log('第三方资源加载失败！');
                    defer.reject(res);
                });
            });
        }

        return defer.promise
    }else{
    }
}

//获取图元插件
function getChartPlugin(url, num){
    var defer = $.Deferred(); //创建defer对象

    $.get(url).then(function success(res) {
        if(res.status === 200){
            var jsTpl = res.data;

            defer.resolve(jsTpl);
        }else{
            console.log('第三方资源请求失败！');
            defer.reject(res);
        }
    }, function error(res){
        console.log('第三方资源请求失败！');
        defer.reject(res);
    });

    return defer.promise
}

//插件封装
function chartLibPlugin(jsTplArr, variablesArr){
    var pluginObj = {};
    var _self = this;

    //执行第三方插件
    for(var i=0; i<jsTplArr.length; i++){
        eval(jsTplArr[i]);
    }

    //获取对象
    variablesArr.forEach(function (node) {
        pluginObj[node] = _self[node];//$.copy(_self[node])
        //delete _self[node];
    });

    _self.pluginObj = pluginObj;
}

module.exports = {
    ctnInit: ctnInit
};