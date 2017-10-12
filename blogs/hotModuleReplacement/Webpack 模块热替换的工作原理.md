

### Webpack Hot Module Replacement 的工作原理

Hot Module Replacement（以下简称 HMR）是 Webpack 在 2013 年引入的最令人兴奋的特性之一 ，当你对代码进行修改并保存后，Webpack 将对代码重新打包，并将新的模块发送到浏览器端，浏览器通过新的模块替换老的模块，这样在不刷新浏览器的前提下就能够对应用进行更新。例如，在开发过程中，当你点击按钮，出现一个弹窗的时候，发现弹窗标题没有对齐，这时候你修改 CSS 样式，然后保存，在浏览器没有刷新的前提下，标题样式发生了改变。感觉就像直接在 Chrome 的开发者工具中直接修改元素样式一样。

如果你对 HMR 依然感觉到陌生，建议先阅读[官网 HMR 指南](https://doc.webpack-china.org/guides/hot-module-replacement/#-hmr)，上面有 HMR 最简单的用例，我会等着你回来的。

#### 为什么需要 HMR

在 Webpack HMR 功能之前，已经有很多 live reload 的工具或库，比如 [live-server](http://tapiov.net/live-server/)，那么我们为什么还需要 HMR 呢？答案其实在上文中已经提及一些。

* live reload 工具并不能够保存应用的状态（states），当刷新页面后，应用之前状态丢失，还是上文中的例子，点击按钮出现弹窗，当浏览器刷新后，弹窗也随即消失，要恢复到之前状态，还需再次点击按钮。而 Webapck HMR 则不会刷新浏览器，而是运行时对模块进行热替换，保证了应用转台不会丢失，提升了开发效率。
* 在古老的开发流程中，我们可能需要手动对代码进行打包，并且打包后在手动刷新浏览器页面，而这一系列重复的工作都可以通过 HMR 工作流来自动化完成，让更多的精力投入到业务中，而不是把时间浪费在重复的工作上。
* HMR 兼容市面上大多前端框架，比如[React Hot Loader](https://github.com/gaearon/react-hot-loader)，[Vue-loader](https://github.com/vuejs/vue-loader)，能够监听组件的变化，实时将最新的组件更新到浏览器端。[Elm Hot Loader](https://github.com/fluxxu/elm-hot-loader) 支持通过 webpack 对Elm 语言代码进行转译并打包，当然它也实现了 HMR 功能。

#### HMR 的工作原理

初识 HMR 的时候觉得其很神奇，一直有一些疑问萦绕在脑海。

1. webpack 可以将不同的模块打包成 bundle 文件或者几个 chunk 文件，但是当我通过 webpack HMR 进行开发的过程中，我并没有在我的 dist 目录中找到 webpack 打包好的文件？
2. 通过查看 webpack-dev-server 的 package.json 文件，我们知道其依赖于 webpack-dev-middleware 库，那么 webpack-dev-middleware 在 HMR 过程中扮演什么角色？
3. 使用 HMR 的过程中，通过 Chrome 开发者工具我知道浏览器是通过 websocket 和 webpack-dev-server 进行通信的，但是 websocket 的 message 中并没有发现新模块代码。打包后的新模块又是怎样发送到浏览器端的呢？
4. 浏览器拿到最新的模块代码，HMR 又是怎么老的模块替换成新的模块，在替换的过程中怎样处理模块之间的依赖关系？
5. 当模块的热替换过程中，如果替换模块失败，有什么回退机制吗？

带着上面的问题，于是决定深入到 webpack 源码，寻找 HMR 底层的奥秘。

![hotModuleReplacement](./hotModuleReplacement.png)

上图是通过 webpack-dev-server 和 webpack 中的 HotModulePlugin 插件配合开发应用的模块热更新流程图。

* 红色框内是 Server 端，而上面的橙色框是浏览器端。
* 绿色的方框是 webpack 代码控制的区域。蓝色方框是 webpack-dev-server 代码控制的区域，洋红色的方框是文件系统，文件修改后的变化就发生在这，而青色的方框是应用本身。

上图显示了我们修改代码到模块热更新完成的一个周期，通过深蓝色的阿拉伯数字符号已经将 HMR 的整个过程标识了出来。

1. 第一步，在 webpack 的 watch 模式下，文件系统中某一个文件发生修改，webpack 监听到文件变化，根据配置文件对模块重新编译打包，并将打包后的代码通过 JavaScript 对象保存在内存中。
2. 第二步是 webpack-dev-server 和 webpack 之间的接口交互，而在这一步，主要是 webpack-dev-middleware 和 webpack 之间的交互，webpack-dev-middleware 通知 webpack 对代码变化进行监控，并且告诉 webpack，将代码打包到内存中。
3. 第三步是 webpack-dev-server 对文件变化的一个监控，当我们在配置文件中配置了[devServer.contentBase](https://webpack.js.org/configuration/dev-server/#devserver-contentbase) 的时候，Server 会监听这些配置文件夹中静态文件的变化，变化后会通知浏览器端对应用进行 live reload。（注意，这儿是浏览器刷新，而不是热更新）
4. 第四步也是 webpack-dev-server 代码的工作，该步骤主要是通过[sockjs](https://github.com/sockjs/sockjs-client)（webpack-dev-server 的依赖）在浏览器端和服务端的之间建立一个 websocket 连接，将 webpack 编译打包的各个阶段的状态信息告知浏览器端，同时也包括第三步中 Server 监听静态文件变化的信息。浏览器端根据这些 socket 消息进行不同的操作。当然服务端传递的最主要的信息还是新模块的 hash 值，后面的步骤根据这一 hash 值来进行模块热替换。
5. webpack-dev-server/client 端并不能够请求更新的代码，而把这一工作又交回给了 webpack，webpack/hot/dev-server 的工作就是根据 webpack-dev-server/client 传给他的信息决定是刷新浏览器呢还是进行模块热更新。当然如果仅仅是刷新浏览器，也就没有后面那几个步骤了。
6. HotModuleReplacement.runtime 是客户端 HMR 的中枢，它接收到上一步传递给他的新模块的 hash 值，它通过 JsonpMainTemplate.runtime 向 server 端发送 Ajax 请求，服务端返回一个 json，该 json 包含了所有要更新的模块的 hash 值，获取到更新列表后，该模块再次通过jsonp 请求，获取到最新的模块代码。这就是上图中 7、8、9 步骤。
7. 而第 10 步是决定 HMR 成功与否的关键步骤，在该步骤中，HotModulePlugin 将会对新旧模块进行对比，决定是否更新模块，在决定更新模块后，检查模块之间的依赖关系，更新模块的同时更新模块间的依赖引用。
8. 最后一步，当 HMR 失败后，回退到 live reload 操作，也就是进行浏览器刷新来获取最新打包代码。

#### 运用 HMR 的简单例子

在上一个部分，通过一张 HMR 流程图，简要的说明了 HMR 进行模块热更新的过程。在这一部分，我将通过一个简单的例子，通过分析源码详细说明各个库在 HMR 过程中的具体职责。

