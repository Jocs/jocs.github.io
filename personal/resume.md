### 罗冉个人简历

#### 联系方式

​	**手机:** 173\*\*\*\*0713        **Email:** luoran1988@126.com



#### 个人信息

​	**基本:**  罗冉/男/1988

​	**学历:**  **北京师范大学**（2007-2011） 生物科学/国际贸易双学位

​	**Github:**  https://github.com/Jocs

​	**期望职位:** Web前端高级工程师

​	**期望薪资:** // TODO

​	**期望城市:**上海



#### 工作经历（时间倒序）

​	**饿了么（2017年八月~至今）**

​	1. // TODO

​	**杭州数云科技有限公司（2015年9月~2017年7月）**

​	1. **内容管理项目**

​	内容管理项目是一个集邮件编辑、H5页面编辑为一体的内容编辑器，作为前端项目核心程序员，我完成了项				目的前端架构（Angular1.5.8 + 公司自研组件库）、及H5编辑器。项目中主要的难点就是内容保存时对邮件或者H5页面进行截图，以便在列表页进行图片展示，通过对一些DOM转化Canvas的库的选型，最终选择了**html2canvas**,该库在处理H5页面截图是性能不错，因为H5页面中图片体积不大，且没有跨域图片，但是在邮件截图中遇到了瓶颈，html2canvas不能处理跨域图片，且邮件端的图片体积较大，因此邮件端的截图方案最终选择了使用Nodejs搭建了一个截图服务器，将源码发送到截图服务器，使用phantomjs对邮件内容在服务器端渲染，然后截图，图片上传又拍云，并通过websocket将图片url推送到前端进行及时展示。

​	2. **公司数据赢家项目国际化方案**

​	由于公司业务拓展的需求，需对现有项目进行国际化，技术总监要求就是业务代码和国际化代码尽量松耦合，对现有业务代码进行极小改动。最终的方案就是[**jo-i18n**](https://github.com/Jocs/jo-i18n)（由于不涉及公司业务，开源Github），**jo-i18n**是基于[messageformat](https://github.com/messageformat/messageformat.js)之上构建的国际化解决方案，得益于messageformat的优良特性，jo-i18n支持[Unicode CLDR](http://cldr.unicode.org/)标准中的所有[语言](http://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html)，能够处理**单复数**、**日期**和**性别**等语言翻译问题。

​	由于公司大部分项目使用Angular框架，**jo-i18n**目前很好得支持Angular框架，项目提供了`translateProvider`方法轻松创建国际化翻译指令。

​	3.**开发千牛插件**

​	刚进公司业务组就接到一个紧迫任务，15天内开发一个千牛插件并上线，前端直接调淘宝接口，但是淘宝接口也是并行开发的，也就是说所有的前端接口都是根据淘宝提供的接口文档来写的，当时我选择的方案是通过Node.js提供一个mock server。根据接口文档提供一些mock接口，这样前端开发就不会太局限。到上线前两天到淘宝驻场开发调试接口，前一天测试，最后准时上线。



​	**欧莱雅中国研发中心（2012~2015）** 职位：Junior Scientist

​	负责公司人造皮肤质量检测，与目前求职职位无关。



​	**北京市水产科学研究所（2011~2012）** 职位：初级研究员

​	蛋白质表达、西伯利亚鲟育种工作，与目前求职职位无关。



#### 开源项目和作品

​	**个人作品**(未开源)

​	[eTrack.JS](http://etrack.shuyun.com/)是一个前端错误日志监控系统，通过收集、过滤客户端的JS错误或者Ajax错误，并将错误进行必要的格式化，发送到NodeJS服务器，通过Mongodb存储，WebSocket推送到前端监控应用中。前端技术栈：React + Redux + eChart + socket.io。服务端技术栈：NodeJs + Mongoose + Express。该项目主要启发于**mknichel**的一篇文章[javascript-errors](https://github.com/mknichel/javascript-errors)

​	**开源项目**

​	[ESLint_docs](https://github.com/Jocs/ESLint_docs): 该项目是集ESLint文档翻译，配置及使用说明为一体的ESLint使用方案，最初是用于公司项目中，作为代码规范的一部分。**Star: 146  Fork: 36**

​	[node_mongodb_blog_system](https://github.com/Jocs/node_mongodb_blog_system): 该项目是通过NodeJs + Mongodb搭建的多人在线博客系统，也是最初学习NodeJs开发的项目。 **Star: 52    Fork: 22**

​	**个人文章及翻译**

​	[ES2015系列--Build Your Own Promise](https://github.com/Jocs/jocs.github.io/issues/7)（原创）

​	[JavaScript Errors 指南](https://github.com/Jocs/jocs.github.io/issues/1)（翻译）

​	**公司内部演讲**

​	[Functional Programming](https://github.com/Jocs/jocs.github.io/tree/master/presentations/functional-Programming)



#### 技能清单

​	语言：JavaScript、Html、CSS 、Haskell（了解）

​	Web框架：Angular1.x(熟练)、Vue2.x（熟练）、React + Redux（了解）

​	移动端框架：Weex

​	前端工具：Webpack、babel、Sass、Less

​	测试工具: Jasmine、Karma

​	服务端：NodeJs、Express、Mongoose、Websocket

#### 写在最后

​	非常感谢您阅读我的简历，期待与您共事





​	

​	





