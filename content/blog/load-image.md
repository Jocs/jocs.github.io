---
external: false
title: "新零售图片加载优化方案"
description: "新零售图片加载优化方案."
date: 2018-03-27
---

饿了么 App 中新零售项目主要是以图片展示为主，引导用户点击轮播广告栏或者店铺列表进入指定的商品页面，因此页面中包含了大量图片，如搜索框下面的轮播广告栏、中部的促销栏以及底部的店铺列表，这些区域中都有大量的展示图片。因此图片的加载速率直接影响页面的加载速度。下面将从图片加载存在的问题和原因、解决方案两个方面来阐述如何优化新零售图片的加载。

### 图片加载存在的问题和原因

**问题一**：启动页面时加载过多图片

![](/blog/images-load-optmization/max_size.jpeg)

**图1**： 新零售图片请求瀑布图

**问题原因分析**： 如上图所示，页面启动时加载了大约 49 张图片（具体图片数量会根据后端返回数据而变化），而这些图片请求几乎是并发的，在 Chrome 浏览器，对于同一个域名，最多支持 6 个请求的并发，其他的请求将会推入到队列中等待或者停滞不前，直到六个请求之一完成后，队列中新的请求才会发出。上面的瀑布图中，在绿色的标记框中，我们看到不同长度的白色横柱，这些都是请求的图片资源排队等待时间。

**问题二**：部分图片体积过大

![](/blog/images-load-optmization/banner_timing.jpeg)

图2. 顶部轮播图中的一张图片加载图

**问题原因分析**：如图 1，红框中是搜索框下部的轮播广告中的一张图片，通过图 2 可以看到，该图片主要耗时在 `Conent Download` 阶段。在下载阶段耗时 13.50s。而该请求的总共时间也就 13.78s。产生该问题的原因从图 1 也能看出一些端倪，该图片体积 `76.2KB`，**图片体积过大**，直接导致了下载图片时间过长。

### 前端解决方案

**针对问题一的解决方案**

由于新零售首页展示展示大量图片，其实在这大约 49 张图片中，大部分图片都不是首屏所需的，因此可以延迟首屏不需要的图片加载，而优先加载首屏所需图片。这儿**首屏**的含义是指打开新零售首页首先进入屏幕视窗内的区域范围。

判断图片是否是首屏内图片，首先想到的肯定是通过 `getBonundingClientRect` 方法，获取到图片的位置信息，判断其是否在 `viewport` 内部。可能的代码如下：

```Javascript
const inViewport = (el) => {
  const rect = el.getBoundingClientRect()

  return rect.top > 0
    && rect.bottom < window.innerHeight
    && rect.left > 0
    && rect.right < window.innerWidth
}
```

