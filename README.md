# webpackSDK
这是一个使用webpack创建的前端sdk，与后端nodeServer服务交互生成对应的图元。

## 项目内容
用户使用该sdk可以展示布置图元

### 文件结构
* src sdk源码
* dist 为展示页面

### 主要模块
* src/components/componentData/component 继承Immutable.Map对象部分接口未重写完，还在读Immutable.js的源码 是组件数据源对象
* src/components/component/editDecorator 组件编辑装饰器，在扩展react组件时可编辑组件可以加上声明@editDecorator
* src/components/componentManage 实现整个画布的数据管理，包括回退、前进、增删该查，该模块还未写完

## 项目安装
```
npm install (--save-dev)
webpack
```

