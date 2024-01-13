---
external: false
title: "一种自动化生成骨架屏的方案"
description: "一种自动化生成骨架屏的方案."
date: 2018-04-28
---

![5aebdbd1066bf](https://i.loli.net/2018/05/04/5aebdbd1066bf.png)

大家好，我今天分享的主题是：「一种自动化生成骨架屏的方案」。

在分享之前，先自我介绍下，我叫罗冉，GitHub 账号是 @jocs。第一份工作是在欧莱雅做化妆品研发，2015年转行，目前是饿了么的一名前端工程师，主要工作是研究前端加载性能及运行时性能优化。在工作之余，开发一款叫做@marktext 的 Markdown 编辑器。

今天的分享主要分为三个部分：

- *首屏加载状态演进*

- *如何构建骨架屏*

- *将骨架屏打包的项目中*

## 首屏加载的演进

我们先来看一些权威机构所做的研究报告。

一份是 [Akamai](http://www.akamai.com/html/about/press/releases/2009/press_091409.html) 的研究报告，当时总共采访了大约 1048 名网上购物者，得出了这样的结论：

- 大约有 47% 的用户期望他们的页面在两秒之内加载完成。

- 如果页面加载时间超过 3s，大约有 40% 的用户选择离开或关闭页面。

![5aebdbf2e554f](https://i.loli.net/2018/05/04/5aebdbf2e554f.png)

这是 TagMan 和眼镜零售商 Glasses Direct 合作进行的测试，研究页面加载速度和最终转化率的关系：

![5aebc6d543104](https://assets.econsultancy.com/images/0002/4853/tagmma_image.png)

在这份测试报告中，发现了网页加载速度和转化率呈现明显的负相关性，在页面加载时间为1~2 秒时的转化率是最高的，而当加载时间继续增长，转化率开始呈现一个下降的趋势，大约页面加载时间每增加 1s 转化率下降6.7个百分点。

另外一份研究报告是 MIT 神经科学家在 2014 年做的研究，人类可以在 13ms 内感知到离散图片的存在，并将图片的大概信息传输到我们的大脑中，在接下来的 100 到 140ms 之间，大脑会决定我们的眼睛具体关注图片的什么位置，也就是获取图片的关注焦点。从另一个角度来看，如果用户进行某项交互（比如点击某按钮），要让用户感知不到延迟或者数据加载，我们大概有 200 ms 的时间来准备新的界面信息呈现给用户。

在 200ms 到 1s 之间，用户似乎还感知不到自己处在交互等待状态，当一秒钟后依然得不到任何反馈，用户将会把其关注的焦点移到其他地方，如果等待超过 10s，用户将对网站失去兴趣，并浏览其他网站。

那么我们需要做些什么来留住用户呢？

通常方案，我们会在首屏、或者获取数据时，在页面中展现一个进度条，或者转动的 Spinner。

- 进度条：明确知道交互所需时间，或者知道一个大概值的时候我们选择使用进度条。

- Spinner：无法预测获取数据、或者打开页面的时长。

有了进度条或者 Spinner，至少告诉了用户两点内容：

- 你所进行的操作需要等待一段时间。

- 其次，安抚用户，让其耐心等待。

除此之外，进度条和 Spinner 并不能带来其他任何作用，既无法让用户感知到页面加载得更快，也无法给用户一个焦点，让用户将关注集中到这个焦点上，并且知道这个焦点即将呈现用户感兴趣的内容。

那么有没有比进度条和 Spinner 更好的方案呢？也许我们需要的是骨架屏。

![5aebdc1b79c1c](https://i.loli.net/2018/05/04/5aebdc1b79c1c.png)

其实，骨架屏（Skeleton Screen）已经不是什么新奇的概念了，[Luke Wroblewski](https://www.lukew.com/about/) 早在 2013 年就首次提出了骨架屏的概念，并将这一概念成功得运用到他当时的产品「Polar app」中，2014 年，「Polar」加入 Google，_Luke Wroblewski_ 本人也成为了Google 的一位产品总监。

> A skeleton screen is essentially a blank version of a page into which information is gradually loaded.

他是这样定义骨架屏的，他认为骨架屏是一个页面的空白版本，通过这个空白版本传递信息，我们的页面正在渐进式的加载过程中。

苹果公司已经将骨架屏写入到了 [iOS Human Interface Guidelines](https://developer.apple.com/library/ios/documentation/UserExperience/Conceptual/MobileHIG/LaunchImages.html) ,只是在该手册中，其用了一个新的概念「launch images」。在该手册中，其推荐在应用首屏中包含文本或者元素基本的轮廓。

2015 年，Facebook 也首次在其移动端 App 中使用了骨架屏的设计来预览页面的加载状态。

![5aebdc36418ab](https://i.loli.net/2018/05/04/5aebdc36418ab.png)

随后，Twitter，Medium，YouTube 也都在其产品设计中添加了骨架屏，骨架屏一时成为了首屏加载的新趋势，国内一些公司也紧随其后，饿了么、知乎、掘金、腾讯新闻等也都在其 PC 端或者移动端加入了骨架屏设计。

**为什么需要骨架屏？**

- 在最开始关于 MIT 2014 年的研究中已有提到，用户大概会在 200ms 内获取到界面的具体关注点，在数据获取或页面加载完成之前，给用户首先展现骨架屏，骨架屏的样式、布局和真实数据渲染的页面保持一致，这样用户在骨架屏中获取到关注点，并能够预知页面什么地方将要展示文字什么地方展示图片，这样也就能够将关注焦点移到感兴趣的位置。当真实数据获取后，用真实数据渲染的页面替换骨架屏，如果整个过程在 1s 以内，用户几乎感知不到数据的加载过程和最终渲染的页面替换骨架屏，而在用户的感知上，出现骨架屏那一刻数据已经获取到了，而后只是数据渐进式的渲染出来。这样用户感知页面加载更快了。

- 再看看现在的前端框架， [React](https://link.zhihu.com/?target=https%3A//github.com/facebook/react)、[Vue](https://link.zhihu.com/?target=https%3A//github.com/vuejs/vue)、[Angular](https://link.zhihu.com/?target=https%3A//github.com/angular/angular) 已经占据了主导地位，市面上大多数前端应用也都是基于这三个框架或库完成，这三个框架有一个共同的特点，都是 JS 驱动，在 JS 代码解析完成之前，页面不会展示任何内容，也就是所谓的白屏。用户是极其不喜欢看到白屏的，什么都没有展示，用户很有可能怀疑网络或者应用出了什么问题。 拿 Vue 来说，在应用启动时，Vue 会对组件中的 data 和 computed 中状态值通过 `Object.defineProperty` 方法转化成 set、get 访问属性，以便对数据变化进行监听。而这一过程都是在启动应用时完成的，这也势必导致页面启动阶段比非 JS 驱动（比如 jQuery 应用）的页面要慢一些。

## 如何构建骨架屏

饿了么移动 web 页面在 2016 年开始引入骨架屏，是完全通过 HTML 和 CSS 手写的，手写骨架屏当然可以完全复刻页面的真实样式，但也有弊端：

举个例子，突然有一天，产品经理跑到了我面前，这个页面布局需要调整一下，然后这一块推广内容可以去掉了，我当时的心情可能是这样的。

![5aebd1e042a9a](https://i.loli.net/2018/05/04/5aebd1e042a9a.png)

手写骨架屏带来的问题就是，每次需求的变更我们不仅需要修改业务代码， 同时也要去修改骨架屏的样式和布局，这往往是比较机械重复的工作，手写骨架屏增加了维护成本。

因此饿了么前端团队一直在寻找一种更好、更快的将数据呈现到用户面前的方案。

在选择骨架屏之前，我们也调研了其他两种备选方案：服务端渲染（ssr）和预渲染（prerender）。

![5aebdc4d74216](https://i.loli.net/2018/05/04/5aebdc4d74216.png)

现在，前端领域，不同框架下，服务端渲染的技术已经相当成熟，开箱即用的方案也有，比如 Vue 的 [Nuxt.js](https://nuxtjs.org/)。那么为什么不直接使用服务端渲染来加快内容展现？

首先我们了解到，服务端渲染主要有两个目的，一是 SEO，二是加快内容展现。在带来这两个好处的同时，我们也需要评估服务端渲染的成本，首先我们需要服务端的支持，因此涉及到了到了服务构建、部署等，同时我们的 web 项目是一个流量较大的网站，也需要考虑服务器的负载，以及相应的缓存策略，特别是一些外卖行业，由于地理位置的不同，不同用户看到的页面也是不一样的，也就是所谓的千人千面，这也为缓存造成了一定困难。

![5aebdc5f03f06](https://i.loli.net/2018/05/04/5aebdc5f03f06.png)

其次，预渲染（prerender），所谓预渲染，就是在项目的构建过程中，通过一些渲染机制，比如 [puppeteer](https://github.com/GoogleChrome/puppeteer) 或则 [jsdom](https://npmjs.com/package/jsdom) 将页面在构建的过程中就渲染好，然后插入到 html 中，这样在页面启动之前首先看到的就是预渲染的页面了。但是该方案最终也抛弃了，预渲染渲染的页面数据是在构建过程中就已经打包到了 html 中， 当真实访问页面的时候，真实数据可能已经和预渲染的数据有了很大的出入，而且预渲染的页面也是一个不可交互的页面，在页面没有启动之前，用户无法和预渲染的页面进行任何交互，预渲染页面中的数据反而会影响到用户获取真实的信息，当涉及到一些价格、金额、地理位置的地方甚至会导致用户做出一些错误的决定。因此我们最终没有选择预渲染方案。

**生成骨架屏基本方案**

> 通过 [puppeteer](https://link.zhihu.com/?target=https%3A//github.com/GoogleChrome/puppeteer) 在服务端操控 [headless Chrome](https://link.zhihu.com/?target=https%3A//developers.google.com/web/updates/2017/04/headless-chrome)  打开开发中的需要生成骨架屏的页面，在等待页面加载渲染完成之后，在保留页面布局样式的前提下，通过对页面中元素进行删减或增添，对已有元素通过层叠样式进行覆盖，这样达到在不改变页面布局下，隐藏图片和文字，通过样式覆盖，使得其展示为灰色块。然后将修改后的 HTML 和 CSS 样式提取出来，这样就是骨架屏了。

下面我将通过 [page-skeleton-webpack-plugin](https://link.zhihu.com/?target=https%3A//www.npmjs.com/package/page-skeleton-webpack-plugin) 工具中的代码，来展示骨架屏的具体生成过程。

正如上面基本方案所描述的那样，我们将页面分成了不同的块：

- 文本块：仅包含文本节点（NodeType 为 `Node.TEXT_NODE`）的元素（NodeType 为 `Node.ELEMENT_NODE`），一个文本块可能是一个 p 元素也可能是 div 等。文本块将会被转化为灰色条纹。

- 图片块：图片块是很好区分的，任何 img 元素都将被视为图片块，图片块的颜色将被处理成配置的颜色，形状也被修改为配置的矩形或者圆型。

- 按钮块：任何 button 元素、 type 为 button 的 input 元素，role 为 button 的 a 元素，都将被视为按钮块。按钮块中的文本块不在处理。

- svg 块：任何最外层是 svg 的元素都被视为 svg 块。

- 伪类元素块：任何伪类元素都将视为伪类元素块，如 `::before` 或者 `::after`。

- ...

首先，我们为什么要把页面划分为不同的块呢？

将页面划分为不同的块，然后分别对每个块进行处理，这样不会破坏页面整体的样式和布局，当我们最终生成骨架屏后，骨架屏的布局样式将和真实页面的布局样式完全一致，这样就达到了复用样式及页面布局的目的。

在所有分开处理之前，我们需要完成一项工作，就是将我们生成骨架屏的脚本，插入到 puppeteer 打开的页面中，这样我们才能够执行脚本，并最终生成骨架屏。

值得庆幸的是，puppeteer 在其生成的 page 实例中提供了一个原生的方法。

> page.addScriptTag(options)
> 
> - options\<Object>
>   
>   - url
>   
>   - path
>   
>   - content
>   
>   - type（Use 'module' in order to load a Javascript ES6 module.）

有了这种方法，我们可以插入一段 js 脚本的 url 或者是相对/绝对路径，也可以直接是 js 脚本的内容，在我们的实践过程中，我们直接插入的脚本内容。

```javascript
  async makeSkeleton(page) {
    const { defer } = this.options
    await page.addScriptTag({ content: this.scriptContent })
    await sleep(defer)
    await page.evaluate((options) => {
      Skeleton.genSkeleton(options)
    }, this.options)
  }
```

有了上面插入的脚本，并且我们在脚本中提供了一个全局对象 `Skeleton`，这样我们就可以直接通过 page.evaluate 方法来执行脚本内容并最终生成骨架页面了。

由于时间有限，这儿不会对每个块的生成骨架结构进行详尽分析，这儿可能会重点阐述下文本块、图片块、svg 块如何生成骨架结构的，然后再谈谈如何对骨架结构进行优化。

好，我们再来说下文本块的骨架结构生成。

**文本块的骨架结构生成**

文本块可以算是骨架屏生成中最复杂的一个区块了，正如上面也说的，任何只包含文本节点的元素都将视为文本块，在确定某个元素是文本块后，下一步就是通过一些 CSS 样式，以及元素的增减将其修改为骨架样式。

![5aebdc81eee0f](https://i.loli.net/2018/05/04/5aebdc81eee0f.png)

在这张图中，图左边虚线框内是一个 p 元素，可以看到其内部有 4 行文本，右图是一个已经生成好的带有 4 行文本的骨架屏。在生成文本块骨架屏之前，我们首先需要了解一些基本的参数。

- 单行文本内容的高度，可以通过 fontSize 获取到。

- 单行文本内容加空白间隙的高度，可以通过 lineHeight 获取到。

- p 元素总共有多少行文本，也就是所谓行数，这个可以通过 p 元素的（height - paddingTop - paddingBottom）/ lineHeight 大概算出。

- 文本的 textAlign 属性。

在这些参数中，fontSize、lineHeight、paddingTop、paddingBottom 都可以通过 getComputedStyle 获取到，而元素的高度 height 可以通过 getBoundingClientRect 获取到，有了这些参数后我们就能够绘制文本块的骨架屏了。

![5aebd4c465ec1](https://i.loli.net/2018/05/04/5aebd4c465ec1.png)

相信很多人都读过  [@Lea Verou](https://github.com/LeaVerou) 的 _CSS Secrets_ 这本书，书中有一篇专门阐述怎么通过线性渐变生成条纹背景的文章，而在绘制文本块骨架屏方案，正是受到了这篇文章的启发，文本块的骨架屏也是通过线性渐变来绘制的。核心简化代码看屏幕：

```javascript
const textHeightRatio = parseFloat(fontSize, 10) / parseFloat(lineHeight, 10)
const firstColorPoint = ((1 - textHeightRatio) / 2 * 100).toFixed(decimal)
const secondColorPoint = (((1 - textHeightRatio) / 2 + textHeightRatio) * 100).toFixed(decimal)

const rule = `{
  background-image: linear-gradient(
    transparent ${firstColorPoint}%, ${color} 0%,
    ${color} ${secondColorPoint}%, transparent 0%);
  background-size: 100% ${lineHeight};
  position: ${position};
  background-origin: content-box;
  background-clip: content-box;
  background-color: transparent;
  color: transparent;
  background-repeat: repeat-y;
}`
```

我们首先计算了lineHeight 和 fontSize 等一些样式参数，通过这些参数我们计算出了文本占整个行高的比值，也就是 textHeightRadio，有了这一比值，就可以知道灰色条纹的分界点，正如 @Lea Verou 所说:

> 摘自：CSS Secrets  
> “If a color stop has a position that is less than the specied position of any color stop before it in the list, set its position to be equal to the largest speci ed position of any color stop before it.”  
> — CSS Images Level 3 ([http://w3.org/TR/css3-images](https://link.zhihu.com/?target=http%3A//w3.org/TR/css3-images))

也就是说，在线性渐变中，如果我们将线性渐变的起始点设置小于前一个颜色点的起始值，或者设置为0 %，那么线性渐变将会消失，取而代之的将是两条颜色分明的条纹，也就是说不再有线性渐变。

在我们绘制文本块的时候，backgroundSize 宽度为 100%， 高度为 lineHeight，也就是灰色条纹加透明条纹的高度是 lineHeight。虽然我们把灰色条纹绘制出来了，但是，我们的文字依然显示，在最终骨架样式效果出现之前，我们还需要隐藏文字，设置 `color：‘transparent’` 这样我们的文字就和背景色一致，最终显示得也就是灰色条纹了。

根据 lineCount 我们可以判断文本块是单行文本还是多行，在处理单行文本的时候，由于文本的宽度并没有整行宽度，因此，针对单行文本，我们还需要计算出文本的宽度，然后设置灰色条纹的宽度为文本宽度，这样骨架样式的效果才能够更加接近文本样式。

**图片块的骨架生成**

图片块的绘制比文本块要相对简单很多，但是在订方案的过程中也踩了一些坑，这儿简单分享下采坑经历。

最初订的方案是通过一个 DIV 元素来替换 IMG 元素，然后设置 DIV 元素背景为灰色，DIV 的宽高等同于原来 IMG 元素的宽高，这种方案有一个严重的弊端就是，原来通过元素选择器设置到 IMG 元素上的样式无法运用到 DIV 元素上面，导致最终图片块的骨架效果和真实的图片在页面样式上有出入，特别是没法适配不同的移动端设备，因为 DIV 的宽高被硬编码。

接下来我们又尝试了一种看似「高级」的方法，通过 Canvas 来绘制和原来图片大小相同的灰色块，然后将 Canvas 转化为 dataUrl 赋予给 IMG 元素的 src 特性上，这样 IMG 元素就显示成了一个灰色块了，看似完美，当我们将生成的骨架页面生成 HTML 文件时，一下就傻眼了，文件大小尽然有 200 多 kb，我们做骨架页面渲染的一个重要原因就是希望用户在感知上感觉页面加载快了，如果骨架页面都有 200 多 kb，必将导致页面加载比之前要慢一些，违背了我们的初衷，因此该方案也只能够放弃。

**最终方案**，我们选择了将一张1 * 1 像素的 gif 透明图片，转化成 dataUrl ，然后将其赋予给 IMG 元素的 src 特性上，同时设置图片的 width 和 height 特性为之前图片的宽高，将背景色调至为骨架样式所配置的颜色值，完美解决了所有问题。

> // 最小 1 * 1 像素的透明 gif 图片  
> 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

这是1 * 1像素的 base64 格式的图片，总共只有几十个字节，明显比之前通过 Canvas 绘制的图片小很多。

代码看屏幕：

```javascript
function imgHandler(ele, { color, shape, shapeOpposite }) {
  const { width, height } = ele.getBoundingClientRect()
  const attrs = {
    width,
    height,
    src
  }

  const finalShape = shapeOpposite.indexOf(ele) > -1 ? getOppositeShape(shape) : shape

  setAttributes(ele, attrs)

  const className = CLASS_NAME_PREFEX + 'image'
  const shapeName = CLASS_NAME_PREFEX + finalShape
  const rule = `{
    background: ${color} !important;
  }`
  addStyle(`.${className}`, rule)
  shapeStyle(finalShape)

  addClassName(ele, [className, shapeName])

  if (ele.hasAttribute('alt')) {
    ele.removeAttribute('alt')
  }
}
```

**svg 块骨架结构**

svg 块处理起来也比较简单，首先我们需要判断 svg 元素 hidden 属性是否为 true，如果为 true，说明该元素不展示的，所以我们可以直接删除该元素。

```javascript
if (width === 0 || height === 0 || ele.getAttribute('hidden') === 'true') {
  return removeElement(ele)
}
```

如果不是隐藏的元素，那么我们将会把 svg 元素内部所有元素删除，减少最终生成的骨架页面体积，其次，设置svg 元素的宽、高和形状等。

```javascript
const shapeClassName = CLASS_NAME_PREFEX + shape
shapeStyle(shape)

Object.assign(ele.style, {
  width: px2relativeUtil(width, cssUnit, decimal),
  height: px2relativeUtil(height, cssUnit, decimal),
})

addClassName(ele, [shapeClassName])

if (color === TRANSPARENT) {
  setOpacity(ele)
} else {
  const className = CLASS_NAME_PREFEX + 'svg'
  const rule = `{
    background: ${color} !important;
  }`
  addStyle(`.${className}`, rule)
  ele.classList.add(className)
}
```

**一些优化的细节**

- 首先，由上面一些代码可以看出，在我们生成骨架页面的过程中，我们将所有的共用样式通过 `addStyle` 方法缓存起来，最后在生成骨架屏的时候，统一通过 style 标签插入到骨架屏中。这样保证了样式尽可能多的复用。
- 其次，在处理列表的时候，为了生成骨架屏尽可能美观，我们对列表进行了同化处理，也就是说将 list 中所有的 listItem 都是同一个 listItem 的克隆。这样生成的 list 的骨架屏样式就更加统一了。
- 还有就是，正如前文所说，骨架屏仅是一种加载状态，并非真实页面，因此其并不需要完整的页面，其实只需要首屏就好了，我们对非首屏的元素进行了删除，只保留了首屏内部元素，这样也大大缩减了生成骨架屏的体积。
- 删除无用的 CSS 样式，只是我们只提取了对骨架屏有用的 CSS，然后通过 style 标签引入。

关键代码大致是这样的，看屏幕：

```javascript
const checker = (selector) => {
  if (DEAD_OBVIOUS.has(selector)) {
    return true
  }
  if (/:-(ms|moz)-/.test(selector)) {
     return true
  }
  if (/:{1,2}(before|after)/.test(selector)) {
    return true
  }
  try {
    const keep = !!document.querySelector(selector)
    return keep
  } catch (err) {
    const exception = err.toString()
    console.log(`Unable to querySelector('${selector}') [${exception}]`, 'error')
    return false
  }
}
```

可以看出，我们主要通过 document.querySelector 方法来判断该 CSS 是否被使用到，如果该 CSS 选择器能够选择上元素，说明该 CSS     样式是有用的，保留。如果没有选择上元素，说明该 CSS 样式没有用到，所以移除。

在后面的一些 slides 中，我们来聊聊怎讲将构建骨架屏和 webpack 开发、打包结合起来，最终将我们的骨架屏打包到实际项目中。

## 通过 webpack 将骨架屏打包到项目中

在上一个部分，我们分析了怎么去生成骨架屏，在这一部分，我们将探讨如何通过 webpack 将骨架屏打包的项目中。在这过程中，思考了以下一些问题：

**为什么在开发过程中生成骨架屏？**

其主要原因还是为了骨架屏的可编辑。

在上一个部分，我们通过一些样式和元素的修改生成了骨架屏页面，但是我们并没有马上将其写入到配置的输出文件夹中，在写入骨架页面到项目之前。我们通过 [memory-fs](https://github.com/webpack/memory-fs) 将骨架屏写入到内存中，以便我们能够通过预览页面进行访问。同时我们也将骨架屏源码发送到了预览页面，这样我们就可以通过修改源码，对骨架屏进行二次编辑。

正如屏幕上这张图片，这张图是插件打开的骨架屏的预览页面，从左到右依次是开发中的真实页面、骨架屏、骨架屏可编辑源码。

![5ae439b52c75d](https://i.loli.net/2018/04/28/5ae439b52c75d.jpg)

这样我们就可以在开发过程中对骨架屏进行编辑，修改部分样式，中部骨架屏可以进行实时预览，这之间的通信都是通过websocket 来完成的。当我们对生成的骨架屏满意后，并点击右上角写入骨架屏按钮，将骨架屏写入到项目中，在最后项目构建时，将骨架屏打包到项目中。

如果我们同时在构建的过程中生成骨架屏，并打包到项目中，这时的骨架屏我们是无法预览的，因此我们对此时的骨架屏一无所知，也不能够做任何修改，这就是我们在开发中生成骨架屏的原因所在。

演讲最开始已经提到，目前流行的前端框架基本都是 JS 驱动，也就是说，在最初的 index.html 中我们不用写太多的 html 内容，而是等框架启动完成后，通过运行时将内容填充到 html 中，通常我们会在 html 模板中添加一个根元素（看屏幕）：

```html
<div id="app"></div>
```

当应用启动后，会将真实的内容填充到上面的元素中。这也就给了我们一个展示骨架屏的机会，我们将骨架屏在页面启动之前添加到上面元素内（看屏幕）：

```html
<div id="app"><!-- shell.html --></div>
```

我们在项目构建的过程中，将骨架屏 插入到上面代码注释的位置，这样在应用启动前，就是展示的骨架屏，当应用启动后，通过真实数据渲染的页面替换骨架屏页面。

**怎样将骨架屏打包到项目中**

Webpack 是一款优秀的前端打包工具，其也提供了一些丰富的 API 让我们可以自己编写一些插件来让 webpack 完成更多的工作，比如在构建过程中，将骨架屏打包到项目中。

Webpack 在整个打包的过程中提供了众多生命周期事件，比如`compilation` 、`after-emit` 等，比如我们最终将骨架屏插入到 html 中就是在`after-emit` 钩子函数中进行的，简单的代码看下屏幕：

```javascript
SkeletonPlugin.prototype.apply = function (compiler) {
  // 其他代码
  compiler.plugin('after-emit', async (compilation, done) => {
    try {
      await outputSkeletonScreen(this.originalHtml, this.options, this.server.log.info)
    } catch (err) {
      this.server.log.warn(err.toString())
    }
    done()
  })
  // 其他代码
}
```

我们再来看看 `outputSkeletonScreen` 是如何将骨架屏插入到原始的 HTML 中，并且写入到配置的输入文件夹的。

```javascript
const outputSkeletonScreen = async (originHtml, options, log) => {
  const { pathname, staticDir, routes } = options
  return Promise.all(routes.map(async (route) => {
    const trimedRoute = route.replace(/\//g, '')
    const filePath = path.join(pathname, trimedRoute ? `${trimedRoute}.html` : 'index.html')
    const html = await promisify(fs.readFile)(filePath, 'utf-8')
    const finalHtml = originHtml.replace('<!-- shell -->', html)
    const outputDir = path.join(staticDir, route)
    const outputFile = path.join(outputDir, 'index.html')
    await fse.ensureDir(outputDir)
    await promisify(fs.writeFile)(outputFile, finalHtml, 'utf-8')
    log(`write ${outputFile} successfully in ${route}`)
    return Promise.resolve()
  }))
}
```

## 更多思考

Page Skeleton webpack 插件在我们内部团队已经开始使用，在使用的过程中我们也得到了一些反馈信息。

首先是对 SPA 多路由的支持，其实现在插件已经支持多路由了，只是还没有用到真实项目中，我们针对每一个路由页面生成一个单独的 `index.html`，也就是静态路由。然后将每个路由生成的骨架屏插入到不同的静态路由的 html 中。

其次，玩过服务端渲染的同学都知道，在 React 和 Vue 服务端渲染中有一种称为 Client-side Hydration 的技术，指的是在 Vue 在浏览器接管由服务端发送来的静态 HTML，使其变为由 Vue 管理的动态 DOM 的过程。

在我们构建骨架屏的过程中，其 DOM 结构和真实页面的 DOM 结构基本相同，只是添加了一些行内样式和 classname，我们也在思考这些 DOM 能够被复用，也就是在应用启动时重新创建所有 DOM。我们只用激活这些骨架屏 DOM，让其能够相应数据的变化，这似乎就可以使骨架屏和真实页面更好的融合。

还有，在页面启动后，我们可能还是会通过 AJAX 获取后端数据，这时候我们也可以通过 骨架屏 来作为一种加载状态。也就是说，其实我们可以在「非首屏骨架屏」上做一些工作。

最后，在项目中可能会有一些性能监控的需求，比如骨架屏什么时候创建，什么时候被销毁，这些我们可能都希望通过一些性能监控的工具记录下来，以便将来做一些性能上面的分析。因此将来也会提供一些骨架屏的生命周期函数，或者提供相应的自定义事件，在生命周期不同阶段，调用相应的生命周期钩子函数或监听相应事件，这样就可以将骨架屏的一些数据记录到性能监控软件中。
