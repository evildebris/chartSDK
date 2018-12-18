/**
 * @author cai.liao
 * 实现Chart类和相关服务功能
 * */

var appServer = require('./appServer');
var chartContainerSer = require('./chartContainer');
var $ = require('./zepto');
var allChartMap = {};
var linkCahrtMap = {};
var linkedCahrtMap = {};
function Chart(chartData,appId) {
    if(!chartData&&!chartData.chartId){
       throw new TypeError('图元信息初始化参数错误！');
    }
    this.initArgs = chartData;
    this.selectedChart = this.initArgs.paramSetting.value;
    this.chartId = chartData.chartId;
    this._appId = appId;
    if(this.initArgs.container && this.initArgs.container instanceof HTMLElement){
        this.initChart(this.initArgs.container);
    }
}
Chart.prototype = {
    initChart: function (dom,chartDatas) {
        var _this = this;
        if(!dom || !(dom instanceof HTMLElement)){
            throw new TypeError('initChart初始化参数错误！');
        }
        _this.resultData = chartDatas || {};
        _this.initArgs.container = dom;
        if(!_this.initArgs.parentLinkChartId){
            _this.render();
        }
    },
    render: function () {
        if(!this.initArgs.container){
            return;
        }
        var _this = this;
        var viewComArr = appServer.getCaseCharts(_this.initArgs.caseVal);
        if(viewComArr && viewComArr.length){
            viewComArr.forEach(function (viewCom) {
                if(_this.selectedChart === viewCom.id){
                    if(viewCom.plugins){
                        try {
                            chartContainerSer.ctnInit(viewCom.plugins).then(function () {

                            });
                        }catch (e){
                            console.log('容器加载error: %s',e);
                        }
                    }
                    if(_this.instance){// 关闭回调
                        viewCom.template.renderFuncObj.close(_this.instance);
                        _this.instance = null;
                    }
                    // 渲染图元
                    _this.instance = viewCom.template.renderFuncObj.render(_this.instance, _this.initArgs, _this.initArgs.theme, _this.resultData);
                }
            })
        }
    },
    resize: function () {
        if(this.instance){
            this.instance.resize && this.instance.resize();
        }
    },
    reload: function (chartDatas) {
        if(chartDatas && typeof chartDatas === 'object'){
            this.resultData = chartDatas;
            this.render();
        }
    },
    /**
     * @method doLinkage
     * @description 触发联动，但没有配置联动或者未选择联动时该方法会报错
     * */
    doLinkage: function () {
        if(!linkedCahrtMap[this.chartId]) {
            throw new TypeError('该图没有设置联动，请先设置对应联动！');
        }
        if(!this.initArgs.selectedData||!this.initArgs.selectedData.tables){
            throw new TypeError('请先在图上选择联动数据！');
        }
        var linkageId = this.initArgs.viewResultId + '_' + this.initArgs.layoutId;
        var _this = this;
        appServer.runLinkage(this._appId,linkageId,this.initArgs.selectedData).then(function (result) {
            if(result.status === 'OK' && result.data){
                var linkedChart = allChartMap[linkedCahrtMap[_this.chartId]];
                if(linkedChart){
                    _this.resultData = result.data;
                    _this.selectedChart = linkedChart.initArgs.paramSetting.value;
                    _this.chartId = linkedChart.chartId;
                    $.extend(_this.initArgs,linkedChart.initArgs);
                    _this.render();
                }
            }else {
                throw new TypeError(result.message);
            }
        });
    }
};
function createChartList(chartMap,parentDom,appId) {
    var chartList = [],hasParent;
    if(parentDom && parentDom instanceof HTMLElement){
        $(parentDom).addClass("chart_window");
        hasParent = true;
    }
    for(var chartId in chartMap){
        if(hasParent && !chartMap[chartId].parentLinkChartId){ // 将所有
            var div = $(document.createElement('div'));
            var div2 = $(document.createElement('div'));
            div.addClass('chart_box');
            div2.addClass('chart_body');
            div.append(div2);
            $(parentDom).append(div);
            chartMap[chartId].container = div2[0];
        }
        allChartMap[chartId] = new Chart(chartMap[chartId],appId);
        if(!allChartMap[chartId].initArgs.parentLinkChartId) { //是否是联动图元
            chartList.push(allChartMap[chartId]);
        }else {
            linkCahrtMap[chartId] = allChartMap[chartId].initArgs.parentLinkChartId;
            linkedCahrtMap[allChartMap[chartId].initArgs.parentLinkChartId] = chartId;
        }
    }
    return chartList;
}
function refreshChart(nodeDataList) {
    nodeDataList.forEach(function (nodeData) {
        if($.isArray(nodeData.chartList)){
            nodeData.chartList.forEach(function (chartId) {
                var chart =allChartMap[chartId];
                chart.initArgs.viewResultId = nodeData.viewResultId;
                if(chart && !chart.initArgs.parentLinkChartId){
                    chart.reload(nodeData.result);
                }
            })
        }
    })
}
$(window).on('resize',function () {
    for(var chartId in allChartMap){
        var chart =allChartMap[chartId];
        if(chart && chart.instance){
            chart.resize();
        }
    }
});
module.exports = {
    Chart: Chart,
    createChartList: createChartList,
    refreshChart: refreshChart
};

/**********************************************chart全局方法*************************************************/
/**
 * Created by tanglvshuang on 2017/4/25 0025. dom,数据,数据,echats实例,作用域
 */
