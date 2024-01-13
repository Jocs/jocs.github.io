## 使用 Atomics 来在 SharedArrayBuffers 中避免竞用条件

这是本系列三篇文章中的第二篇：

1. *内存管理速成手册*

2. *通过漫画形式来解释 ArrayBuffers 和 SharedArrayBuffers*

3. *使用 Atomics 来在 SharedArrayBuffers 中避免竞用条件*

在上一篇[文章](https://hacks.mozilla.org/2017/06/a-cartoon-intro-to-arraybuffers-and-sharedarraybuffers/)中，我已经提到过 SharedArrayBuffers 如何导致竞用条件。这使得在使用 SharedArrayBuffers时变得困难，因此我们并不希望应用开发者直接使用 SharedArrayBuffers。

但是对于拥有其他语言多线程开发经验的库开发者而言，他们可以使用这些底层的 APIs开发出更高级的工具。应用开发者就能够使用这些工具而不是直接使用 SharedArrayBuffers 或者 Atomics。

[![Layer diagram showing SharedArrayBuffer + Atomics as the foundation, and JS libaries and WebAssembly threading building on top](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/02_15-500x335.png)](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/02_15.png)

尽管你也许不会直接使用到 SharedArrayBuffers 和 Atomics，但是了解它们是如何工作的依然是一件有趣的事。因此在这篇文章中，我将解释 SharedArrayBuffers 将产生哪些类型的竞用条件，以及 Atomics 怎么帮助库开发者们避免这些竞用条件。

但是首先，什么是竞用条件呢？

[![Drawing of two threads racing towards memory](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/02_13-500x201.png)

**竞用条件：一个你之前可能见过的例子**

一个相当简单的关于竞用条件的例子，当你声明一个变量后，同时这个变量被两个线程所使用，那么将会导致竞用条件的产生。比如一个线程需要上传一个文件，而另外一个线程用来检查文件是否存在，这两个线程共享同一个变量` fileExists`，用于通信。

最初，`fileExists`变量设置为 flase。

[![Two threads working on some code. Thread 1 is loading a file if fileExists is true, and thread 2 is setting fileExists](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/03_03-500x400.png)

只要线程 2 先运行，那么文件将被上传。

[![Diagram showing thread 2 going first and file load succeeding](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/03_04-500x259.png)](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/03_04.png)

但是，如果是线程 1 先运行，那么将会打印一条错误日志给用户，告诉用户文件不存在。

[![Diagram showing thread 1 going first and file load failing](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/03_05-500x259.png)](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/03_05.png)



但是，这并不是问题所在，也不是文件不存在导致，真正的问题在于竞用条件。

很多 JavaScript 开发者都遇到过这样的竞用条件，即使在单线程的代码中，你甚至不必去了解任何关于多线程的知识就知道为什么这就是竞用条件。

然后，有一些竞用条件并不发生在单线程的代码中，而是在你多线程编程时发生，这些线程共享内存中某些单元。

**Atomics 怎么不避免同类型的竞用条件问题**

让我们探索一些在多线程编程中遇到的一些关于竞用条件的例子，并看看 Atomics 是怎样避免其产生的。这些例子也许并不能够完全覆盖所有的竞用条件类型，但是它却在 API 为什么会提供这些方法上给予了你一些启发。

在我们开始前，需要重申一点：你不应该直接使用 Atomics。写多线程的代码是一项艰难的任务，你应该在你的多线程代码中使用一些可靠的库帮你解决共享内存的问题。

[![Caution sign](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/03_06-500x309.png)](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/03_06.png)

就这样...

**单线程中的竞用条件**

让我们看看下面的例子，你有两个线程都在对同一个变量进行递增。你也许会想无论哪个线程先运行，结果都会是一样的。

[![Diagram showing two threads incrementing a variable in turn](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/03_07-500x540.png)](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/03_07.png)

但是，尽管，在源码里，递增一个变量看上去是一个单步骤操作，但是当你查看编译后的代码时，你会发现递增并非单步骤操作。

在 CPU 层面上，递增一个值需要 3 条指令，这是因为计算机中同时拥有长期内存和短期内存。（我在我另外一篇[文章](https://hacks.mozilla.org/2017/02/a-crash-course-in-assembly/)中会阐述他们是如何工作的）

[![Drawing of a CPU and RAM](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/03_08-500x339.png)](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/03_08.png)

所有的线程都共享长期内存，短期内存-也就是寄存器-并不会在不同线程之间共享。

不同线程都需要从内存中获取到值让后放入寄存器中，只有这样，计算机才能够在寄存器中对这些值进行计算，当计算完成后，计算机将计算所得结果从短期内存中取出然后存入长期内存中。

[![Diagram showing a variable being loaded from memory to a register, then being operated on, and then being stored back to memory](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/03_09-500x283.png)](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/03_09.png)

如果线程 1 中所有的操作先运行，然后再是线程 2 的操作进行，那么我们将得到我们想要的结果。

[![Flow chart showing instructions happening sequentially on one thread, then the other](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/03_10-500x1066.png)](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/03_10.png)

但是如果线程 1和线程 2 交错运行，也就是说线程2从内存中取出值存入寄存器中而此时线程1的结果还没有存入内存，也就是说线程 2 并没有获取到线程 1 运行的结果然后进行操作，相反，线程 2 只是和线程 1 一样从长期内存中取出相同的值，然后进行计算，最后再把相同的值放入长期内存中。

[![Flow chart showing instructions interleaved between threads](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/03_11-500x1066.png)](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/03_11.png)



那些普通人认为是单步骤而计算机视为多步骤的操作，Atomic 所做的事情就是使得计算机也将普通人认为的单步骤操作视为单步骤操作。

这也是为什么他们被称作原子操作。这是因为当计算机进行一个多指令操作时，这些指令可能会被暂停或者重启，而 Atomic 能够使得这些同一操作内的指令立即执行，就好像它们是单一指令一样，这也就像一个单独的原子。

[![Instructions encased in an atom](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/03_12-500x183.png)](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/03_12.png)

当进行原子操作时，进行递增的代码看上去有些不同。

[![Atomics.add(sabView, index, 1)](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/03_13-500x157.png)](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/03_13.png)



现在我们使用` Atomics.add`，在对变量进行递增的不同指令在两个线程中将不会交错，而是，一个线程在完成其原子操作之前，另外一个线程不会开始，当之前线程完成原子操作后，第二个线程才启动它的原子操作。

[![Flow chart showing atomic execution of the instructions](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/03_14-500x1066.png)](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/03_14.png)



Atomics 提供了如下方法来避免竞用条件的产生：

- `Atomics.add`

- `Atomics.sub`

- `Atomics.and`

- `Atomics.or`

- `Atomics.xor`

- `Atomics.exchange`

你也许已经注意到了上面的列表提供的方法相当有限，它甚至没有包括乘法和除法等。库开发者可以开发出上面列表不包括的一些原子操作。

为了完成上面的新增原子操作，开发者们可以使用` Atomics.compareExchange`.通过这个方法，你从 SharedArrayBuffer中获取到值，对其进行操作，只有当其他线程没有对该值进行改变时你才能够将该值写入 SharedArrayBuffers，如果其他线程已经更新了该值，那么你可以获取到新的值，并重新执行之前操作。

**在不同操作之间的竞用条件**

上面提及的原子操作能够有效的避免“单线程”中的竞用条件，但是有时候你需要改变一个对象上的多个值（也就是需要多个操作）同时需要确保没有其它线程同时在操作该对象。简单来说，这意味着在对一个对象进行某些改变时，该对象对于其它线程是锁定状态，并且无法操作。

Atomics 对象并没有提供任何工具来处理该问题，但是它提供了一些工具，库开发者们可以使用这些工具来解决以上问题，也就是说，库开发者能够开发一个「锁」。

[![Diagram showing two threads and a lock](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/03_15-500x400.png)](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/03_15.png)

如果代码需要获取到被锁的数据，那么首先需要获取到数据的锁。通过该锁锁定数据，是的其他线程无法访问数据，当锁是激活状态时，只有当前线程能够获取并且更新带锁数据。

为了开发这样的一个锁，库开发者需要使用` Atomics。wait` 和 `Atomics。wake`在加上其他的一些方法，不如` Atomics.compareExchange`和`Atomics.store`。如果你想知道这些方法怎么工作的，那么你可以查看一个[基本的实现用例](https://github.com/lars-t-hansen/js-lock-and-condition)。

在下面的例子中，线程 2 获取到数据的锁，并且锁定数据，这意味着线程 1 无法访问数据直到线程 2 将该数据解锁。

[![Thread 2 gets the lock and uses it to lock up shared memory](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/03_16-500x400.png)](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/03_16.png)

如果线程 1 想要访问数据，它尝试去获取数据的锁，但是由于该锁依然在被使用，因此线程1无法获取到。那么该线程将会等待，也就是说线程1 将会被阻塞，直到该锁能够被获取到。

[![Thread 1 waits until the lock is unlocked](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/03_17-500x400.png)](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/03_17.png)

一旦线程 2 完成操作，将会解锁数据，该锁将会通知一到多个等待中的线程，告诉他们现在锁能够被重新获取到了。

[![Thread 1 is notified that the lock is available](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/03_18-500x400.png)](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/03_18.png)

后继的线程接手该锁，锁定数据，然后对数据进行操作。

[![Thread 1 uses the lock](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/03_19-500x400.png)](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/03_19.png)

一个拥有锁功能的库可能会对 Atomics 对象使用许多原子操作方法，但是在上面的用例中，最有用的两个方法是：

- `Atomics.wait`

- `Atomics.wake`

**在指令排序过程中的竞用条件**

这是第三个 Atomics 能够解决的同步问题，这个问题甚至有些出人意料。

您可能没有意识到，但是很有可能您编写的代码并没有按照您预期的顺序运行。编译器和cpu对代码进行重新排序使其运行得更快。

举个例子，你写了一些代码片段用来计算数字之和。并且你想在计算完之后进行标记。

[![subTotal = price + fee; total += subTotal; isDone = true](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/03_20-500x106.png)](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/03_20.png)

为了编译上面的代码，我们需要决定不同的变量分配不同寄存器。接下来将不同的源码转换成机器指令。

[![Diagram showing what that would equal in mock assembly](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/03_21-500x260.png)](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/03_21.png)



到目前为止，所有的事情按照预期进行。

如果您不了解计算机在芯片级的工作原理(以及它们用于执行代码工作的管道)，那么你对上面的描述可能有些不清楚，我们代码中的第2行需要等待第一行运行完成才能执行。

几乎所有的计算机都将运行中的指令分解成不同的步骤，这样保证了CPU的不同部分在同一时间都是在使用状态，这样也保证了充分利用 CPU.

下面是一个关于指令分解成不同步骤的例子：

- 从内存中获取到下一条指令

- 弄明白该指令进行什么操作（解码指令），并且将值从寄存器中取出。

- 执行指令

- 将结果写回寄存器

[![Pipeline Stage 1: fetch the instruction](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/03_22-500x244.png)](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/03_22.png)

[![Pipeline Stage 2: decode the instruction and fetch register values](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/03_23-500x244.png)](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/03_23.png)

[![Pipeline Stage 3: Execute the operation](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/03_24-500x242.png)](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/03_24.png)

[![Pipeline Stage 4: Write back the result](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/03_25-500x243.png)](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/03_25.png)

上面描述了一条指令是如何运行的。我们希望第二条指令紧跟第一条指令，当第一条指令进入第二阶段时，我们就希望去获取下一天指令了。

问题在于在指令1和指令2之间有依赖关系。

[![Diagram of a data hazard in the pipeline](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/03_26-500x207.png)](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/03_26.png)

我们可以暂停 CPU直到指令1 更新了寄存器中的` subTotal`变量。但是这也会使操作变慢。

为了使 CPU更加高效，很多编译器和 CPUs 会记录代码，然后寻找那些不会用到 `subTotal` 或 `total`的指令，将这些指令提前。

[![Drawing of line 3 of the assembly code being moved between lines 1 and 2 ](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/03_27-500x72.png)](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/03_27.png)

这样保证了源源不断的指令能够通过管道。

因为第三条指令并不依赖于第一条或者第二条指令返回的结果，因此编译器或者 CPU 计算出将该指令提前是安全的。当你是在运行单线程代码时，其他代码在该函数运行完成之前不会看到运行的结果。

但是当在其他进程中计算机同时运行着其他线程，那么就不一样了，其他线程的代码没有必要等待该函数运行完成并获取到其结果，其他线程甚至在该函数将` isDone`写回内存时就能够获取到该值了，也就是说，在写回 total 之前就能够获取到` isDone`的值。

如果你通过` isDone`来标识` total`已经被计算出来并且可以被其他线程使用，那么上面对指令的重新排序将会导致竞用条件。

Atomics 试图解决以上问题，当你使用 Atomics 来写代码时，就好像在两块代码之间加了一个围栏。

Atomics 操作并没有对相关指令重排序，并且其他操作也不会移入这些操作之间，通常情况下，下面两个方法经常被用来确保操作按顺序进行：

- `Atomics.load`

- `Atomics.store`

在函数源码中，所有在` Atomics.store`代码之上的变量都应该在 `Atomics.store`写回内存之前更新。即使一些非原子指令进行重排序，也是在这些非原子代码之下的` Atomics.store`被执行后才能够进行重排序的。

在函数源码中，所有在` Atomics.load`之下的代码将被放在` Atomics.load`重新获取它的值之后执行，即使对于非原子操作的指令的重排序，也不会被移动到之前就在前面` Atomics.load`代码之前。

[![Diagram showing Atomics.store and Atomics.load maintaining order](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/03_28-500x500.png)](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/03_28.png)

注意：上面我展示的循环被称作自旋锁，并且是非常低效的。如果在主线程上，它甚至会将你的应用带向地狱。你应该确保在真实代码中不会用到它。

再次提醒，这些方法不应该在应用开发中直接被使用，相反，库开发者应该使用它们开发出「锁」。共享内存的多线程编程是比较困难的，因为有众多的竞用条件等着你去解决。

[![Drawing of shared memory with a dragon and "Here be dragons" above](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/03_29-500x179.png)](https://2r4s9p1yi1fa2jd7j43zph8r-wpengine.netdna-ssl.com/files/2017/06/03_29.png)



这也是为什么你不希望在应用代码中直接使用 SharedArrayBuffers 和 Atomics 的原因。相反，你应该依赖于经验丰富的多线程开发者开发的库，这些库的作者通常都对内存模型有着深入研究。

现在依然是 SharedArrayBuffers 和 Atomics 启蒙时期，这些库依然还没有被开发出来，但是这些新的 APIs 为这些库的开发提供了坚实的基础。
