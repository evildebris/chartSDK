(function (root, factory) {//dark改customed
  if(typeof exports === 'object' && typeof module === 'object') {
    factory({},window.echartscurrent);
    factory({},window.echarts3);
    factory({},window.echarts3_8_4);
    module.exports ={};
  }else if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['exports', 'echartscurrent','echarts3','echarts3_8_4'], factory);
  } else if (typeof exports === 'object' && typeof exports.nodeName !== 'string') {
    // CommonJS
    factory(exports, require('echartscurrent','echarts3','echarts3_8_4'));
  } else {
    // Browser globals
    factory({},root.echartscurrent);
    factory({},root.echarts3);
    factory({},root.echarts3_8_4);
  }
}(this, function factory(exports, echarts) {
  var log = function (msg) {
    if (typeof console !== 'undefined') {
      console && console.error && console.error(msg);
    }
  };
  //PF-2685 edit by cai.liao amd 加载时同步加载'echarts3','echarts3_8_4'
  if (typeof define === 'function' && define.amd&&!window.hasLoadCustomed) {
    window.hasLoadCustomed = true;
    factory({},arguments[2]);
    factory({},arguments[3]);
  }
  if (!echarts) {
    // log('ECharts is not Loaded');
    return;
  }
  var contrastColor = '#eee';
  var axisCommon = function () {
    return {
      axisLine: {
        lineStyle: {
          color: contrastColor
        }
      },
      axisTick: {
        lineStyle: {
          color: contrastColor
        }
      },
      axisLabel: {
        textStyle: {
          color: contrastColor
        }
      },
      splitLine: {
        lineStyle: {
          type: 'dashed',
          color: '#aaa'
        }
      },
      splitArea: {
        areaStyle: {
          color: contrastColor
        }
      }
    };
  };

  // var colorPalette = [
  //     '#2ec7c9','#b6a2de','#5ab1ef','#ffb980','#d87a80',
  //     '#8d98b3','#e5cf0d','#97b552','#95706d','#dc69aa',
  //     '#07a2a4','#9a7fd1','#588dd5','#f5994e','#c05050',
  //     '#59678c','#c9ab00','#7eb00a','#6f5553','#c14089'
  // ];
  var colorPalette = [
    "#1c9ff1","#00d2e0","#f26c5d","#02bf98","#0c6fec","#7d2aad","#ef572e","#0f9467","#6ea0db","#6235f3","#e59a23","#cc1944","#edf0d3","#9266f1","#c5594b","#c3cc6a"
  ]
  var theme = {
    color: colorPalette,
    backgroundColor: '#08173c',
    tooltip: {
      axisPointer: {
        lineStyle: {
          color: contrastColor
        },
        crossStyle: {
          color: contrastColor
        }
      }
    },
    legend: {
      textStyle: {
        color: contrastColor
      }
    },
    textStyle: {
      color: contrastColor
    },
    title: {
      textStyle: {
        color: contrastColor
      }
    },
    toolbox: {
      iconStyle: {
        normal: {
          borderColor: contrastColor
        }
      }
    },
    dataZoom: {
      textStyle: {
        color: contrastColor
      }
    },
    timeline: {
      lineStyle: {
        color: contrastColor
      },
      itemStyle: {
        normal: {
          color: colorPalette[1]
        }
      },
      label: {
        normal: {
          textStyle: {
            color: contrastColor
          }
        }
      },
      controlStyle: {
        normal: {
          color: contrastColor,
          borderColor: contrastColor
        }
      }
    },
    timeAxis: axisCommon(),
    logAxis: axisCommon(),
    valueAxis: axisCommon(),
    categoryAxis: axisCommon(),

    line: {
      symbol: 'circle'
    },

    graph: {
      color: colorPalette
    },
    gauge: {
      title: {
        textStyle: {
          color: contrastColor
        }
      }
    },
    candlestick: {
      itemStyle: {
        normal: {
          color: '#FD1050',
          color0: '#0CF49B',
          borderColor: '#FD1050',
          borderColor0: '#0CF49B'
        }
      }
    }
  };
  theme.categoryAxis.splitLine.show = false;
  echarts.registerTheme('customed', theme);
  return {};
}));