function createBrush(params) {
    var objBrush = new Object();
    var isCrosshair=false;
    objBrush.dom = params.dom;
    objBrush.theme=params.theme;
    objBrush.params = params;
    objBrush.chart = params.charts;
    objBrush.dataset = params.dataset;
    objBrush.brushF = params.brushF;
    objBrush.isInit = true;
    objBrush.initArgs = params.initArgs;
    objBrush.iPrevX = 0, //起点X
        objBrush.iPrevY = 0, //起点Y
        objBrush.upperX = 0;
    objBrush.upperY = 0;
    objBrush.color = 'rgba(0, 0, 0, 0.1);';
    objBrush.w = 0; //宽
    objBrush.h = 0; //高
    objBrush.x = 0;
    objBrush.y = 0;
    objBrush.p = null;
    objBrush.isInit = true;
    var hasclick=false;
    objBrush.draw = function (x, y, w, h, color) {
        this.x = x
        this.y = y
        this.w = w
        this.h = h
        if (this.w > 0 && this.h > 0 && objBrush.theme=="customed") {
            objBrush.chart.setOption({
                graphic: {
                    type: 'rect',
                    id: "rect",
                    zlevel: 10000,
                    draggable: true,
                    cursor: 'move',
                    bounding: 'all',
                    shape: {
                        x: this.x,
                        y: this.y,
                        width: this.w,
                        height: this.h,
                        lineWidth: 50,
                    },
                    style: {
                        fill: 'rgba(204,204,204,0.5)',
                        stroke: 'rgba(234,234,234,0.5)',
                        lineWidth: 2,
                    },
                    onmouseover: function (e) {
                        var canvas = e.event.currentTarget.querySelectorAll('canvas');
                        angular.forEach(canvas, function (canva) {
                            canva.style.cursor = "move";
                        });
                    },
                    onmouseout: function (e) {
                        var canvas = e.event.currentTarget.querySelectorAll('canvas');
                        angular.forEach(canvas, function (canva) {
                            canva.style.cursor = "pointer";
                            objBrush.isInit = true; //移除激活
                            objBrush.iPrevX = 0; //鼠标点击 first
                            objBrush.p = null;
                        });
                    },
                    onclick:
                    //ondragend:
                        function (e) {
                            var transform = this.transform;
                            //var moveX=transform[4];
                            //var moveY=transform[5];//拖拽之后的左上角X,Y 也是最低点
                            var startX = e.target.shape.x; //起始x
                            var startY = e.target.shape.y; //起始y
                            var position = e.target.position; //平移坐标
                            var moveX = startX + position[0]; //移动之后的最小X
                            var moveY = startY + position[1]; //移动之后的最小Y
                            var maxX = moveX + e.target.shape.width;
                            var maxY = moveY + e.target.shape.height;
                            objBrush.initArgs.range = [
                                [maxX, maxY],
                                [moveX, moveY]
                            ];
                            objBrush.brushF(objBrush.initArgs, objBrush.chart, objBrush.dataset);
                            // objBrush.brushSelectedForceFunction(objBrush.params,objBrush.param,objBrush.chart,moveX,moveY,maxX,maxY);
                        }
                }
            });
        }else {
            objBrush.chart.setOption({
                graphic: {
                    type: 'rect',
                    id: "rect",
                    zlevel: 10000,
                    draggable: true,
                    cursor: 'move',
                    bounding: 'all',
                    shape: {
                        x: this.x,
                        y: this.y,
                        width: this.w,
                        height: this.h,
                        lineWidth: 50,
                    },
                    style: {
                        fill: 'rgba(0,0,0,0.2)',
                        stroke: 'rgba(0,0,0,0.5)',
                        lineWidth: 2,
                    },
                    onmouseover: function (e) {
                        var canvas = e.event.currentTarget.querySelectorAll('canvas');
                        angular.forEach(canvas, function (canva) {
                            canva.style.cursor = "move";
                        });
                    },
                    onmouseout: function (e) {
                        var canvas = e.event.currentTarget.querySelectorAll('canvas');
                        angular.forEach(canvas, function (canva) {
                            canva.style.cursor = "pointer";
                            objBrush.isInit = true; //移除激活
                            objBrush.iPrevX = 0; //鼠标点击 first
                            objBrush.p = null;
                        });
                    },
                    onclick:
                    //ondragend:
                        function (e) {
                            var transform = this.transform;
                            //var moveX=transform[4];
                            //var moveY=transform[5];//拖拽之后的左上角X,Y 也是最低点
                            var startX = e.target.shape.x; //起始x
                            var startY = e.target.shape.y; //起始y
                            var position = e.target.position; //平移坐标
                            var moveX = startX + position[0]; //移动之后的最小X
                            var moveY = startY + position[1]; //移动之后的最小Y
                            var maxX = moveX + e.target.shape.width;
                            var maxY = moveY + e.target.shape.height;
                            objBrush.initArgs.range = [
                                [maxX, maxY],
                                [moveX, moveY]
                            ];
                            objBrush.brushF(objBrush.initArgs, objBrush.chart, objBrush.dataset);
                            // objBrush.brushSelectedForceFunction(objBrush.params,objBrush.param,objBrush.chart,moveX,moveY,maxX,maxY);
                        }
                }
            });
        }
        //清空初始化
        var canvas = objBrush.dom.querySelectorAll('canvas');
        angular.forEach(canvas, function (canva) {
            canva.style.cursor = "crosshair";
            objBrush.isInit = true; //移除激活
            objBrush.iPrevX = 0; //鼠标点击 first
            objBrush.p = null;
        });
    }
    objBrush.draw1 = function (x, y, w, h, color) {
        this.x = x
        this.y = y
        this.w = w
        this.h = h
        if (this.w > 0 && this.h > 0 && objBrush.theme=="customed") {
            objBrush.chart.setOption({
                graphic: {
                    type: 'rect',
                    id: "rect",
                    zlevel: 10000,
                    draggable: true,
                    cursor: 'move',
                    bounding: 'all',
                    shape: {
                        x: this.x,
                        y: this.y,
                        width: this.w,
                        height: this.h,
                        lineWidth: 50,
                    },
                    style: {
                        fill: 'rgba(204,204,204,0.5)',
                        stroke: 'rgba(234,234,234,0.5)',
                        lineWidth: 2,
                    },
                }
            });
        }else {
            objBrush.chart.setOption({
                graphic: {
                    type: 'rect',
                    id: "rect",
                    zlevel: 10000,
                    draggable: true,
                    cursor: 'move',
                    bounding: 'all',
                    shape: {
                        x: this.x,
                        y: this.y,
                        width: this.w,
                        height: this.h,
                        lineWidth: 50,
                    },
                    style: {
                        fill: 'rgba(0,0,0,0.2)',
                        stroke: 'rgba(0,0,0,0.5)',
                        lineWidth: 2,
                    },
                }
            });
        }
    }
    objBrush.OnMouseMove = function (evt) {
        // if (this.p && this.p.isDown) {
        //     var X = evt.layerX - objBrush.p.w / 2;
        //     var Y = evt.layerY - objBrush.p.h / 2;
        // }
        // if (hasclick){
        var X = evt.offsetX;
        var Y = evt.offsetY;
        var width = Math.floor(X - this.iPrevX);
        var height = Math.floor(Y - this.iPrevY);
        this.w = Math.abs(width);
        this.h = Math.abs(height);
        // var canvas = this.dom.querySelectorAll('canvas');
        // // var isCrosshair = false; //是否开启鼠标画矩形
        // angular.forEach(canvas, function (canva) {
        //     if (canva.style.cursor == "crosshair") {
        //         isCrosshair = true;
        //     }
        // });
        if (hasclick) {
            objBrush.p=null;
            this.p = new this.draw1(this.iPrevX, this.iPrevY, this.w, this.h, this.color);
            this.upperX = this.iPrevX; //上一次画的开始节点
            this.upperY = this.iPrevY;
            evt.stopPropagation(); //阻止事件冒泡
        } else {
            evt.preventDefault(); //事件冒泡
        }
        // }
    }
    objBrush.OnMouseDown = function (evt) {

        var X = evt.offsetX;
        var Y = evt.offsetY;

        if ((this.isInit && this.iPrevX == 0)) {
            this.iPrevX = X;
            this.iPrevY = Y;
        }
        var canvas = this.dom.querySelectorAll('canvas');
        var isCrosshair = false; //是否开启鼠标画矩形
        angular.forEach(canvas, function (canva) {
            if (canva.style.cursor == "crosshair") {
                isCrosshair = true;
                hasclick=true;
            }
        });
        if (isCrosshair) {
            evt.stopPropagation(); //阻止事件冒泡
        } else {
            evt.preventDefault(); //事件冒泡
        }
    }
    //力引导图刷选数据
    objBrush.brushSelectedForceFunction = function () {

    }
    objBrush.OnMouseUp = function (evt) {
        var X = evt.offsetX;
        var Y = evt.offsetY;
        var width = Math.floor(X - this.iPrevX);
        var height = Math.floor(Y - this.iPrevY);
        this.w = Math.abs(width);
        this.h = Math.abs(height);
        var canvas = this.dom.querySelectorAll('canvas');
        // var isCrosshair = false; //是否开启鼠标画矩形
        angular.forEach(canvas, function (canva) {
            if (canva.style.cursor == "crosshair") {
                isCrosshair = true;
            }
        });
        if (isCrosshair) {
            objBrush.p=null;
            this.p = new this.draw(this.iPrevX, this.iPrevY, this.w, this.h, this.color);
            this.upperX = this.iPrevX; //上一次画的开始节点
            this.upperY = this.iPrevY;
            angular.forEach(canvas, function (canva) {
                if (canva.style.cursor == "crosshair") {
                    canva.style.cursor = "pointer"
                }
            });
            evt.stopPropagation(); //阻止事件冒泡
        } else {
            evt.preventDefault(); //事件冒泡
        }
        hasclick=false;
        isCrosshair=false;
        // this.dom.removeEventListener("mousemove",this.OnMouseMove.bind(this),true);
        //}
    }
    objBrush.event = function () {
        this.dom.addEventListener("mousedown", this.OnMouseDown.bind(this), true);
        this.dom.addEventListener("mousemove",this.OnMouseMove.bind(this),true);
        this.dom.addEventListener("mouseup", this.OnMouseUp.bind(this), true);
    }
    objBrush.event();
    return objBrush;
}
/*
 * editor : taoyahui
 * date : 2018.01.11 09:30:10
 * */
