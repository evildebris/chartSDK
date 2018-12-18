/**
 * @author cai.liao
 * SDK 中comClass 只需要实现com.template.renderFuncObj构造相关功能其他代码不进行移植
 * */


/**
 * 图元算子模板类。该类只能通过new方法实例化：new ChartComTemplate(jsonObj)
 * @constructor
 */
function ChartComTemplate() {
    var templateSelf = this;

    //函数定义
    /**
     * 加载算子模板的JSON对象。该方法是静态调用。
     * @param instance 模板对象实例
     * @param data 模板的JSON对象
     * @returns {load} 返回算子模板自身
     */
    function loadOrigin(instance, data) {
        if (!data || typeof(data) !== "object") {
            return instance;
        } else {
            //嵌套的参数模型
            for (var key in data) {
                var value = data[key];
                if (typeof(value) != "function") {
                    if (key != "paramList") {
                        instance[key] = value;
                    }
                }
            }
            instance._changed = false;
        }
    }
    //函数定义
    /**
     * 加载算子模板的JSON对象。该方法不是静态调用。
     * @param data 模板的JSON对象
     * @returns {load} 返回算子模板自身
     */
    function load(instance, data) {
        loadOrigin(instance, data);
        setDefaultFunc(instance);
        //构造函数对象
        buildFuncObject(instance, data);
        return instance;
    }

    /**
     * 将Javascript代码文本转化为可调用的函数对象
     * @param funcStr Javascript代码文本
     * @returns {*} 可调用的函数对象
     */
    function buildJsFuncObject(funcStr) {
        if (!funcStr || funcStr.length == 0) {
            return undefined;
        }
        var fproto = "try{__FUNC__.<#FuncName#>=<#FuncName#>;}catch(ex){/*console.warn('ComTemplate.buildJsFuncObject异常：%s',ex);*/}\n";
        var fstr = "";
        //查找“function XXX (”字符串，提取函数名
        var match = /function\s+([a-zA-Z_$][0-9a-zA-Z_$]+)\s*\(/g;
        var funcNames = [];
        var func = match.exec(funcStr);
        while (match.lastIndex > 0) {
            funcNames.push(func[1]);
            func = match.exec(funcStr);
        }
        //查找到“function XXX (”字符串，提取函数名
        funcNames.forEach(function (x) {
            fstr += fproto.replace(/<#FuncName#>/g, x);
        });
        var funcObj = undefined;
        if (fstr.length > 0) {
            fstr = funcStr + "\nvar __FUNC__={};\n" + fstr + "\nreturn __FUNC__;";
            var fobj = null;
            try {
                fobj = new Function(fstr);
            } catch (ex) {
                console.warn("ComTemplate.buildJsFuncObject异常：%s", ex);
                return undefined;
            }
            try {
                funcObj = fobj();
            } catch (ex) {
                console.warn("ComTemplate.buildJsFuncObject异常：%s", ex);
            }
        }
        return funcObj;
    }

    function buildFuncObject(instance, data) {
        //构造函数对象
        var renderStr = "function init(initArgs,theme){\n" + instance.initFunc + "\n}\n";
        renderStr += "function load(charts,initArgs,theme,dataset){\n" + instance.loadFunc + "\n}\n";
        renderStr += "function events(charts,initArgs,theme){\n" + instance.eventsFunc + "\n}\n";
        renderStr += "\
function close(charts){\n\
  try{\n"+
            instance.closeFunc + "\n\
  }catch(ex){\n\
    console.warn('回收图元对象异常：%o',ex);\n\
  }\n\
}\n";
        if (data.renderFunc) {
            renderStr += "function render(charts,initArgs,theme,dataset){\n" + data.renderFunc + "\n}\n";
        } else {
            renderStr += "\
function render(charts,initArgs,theme,dataset){\n\
  if(!charts){\n\
    try{\n\
      charts=init(initArgs,theme);\n\
    }catch(ex){\n\
      console.warn('初始化图元对象异常：%o',ex);\n\
      return;\n\
    }\n\
    try{\n\
      events(charts,initArgs,theme);\n\
    }catch(ex){\n\
      console.warn('设定图元事件异常：%o',ex);\n\
      return;\n\
    }\n\
  }\n\
  try{\n\
    load(charts,initArgs,theme,dataset);\n\
  }catch(ex){console.warn('加载图元数据渲染异常：%o',ex);}\n\
  return charts;\n\
}\n";
        }
        instance.renderFuncObj = buildJsFuncObject(renderStr);
        return instance;
    }

    function setDefaultFunc(instance) {
        //设定init、events、load、close函数帮助
        if (!instance.initFunc) {
            instance.initFunc = "\
//输入变量：\n\
//initArgs：初始化参数，和需要用到全局服务或配置\n\
//theme：呈现主题（色系、皮肤等等）\n\
//返回值：图元对象。\n";
        }
        if (!instance.eventsFunc) {
            instance.eventsFunc = "\
//输入变量：\n\
//charts：init函数返回的图元对象\n\
//initArgs：初始化参数，和需要用到全局服务或配置\n\
//theme：呈现主题（色系、皮肤等等）\n\
//返回值：图元对象。\n";
        }
        if (!instance.loadFunc) {
            instance.loadFunc = "\
//输入变量：\n\
//charts：init函数返回的图元对象\n\
//initArgs：初始化参数，和需要用到全局服务或配置\n\
//theme：呈现主题（色系、皮肤等等）\n\
//dataset：需要加载的数据集\n\
//返回值：图元对象。\n";
        }
        if (!instance.closeFunc) {
            instance.closeFunc = "\
//输入变量：\n\
//charts：init函数返回的图元对象\n";
        }
    }

    //原型方法
    if (ChartComTemplate.prototype.__initChartComTemplate__ !== true) {
        ChartComTemplate.prototype.__initChartComTemplate__ = true;
    }

    //初始化或构造函数
    var argn = arguments.length;
    if (argn == 1) {
        load(templateSelf, arguments[0]);
    } else {
        //设定init、events、load、close函数帮助
        setDefaultFunc(templateSelf);
    }

}


function initChartComRenderFuncObj(data) {
    if(data && data.template && typeof data.template === 'string') {
        data.template = JSON.parse(data.template);
    }
    if(data && data.template && typeof data.template === 'object') {
        data.template = new ChartComTemplate(data["template"]);
    }
}
module.exports = {
    initChartComRenderFuncObj: initChartComRenderFuncObj
};