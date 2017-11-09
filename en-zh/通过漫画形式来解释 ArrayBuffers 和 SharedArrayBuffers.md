# 通过漫画形式来解释 ArrayBuffers 和 SharedArrayBuffers

这是本系列三篇文章中的第二篇：

1. *内存管理速成手册*
2. *通过漫画形式来解释 ArrayBuffers 和 SharedArrayBuffers*
3. *使用 Atomics 来在 SharedArrayBuffers 中避免竞用条件*

In the [last article](https://hacks.mozilla.org/2017/06/a-crash-course-in-memory-management/), I explained how memory-managed languages like JavaScript work with memory. I also explained how manual memory management works in languages like C.Why is this important when we’re talking about [ArrayBuffers](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer) and [SharedArrayBuffers](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer)?It’s because ArrayBuffers give you a way to handle some of your data manually, even though you’re working in JavaScript, which has automatic memory management.Why is this something that you would want to do?As we talked about in the last article, there’s a trade-off with automatic memory management. It is easier for the developer, but it adds some overhead. In some cases, this overhead can lead to performance problems.

在上一篇[文章中](https://github.com/Jocs/jocs.github.io/issues/16)，我解释了一些自动内存管理的语言比如 JavaScript 怎么管理内存。同时我也解释了例如 C 语言，如何进行手动内存管理。那么这和我们将要讨论的 [ArrayBuffers](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer) 和 [SharedArrayBuffers](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer) 有什么关系呢？这是因为 ArrayBuffer 也使得你能够手动处理数据，尽管这是在 JavaScript 中，一种具有自动内存管理的语言。那么，你为什么想要进行手动处理呢？正如上一篇文章所描述，在使用自动内存管理上有一个权衡。自动内存管理使得开发者开发程序变得相对容易，但是它也带来了一些困扰。在某些场景中，自动内存管理可能会带来性能上的问题。

[![A balancing scale showing that automatic memory management is easier to understand, but harder to make fast](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/02_01-500x285.png)](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/02_01.png)

For example, when you create a variable in JS, the engine has to guess what kind of variable this is and how it should be represented in memory. Because it’s guessing, the JS engine will usually reserve more space than it really needs for a variable. Depending on the variable, the memory slot may be 2–8 times larger than it needs to be, which can lead to lots of wasted memory.Additionally, certain patterns of creating and using JS objects can make it harder to collect garbage. If you’re doing manual memory management, you can choose an allocation and de-allocation strategy that’s right for the use case that you’re working on.Most of the time, this isn’t worth the trouble. Most use cases aren’t so performance sensitive that you need to worry about manual memory management. And for common use cases, manual memory management may even be slower.But for those times when you need to work at a low-level to make your code as fast as possible, ArrayBuffers and SharedArrayBuffers give you an option.

例如，当你使用 JS 创建一个变量的时候，JS 引擎不得不猜测这个 JS 变量所包含数据的类型以及怎样在内存中进行存储。因为这些猜测，JS 引擎通常会为这些变量实际需要的内存分配更大的内存空间。根据不同的变量，分配的内存空间可能是实际所需的 2-8 倍，这将导致极大的内存浪费。除此之外，特性模式的创建和使用 JS 对象也将会使得其很难被 JS 引擎垃圾回收。如果你正在进行手动的内存管理，你可以根据自己工作上的使用场景自己选择内存分配和解除分配的策略。当时在很多时候，却并不值得这样做。因为在很多使用场景下我们的程序并没有那么性能敏感以至于需要采用手动得内存管理。甚至在通常的使用中，手动内存管理甚至会使得程序更慢。但是在有些时候，你需要从一些更底层的操作来时的你的代码运行的更快，那么 ArrayBuffers 和 SharedArrayBuffers 将是很好的选择。

[![A balancing scale showing that manual memory management gives you more control for performance fine-tuning, but requires more thought and planning](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/02_02-500x285.png)](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/02_02.png)

So how does an ArrayBuffer work?It’s basically like working with any other JavaScript array. Except, when using an ArrayBuffer, you can’t put any JavaScript types into it, like objects or strings. The only thing that you can put into it are bytes (which you can represent using numbers).

那么 ArrayBuffer 是怎么工作的呢？基本上和其他的 JavaScript 数组没有什么区别。除了，当你使用 ArrayBuffer 的时候，你不可以将任意的 JavaScript 数据类型到 ArrayBuffer 中，例如 objects 或者 strings。唯一能够放入 ArrayBuffer 中的只有字节（可以通过数字来表示）。

[![Two arrays, a normal array which can contain numbers, objects, strings, etc, and an ArrayBuffer, which can only contain bytes](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/02_03-500x377.png)](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/02_03.png)

One thing I should make clear here is that you aren’t actually adding this byte directly to the ArrayBuffer. By itself, this ArrayBuffer doesn’t know how big the byte should be, or how different kinds of numbers should be converted to bytes.The ArrayBuffer itself is just a bunch of zeros and ones all in a line. The ArrayBuffer doesn’t know where the division should be between the first element and the second element in this array.

另外一件我必须明确说明的是，你并不能够直接的将字节放入 ArrayBuffer。这是因为，ArrayBuffer 并不知道一个字节有多大，也不知道不同的数字转化成字节的区别。ArrayBuffer 仅仅是一个「0」和「1」组成一行的二进制串。ArrayBuffer 也不知道分隔符应该放在该二进制串的什么位置。

[![A bunch of ones and zeros in a line](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/02_04-500x61.png)](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/02_04.png)

To provide context, to actually break this up into boxes, we need to wrap it in what’s called a view. These views on the data can be added with typed arrays, and there are lots of different kinds of typed arrays they can work with.For example, you could have an Int8 typed array which would break this up into 8-bit bytes.

为了给 ArrayBuffer 提供上下文，将上面的二进制串分割在相同尺寸的盒子里，我们需要一个称作「视窗」概念将二进制串分割到不同的盒子里。这些二进制数据上的视窗可以以带类型的数组存储，同时在 ArrayBuffer 中有不同带类型数组。比如，你可以通过8位整数的类型数组将上面的 ArrayBuffer  8 位一字节分割开来。

[![Those ones and zeros broken up into boxes of 8](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/02_05-500x177.png)](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/02_05.png)

Or you could have an unsigned Int16 array, which would break it up into 16-bit bites, and also handle this as if it were an unsigned integer.

或者你可以使用无符号16位整数的数组，这样就将上面的 ArrayBuffer 分割成了16位一字节的不同块中，然后依然想无符号整数一样对其操作。

[![Those ones and zeros broken up into boxes of 16](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/02_06-500x153.png)](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/02_06.png)

You can even have multiple views on the same base buffer. Different views will give you different results for the same operations.For example, if we get elements 0 & 1 from the Int8 view on this ArrayBuffer, it will give us different values than element 0 in the Uint16 view, even though they contain exactly the same bits.

你甚至可以在同一个基础 buffer 上面拥有不同的「视窗」。不同的「视窗」在相同的操作下会带来不同的结果。比如，在Int8 视窗中，你可能会得到 `0 & 1` 表达式，而在同样的 buffer 下，在 Uint16 视窗下你可能会得到其他结果，尽管他们都拥有相同的二进制位串。

[![Those ones and zeros broken up into boxes of 16](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/02_07-500x262.png)](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/02_07.png)

In this way, the ArrayBuffer basically acts like raw memory. It emulates the kind of direct memory access that you would have in a language like C.You may be wondering why don’t we just give programmers direct access to memory instead of adding this layer of abstraction. Giving direct access to memory would open up some security holes. I will explain more about this in a future article.So, what is a SharedArrayBuffer?To explain SharedArrayBuffers, I need to explain a little bit about running code in parallel and JavaScript.You would run code in parallel to make your code run faster, or to make it respond faster to user events. To do this, you need to split up the work.In a typical app, the work is all taken care of by a single individual—the main thread. I’ve talked about this before… the main thread is like a full-stack developer. It’s in charge of JavaScript, the DOM, and layout.Anything you can do to remove work from the main thread’s workload helps. And under certain circumstances, ArrayBuffers can reduce the amount of work that the main thread has to do.

在上面描述得工作方式下，ArrayBuffer 的角色仅仅是向一块原始的内存。它模拟了像在 C 语言中直接获取\操作 内存的工作。你可能会产生疑问，为什么 JS 不直接提供给使用者直接获取/操作内存的接口而是添加ArrayBuffer 这一抽象层呢？这是因为直接获取/操作内存可能会导致一些安全漏洞。我将在将来的文章中讨论这一块内容。那么，SharedArrayBuffers 又是什么呢？为了解释 SharedArrayBuffers，我需要先简略解释 JavaScript 中并行运行代码。为了并行运行代码，你需要将工作拆分成不同部分。但是在一个典型的 app 中，所有的工作都是在一个独立的线程中完成。在之前的文章中我也提及过这一点...这个主线程就像一个全栈工程师一样。它掌管着 JavaScript、DOM、以及视图布局。所有你能够操作的工作都是在这个主线程帮助下完成的。在某些特定环境下，ArrayBuffers 可以减轻主线程的负担，代替完成主线程的部分工作。

[![The main thread standing at its desk with a pile of paperwork. The top part of that pile has been removed](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/02_08-500x350.png)](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/02_08.png)

But there are times when reducing the main thread’s workload isn’t enough. Sometimes you need to bring in reinforcements… you need to split up the work.In most programming languages, the way you usually split up the work is by using something called a thread. This is basically like having multiple people working on a project. If you have tasks that are pretty independent of each other, you can give them to different threads. Then, both those threads can be working on their separate tasks at the same time.In JavaScript, the way you do this is using something called a [web worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers). These web workers are slightly different than the threads you use in other languages. By default they don’t share memory.

但是有时候减少主线程的工作依然是不够的。有时候你需要引进增援…你需要将工作分开。在很多编程语言中，将工作分成不同块每一块也就称作一个线程。这个多人共同完成一个项目是一个道理。如果你有一些任务，同时该任务和其他任务相对独立，那么你就可以在其他线程中完成这些任务。因此，不同的线程就可以在同一时间完成互相独立的分离任务。在 JavaScript 中，我们可以通过被称作[web worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers)的工具来完成以上工作。这些web workers与您在其他语言中使用的线程略有不同。默认情况下，它们不共享内存。

[![Two threads at desks next to each other. Their piles of paperwork are half as tall as before. There is a chunk of memory below each, but not connected to the other's memory](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/02_09-500x360.png)](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/02_09.png)

This means if you want to share some data with the other thread, you have to copy it over. This is done with the function [postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Worker/postMessage).postMessage takes whatever object you put into it, serializes it, sends it over to the other web worker, where it’s deserialized and put in memory.

这也就意味着，如果你想和其他线程共享数据，那么你就需要将数据从一个地方复制到另外一个地方。这是通过函数[postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Worker/postMessage) 完成的。postMessage 将所有输入的对象序列化，将其发送到另一个web worker，并将其反序列化并放入内存中。

[![Thread 1 shares memory with thread 2 by serializing it, sending it across, where it is copied into thread 2's memory](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/02_10-500x355.png)](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/02_10.png)

That’s a pretty slow process.For some kinds of data, like ArrayBuffers, you can do what is called transferring memory. That means moving that specific block of memory over so that the other web worker has access to it.But then the first web worker doesn’t have access to it anymore.

这事一个相当慢的过程，比如一些类型的数据，像 ArrayBuffers，你可以转移内存。这意味着你可以将某一特定的内存块移动到其他地方，这样其他的 web worker 就可以获取/操作 该内存块。但是之前的 web worker 将不能够再获取到该内存块了。

[![Thread 1 shares memory with thread 2 by transferring it. Thread 1 no longer has access to it](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/02_11-500x360.png)](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/02_11.png)

That works for some use cases, but for many use cases where you want to have this kind of high performance parallelism, what you really need is to have shared memory.This is what SharedArrayBuffers give you.

这也许在某些场景中适用，但是在更多的情况，你可能需要更高效得并行策略，在这些场景下，你可能真实的想要共享内存单元。ShareArrayBuffer 能够帮助你达到此目的。

[![The two threads get some shared memory which they can both access](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/02_12-500x349.png)](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/02_12.png)

With the SharedArrayBuffer, both web workers, both threads, can be writing data and reading data from the same chunk of memory.This means they don’t have the communication overhead and delays that you would have with postMessage. Both web workers have immediate access to the data.There is some danger in having this immediate access from both threads at the same time though. It can cause what are called race conditions.

通过 ShareArrayBuffer，web worker、不同线程可以在相同的内存块中读写数据。这也意味着你不爱需要通过 postMessage 来在不同的线程中通信传递数据。不同的 web worker 都有获取/操作数据的权限。但是这也会带来一些问题，比如两个线程在同一时间对数据进行操作。这也就是通常被称作「竞用条件」的现象。

[![Drawing of two threads racing towards memory](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/02_13-500x201.png)](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/02_13.png)

I’ll explain more about those in the [next article](https://hacks.mozilla.org/2017/06/avoiding-race-conditions-in-sharedarraybuffers-with-atomics/).What’s the current status of SharedArrayBuffers?SharedArrayBuffers will be in all of the major browsers soon.

我将在[下一篇文章](https://hacks.mozilla.org/2017/06/avoiding-race-conditions-in-sharedarraybuffers-with-atomics/)中解释什么是竞用条件。那么 SharedArrayBuffers 现阶段处于什么地位呢？庆幸得，在不久的将来，所有主流浏览器都贱支持 SharedArrayBuffers。

[![Logos of the major browsers high-fiving](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/02_14-500x169.png)](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/02_14.png)

They’ve already shipped in Safari (in Safari 10.1). Both Firefox and Chrome will be shipping them in their July/August releases. And Edge plans to ship them in their fall Windows update.Even once they are available in all major browsers, we don’t expect application developers to be using them directly. In fact, we recommend against it. You should be using the highest level of abstraction available to you.What we do expect is that JavaScript library developers will create libraries that give you easier and safer ways to work with SharedArrayBuffers.In addition, once SharedArrayBuffers are built into the platform, WebAssembly can use them to implement support for threads. Once that’s in place, you’d be able to use the concurrency abstractions of a language like Rust, which has fearless concurrency as one of its main goals.In the [next article](https://hacks.mozilla.org/2017/06/avoiding-race-conditions-in-sharedarraybuffers-with-atomics/), we’ll look at the tools ([Atomics](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Atomics)) that these library authors would use to build up these abstractions while avoiding race conditions.

SharedArrayBuffers 在 Safari（Safari 10.1）中已经可以使用。Firefox 和 Chrome 也将在今年的七八月发布的版本中包含此项功能。Edge 浏览器计划在今年的秋天完成此项功能的更新。但是即使所有主流浏览器都已经支持 SharedArrayBuffers，我们也不希望应用程序开发人员直接使用它。实际上，我们发对这样做。你应该在其之上进行抽象，使用更高层的一些库。我们所期待的是框架或库的开发者们能够创建一些工具库，这些工具库能够帮助我们更方便、安全的使用 SharedArrayBuffer。除此之外，一旦 SharedArrayBuffers 在平台上实现，WebAssembly 可以使用它来实现多线程。到时候，你就能够向 Rust 语言一样使用并发的抽象层，它将无所畏惧得将并发作为其主要目标。在下一篇文章中，我们将解释工具（[Atomics](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Atomics) ）以及工具开发者是怎样来实现这一抽象层并如何避免竞用条件的。

[![Layer diagram showing SharedArrayBuffer + Atomics as the foundation, and JS libaries and WebAssembly threading building on top](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/02_15-500x335.png)](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/02_15.png)