//随机整数
function RandomNumBetween(Min, Max) {
    var Range = Max - Min + 1;
    var Rand = Math.random();
    var num = Min + Math.floor(Rand * Range); //取整
    return num;
}
//取索引
function getIndex(name, tableName, dataset) {
    var dataIndex;
    for (var i = 0; i < dataset[tableName].schema.length; i++) {
        if (dataset[tableName].schema[i].name == name) {
            dataIndex = dataset[tableName].schema[i].index;
            break;
        }
    }
    return dataIndex;
}
//判断拖入设置的数据列的数据格式是不是和需求复合
function checkDataType(setArray, tableName, dataset, targetType, call) {
    for (var i = 0, setArrayLength = setArray.length; i < setArrayLength; i++) {
        var currentSetIndex = getIndex(setArray[i].name, tableName, dataset);
        var helpArray = [];
        for (var j = 0, tableLength = dataset[tableName].table.length; j < tableLength; j++) {
            var randomData = RandomNumBetween(0, dataset[tableName].table.length - 1);
            while (helpArray.indexOf(randomData) > -1) {
                randomData = RandomNumBetween(0, dataset[tableName].table.length - 1);
            }
            helpArray.push(randomData);
            if (dataset[tableName].table[randomData][currentSetIndex] != undefined && dataset[tableName].table[randomData][currentSetIndex] != "null") {
                if (typeof dataset[tableName].table[randomData][currentSetIndex] == targetType) {
                    break;
                } else {
                    if (call) {
                        call(setArray[i].name);
                    }
                    return false;
                }
            }
        }
    }
    return true;
}
/*
 * editor : xiafangliang
 * date : 2018.01.19 09:30:10
 * */
function checkTypeTy(initArgs, dataset, charts, arrListName, targetType, checkText) {
    var tableName = initArgs.paramSetting.tableName;
    for (var i = 0; i < arrListName.length; i++) {
        var ele = arrListName[i];
        if ((ele != undefined) && (ele instanceof Array) && (ele.length > 0)) {
            var flag = checkDataType(ele, tableName, dataset, targetType, function (item) {
                (checkText.innerHTML == "") && (checkText.innerHTML = item + "与所需数据类型不匹配,未生效,请检查!");
            });
        }
    }
};

