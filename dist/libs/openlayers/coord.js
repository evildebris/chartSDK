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

 //对dom元素进行监听resize事件
 (function ($, h, c) {
     var a = $([]),
         e = $.resize = $.extend($.resize, {}),
         i, k = "setTimeout",
         j = "resize",
         d = j +
         "-special-event",
         b = "delay",
         f = "throttleWindow";
     e[b] = 350;
     e[f] = true;
     $.event.special[j] = {
         setup: function () {
             if (!e[f] && this[k]) {
                 return false
             }
             var l = $(this);
             a = a.add(l);
             $.data(this, d, {
                 w: l.width(),
                 h: l.height()
             });
             if (a.length === 1) {
                 g()
             }
         },
         teardown: function () {
             if (!e[f] && this[k]) {
                 return false
             }
             var l = $(this);
             a = a.not(l);
             l.removeData(d);
             if (!a.length) {
                 clearTimeout(i)
             }
         },
         add: function (l) {
             if (!e[f] && this[k]) {
                 return false
             }
             var n;

             function m(s, o, p) {
                 var q = $(this),
                     r = $.data(this, d);
                 if (r) {
                     r.w = o !== c ? o : q.width();
                     r.h = p !== c ? p : q.height();
                 }
                 n.apply(this, arguments)
             }
             if ($.isFunction(l)) {
                 n = l;
                 return m
             } else {
                 n = l.handler;
                 l.handler = m
             }
         }
     };

     function g() {
         i = h[k](function () {
             a.each(function () {
                 var n = $(this),
                     m = n.width(),
                     l = n.height(),
                     o = $.data(this, d);
                 try {
                     if (m !== o.w || l !== o.h) {
                         n.trigger(j, [o.w = m, o.h = l])
                     }
                 } catch (error) {}
             });
             g()
         }, e[b])
     }
 })(jQuery, this);

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