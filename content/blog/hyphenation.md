---
external: false
title: "连字符断词从原理到实践"
description: "本篇文章主要介绍连字符断词的原理和在 Univer 中的实践"
date: 2024-10-08
---

## 1 背景介绍

今年伊始，为了优化 [Univer](https://github.com/dream-num/univer) 段落布局和文字排版，我开始了数字排版相关的学习和实践，在这过程中，也了解到很多排版相关的领域知识，打算通过一系列文章来记录下这段时间的学习所得，加深对排版领域知识的理解和思考，也希望对想了解数字排版的同学有所帮助，当然文中难免有纰漏，还望指正

### 1.1 连字符断词的发展

今天的主角是连字符断词（Hyphenation），连字符断词并不是数字排版的产物，早在中世纪的拉丁手稿中，连字符开始用于断词，抄写员在遇到需要换行时，通常会用一个短划线来将长词一分为二，以便节约版面，此时的连字符规则较为随意，没有固定规则

随着**古登堡印刷术**的发明（约1440年），印刷文字排版成为书籍出版的主要方式，排版规则也随之规范化。由于印刷需要将文本整齐地排布在固定尺寸的页面上，断词的需求变得更加突出。排版工人手动排版时，断词往往是为了确保每一行的排版能够整齐对齐，而不留下过多空白，这一时期，连字符排版更加标准化，但是规则依赖于排版师的经验和语言习惯，印刷术发展至16-17世纪后，欧洲各地的印刷商开始制定连字符断词的基本规则。例如，英语中逐渐形成以音节为基础的断词方法，而德语中则更注重词根和词缀的断开

到了19世纪，连字符断词的规则逐渐由语言学家、词典编纂者和印刷行业制定的排版规范所统一。例如，《牛津英语词典》（OED）以及一些拼写手册开始规定哪些位置可以断开单词。印刷机上的排版工人开始依赖书面规范来进行连字符断词。书籍、报纸和期刊等出版物在排版时经常使用连字符来处理换行。

20世纪，随着数字排版的兴起，在排版印刷业，连字符断词进入到了新的阶段。电子排版取代了的人工排版，连字符断词算法也成了数字排版中一个热门的研究领域，如[高德纳 \[Donald Knuth\]](https://zh.wikipedia.org/wiki/%E9%AB%98%E5%BE%B7%E7%BA%B3) 开发的排版系统 TeX 中，开始了自动化的连字符断词，后又由 Frank Liang 提出 packed Trie、Hyphenation patterns 等概念对连字符断词算法进行优化，提升了算法效率和准确性，我们将在【算法部分】详述连字符断词算法的发展历程

总的来说，连字符断词不是数字排版的产物，但因数字排版而兴起，并引起了广泛的学术研究和讨论，关于连字符断词还引发了一场战争，[Hyphen War](https://en.wikipedia.org/wiki/Hyphen_War)，有兴趣的可以去了解下

### 1.2 为什么需要连字符断词？

在文字段落排版中，中文采用“按字分写”，因此中文可以在任意字后进行断行，当然特殊情形除外，比如[行尾标点禁则](https://www.w3.org/TR/clreq/#prohibition_rules_for_line_start_end)中，汉字后紧跟行尾标点，这个时候就不能在汉字后直接断行了。西文中采用“按词分写”，词与词之间有词距（word space），因此根据 [Unicode Linebreak 算法](https://unicode.org/reports/tr14/)，西文的断行多在于单词后空格换行。在两端对齐时，中文可以调整汉字间距，而西文主要是调整词距，英语中有较多长单词，在两端对齐时，词距往往较大，在左对齐时（如图 1），右侧又有较大空隙，既不美观，也浪费版面。于是便有了连字符断词，将一个单词一拆为二，前一半置于当前行尾，并加以连字符“-”。后半部分置于下一行首，这样便有效的避免的间隙过大的问题（如图 2）

![](/blog/hyphenation/1.png)

(图 1：没有连字符断词场景，左对齐时，右侧较大空隙)

![](/blog/hyphenation/2.png)

（图 2：有连字符断词场景，左对齐时，右侧参差不齐明显减少）

在一些期刊报纸的排版上，往往采用分栏设计，每栏的宽度有限，采用连字符断词，往往可以避免窄栏导致的明显的参差不齐

### 1.3 连字符断词在 Web 中的应用

作为一名前端工程师，我们会更关注连字符断词在浏览器端的支持情况。好的事，现代主流浏览器已经广泛支持连字符断词，在[CSS Text Module Level 4](https://www.w3.org/TR/css-text-4/#hyphenation)中也有关于浏览器支持连字符断词的标准说明，在该标准中，对 Hyphenation 做了如下说明

> ***Hyphenation*** is the controlled splitting of words where they usually would not be allowed to break to improve the layout of paragraphs, typically splitting words at syllabic or morphemic boundaries and often visually indicating the split (usually by inserting a hyphen, U+2010). In some cases, hyphenation may also alter the spelling of a word. Regardless, hyphenation is a rendering effect only: it must have no effect on the underlying document content or on text selection or searching.

上面这段很好的表明了连字符的功能及其影响：连字符断词（Hyphenation）用于提升段落的布局，在允许的位置进行拆分单词，并且通过连字符（U+2010）进行连接，不同的断词会改变单词的拼写，并且连字符只会存在于渲染层，也就是说数据层不会保存连字符，因此连字符对于搜索等功能不会产生影响

#### 1.3.1 在浏览器端开启连字符断词

第一步：设置语言
断词算法是和语言相关，不同的语言会有不同的 hyphenation pattern（断词算法部分会有介绍），所以第一步，应该设置网页渲染的语言

```html
<html lang="pt-BR">
```

即使是同一种语言，比如英语，在不同区域，也有可能有不同的拼写和发音，因此也会导致连字符断词的不同，这种差异在葡萄牙语更为明显，因此我们在设置语言的时候通常会添加一个区域（region）的后缀，来提供更好的匹配对应的 hyphenation patterns
第二步：打开连字符断词

```css
hyphens: auto;
```

#### 1.3.2 对于连字符断词精细的控制

比如对于一个较短的单词，我们可能并不希望对齐进行断词处理，因为短单词断词后往往难以阅读，同时断词的位置在单词中太靠前或者靠后，这个时候我们可以通过`hyphenate-limit-chars`，用来控制。如

```css
hyphenate-limit-chars: 6 3 2;
```

规则中的第一个数字表示单词字母小于6就不进行连字符断词了。第二和第三个数字是指连字符断词拆分单词后，前后部分最小的字符数限制
考虑另外一种情景，如果一个段落连续多行出现了连字符断词，这不仅不美观，而且还会造成阅读困难，因此浏览器还提供了`hyphenate-limit-lines`来控制连续出现连字符断词的行数，避免一个段落连续多行以连字符结尾的窘境，当然你要是无所谓，也可以通过`no-limit`来取消这一限制
如果连字符断词出现在段落最后一行，最后一行可能之后半个单词，CSS 标准的制定者也考虑到了这种场景，可以通过 `hyphenate-limit-last: always;`来进行控制

最后一个控制是 `hyphenation zone`。这往往用于更加精细的控制连字符断词出现的频率，默认情况下，连字符断词可能会频繁发生，在没有其他限制的前提现，浏览器会在当前行不能放下整个单词，又留有空隙时，尽可能的断词，这可能会导致大量的连字符产生

考虑一个左对齐的场景，为了减少右边缘出现的参差不齐的现象，尽可能的使用连字符，这个时候，参差不齐减少了，但是大量的连字符也会导致段落排版的难看，因此我们往往需要在参差不齐和连字符数量上做一个权衡，这时候`hyphenate-limit-zone`这位平衡大师可以帮我们解决这个问题

![image](/blog/hyphenation/3.png)
（图3：hyphenate-limit-zone 图示）

`hyphenate-limit-zone`是指段落右侧一块区域，如果一个单词开始于 hyphenate zone，那么它将不能被连字符断词。因此如果区域越大，出现连字符断词的概率就越小，反之，出现连字符的概率越大。如图 3 中，第三行的 `added`其实开始于 hyphenate zone，但是又在上一行无法放下，因此放到了下一行，同时也避免了连续出现连字符断词。通常 `hyphenate-limit-zone: 8%` 是一个很好的选择，参考[All you need to know about hyphenation in CSS](https://medium.com/clear-left-thinking/all-you-need-to-know-about-hyphenation-in-css-2baee2d89179)

## 2 断词算法

### 2.1 TEX 中断词算法的发展

关于 TeX 的发展起源有这样一个故事，[高德纳 \[Donald Knuth\]](https://zh.wikipedia.org/wiki/%E9%AB%98%E5%BE%B7%E7%BA%B3) 为了出版其系列书籍《The Art of Computer Programming》，但又无法忍受出版商给出的书面排版，于是便开发了 TeX 排版系统，并且很快就在学术界流行起来，并且还被美国数学学会（American Mathematical  Society）采纳，用于数学期刊杂志的排版

TeX 中一个重要而不可或缺的部分就是连字符断词（Hyphenation），特别是在一些两端对齐的排版需求下，连字符断词可以获得优雅的段落布局。如前所述，在电子排版之前，断词的位置往往由排版工人根据规则来判定，进入数字排版时代，一些学者（如Donald Knuth、Frank Liang 等）便提出了通过计算机算法来确定相对准确的连字符断词位置

在现有的排版系统中，连字符断词算法主要有两个方向：基于**规则的连字符断词**和基于**字典的连字符断词**。

基于规则的连字符断词算法依赖于一套分割规则，例如在《韦氏词典》前言中就为英语提供了连字符断词的规则，这些规则包括了常用的前缀、后缀、在双辅音之间分割以及其他更专业的规则，一些规则并不明确，也不利于算法的实现。基于规则的方案不可避免会出现错误，而且他们很少涵盖所有的情况，此外，要找到一组合适的规则本身就是一个困难且耗时的项目

基于字典的连字符断词算法存储了整个单词列表中允许的断词分割点，当然这种算法一个显而易见的缺点就是需要比较大的存储空间，以及在这个字典中如何快速定位到一个单词中位置，是否允许断词

TeX 最初的排版算法就是由[高德纳 \[Donald Knuth\]](https://zh.wikipedia.org/wiki/%E9%AB%98%E5%BE%B7%E7%BA%B3)等人于1977年夏天设计和实现的，最初的版本是基于规则的连字符断词算法，主要有三种类型的规则：后缀去除、前缀去除、元音-辅音-辅音-元音（veev）分割。最后一条规则指出，当单词中出现“元音-辅音-辅音-元音”的模式时，在大多数情况下，我们可以在辅音之间进行分割。还有许多特殊情况的规则；例如，“在元音-q 处断开”或“在 ck 后断开”。最后，一个小的例外字典（约300个单词）用于处理上述规则产生的错误，以及对某些常见单词（例如 pro-gram）进行连字符划分，这些单词并未被规则拆分。完整算法在旧版 TeX 手册的附录 H 中有描述

上述算法虽然表现不错，但也有其缺点，在一个小的字典列表上，仅找到 40% 允许连字符断词的位置，误差为1%。这也暴露了基于规则的断词算法的缺陷，很难覆盖字典内所有允许断词的位置，同时不可避免的会产生一些错误的判断，基于规则的算法还有一个致命的缺点，就是所有的规则很难自动化，需要规则开发者对某种语言有比较深入的研究，然后指定规则。这也导致了基于规则的算法无法自动化拓展到其他语言

1977 年，[高德纳 \[Donald Knuth\]](https://zh.wikipedia.org/wiki/%E9%AB%98%E5%BE%B7%E7%BA%B3)的学生 Frank Liang 开始参与到 TeX 系统的开发中，其主要贡献就是对 TeX 连字符断词算法的设计和优化（1978年），Frank Liang 设计了一种基于 patterns（模式匹配）的算法（其实也是基于字典算法的衍生），并提出了一种新的优化的 Trie 数据结构 - packed trie（压缩的字典树），并且在 TeX82 版本中替换了最初的连字符断词版本，并且这一算法被广泛用于其他的排版系统和文字处理软件。这一算法的设计和优化也详述在了 Frank Liang 的博士论文“[Hy-phen-a-tion by Com-put-er](https://www.researchgate.net/publication/35881346_Word_Hy-phen-a-tion_by_Com-put-er)” 中。后来 Frank Liang 在 1982 年还参与到了 Microsoft Word 的开发，主要负责页面的排版和打印

Frank Liang 算法的核心原理：首先需要准备一个包含某种语言所有单词及连字符位置的字典。其次，遍历字典中的每一个单词，识别出其中的连字符位置，并生成相应的连字符断词模式（hyphenation patterns），通过这些提取出来的模式，插入到 packed trie 中，利用其压缩性来优化存储。最后，我们就可以通过模式匹配在单词中进行查找可能得断词位置了

根据上面算法的简述，脑子里肯定有不少疑问：

1. packed trie 是怎样的数据结构，如何通过压缩来优化存储的？
2. 不同的字典在连字符断词上有差异，同一字典，单词在不同语境分词的位置也有所不同，例如当一个单词既可以作为“名词”又可以作为“动词”时，其连字符断词的位置往往不同，看来单一的匹配模式是无法满足以上需求的，那么 Frank Liang 又是怎么设计连字符断词匹配模式（hyphenation patterns） 的呢？
3. 如果你已经知道了通过断词级别（hyphenation levels）来提升断词的准确性，那么断词级别是怎么确定的呢？

让我们带着这些疑问继续...

### 2.2 Packed tries

Frank Liang 发现了基于规则的连字符断词算法的缺陷，比如难以覆盖所有情形、不可避免的错误判断、以及难以拓展到其他语言，为了获得更高的准确性和算法效率。所以 Frank Liang 连字符断词算法的方向转向了基于字典的算法，利用模式匹配和数据压缩的思想，旨在提高连字符处理的准确性和效率
上面也说到，基于字典的算法因为存储了整个字典单词的所有允许断词的位置，所以占用较大的存储空间，所以 Frank Liang 首要需要解决的问题就是如何减少字典存储的空间，也就是寻找一种占用体积小，并且搜索效率高的数据结构

在一个字典中搜索特定单词，我们首先想到的数据结构就是字典树（Trie），Trie 非常适合用于存储和搜索字符串集合，比如一本英文字典，因此也被称为字典树。Trie 这个术语来源于re**trie**val。trie 的发明者 Edward Fredkin 把它读作[/ˈtriː/](https://zh.wikipedia.org/wiki/Help:%E8%8B%B1%E8%AA%9E%E5%9C%8B%E9%9A%9B%E9%9F%B3%E6%A8%99) "tree"。但是，其他作者把它读作[/ˈtraɪ/](https://zh.wikipedia.org/wiki/Help:%E8%8B%B1%E8%AA%9E%E5%9C%8B%E9%9A%9B%E9%9F%B3%E6%A8%99) "try”。[Trie](https://zh.wikipedia.org/zh-hans/Trie) 是一个有序树，一个节点的所有子孙都有相同的前缀，也就是这个节点对应的字符串，而根节点对应空字符串，路径从根节点到某个叶子节点表示一个字符串。

示例：假设我们有以下单词集合："cat”、”car”、”dog"

普通 Trie 的结构如下：

```sh
          (root)
           /  \
          c    d
         / \    \
        a   a    o
       /     \    \
      t       r    g

```

在 Trie 中，每个节点都会有多个指向子节点的指针，每个指针对应一个字符。其查找的时间复杂度是 O(m)，其中 m 为查找字符串的长度。但 Trie 有个缺陷就是空间浪费，每个节点可能有很多空指针，指向（null）。

所以 Frank Liang 提出了 Packed Trie（压缩字典树）用于解决 Trie 空间浪费的问题，packed trie 本质上是一种优化的字典树（Trie），在减少空间浪费的同时，依然保持快速的查找效率，它通过压缩相同前缀的节点来实现这一点。在传统 Trie 中，每个节点有大量的空指针，而且 packed trie 中，相同前缀的节点被合并，从而节省了空间。由于篇幅有限，关于 packed trie 更多的讨论请参阅 Frank Liang 的论文 [Hy-phen-a-tion by Com-put-er](https://www.researchgate.net/publication/35881346_Word_Hy-phen-a-tion_by_Com-put-er) Chapter 2

### 2.3 Hyphenation patterns

压缩字典树（packed trie）解决了基于字典的连字符断词算法空间浪费的问题，但是并没有解决断词准确性的问题，正如上面疑问所述，不同字典对于同一个单词可能有不同的连字符断词位置，同一本字典，同一个单词在不同语境下，也可能有不同的连字符断词位置，这正是连字符断词模式（hyphenation patterns）要 解决的问题

> “**pattern** ORIGIN Middle English patron ‘something serving as a model’, from Old French.
> The change in sense is from the idea of *patron giving an example to be copied.* Metathesis
> in the second syllable occurred in the 16th cent. By 1700 patron ceased to be used of
> things, and the two forms became diﬀerentiated in sense.”
>                                                                  *— New Oxford Dictionary of English, 1998 edition*

上面是牛津字典中关于 pattern 的描述，而连字符断词模式（hyphenation pattern）是一些特殊的字符串，并且在字符串中插入数字以携带断词信息，如下：

```tex
% title: Hyphenation patterns for American English
% ...
% The Plain TeX hyphenation tables.
\patterns{ % just type <return> if you're not using INITEX
.ach4
.ad4der
.af1t
.al3t
.am5at
ar5inat
ar3io
a5sia.
```

上面代码是 TeX 源码中，用于 American English 的连字符断词匹配模式中的部分代码截取，用来匹配英文单词，在什么位置可以断词，在什么位置不能够断词。我们可以看到在模式由：`.`、字母、数字组合而成

- `.`：用于表示单词边界，模式前面的`.`表示单词的开始，模式尾部的`.`用于表示单词的结尾
- 字母：字母就表示其本身，用于在单词中进行匹配
- 数字：断词级别，用来表示单词潜在的可以断词或者禁止断词的位置，总共有 5 个等级，**等级越高，优先级越高，奇数数字表示允许断词，偶数数字表示禁止在该位置断词**

如上面例子，`.ach4`表示从单词开始进行匹配，如果一个单词匹配上了该模式`ach4`，有很大可能性是禁止断词的，除非匹配上拥有数字 5 的模式。而如果一个单词匹配上`.am5at`，那么就需要在`am`和`at`之间进行连字符断词，因为 5 已经是最高等级

因为有不同的“断词级别”，所以也就解决了断词准确性的问题。因为不同的断词模式可以被分配不同的级别，较高的级别通常表示这些模式更加可靠或者常用，应该优先运用。设置“断词级别”还有另外一个作用，减少处理单词断词时的错误，通过“奇数”、“偶数”的区分，可以表达“允许”和“禁止”二元含义，同时高优先级覆盖低优先级，较低级别的模式可能允许一定的错误发生，而较高级别的模式则要求更加严格和准确。这种分级能够帮助我们在处理单词的时候，尽量减少不必要的断词错误

![](/blog/hyphenation/4.png)

（图 4：不同级别模式准确性对比）

上图是 Frank Liang 对 Webster pocket dictionary 生成的 4919 个 patterns 的统计对比，从上表看出，随着 level 提高，断词的正确性也在提升。level 5 bad 的概率为 0.0%

总结一下，断词级别（hyphenation level）对模式进行分级，可以有效的管理断词过程，确保在断词的过程中找到最合适的断词位置，又尽可能减少错误，这在提升断词准确性上起到了关键作用

### 2.4 模式匹配实践

有了模式，下一步我们就可以来匹配单词，找到合适的断词位置了。在示例中使用美国英语的连字符断词模式（Hyphenation patterns for American English），并用单词`hyphenation`来说明

![image 2](/blog/hyphenation/5.png)

遍历单词首字母`h`开始进行匹配，首先匹配的模式`hy3ph`。这是一个 3 等级的 hyphenation pattern。意味着在`hy`之后有比较大可能断词。接着往下匹配，在第四个字母`h`处，我们匹配到了三个模式，分别为`he2n`、`hena4` 和 `hen5at`。按照模式等级顺序，我们标注在上图中，接下来是字母`n`，匹配到模式`1na`和`n2at`，以及字母`t`匹配到模式 `1tion`。字母`i`匹配到`2io`。自此，遍历完单词字符，并且找到了所有匹配的模式。根据模式匹配的规则，高等级的模式会覆盖低等级的模式，没有数字标识的我们以 0 代替。最终我们得到的数字表示`h0y3p0h0e2n5a4t2i0o0n`。最后将奇数数字（表示断词）替换为连字符`-`，偶数直接删除，最终得到 *hyphenation* 的连字符表示模式 *hy-phen-ation*。

在算法实现上，首先也应该考虑高优先级的模式，再考虑中低优先级的模式，这样在匹配上高优先的模式后，就不用再匹配低优先级的模式，提升算法效率。在通过 TeX 文件生成字典树上面，由于多个模式可能拥有相同的模式等级，因此复用模式等级来节约内存

在 [Univer](https://github.com/dream-num/univer) 中，如何通过字典树来进行模式匹配的代码，同时也有类似浏览器端`hyphenate-limit-lines` 和 `hyphenate-limit-area` 的代码实现，感兴趣同学可以看看

## 3 未来展望

Masaryk 大学的学者也提出过  Universal Hyphenation Patterns 来解决连字符断词的问题，它其实是对 Frank Liang 断词算法的一种优化，它旨在一份 patterns 处理多种语言，以此来节省存储资源。例如英语和捷克斯洛伐克语，只有很少的单词有不同的连字符，因此可以用一套模式来处理这些语言

在 ”Hyphenation using deep neural networks” 这篇论文中，作者提出了通过深度学习来对匈牙利语进行自动化连字符断词的可能，随着最近几年 AI 及自然语言处理的飞速发展，相信不久将来通过机器学习的方式，将大大提升连字符断词的准确性和效率

## 4 参考文献

1. Word Hy-phen-a-tion by Com-put-er
2. Towards Univeral Hyphenation Patterns
3. Hyphenation using deep neural networks
4. [All you need to know about hyphenation in CSS](https://medium.com/clear-left-thinking/all-you-need-to-know-about-hyphenation-in-css-2baee2d89179)