function promptExceptionData(initArgs, dataset, charts, arrListIdnex, dataType, checkText) {
    var p = initArgs.paramSetting;
    var tableName = p.tableName;
    if (arrListIdnex.companionLocusTableName) tableName = p.companionLocusTableName;
    var data = dataset[tableName].table;
    var tips = function (checkText) {
        if (checkText.innerHTML == "") {
            checkText.innerHTML = "有异常数据,已处理,请检查!";
            charts.timer = setTimeout(function () {
                $(checkText).remove();
            }, 5000);
        }
    }
    if (dataType == "number") {
        for (var i = 0; i < arrListIdnex.length; i++) {
            var listIndex = arrListIdnex[i][0];
            var type = arrListIdnex[i][1];
            if (listIndex != undefined) {
                for (var j = 0; j < data.length; j++) {
                    var ele = data[j];
                    switch (type) {
                        case "longitude":
                            if (ele[listIndex] == null || ele[listIndex] > 180 || ele[listIndex] < -180) {
                                tips(checkText);
                            };
                            break;
                        case "latitude":
                            if (ele[listIndex] == null || ele[listIndex] > 90 || ele[listIndex] < -90) {
                                tips(checkText);
                            };
                            break;
                        case "number":
                            if (ele[listIndex] == null) {
                                tips(checkText);
                            };
                            break;
                    }
                }
            } else {
                return;
            }
        }
    } else if (dataType == "string") {
        var reg = new RegExp(/^\[.*\]$/);
        for (var i = 0; i < arrListIdnex.length; i++) {
            var listIndex = arrListIdnex[i][0];
            var type = arrListIdnex[i][1];
            if (listIndex != undefined) {
                for (var j = 0; j < data.length; j++) {
                    var el;
                    if (reg.test(data[j][listIndex])) {
                        el = JSON.parse(data[j][listIndex]);
                    } else {
                        tips(checkText);
                    };
                    switch (type) {
                        case "track2D":
                            if (el.length > 1) {
                                for (var k = 0; k < el.length; k++) {
                                    var et = el[k];
                                    if ((typeof et[0] != "number") || (typeof et[1] != "number")) {
                                        tips(checkText);
                                    } else if ((typeof et[0] == "number") && (typeof et[1] == "number")) {
                                        if (et[0] > 180 || et[0] < -180 || et[1] > 90 || et[1] < -90) {
                                            tips(checkText);
                                        }
                                    }
                                }
                            } else {
                                tips(checkText);
                            }
                            break;
                        case "track3D":
                            if (el.length > 1) {
                                for (var k = 0; k < el.length; k++) {
                                    var et = el[k];
                                    if ((typeof et[0] != "number") || (typeof et[1] != "number")) {
                                        tips(checkText);
                                    } else if ((typeof et[0] == "number") && (typeof et[1] == "number")) {
                                        if (et[0] > 180 || et[0] < -180 || et[1] > 90 || et[1] < -90) {
                                            tips(checkText);
                                        }
                                    }
                                    if (et[2] != undefined) {
                                        if (typeof et[2] != "number") {
                                            tips(checkText);
                                        }
                                    }
                                }
                            } else {
                                tips(checkText);
                            }
                            break;
                    }
                }
            } else {
                return;
            }
        }
    } else {
        return;
    }
};
/* end : 2018.01.11 09:30:10 */