但是在项目中，我们并没有采用该方案来判断是否在首屏，其原因在于，只有当 DOM 元素插入到 DOM 树中，并且页面进行重拍和重绘后，我们才能够知道该元素是否在首屏中。在项目中我们使用了 [v-img](https://github.com/ElemeFE/vue-img) 指令（新零售项目使用该指令对图片进行加载、并且将 hash 转换成 Url。项目已开源，在符合需求前提下欢迎使用），在 Vue 指令中包含两个钩子函数 `bind` 和 `inserted`。官网对这两个钩子函数进行如下解释：

>- `bind`：只调用一次，指令第一次绑定到元素时调用。在这里可以进行一次性的初始化设置。
>- `inserted`：被绑定元素插入父节点时调用 (仅保证父节点存在，但不一定已被插入文档中)。

由上面解释可知，我们只能够在 inserted 钩子函数中才能够获取到元素的位置，并且判断其是否在首屏中。在新零售项目中，经过笔者测试，这两个钩子函数的触发时差大约是200ms，因此如果在 inserted 钩子函数内再去加载图片就回比在 bind 钩子函数中加载晚大约200ms，在 4G 网络环境下，200ms 对于很多图片来说已经足够用来加载了，因此我们最终放弃了在 inserted 钩子函数中加载首屏图片的方案。

**如果元素没有插入到 DOM 树中并渲染，怎么能够判断其是否在首屏中呢**？

> \<img v-img="{ hash: 'xxx', defer: true }"\>

项目中使用了一种比较笨的方式来判断哪些是首屏图片，新零售页面布局是确定的，轮播广告栏下面是促销栏、再下面是店铺列表，这些组件的高度也都相对固定，因此这些组件是否在首屏中其实我们是事先知道的。因此在实际使用 [v-img](https://github.com/ElemeFE/vue-img) 指令的时候，通过传 `defer` 配置项来告诉 v-img 哪那些图片需要提前加载，哪些图片等待提前加载的图片加载完毕后再加载。这样我们就能够在 bind 钩子函数中加载优先加载的图片了。比如说，轮播组件图片、促销组件图片、前两个店铺中的展示图片需要先加载，除此以外的其他图片，需等待首屏图片完全加载后再进行请求加载。实际实现代码如下：

```javascript
const promises = [] // 用来存储优先加载的图片  
Vue.directive('img', {
    bind(el, binding, vnode) {
   	  // ...
      const { defer } = binding.value
	  // ...
      if (!defer) {
        promises.push(update(el, binding, vnode))
      }
    },
    inserted(el, binding, vnode) {
      const { defer } = binding.value
      if (!defer) return
      if (inViewport(el)) {
        promises.push(update(el, binding, vnode))
      } else {
        Vue.nextTick(() => {
          Promise.all(promises)
          .then(() => {
            promises.length = 0
            update(el, binding, vnode)
          })
          .catch(() => {})
        })
      }
    },
    // ...
  })
```

首先通过声明一个数组 promises 用于存储优先加载的图片，在 bind 钩子函数内部，如果 defer 配置项为 false，说明不延时加载，那么就在 bind 钩子函数内部加载该图片，且将返回的 promise 推入到 promises 数组中。在 inserted 钩子函数内，对于延迟加载的图片（defer 为 true），但是其又在首屏内，那么也有优先加载权，在 inseted 钩子函数调用时就对其加载。而对于非首屏且延迟加载的图片等待 promises 数组内部所有的图片都加载完成后才加载。当然在实际代码中还会考虑容错机制，比如上面某张图片加载失败、或者加载时间太长等。因此我们可以配置一个最大等待时间。

优化后的图片加载瀑布图如下：

![](/blog/images-load-optmization/after_optimization.jpeg)

图2. 图片按需加载的瀑布图

如上图所示，下面红框的图片不是首屏图片，因此进行了延迟加载。可以看出，其是在上面所有图片（包括上面的红框中耗时最长的那张图）加载完成之后进行加载的。这样减少了首屏加载时的网络消耗。提升了图片下载速度。

**优化前后对比**

通过上面的优化方案，在预设的网络环境下（参见文末注），分别对优化前和优化后进行了 5 次平行`清空缓存加载`，平均数据如下：

|            | DOMContentLoaded | Loaded | Max_size_image |
| :--------: | :--------------: | :----: | :------------: |
| 优化前（平均值 s） |       1.01       |  1.01  |   13.86±0.54   |
| 优化后（平均值 s） |      0.952       | 0.951  |   8.12±0.50    |

通过上面表格可以看出，`DOMContentLoaded` 和 `Loaded` 并没有多大参考价值，首屏的完整展现所需要的时间依然由加载最慢（一般都是体积最大那张图片）的图片决定，也就是上表的 `Max_size_image` 决定，上表可以看出，优化后比优化前最大体积图片的加载时间缩短了 **5.74s**。提速了整整 **41.41%**。加载最慢的图片加载速度的变化也很好的反应了首屏时间的变化。

当然上面的数据也不能够完全反应线上场景，毕竟测试的时间点及后端数据都有所不同。我们也不能够在同一时间点、同一网络环境下对优化前、优化后进行同时数据采集。

**针对问题一还有些后续的解决方案：**

* 在 HTTP/1.0 和 HTTP/1.1 协议下，由于 Chrome 只支持同域同时发送 6 个并发请求，可以进行域名切分，来提升并发的请求数量。或者使用 HTTP/2 协议。

**针对问题二的解决方案**

**图片体积过大，导致下载时间过长。**在保证清晰度的前提下尽量使用体积较小的图片。而一张图片的体积由两个因素决定，该图片总的像素数目和编码单位像素所需的字节数。因此一张图片的文件大小就等于图片总像素数目乘以编码单位像素所需字节数，也就是有如下等式：

> FileSize = Total Number Pixels  *  Bytes of Encode single Pixels

举个例子：

一张 `100px * 100px` 像素的图片，其包含该 `100 * 100 = 10000` 个像素点，而每个像素点通过 `RGBA` 颜色值进行存储，`R\G\B\A` 每个色道都有 0~255 个取值，也就是 2^8 = 256。正好是 8 位 1byte。而每个像素点有四个色道，每个像素点需要 4bytes。因此该图片体积为：`10000 * 4bytes = 40000bytes = 39KB`。

有了上面的背景知识后，我们就知道怎么去优化一张图片了，无非就两个方向：

* 一方面是减少单位像素所需的字节数
* 另一方面是减少一张图片总的像素个数

**单位像素优化**：单位像素的优化也有两个方向，一个方向是「有损」的删除一些像素数据，另一个方面是做一些「无损」的图片像素压缩。正如上面例子所说，`RGBA` 颜色值可以表示 `256^4` 种颜色，这是一个很大的数字，往往我们不需要这么多颜色值，因此我们是否可以减少色板中的颜色种类呢？这样表示单位像素的字节数就减少了。而「无损」压缩是通过一些算法，存储像素数据不变的前提下，尽量减少图片存储体积。比如一张图片中的某一个像素点和其周围的像素点很接近，比如一张蓝天的图片，因此我们可以存储两个像素点颜色值的差值（当然实际算法中可能不止考虑两个像素点也许更多），这样既保证了像素数据的「无损」，同时也减少了存储体积。不过也增加了图片解压缩的开销。

针对单位像素的优化，衍生出了不同的图片格式，`jpeg`、`png`、`gif`、`webp`。不同的图片格式都有自己的减少单位像素体积的算法。同时也有各自的优势和劣势，比如 `jpeg` 和 `png` 不支持动画效果，`jpeg` 图片体积小但是不支持透明度等。因此项目在选择图片格式上的策略就是，在满足自己需求的前提下选择体积最小的图片格式，新零售项目中已经统一使用的 `WebP` 格式，和 `jpeg` 格式相比，其体积更减少 30%，同时还支持动画和透明度。

**图片像素总数优化**：

![](/blog/images-load-optmization/natural.jpeg)

图3：图片加载尺寸和实际渲染尺寸对比

上图是新零售类目页在 Chrome 浏览器中的 iPhone 6 模拟器加载后的轮播展示的图片之一，展示的图片是 `750 * 188` 像素，但是图片的实际尺寸为 `1440 * 360` 像素，也就是说我们根本不需要这么大的图片，大图片不仅造成了图片加载的时长增加（后面会有数据说明），同时由于图片尺寸需要缩小增加CPU的负担。

上文中已经提及，项目中我们使用的 `v-img` 指令来加载项目中的所需图片，如果我们能够根据设备的尺寸来加载不同尺寸（像素总数不同）的图片，也就是说在保证图片清晰度的前提下，尽量使用体积小的图片。问题就迎刃而解了。项目中我们使用的是七牛的图片服务，[七牛图片服务](https://developer.qiniu.com/dora/manual/1270/the-advanced-treatment-of-images-imagemogr2)提供了图片格式转换、按尺寸裁剪等图片处理功能。只需要对 `v-img` 指令添加图片宽、高的配置，那么我们是不是可以对不同的设备加载不同尺寸的图片呢？

项目中我们使用的 [lib-flexible](https://github.com/amfe/lib-flexible) 来对不同的移动端设备进行适配，`lib-flexible` 库在我们页面的html元素添加了两个属性，`data-dpr` 和 `style`。这儿我们主要会用到 style 中的 `font-size` 值，在一定的设备范围内其正好是html元素宽度的十分之一（具体原理参见：[使用Flexible实现手淘H5页面的终端适配](http://www.w3cplus.com/mobile/lib-flexible-for-html5-layout.html)），也就是说我们可以通过style属性大概获取到设备的宽度。同时设计稿又是以 iPhone6 为基础进行设计的，也就是设计稿是宽度为 750px的设计图，这样在设计图中的图片大小我们也就能够转换成其他设备中所需的图片大小了。

举个例子：

设计稿中一张宽 200px 的图片，其对应的 iPhone 6 设备的宽度为 750px。我们通过 html 元素的 style 属性计算出 iPhone6 plus 的宽度为 1242px。这样也就能够计算中 iPhone6 plus 所需图片尺寸。计算如下：

>200 * 1242 / 750 = 331.2px

实现代码如下：

```javascript
const resize = (size) => {
  let viewWidth
  const dpr = window.devicePixelRatio
  const html = document.documentElement
  const dataDpr = html.getAttribute('data-dpr')
  const ratio = dataDpr ? (dpr / dataDpr) : dpr

  try {
    viewWidth = +(html.getAttribute('style').match(/(\d+)/) || [])[1]
  } catch(e) {
    const w = html.offsetWidth
    if (w / dpr > 540) {
      viewWidth = 540 * dpr / 10
    } else {
      viewWidth = w / 10
    }
  }

  viewWidth = viewWidth * ratio

  if (Number(viewWidth) >= 0 && typeof viewWidth === 'number') {
    return (size * viewWidth) / 75 // 75 is the 1/10 iphone6 deivce width pixel
  } else {
    return size
  }
}
```

上面 resize 方法用于将配置的宽、高值转换为实际所需的图片尺寸，也就是说，size 参数是 iphone 6 设计稿中的尺寸，resize 的返回值就是当前设备所需的尺寸，再把该尺寸配置到图片服务器的传参中，这样我们就能够获取到按设备裁剪后的图片了。

**优化前后效果对比**，有了上面的基础，我们在 Chrome 中的不同的移动端模拟器上进行了实验，我们对新零售类目页中的一张体积最大的广告图片在不同设备中的加载进行了数据统计（平行三次清空缓存加载），为什么选择体积最大的图片，上文也已经说过，其决定了首屏展现所需的时间。

|       **Size(px)**       | **File Size**(KB) | **Total Time**(s) | **Download**(s) | **TTFB**(ms) |
| :----------------------: | :---------------: | :---------------: | :-------------: | :----------: |
|    iphone5(640 * 160)    |       23.2        |       3.90        |      3.65       |    226.62    |
|    iphone6(750 * 188)    |       30.4        |       5.05        |      4.87       |    162.37    |
|   Nexus 5x(820 * 205)    |       34.2        |       5.87        |      5.35       |    501.34    |
|  Galaxy S5(1080 * 270)   |       51.1        |       9.31        |      9.13       |    222.67    |
|   Nexus 6P(1230 * 308)   |       61.9        |       10.57       |      9.12       |    220.67    |
| Iphone6 plus(1240 * 310) |       62.5        |       10.99       |      10.66      |    313.74    |
|     未优化（1440 * 360）      |       76.2        |       14.85       |      13.79      |    224.01    |

上表格中，除去最后一行是未优化的加载数据，从上到下，设备屏幕尺寸逐渐变大，加载的图片尺寸也从 23.2kb增加到 65.5kb。而加载时间和下载时长也跟随着图片体积的加大而增加，下面的折线图更能够反应图片尺寸、加载时长、下载时长之间的正相关关系。TTFB（从发送请求到接收到第一个字节所需时长）却和图片大小没有明显的正相关关系，可能对于图片服务器在裁剪上述不同尺寸的图片所需时长差异不大。

![](/blog/images-load-optmization/chart.jpg)

图4：不同设备中对同一张图片进行加载，文件大小、加载和下载时长的折线变化

由上折线图我们还能看到，对于小屏幕设备的效果尤为明显，在不优化下，iPhone5 中图片的加载需要 14.85s，而优化后，加载时长缩短到了 3.90s。加载时长整整缩短了 **73.73%**。而对于大屏幕的 iPhone6 plus 也有 **26.00%** 时长优化。

当然上面的数据是建立在 `256 kbps ISDN/DSL` 的网络环境下的，该低速网络环境下，图片的加载时间主要是由于下载时间决定的，因此通过优化图片体积能够达到很好的效果。在 `4G`（Charles模拟）环境下，iPhone5 中的优化效果就会有些折扣，加载时长缩短 **69.15%**。其实也很容易想到，在高速的网络环境下，TTFB 对加载时长的影响会比低速网络环境下影响要大一些。

### 最后总结

通过上面的研究及数据结果表明，新零售图片加载缓慢的优化策略：

* 首屏图片优先加载，等首屏图片加载完全后再去加载非首屏图片。
* 对大部分图片，特别是轮播广告中的图片进行按设备尺寸裁剪，减少图片体积，减少网络开销，加快下载速率。

本文中没有过多的讨论代码实现细节，而是把重点放在了图片加载缓慢的原因分析，以及优化前后效果对比的数据分析上，如果想看更多代码细节，请移步[vue-img](https://github.com/ElemeFE/vue-img)。

**注**：本文所有数据及图片都是通过 **Charies** 模拟 `256 kbps ISDN/DSL` 网络环境获取到的。在本案例中只考虑位图，因此文本中提及的图片都是指位图而非矢量图。