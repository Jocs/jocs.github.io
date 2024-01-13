---
external: false
title: "Muya 编辑器介绍及架构"
description: "Muya 编辑器介绍及架构."
date: 2023-03-12
---

从 2017 年年底开始，我利用业余时间在开发一款开源 markdown 编辑器 [marktext](https://github.com/marktext/marktext)，marktext 是一款使用 Electron 开发的所见即所得 markdown 编辑器，下面引用了 README 上的描述：

>A simple and elegant open-source markdown editor that focused on speed and usability.
>(Available for Linux, macOS and Windows.)

正如上面描述，marktext 更多的聚焦在高性能（speed）和可用性（usability）上面，这与其编辑器核心（[muya](https://github.com/marktext/muya)）的架构设计是分不开的，这一系列文章（分享）将聚焦在 muya 的架构设计以及模块实现上。整个系列将拆分成三篇文章：
- [Muya 编辑器的介绍及架构](https://github.com/Jocs/jocs.github.io/issues/28)
- Muya 编辑器核心模块的设计和实现
- Muya 编辑器支持协作编辑

## 一、Muya 编辑器介绍

### 1.1 背景
Muya 编辑器最初是和 marktext 在一个仓库里开发，但是在开发过程中，一些架构及性能问题逐渐暴露：
1. 在编辑文字内容较多的文档时，比如 50000 字以上，会出现卡顿的现象，Muya 使用 [snabbdom](https://github.com/snabbdom/snabbdom) 作为渲染引擎，每次编辑后全局渲染导致卡顿，比如在我们进行用户输入、或者通过按下 Enter 创建新段落、复制黏贴段落，都需要全局渲染整个文档。
2. History（即 Undo/Redo 功能） 模块设计的过于简单，每次用户的操作都是记录的整个文档状态的深拷贝，导致了内存占用过多。
3. marktext 不支持协作编辑。

由于上面的一些问题，大概在 2018 年开始重构 muya，在尽量保证功能不变的前提，来实现更高的性能以及更小的内存占用。

### 1.2 Muya 的支持哪些功能

（[marktext 官网 Feature 部分](https://marktext.app/)）

1. 所输及所得，传统 markdown 编辑器通常是分屏的，也就是左边是 markdown 编辑区，右边是预览区，muya 将编辑区和预览区整合在了一起，可以让我们更聚焦在写作上，而不用关注 markdown 语法。
2. 支持 [CommonMark Spec](https://spec.commonmark.org/) 和 [GitHub Flavored Markdown Spec](https://github.github.com/gfm/) markdown 标准，并且选择性支持 [Pandocs Markdown](https://pandoc.org/MANUAL.html#pandocs-markdown)。（更多的细节将在本系列第二篇文章 <Muya 编辑器核心模块的设计和实现> 讨论）
3. 支持额外的 markdown 扩展语法，比如行内及块的数学公式、Front Matter、Emoji 等。
5. 支持导出 HTML、markdown、JSON，支持导入 markdown、JSON。
6. 支持图表，[flowchart](https://github.com/adrai/flowchart.js)、[mermaid](https://github.com/mermaid-js/mermaid) 等。

## 二、编辑器的核心实现原理及插件支持

在上一个部分主要介绍了 muya 重构的背景，以及 muya 所支持的功能，在这一个部分，我将通过一些简单的代码来描述下 muya 的核心实现原理，以及是如何支持语法和 UI 插件的。

### 2.1 Muya 编辑器核心实现原理概述

我们先来看看单个 markdown 段落是如何渲染的：

```html
<span contenteditable="true"></span>
```

作为前端工程师，应该都知道，给一个 span 元素加上 contenteditable 的属性，那么这个 span 元素将转变成可编辑状态，这样不就是一个最简单的文本编辑器了吗？

```html
<span contenteditable="ture">normal text **strong**</span>
```

可是当我在输入框中输入 **strong** 时，编辑器并没有帮我们对文本 strong 进行加粗，这时候 markdown 词法解析器（Lexical analysis）就派上用场了。

我们通过 [tokenizer](https://github.com/marktext/muya/blob/8d7bfefbdedc3cb6bdbe92f317af27f6f274d909/lib/inlineRenderer/lexer.js#L527) 函数，将 span 中的文本内容解析成一个 token 数组，如下：

```json
[
  {
    "type": "text",
    "raw": "normal text ",
    "content": "normal text ",
    "range": {
      "start": 0,
      "end": 12
    }
  },
  {
    "type": "strong",
    "raw": "**strong**",
    "range": {
      "start": 12,
      "end": 22
    },
    "marker": "**",
    "children": [
      {
        "type": "text",
        "raw": "strong",
        "content": "strong",
        "range": {
          "start": 14,
          "end": 20
        }
      }
    ],
    "backlash": ""
  }
]
```

其实 [tokenizer](https://github.com/marktext/muya/blob/8d7bfefbdedc3cb6bdbe92f317af27f6f274d909/lib/inlineRenderer/lexer.js#L527) 的原理就是通过正则表达式匹配到通过 ** 语法，然后将其转化成 tokens，并且记录了语法开始和结束的位置，便于后面进行渲染，大家如果有兴趣可以看看 tokenizer 源码。

当我们拿到 tokens 后 ，接下来就是将其转换成标记后 HTML，然后插入到之前 contenteditable span 元素中。

```html
<span contenteditable="true">
  <span class="mu-plain-text">normal text </span>
  <span class="mu-hide mu-remove">**</span>
  <strong class="mu-inline-rule">
    <span class="mu-plain-text">strong</span>
  </strong>
  <span class="mu-hide mu-remove">**</span>
 </span>
```

在转换成 HTML 过程中，我们使用了 snabbdom，对 tokens 进行深度优先的遍历，并生成 vnode（[相关源码](https://github.com/marktext/muya/tree/master/lib/inlineRenderer/renderer)）。首先 snabbdom 能够节省我们去拼接 HTML 的工作量，最重要的原因，其 patch 方法会对新老 HTML (vnode)进行比对，仅替换或修改更改的 vnode，这显然比使用 innerHTML 性能更优。

当进行到这一步，我们的 strong  文本已经加粗显示在了编辑区中，但是问题来了，在我们编辑后，contenteditable span 进行了重新渲染，我们的光标或选区也会在重新渲染后丢失，那接下来的工作就是将光标或选区设置回之前的编辑位置。
在浏览器中提供了方法来设置光标：

```js
  select (startNode, startOffset, endNode, endOffset) {
    const range = document.createRange()
    range.setStart(startNode, startOffset)
    if (endNode) {
      range.setEnd(endNode, endOffset)
    } else {
      range.collapse(true)
    }
    this.selectRange(range)

    return range
  }
```

任何一个光标或者选区都可以通过一对（Anchor 和 Focus） DOM Node 加 offset 来标识，在 [Selecton](https://github.com/marktext/muya/tree/master/lib/selection) 模块中，我们对光标位置进行记录，这样在内容重新渲染后，我们只需通过上面的方法重新设置光标或选区就能使编辑器保持输入状态了。上面只是截取了 Muya Selection 模块部分代码，Selection 模块更多设计细节将在 <Muya 编辑器核心模块的设计和实现> 描述。

### 2.2 Muya 是如何支持语法插件和 UI 组件的

我们在做软件架构的时候，都会考虑到其扩展性，muya 的设计也不例外，正如上面所描述，muya 仅支持 CommonMark Spec 和 GFM，以及部分 markdown 语法扩展，如果我们支持语法插件，那么 muya 的使用者就不用给开发者提 Feture Request 了，可以直接通过语法插件来添加新的扩展语法，比如 ==highlight==。

上文已经有所介绍，markdown 行内语法样式在渲染的过程中都是通过  [tokenizer](https://github.com/marktext/muya/blob/8d7bfefbdedc3cb6bdbe92f317af27f6f274d909/lib/inlineRenderer/lexer.js#L527) 来解析的，其实如果想添加自定义的 markdown 语法，就是向  [tokenizer](https://github.com/marktext/muya/blob/8d7bfefbdedc3cb6bdbe92f317af27f6f274d909/lib/inlineRenderer/lexer.js#L527) 添加更多的 rule（其实就是一个正则表达式及 相应 token  的拼装），可以从[源码](https://github.com/marktext/muya/blob/master/lib/inlineRenderer/rules.js)查看目前 muya 支持的 rules。

什么是 [UI 组件](https://github.com/marktext/muya/tree/master/lib/ui)？任何脱离编辑区的弹框、选择框、DropDown 等都是 UI 组件，首先，UI 组件的展示和隐藏是有一套事件系统来通信的，其次，就是 UI 组件的定位和渲染。

先说说事件系统，相信很多同学都写过 EventEmitter 类似的代码，在 muya 中也实现了一个 [EventCenter](https://github.com/marktext/muya/blob/master/lib/event/index.js)，不仅可以绑定和解绑 DOM 事件，也可以触发和监听自定义事件 。

编辑器和 UI 组件的通信都是通过全局唯一的 EventCenter 来完成的，比如编辑器检测到输入 ```java 的时候，会发出 muya-code-picker 事件，UI 组件监听到该事件就会在当前编辑位置渲染一个 code picker。当选择一个语言后，code picker 会自动隐藏。

那么 UI 组件是怎么创建出来并渲染的呢？通过上面的描述，muya 是通过原生 JS 来写的，并没有使用前端框架（React、Vue），muya 并没有对  UI 组件的渲染做任何限制 ，UI 组件和编辑器唯一通信方式就是上面提到的 EventCenter，所以 muya 使用者可以选择任何喜欢的框架来完成他们想要的 UI 组件，在 muya 中，我们依然使用了 snabbdom 作为渲染引擎，来渲染  UI 组件，因为我们不想使 muya 变得太重，当然作为 UI 组件开发者，你可以 选择其它任何框架。

## 三、编辑器架构及与传统 MVC 架构区别

在第二部分，描述了 muya 实现的核心原理，主要聚焦在单个段落的渲染，编辑后的重渲染，光标或选区的回设，以及 muya 是如何支持语法插件和 UI 组件的，第二部分主要希望大家对 muya 有个微观的认识。在这一部分，我们将从宏观的角度来聊聊 muya 的整体架构，因此很多模块也都仅仅点到即止，更多细节可阅读本系列<Muya 编辑器核心模块的设计和实现> 和  <Muya 编辑器支持协作编辑>。

### 3.1 Muya 编辑器架构

我们可以将 markdown 编辑器想象成一个可操纵的黑盒，以 markdown 作为输入，用户可以对这个黑盒进行一些操作（键盘、鼠标事件），最终输出 markdown。

![流程图](https://user-images.githubusercontent.com/9712830/224552633-675cf026-dece-4662-af32-92a21aa7ea99.jpg)

那么问题就在于如何来实现这个黑盒了，普通的 markdown 文本（string）并不是一个适合编辑的数据结构，比如，每次我们对文本进行编辑，添加或者删除文本，我们都需要对整个文本内容做 markdown 语法解析，这是一个比较耗时的过程，同时在 JS 中，直接对长文本操作也不是明智之举，因此我们选择了 JSON 作为 muya 编辑器内部存储数据结构（JSON state，更详细的描述可以直接跳到本系列第三篇文章<Muya 编辑器支持协作编辑>）。

![流程图 (1)](https://user-images.githubusercontent.com/9712830/224552685-6e93733c-df65-464a-85d8-6f4eb45a96b3.jpg)

Block Tree 介绍

在上图中，我们不仅看到了 JSON State 作为 muya 编辑器的数据层，还多了一个 Block Tree，我们知道编辑区域是一个 DOM Tree，但是直接操作 DOM 并不是一个明智之举，首先 DOM 并不能和数据层（JSON State）直接关联。其次 DOM  并没有和 markdown 语法一一映射的相应元素，比如代码模块，HTML 块等。因此我们需要根据 markdown 的语法来抽象我们自己的 UI 层，Block Tree 便应运而生。

```markdown
foo **strong**

> content in quoteblock
```

上面的 markdown 文本，将解析成生成下面的 Block Tree, ScrollPage（下文会提及） 是Block Tree 的根节点，但是它也有个 parent 指针指向 muya 实例。

![流程图 (2)](https://user-images.githubusercontent.com/9712830/224552734-506b63fb-bff3-4ec5-9c32-b6b6f014155d.jpg)

Block Tree 从名字来看就知道他是一个树结构，Block 的 parent 指针指向其 parent Block，children 指针指向其所有子节点，children 同时也是一个链表的数据结构，便于我们进行一些移除和插入的操作。根据 markdown 语法，可以区分两种 Block（括号中是 blockName，下同）：
1. Container Block（block-quote、bullet-list、order-list、task-list、list-Item 等）
2. Leaf Block （paragraph、html 等）

根据支持的 markdown 标准，又可以区分为 CommonMark Block 和 GFM Block 以及 markdown extra Block：
1. commonMark
2. GFM
4. extra

根据是否是直接可编辑（是否包含 contenteditable 元素），又分为可编辑和不可编辑 block：
1. 不可编辑 block（atx-heading、paragraph 等）
2. 可编辑 block（paragraph.content、atxheading.content 等）

Block Tree 同时会绑定渲染的  DOM 元素，同时也会绑定对应的 State。在第二部分我们描述的简单 markdown 编辑器其实就是一个 paragraph.content block 中的元素渲染部分。

Block 同时还承担了监听键盘事件的作用，来响应用户的操作，比如用户在段落中进行输入，监听 input 事件，来重新渲染段落，高亮 markdown 语法，同时也会响应式的去更新 JSON  State。监听 Enter 事件，会创建新的 paragraph block，并且插入到之前的段落后面，在插入段落的过程中，重复上面的步骤，渲染 DOM 元素，更新 JSON State。

## 3.2 文档的生命周期 

上面部分 ，我们了解了 muya 的两个核心模块，JSON  State 和 Block Tree，但是对于他们如何协调工作，让我们顺利的进行文档编辑，可能还是有些模糊，在这一部分，我们将通过在编辑一个文档，来看看在文档编辑整个生命周期，Block 和 JSON State 如何协调工作，以及最后如何输出 markdown 的整个过程。

![流程图 (3)](https://user-images.githubusercontent.com/9712830/224552812-b041134e-0526-4d08-a21e-c250fdd71462.jpg)

**文档渲染**

第一步，将 DEFAULT_MARKDOWN 作为参数传给 Muya 构造函数，生成编辑器实例，在编辑器内部将对 DEFAULT_MARKDOWN 做 markdown 语法解析，在 muya 仓库中，fork 了一份 [marked](https://github.com/markedjs/marked) 源码，并对其添加了额外支持 markdown 扩展 ，比如 inline math、block math、front matter 等。

```js
const DEFAULT_MARKDOWN = `
foo **strong**

# header 1
`

const muya = new Muya(container, { markdown: DEFAULT_MARKDOWN })
```

marked 解析结果如下：

```json
[
  {
    "name": "paragraph",
    "text": "foo **strong**"
  },
  {
    "name": "atx-heading",
    "meta": {
      "level": 1
    },
    "text": "# header 1"
  }
]
```

从上面的 JSON State 我们可以看到，**marked 并不会解析行内样式，正如在上文提及，行内样式的解析是交给了 tokenizer。**

第二步，上一步生成的 JSON State，将进一步生成 Block Tree，完成整个文档的渲染和光标的设置。

```js
  init () {
    const { muya } = this
    const state = this.jsonState.getState()
    this.scrollPage = ScrollPage.create(muya, state)

    const firstLeafBlock = this.scrollPage.firstContentInDescendant()

    const cursor = {
      path: firstLeafBlock.path,
      block: firstLeafBlock,
      anchor: {
        offset: 0
      },
      focus: {
        offset: 0
      }
    }

    this.selection.setSelection(cursor)
  }
```

**用户和文档交互**

在编辑器核心实现原理部分，已经大概介绍了编辑一个段落，并重新渲染设置光标的过程，这儿就不再赘述了，这儿我们来聊一聊如何通过 Enter 键创建新的段落。

我们来看看 format block（paragraph.content 继承 format block） 的源码：

```js
  enterHandler (event) {
    event.preventDefault() // 阻止 contenteditable 元素，Enter 事件的默认行为
    const { text: oldText, muya, parent } = this
    const { start, end } = this.getCursor()
    this.text = oldText.substring(0, start.offset)
    const textOfNewNode = oldText.substring(end.offset)
    const newParagraphState = {
      name: 'paragraph',
      text: textOfNewNode
    }

    const newNode = ScrollPage.loadBlock(newParagraphState.name).create(muya, newParagraphState)

    parent.parent.insertAfter(newNode, parent)

    this.update()
    newNode.firstContentInDescendant().setCursor(0, 0, true)
  }
```

从上面代码，我们来看看enterHander 做了些什么，首先将原来的段落内容根据光标所在位置进行切分，通过后部分文本创建新的段落 newNode，然后将 newNode 插入到之前段落的后面，更新之前段落 this.update()。最后设置光标在新段落的第一个可编辑 block 的 （0，0）位置。上面代码就完成了 Enter 创建段落的整个过程，当然真实过程比上面还会复杂很多，比如我们正在编辑标题、列表在按下 Enter 键又是另外的结果了。有兴趣可以阅读相关 block 源码。

在用户和编辑器的交互过程中，不仅仅涉及到 Enter 键的交互，还有很多其它的交互，比如 BackSpace 键、Tab 键、复制、粘贴、点击、方向键等，针对每一个 Keyboard 和 鼠标事件都会有相应的处理方法，这样就完成了整个编辑器的交互。

**文档导出**

文档的导出相对来说比较简单，因为我们有 JSON State，根据 markdown 语法规则将 JSON State 拼装成 markdown 文本，如果要输出 HTML，在通过 marked 将 markdown 转换成 HTML。

![流程图 (4)](https://user-images.githubusercontent.com/9712830/224552985-7f9c35d3-7d67-4f19-be89-92f57e1343c9.jpg)


更多关于导入、导出细节将在 <Muya 编辑器支持协作编辑> 讨论，或参考源码 [ExportMarkdown](https://github.com/marktext/muya/blob/master/lib/jsonState/stateToMarkdown.js)。

## 3.3 Muya 架构和传统 MVC 的区别

![image](https://user-images.githubusercontent.com/9712830/224553028-fb51c98a-b90e-44f4-bccb-91c0183454fc.png)

[MVC ](https://zh.wikipedia.org/wiki/MVC)架构将程序划分为三种组件，模型 - 视图 - 控制器（MVC）设计定义它们之间的相互作用。
- 模型（Model） 用于封装与应用程序的业务逻辑相关的数据以及对数据的处理方法。“Model”不依赖“View”和“Controller”，也就是说， Model 不关心它会被如何显示或是如何被操作。但是 Model 中数据的变化一般会通过一种刷新机制被公布。为了实现这种机制，那些用于监视此 Model 的 View 必须事先在此 Model 上注册，从而，View 可以了解在数据 Model 上发生的改变。
- 视图（View）能够实现数据有目的的显示。在 View 中一般没有程序上的逻辑。为了实现 View 上的刷新功能，View 需要访问它监视的数据模型（Model），因此应该事先在被它监视的数据那里注册。
- 控制器（Controller）起到不同层面间的组织作用，用于控制应用程序的流程。它处理事件并作出响应。“事件”包括用户的行为和数据 Model 上的改变。

那么 muya 是 MVC 架构吗？答案 muya 是又不是 MVC 架构。我们再回到 muya 的架构图：

![流程图 (5)](https://user-images.githubusercontent.com/9712830/224553057-f5b75d25-70f1-4b07-bd67-d554a1a0774d.jpg)

JSON State 就是标准的 Model 层，Block Tree 是 Controller，但是又承担了部分页面渲染更新视图的工作。在标准的 MVC 架构中，View 会监听数据的变化，并刷新视图，相对比较独立，而在 muya 中，View 已经和 Block Tree 耦合在了一起。说一下为什么这样设计的原因，比如在一个 contenteditable 的元素中进行编辑，我们编辑内容会实时显示在元素中，因此我们的交互控制和 DOM 渲染是紧密联系在一起的（这也是浏览器自带的键盘交互），这也就是为什么 Block Tree 是和文档渲染高度耦合的一个原因。当然在 muya 中会有一个校验检查机制，当我们编辑文本后，我们通过一些判断来决定是否需要重新渲染 DOM，也就是说并不是每次编辑页面都会重新渲染。有兴趣同学可以看看 [checkNeedRender](https://github.com/marktext/muya/blob/2c538f25d91fd518d177120e8db9f6600edb7bec/lib/block/base/format/index.js) 源码。

比如其它应用，白板，我们就可以完全按照 MVC 架构来设计，因为编辑可以和渲染完全分离，比如我们画一条线（Controller），根据这条线生成一系列坐标点（Model），最后根据 Model 重新绘制这条线段（View）。

## 四、面向未来的思考
contenteditable 属性是大部分编辑器的核心所在，但是它实现的编辑器也有其局限性：
1. 不同浏览器间存在兼容问题，这也是为什么我们在很多键盘事件 Enter 等都阻止了默认行为，自定义键盘事件后的行为，来兼容不同的浏览器。
2. contenteditable 本质也是通过 DOM 来渲染文档的，当文档比较大的时候，不可避免会出现性能问题。
3. 正如上面所说，通过 contenteditable 实现的编辑器，交互控制和 DOM 渲染是耦合在一起的，这为我们架构设计或者功能实现上带来了一些阻力。
6. 光标的局限性，原生的只能支持单个光标或选区。
那么有没有更好的方案来实现编辑器呢？像石墨文档 - 新 Doc，Google Doc 都开始采用 Canvas 来渲染文档，通过一个 textarea 或者 contenteditable 元素来进行输入，同时可以自定义绘制光标，也就支持了多光标的输入，这也许是  muya 未来发展的方向。

## 五、参考文献和 GitHub 仓库

1. https://zh.wikipedia.org/wiki/MVC
2. [GitHub muya 仓库](https://github.com/marktext/muya)