function DrawBrush(canvas,ctx,params,param,chart,scope){
    this._init_(canvas,ctx,params,param,chart,scope);
}
DrawBrush.prototype ={
    constructor:DrawBrush,
    scope:null,
    params:null,
    param:null,
    chart:null,
    _init_:function(canvas,ctx,params,param,chart,scope){
        this.ctx=ctx;
        this.scope=scope;
        this.params=params;
        this.param=param;
        this.chart=chart,

            /* DrawBrush.prototype.scope=scope;
             DrawBrush.prototype.params=params;
             DrawBrush.prototype.param=param;
             DrawBrush.prototype.chart=chart;*/
            this.canvas=canvas;
        this.canvas.style.cursor="crosshair"; //zIndex=888;
        //  this.canvas.style="zIndex:10000";
        this.event(canvas);
        this.draw.prototype=this;
        this.setForce.prototype=this;
        this.brushSelectedForceFunction.prototype=this;
        this.isInit=true;
        this.iPrevX=0,//起点X
            this.iPrevY=0,//起点Y
            this.upperX=0;
        this.upperY=0;
        this.color='rgba(0, 0, 0, 0.1);';
        this.w=0;//宽
        this.h=0;//高
    },
    draw:function(x,y,w,h,color){
        //this.ctx.clearRect(this.x-1,this.y-1,this.w+2,this.h+2);
        //this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
        //this.ctx.globalAlpha = 0.8;
        this.x=x
        this.y=y
        this.w=w
        this.h=h
        if(this.w>0&&this.h>0){
            this.chart.setOption({
                graphic: {
                    type: 'rect',
                    id: 'rect',
                    zlevel:10000,
                    draggable:true,
                    cursor:'move',
                    bounding:'all',
                    shape: {
                        x: this.x,
                        y: this.y,
                        width:this.w,
                        height:this.h,
                        lineWidth:12,
                    },
                    style:{
                        fill:'rgba(0,0,0,0.2)',
                    },
                    ondragend:function(e){
                        var transform =this.transform;
                        //var moveX=transform[4];
                        //var moveY=transform[5];//拖拽之后的左上角X,Y 也是最低点
                        var startX= e.target.shape.x;//起始x
                        var startY= e.target.shape.y;//起始y
                        var position= e.target.position; //平移坐标
                        var moveX=startX+position[0];//移动之后的最小X
                        var moveY=startY+position[1];//移动之后的最小Y
                        var maxX=moveX+e.target.shape.width;
                        var maxY=moveY+e.target.shape.height;
                        //this.brushSelectedForceFunction(this.params,this.param,this.chart,moveX,moveY,maxX,maxY);
                    }

                }
            });
        }
        //this.color=color
        //this.ctx.fillStyle = "rgba(0,0,0,0.2)";
        //this.ctx.strokeStyle=this.color
        //this.upperX=this.x;//上一次画的开始节点
        //this.upperY=this.y;
        //this.ctx.strokeRect(this.x,this.y,this.w,this.h);

    },
    OnMouseMove:function(evt){
        if(this.p&&this.p.isDown){
            var X=evt.layerX-this.p.w/2;
            var Y=evt.layerY-this.p.h/2;
            //this.p.draw(X,Y,this.w,this.h,this.color);
        }
    },
    OnMouseDown:function(evt){
        var X=evt.layerX;
        var Y=evt.layerY;
        if(this.p){
            if(X<this.p.x+this.p.w&&X>this.p.x)
            {
                if(Y<this.p.y+this.p.h&&Y>this.p.y){
                    this.p.isDown=true;
                }
            }
            else
            {
                this.p.isDown=false;
            }
        }
        if((this.isInit&&this.iPrevX==0)){
            this.iPrevX=X;
            this.iPrevY=Y;
        }else{
            /**if(!this.ctx.isPointInPath(X,Y)){//初始化||判断是否在矩形内,不在则清空上一次的画的内容,重新画矩形
					  this.upperX=this.iPrevX;
					  this.upperY=this.iPrevY;
					  this.iPrevX=X;
					  this.iPrevY=Y;

				 }**/
        }
    },
//力引导图刷选数据
    brushSelectedForceFunction:function(params,param,chart,_minX,_minY,_maxX,_maxY){
        console.log(this);
        Array.prototype.unique = function (isStrict) {
            if (this.length < 2)
                return [this[0]] || [];
            var tempObj = {}, newArr = [];
            for (var i = 0; i < this.length; i++) {
                var v = this[i];
                var condition = isStrict ? (typeof tempObj[v] != typeof v) : false;
                if ((typeof tempObj[v] == "undefined") || condition) {
                    tempObj[v] = v;
                    newArr.push(v);
                }
            }
            return newArr;
        }
        if(params.tableData["inputTableName1"].rows.length!=0) {
            String.prototype.startWith = function (str) {
                if (str == null || str == "" || this.length == 0 || str.length > this.length)
                    return false;
                if (this.substr(0, str.length) == str)
                    return true;
                else
                    return false;
                return true;
            }
            //获取数据index
            function getIndexByName(list, name) {
                for (var i = 0; i < list.length; i++) {
                    if (list[i].name.startWith(name)) {
                        return list[i].index;
                    }
                }
            };
            String.prototype.trim = function () {

                // 用正则表达式将前后空格
                // 用空字符串替代。
                return this.replace(/(^\s*)|(\s*$)/g, "");
            }
            var inputTableName = params.paramModel.inputTableName1.trim();
            //inputTableName 关系节点
            var inputColumnNames = params.tableData["inputTableName1"].columnNames;
            var subType = params.paramModel.subType;
            var inputTableRows = params.tableData["inputTableName1"].rows;
            var nodeID = (param.paramModel.nodesid).split(",");//节点ID
            var nodeIDIndex = getIndexByName(inputColumnNames, nodeID[0]);//数据ID

            var inputList = [];
            for (var i = 0; i < inputColumnNames.length; i++) {
                var index = inputColumnNames[i].index;
                var name = inputColumnNames[i].name.replace(/\(.+\)/g, "");
                var obj = new Object();
                obj.id = index;
                obj.name = name;
                inputList.push(obj);
            }
            ;


            var inputDragParam = {
                all: false,
                type: subType,
                sourceData: null,
                inputTableName: inputTableName,
                rows: null,
                lists: inputList,
                params: []
            };
            /////////////////////////////关系表
            //是否包含关系表
            var isHasRelation = false;
            var inputListRelation = [];
            var inputTableNameRelation = null;
            var inputColumnNamesRelation = null;
            var inputTableRowsRelation = null;
            var linkssource = null;
            var linkssourceIndex = null;
            var linkstarget = null;
            var linkstargetIndex = null;
            var inputDragParamRelation = null;
            if (params.tableData["inputTableName2"]) {
                isHasRelation = true;
            }
            if (isHasRelation) {
                inputTableNameRelation = params.paramModel.inputTableName2.trim();
                inputColumnNamesRelation = params.tableData["inputTableName2"].columnNames;
                inputTableRowsRelation = params.tableData["inputTableName2"].rows;

                linkssource = (param.paramModel.linkssource).split(",");//起始节点 ID
                linkssourceIndex = getIndexByName(inputColumnNamesRelation, linkssource[0]);//起始节点index

                linkstarget = (param.paramModel.linkstarget).split(",");//起始节点 ID
                linkstargetIndex = getIndexByName(inputColumnNamesRelation, linkstarget[0]);//起始节点index
                for (var i = 0; i < inputColumnNamesRelation.length; i++) {
                    var index = inputColumnNamesRelation[i].index;
                    var name = inputColumnNamesRelation[i].name.replace(/\(.+\)/g, "");
                    var obj = new Object();
                    obj.id = index;
                    obj.name = name;
                    inputListRelation.push(obj);
                }
                ;
                inputDragParamRelation = {
                    all: false,
                    type: subType,
                    sourceData: null,
                    inputTableName: inputTableNameRelation,
                    rows: null,
                    lists: inputListRelation,
                    params: []
                };
            }
            //////////////////////////////////////////////过滤数据
            //存放源数据节点数据
            var inputTableSourceData = {
                columnNames: inputColumnNames,
                rows: []
            };
            var inputRow = [];//存放源数据节点 Index
            //存放源数据关系节点数据
            var inputTableSourceDataRelation = {
                columnNames: inputColumnNamesRelation,
                rows: []
            };
            var inputRowRelation = [];//存放源数据关系节点 Index
            var inRange = [];//获取在这个范围内的

            var series = chart._model.option.series;
            var graphicEls = chart._chartsViews[0]._model.getData()._graphicEls;//真实值
            for (var j = 0; j < series.length; j++) {
                var datas = chart._model.option.series[j].data;
                for (var i = 0; i < datas.length; i++) {
                    var obj = datas[i];
                    //dataIndex  dataType "node"
                    for (var x = 0; x < graphicEls.length; x++) {
                        var graphicEl = graphicEls[x];
                        var dataIndex = graphicEl.dataIndex;
                        var dataType = graphicEl.dataType;
                        if (dataIndex == i && dataType == "node") {
                            var transform = graphicEl.transform;//水平缩放绘图,水平倾斜绘图,	垂直倾斜绘图,垂直缩放绘图,水平移动绘图,垂直移动绘图
                            var realX, realY;
                            if (transform) {
                                realX = transform[4];
                                realY = transform[5];
                            } else {
                                realX = graphicEl.__zr.handler._x;//真实的XY
                                realY = graphicEl.__zr.handler._y;
                            }
                            ;
                            if ((_minX <= realX && realX <= _maxX) && (_minY <= realY && realY <= _maxY)) {
                                inRange.push(obj.id);
                            }
                            ;

                        }
                        ;
                    }
                    ;
                }
                ;
            }
            ;
            //循环比较nodeID是否相等,等则存放数据
            for (var i = 0; i < inputTableRows.length; i++) {
                var nodeId = inputTableRows[i][nodeIDIndex];//源数据里面的节点ID
                for (var j = 0; j < inRange.length; j++) {
                    var rangeId = inRange[j];
                    if (nodeId == rangeId) {
                        inputTableSourceData['rows'].push(inputTableRows[i]);
                        inputRow.push(i);
                    }
                    ;
                }
                ;
            }
            ;
            var relationIds = [];//关联IDs
            //循环比较 节点的开始节点 结束节点是否相等,等则存放数据
            if (isHasRelation) {
                for (var i = 0; i < inputTableRowsRelation.length; i++) {
                    var linkssourceId = inputTableRowsRelation[i][linkssourceIndex];//开始节点 源数据
                    var linkstargetId = inputTableRowsRelation[i][linkstargetIndex];//目标节点
                    for (var j = 0; j < inRange.length; j++) {
                        var rangeId = inRange[j];
                        if (rangeId == linkssourceId) {
                            inputTableSourceDataRelation['rows'].push(inputTableRowsRelation[i]);
                            inputRowRelation.push(i);
                            relationIds.push(linkstargetId);
                        }
                        ;
                        if (linkstargetId == rangeId) {
                            inputTableSourceDataRelation['rows'].push(inputTableRowsRelation[i]);
                            inputRowRelation.push(i);
                            relationIds.push(linkssourceId);
                        }
                        ;
                    }
                    ;
                }
                ;
            }
            if (relationIds.length > 0) {
                relationIds = $.unique(relationIds);
            }
            //循环比较nodeID是否相等,等则存放数据
            for (var i = 0; i < inputTableRows.length; i++) {
                var nodeId = inputTableRows[i][nodeIDIndex];//源数据里面的节点ID
                for (var j = 0; j < relationIds.length; j++) {
                    var rangeId = relationIds[j];
                    if (nodeId == rangeId) {
                        inputTableSourceData['rows'].push(inputTableRows[i]);
                        inputRow.push(i);
                    }
                    ;
                }
                ;
            }
            console.log(inRange.join(","));
            console.log(inputTableRows);
            inputDragParam.sourceData = inputTableSourceData;
            inputDragParam.rows = inputRow;
            inputDragParam.lists = [];

            //关系节点数据
            this.scope.dragParam = [];
            if (inputTableSourceData['rows'].length > 0) {
                this.scope.dragParam.push(inputDragParam);
            }
            if (isHasRelation) {
                inputDragParamRelation.sourceData = inputTableSourceDataRelation;
                inputDragParamRelation.rows = inputRowRelation;
                inputDragParamRelation.lists = [];
                if (inputTableSourceDataRelation['rows'].length > 0) {
                    this.scope.dragParam.push(inputDragParamRelation);
                }
            }
            this.scope.dragSelects = {
                datas: this.scope.dragParam
            };
        }
    },
//力引导画矩形
    setForce:function(){
        console.log(this);

    },
    OnMouseUp:function(evt){
        if(this.p){
            this.p.isDown=false
        }else{
            var X=evt.layerX;
            var Y=evt.layerY;
            var width=Math.floor(X - this.iPrevX);
            var height=Math.floor(Y - this.iPrevY);
            //if((this.isInit&&this.h==0)){//初始化||判断是否在矩形内,不在则清空上一次的画的内容
            this.w=Math.abs(width);
            this.h=Math.abs(height);
            if(width>0&&height>0){
                this.p=new  this.draw(this.iPrevX,this.iPrevY,this.w,this.h,this.color);
                this.upperX=this.iPrevX;//上一次画的开始节点
                this.upperY=this.iPrevY;
            }
            //}else{

            /** if(!this.ctx.isPointInPath(X,Y)){//初始化||判断是否在矩形内,不在则清空上一次的画的内容,重新画矩形
					 this.p=null;
					 this.p=new  this.draw(this.iPrevX,this.iPrevY,this.w,this.h,this.color);
				 }**/
            // }
        }

    },event:function(canvas) {
        canvas.addEventListener("mousedown", this.OnMouseDown.bind(this), true);
        //canvas.addEventListener("mousemove",this.OnMouseMove.bind(this),true);
        canvas.addEventListener("mouseup", this.OnMouseUp.bind(this), true);
    }
}

function creatData(tableName, arr, count) {
    var RandomNum = function (minNum, maxNum) {
        switch (arguments.length) {
            case 1:
                return parseInt(Math.random() * minNum + 1, 10);
                break;
            case 2:
                return parseInt(Math.random() * (maxNum - minNum + 1) + minNum, 10);
                break;
            default:
                return 0;
                break;
        }
    }
    for (var i = 0; i < count; i++) {
        var dataFa = [];
        for (var j = 0; j < arr.length; j++) {
            if (arr[j] instanceof Array) {
                dataFa.push(RandomNum(arr[j][0], arr[j][1]));
            } else {
                dataFa.push(arr[j]);
            }
        }
        dataset[tableName].table.push(dataFa);
    }
}
//created by xifangliang 坐标转换图专用gongj
//坐标转换坐标集合,必须传入坐标类型
function CoordinateTransformation() {
    var PI = 3.1415926535897932384626;
    //判断是否在国内，不在国内则不做偏移
    this.out_of_china = function (lng, lat) {
        var lat = +lat;
        var lng = +lng;
        // 纬度3.86~53.55,经度73.66~135.05
        return !(lng > 73.66 && lng < 135.05 && lat > 3.86 && lat < 53.55);
    };
    this.transformlat = function (lng, lat) {
        var lat = +lat;
        var lng = +lng;
        var ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 0.1 * lng * lat + 0.2 * Math.sqrt(
            Math.abs(lng));
        ret += (20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(lat * PI) + 40.0 * Math.sin(lat / 3.0 * PI)) * 2.0 / 3.0;
        ret += (160.0 * Math.sin(lat / 12.0 * PI) + 320 * Math.sin(lat * PI / 30.0)) * 2.0 / 3.0;
        return ret
    };

    this.transformlng = function (lng, lat) {
        var lat = +lat;
        var lng = +lng;
        var ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(
            Math.abs(lng));
        ret += (20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(lng * PI) + 40.0 * Math.sin(lng / 3.0 * PI)) * 2.0 / 3.0;
        ret += (150.0 * Math.sin(lng / 12.0 * PI) + 300.0 * Math.sin(lng / 30.0 * PI)) * 2.0 / 3.0;
        return ret
    };
};
CoordinateTransformation.prototype = {
    bd09togcj02: function (lng, lat) {
        var x_PI = 3.14159265358979324 * 3000.0 / 180.0;
        var lng = +lng;
        var lat = +lat;
        var x = lng - 0.0065;
        var y = lat - 0.006;
        var z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * x_PI);
        var theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * x_PI);
        var gg_lng = z * Math.cos(theta);
        var gg_lat = z * Math.sin(theta);
        return [gg_lng, gg_lat]
    },
    gcj02tobd09: function (lng, lat) {
        var x_PI = 3.14159265358979324 * 3000.0 / 180.0;
        var lat = +lat;
        var lng = +lng;
        var z = Math.sqrt(lng * lng + lat * lat) + 0.00002 * Math.sin(lat * x_PI);
        var theta = Math.atan2(lat, lng) + 0.000003 * Math.cos(lng * x_PI);
        var bd_lng = z * Math.cos(theta) + 0.0065;
        var bd_lat = z * Math.sin(theta) + 0.006;
        return [bd_lng, bd_lat]
    },
    wgs84togcj02: function (lng, lat) {
        var PI = 3.1415926535897932384626;
        var a = 6378245.0;
        var ee = 0.00669342162296594323;
        var lat = +lat;
        var lng = +lng;
        if (this.out_of_china(lng, lat)) {
            return [lng, lat]
        } else {
            var dlat = this.transformlat(lng - 105.0, lat - 35.0);
            var dlng = this.transformlng(lng - 105.0, lat - 35.0);
            var radlat = lat / 180.0 * PI;
            var magic = Math.sin(radlat);
            magic = 1 - ee * magic * magic;
            var sqrtmagic = Math.sqrt(magic);
            dlat = (dlat * 180.0) / ((a * (1 - ee)) / (magic * sqrtmagic) * PI);
            dlng = (dlng * 180.0) / (a / sqrtmagic * Math.cos(radlat) * PI);
            var mglat = lat + dlat;
            var mglng = lng + dlng;
            return [mglng, mglat]
        }
    },
    gcj02towgs84: function (lng, lat) {
        var PI = 3.1415926535897932384626;
        var a = 6378245.0;
        var ee = 0.00669342162296594323;
        var lat = +lat;
        var lng = +lng;
        if (this.out_of_china(lng, lat)) {
            return [lng, lat]
        } else {
            var dlat = this.transformlat(lng - 105.0, lat - 35.0);
            var dlng = this.transformlng(lng - 105.0, lat - 35.0);
            var radlat = lat / 180.0 * PI;
            var magic = Math.sin(radlat);
            magic = 1 - ee * magic * magic;
            var sqrtmagic = Math.sqrt(magic);
            dlat = (dlat * 180.0) / ((a * (1 - ee)) / (magic * sqrtmagic) * PI);
            dlng = (dlng * 180.0) / (a / sqrtmagic * Math.cos(radlat) * PI);
            var mglat = lat + dlat;
            var mglng = lng + dlng;
            return [lng * 2 - mglng, lat * 2 - mglat]
        }
    }
}
var coordinateTransformation = new CoordinateTransformation();
//默认转goGoogleCoord方法
function goGoogleCoord(lonAndLat, coordinateType) {
    var longitude = lonAndLat[0];
    var latitude = lonAndLat[1];
    if (coordinateType == "BD09") {
        return coordinateTransformation.bd09togcj02(longitude, latitude);;
    } else if (coordinateType == "GCJ02") {
        return [longitude, latitude];
    } else if (coordinateType == "WGS84") {
        return coordinateTransformation.wgs84togcj02(longitude, latitude);
    }
}

//新增转WGS84方法
function goWGS84Coord(lonAndLat, coordinateType) {
    var longitude = lonAndLat[0];
    var latitude = lonAndLat[1];
    if (coordinateType == "BD09") {
        var loAndLa = coordinateTransformation.bd09togcj02(longitude, latitude);
        return coordinateTransformation.gcj02towgs84(loAndLa[0], loAndLa[1]);
    } else if (coordinateType == "GCJ02") {
        return coordinateTransformation.gcj02towgs84(longitude, latitude);
    } else if (coordinateType == "WGS84") {
        return [longitude, latitude];
    }
}
//新增转BD09方法
function goBD09Coord(lonAndLat, coordinateType) {
    var longitude = lonAndLat[0];
    var latitude = lonAndLat[1];
    if (coordinateType == "BD09") {
        return [longitude, latitude];
    } else if (coordinateType == "GCJ02") {
        return coordinateTransformation.gcj02tobd09(longitude, latitude);
    } else if (coordinateType == "WGS84") {
        var loAndLa = coordinateTransformation.wgs84togcj02(longitude, latitude);
        return coordinateTransformation.gcj02tobd09(loAndLa[0], loAndLa[1]);
        return [longitude, latitude];
    }
}

function getColor(arr) {
    var color = ["#27727b", "#fcce10", "#e87c25", "#b5c334", "#fe8463", "#9bca63", "#fad860",
        "#f3a43b", "#60c0dd", "#d7504b", "#c6e579", "#f4e001", "#f0805a", "#26c0c0", "#8B6969",
        "#7171C6", "#40E0D0", "#00E5EE", "#0000CD", "#DEB887"
    ];

    function RandomNum(Min, Max) {
        var Range = Max - Min;
        var Rand = Math.random();
        var num = Min + Math.floor(Rand * Range); //舍去
        return num;
    }
    var cArr = [];
    for (var i = 0; i < arr.length; i++) {
        if (arr.length < 20) {
            cArr[i] = color[i];
        } else {
            cArr[i] = "rgb(" + RandomNum(0, 255) + "," + RandomNum(0, 255) + "," + RandomNum(0, 255) + ")";
        }
    }
    return cArr;
}
Array.prototype.arrUniq = function () {
    var temp, arrVal,
        array = this,
        arrClone = array.concat(), //克隆数组
        typeArr = { //数组原型
            'obj': '[object Object]',
            'fun': '[object Function]',
            'arr': '[object Array]',
            'num': '[object Number]'
        },
        ent = /(\u3000|\s|\t)*(\n)+(\u3000|\s|\t)*/gi; //空白字符正则

    //把数组中的object和function转换为字符串形式
    for (var i = arrClone.length; i--;) {
        arrVal = arrClone[i];
        temp = Object.prototype.toString.call(arrVal);

        if (temp == typeArr['num'] && arrVal.toString() == 'NaN') {
            arrClone[i] = arrVal.toString();
        }

        if (temp == typeArr['obj']) {
            arrClone[i] = JSON.stringify(arrVal);
        }

        if (temp == typeArr['fun']) {
            arrClone[i] = arrVal.toString().replace(ent, '');
        }
    }

    //去重关键步骤
    for (var i = arrClone.length; i--;) {
        arrVal = arrClone[i];
        temp = Object.prototype.toString.call(arrVal);

        if (temp == typeArr['arr']) arrVal.arrUniq(); //如果数组中有数组，则递归
        if (arrClone.indexOf(arrVal) != arrClone.lastIndexOf(arrVal)) { //如果有重复的，则去重
            array.splice(i, 1);
            arrClone.splice(i, 1);
        } else {
            if (Object.prototype.toString.call(array[i]) != temp) {
                //检查现在数组和原始数组的值类型是否相同，如果不同则用原数组中的替换，原因是原数组经过了字符串变换
                arrClone[i] = array[i];
            }
        }
    }
    return arrClone;
}

function getListData(data, listIndex) {
    var dataArray = [];
    for (var j = 0; j < data.length; j++) {
        dataArray.push(data[j][listIndex])
    }
    return dataArray;
}
var saveAs = saveAs || function (e) {
    "use strict";
    if (typeof e === "undefined" || typeof navigator !== "undefined" && /MSIE [1-9]\./.test(
            navigator.userAgent)) {
        return
    }
    var t = e.document,
        n = function () {
            return e.URL || e.webkitURL || e
        },
        r = t.createElementNS("http://www.w3.org/1999/xhtml", "a"),
        o = "download" in r,
        a = function (e) {
            var t = new MouseEvent("click");
            e.dispatchEvent(t)
        },
        i = /constructor/i.test(e.HTMLElement) || e.safari,
        f = /CriOS\/[\d]+/.test(navigator.userAgent),
        u = function (t) {
            (e.setImmediate || e.setTimeout)(function () {
                throw t
            }, 0)
        },
        s = "application/octet-stream",
        d = 1e3 * 40,
        c = function (e) {
            var t = function () {
                if (typeof e === "string") {
                    n().revokeObjectURL(e)
                } else {
                    e.remove()
                }
            };
            setTimeout(t, d)
        },
        l = function (e, t, n) {
            t = [].concat(t);
            var r = t.length;
            while (r--) {
                var o = e["on" + t[r]];
                if (typeof o === "function") {
                    try {
                        o.call(e, n || e)
                    } catch (a) {
                        u(a)
                    }
                }
            }
        },
        p = function (e) {
            if (
                /^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i
                    .test(e.type)) {
                return new Blob([String.fromCharCode(65279), e], {
                    type: e.type
                })
            }
            return e
        },
        v = function (t, u, d) {
            if (!d) {
                t = p(t)
            }
            var v = this,
                w = t.type,
                m = w === s,
                y, h = function () {
                    l(v, "writestart progress write writeend".split(" "))
                },
                S = function () {
                    if ((f || m && i) && e.FileReader) {
                        var r = new FileReader;
                        r.onloadend = function () {
                            var t = f ? r.result : r.result.replace(/^data:[^;]*;/,
                                "data:attachment/file;");
                            var n = e.open(t, "_blank");
                            if (!n) e.location.href = t;
                            t = undefined;
                            v.readyState = v.DONE;
                            h()
                        };
                        r.readAsDataURL(t);
                        v.readyState = v.INIT;
                        return
                    }
                    if (!y) {
                        y = n().createObjectURL(t)
                    }
                    if (m) {
                        e.location.href = y
                    } else {
                        var o = e.open(y, "_blank");
                        if (!o) {
                            e.location.href = y
                        }
                    }
                    v.readyState = v.DONE;
                    h();
                    c(y)
                };
            v.readyState = v.INIT;
            if (o) {
                y = n().createObjectURL(t);
                setTimeout(function () {
                    r.href = y;
                    r.download = u;
                    a(r);
                    h();
                    c(y);
                    v.readyState = v.DONE
                });
                return
            }
            S()
        },
        w = v.prototype,
        m = function (e, t, n) {
            return new v(e, t || e.name || "download", n)
        };
    if (typeof navigator !== "undefined" && navigator.msSaveOrOpenBlob) {
        return function (e, t, n) {
            t = t || e.name || "download";
            if (!n) {
                e = p(e)
            }
            return navigator.msSaveOrOpenBlob(e, t)
        }
    }
    w.abort = function () {};
    w.readyState = w.INIT = 0;
    w.WRITING = 1;
    w.DONE = 2;
    w.error = w.onwritestart = w.onprogress = w.onwrite = w.onabort = w.onerror = w.onwriteend =
        null;
    return m
}(typeof self !== "undefined" && self || typeof window !== "undefined" && window || this.content);
if (typeof module !== "undefined" && module.exports) {
    module.exports.saveAs = saveAs
} else if (typeof define !== "undefined" && define !== null && define.amd !== null) {
    define("FileSaver.js", function () {
        return saveAs
    })
}
$.extend(window,{
    createBrush: createBrush,
    RandomNumBetween: RandomNumBetween,
    getIndex: getIndex,
    checkDataType: checkDataType,
    checkTypeTy: checkTypeTy,
    promptExceptionData: promptExceptionData,
    creatData: creatData,
    DrawBrush: DrawBrush,
    goGoogleCoord: goGoogleCoord,
    goWGS84Coord: goWGS84Coord,
    goBD09Coord: goBD09Coord,
    getColor: getColor,
    getListData: getListData,
});