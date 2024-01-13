---
external: false
title: "ES6 Generator函数实现协同程序"
description: "ES6 Generator函数实现协同程序."
date: 2017-08-23
---

> 至此本系列的四篇文章翻译完结，查看完整系列请移步[blogs](https://github.com/Jocs/jocs.github.io/issues) 
>
> 由于个人能力知识有限，翻译过程中难免有纰漏和错误，望不吝指正[issue](https://github.com/Jocs/jocs.github.io/issues/12)

ES6 Generators: 完整系列

1. [The Basics Of ES6 Generators](https://davidwalsh.name/es6-generators)
2. [Diving Deeper With ES6 Generators](https://davidwalsh.name/es6-generators-dive)
3. [Going Async With ES6 Generators](https://davidwalsh.name/async-generators)
4. [Getting Concurrent With ES6 Generators](https://davidwalsh.name/concurrent-generators)

如果你已经阅读并消化了本系列的前三篇文章：[第一篇](https://davidwalsh.name/es6-generators/)、[第二篇](https://davidwalsh.name/es6-generators-dive/)、[第三篇](https://davidwalsh.name/async-generators/)，那么在此时你已经对如何使用ES6 generator函数胸有成竹，并且我也衷心希望你能够受到前三篇文章的鼓舞，实际去使用一下generator函数（挑战极限），探究其究竟能够帮助我们完成什么样的工作。

我们最后一个探讨的主题可能和一些前沿知识有关，甚至需要动脑筋才能够理解（诚实的说，一开始我也有些迷糊）。花一些时间来练习和思考这些概念和示例。并且去实实在在的阅读一些别人写的关于此主题的文章。

此刻你花时间（投资）来弄懂这些概念对你长远来看是有益的。并且我完全深信在将来JS处理复杂异步的操作能力将从这些观点中应运而生。



#### 正式的CSP（Communicating Sequential Processes）

起初，关于该主题的热情我完全受启发于 [David Nolen](http://github.com/swannodette) [@swannodette](http://twitter.com/swannodette)的杰出工作。严格说来，我阅读了他写的关于该主题的所有文章。下面这些链接可以帮助你对CSP有个初步了解：

- ["Communicating Sequential Processes"](http://swannodette.github.io/2013/07/12/communicating-sequential-processes/)
- ["ES6 Generators Deliver Go Style Concurrency"](http://swannodette.github.io/2013/08/24/es6-generators-and-csp/)
- ["Extracting Processes"](http://swannodette.github.io/2013/07/31/extracting-processes/)

OK，就我在该主题上面的研究而言，在开始写JS代码之前我并没有编写Clojure语言的背景，也没有使用Go和ClojureScript语言的经验。在阅读上面文章的过程中，我很快就发现我有一点弄不明白了，而不得不去做一些实验性学习或者学究性的去思考，并从中获取一些有用的知识。

在这个过程中，我感觉我达到了和作者相同的思维境界，并且追求相同的目标，但是却采取了另一种不那么正规的思维方式。

我所努力并尝试去构建一个更加简单的Go语言风格的CSP(或者ClojureScript语言中的core.async)APIs，并且（我希望）竟可能的保留那些潜在的能力。在阅读我文章的那些聪明的读者一定能够容易的发现我对该主题研究中的一些缺陷和不足，如果这样的话，我希望我的研究能够演进并持续发展下去，我也会坚持和我广大的读者分享我在CSP上的更多启示。



#### 分解 CSP 理论（一点点）

CSP究竟是什么呢？在CSP概念下讲述的“communicating”、“Sequential”又是什么意思呢？“processes”有代表什么？

首先，CSP的概念是从Tony Hoare的[书  *"Communicating Sequential Processes"*](http://www.usingcsp.com/)中首次被提及。这本书主要是一些CS理论上的东西，但是如果你对一些学术上的东西很感兴趣，相信这本书是一个很好的开端。在关于CSP这一主题上我绝不会从一些头疼的、难懂的计算机科学知识开始，我决定从一些非正式入口开始关于CSP的讨论。

因此，让我们先从“sequential”这一概念入手，关于这部分你可能已经相当熟悉，这也是我们曾经讨论过的单线程行为的另一种表述或者说我们在同步形式的ES6 generator函数中也曾遇到过。

回忆如下的generator函数语法：

```javascript
function *main() {
    var x = yield 1;
    var y = yield x;
    var z = yield (y * 2);
}
```

上面代码片段中的语句都按顺序一条接一条执行执行，同一时间不能够执行多条语句。`yield` 关键字表示代码在该处将会被阻塞式暂停（阻塞的仅仅是 generator 函数代码本身，而不是整个程序），但是这并没有引起 `*main()` 函数内部自顶向下代码的丝毫改变。是不是很简单，难道不是吗？

接下来，让我们讨论下「processes」。「processes」究竟是什么呢？

本质上说，一个 generator 函数的作用相当于虚拟的「进程」。它是一段高度自控的程序，如果 JavaScript 允许的话，它能够和程序中的其他代码并行运行。

说实话，上面有一点捏造事实了，如果 generator 函数能够获取到共享内存中的值（也就是说，如果它能够获取到一些除它本身内部的局部变量外的「自由变量」），那么它也就不那么独立了。但是现在让我们先假设我们拥有一个 generator 函数，它不会去获取函数外部的变量（在函数式编程中通常称之为「组合子」）。因此理论上 generator 函数可以在其自己的进程中独立运行。

但是我们这儿所讨论的是「processes」\-\-复数形式\-\-，因为更重要的是我们拥有两个或者多个的进程。换句话说，两个或者多个 generator 函数通常会同时出现在我们的代码中，然后协作完成一些更加复杂的任务。

为什么将 generator 函数拆分为多个而不是一个呢？最重要的原因：**实现功能和关注点的解耦**。如果你现在正在着手一项 XYZ 的任务，你将这个任务拆分成了一些子任务，如 X, Y和 Z,并且每一个任务都通过一个 generator 函数实现，现在这样的拆分和解耦使得你的代码更加易懂且可维护性更高。

这个你将一个`function XYZ()`分解为三个函数`X()`,`Y()`,`Z()`,然后在`X()`函数中调用`Y()`，在`Y()`函数中调用`Z()`的动机是一样的，我们将一个函数分解成多个函数，分离的代码更加容易推理，同时也是的代码可维护性增强。

**我们可以通过多个 generator 函数来完成相同的事情**

最后，「communicating」。这有表达什么意思呢？他是从上面\-\-协程—的概念中演进而来，协程的意思也就是说多个 generator 函数可能会相互协作，他们需要一个交流沟通的渠道（不仅仅是能够从静态作用域中获取到共享的变量，同时是一个真实能够分享沟通的渠道，所有的 generator 函数都能够通过独有的途径与之交流）。

这个通信渠道有哪些作用呢？实际上不论你想发送什么数据（数字 number，字符串 strings 等），你实际上不需要通过渠道来实际发送消息来和渠道进行通信。「Communication」和协作一样简单，就和将控制权在不同 generator 函数之间传递一样。

为什么需要传递控制权？最主要的原因是 JS是单线程的，在同一时间只允许一个 generator 函数的执行。其他 generator 函数处于运行期间的暂停状态，也就是说这些暂停的 generator 函数都在其任务执行过程中停了下来，仅仅是停了下来，等待着在必要的时候重新启动运行。

这并不是说我们实现了（译者注：作者的意思应该是在没有其他库的帮助下）任意独立的「进程」可以魔法般的进行协作和通信。

相反，显而易见的是任意成功得 CSP 实现都是精心策划的，将现有的问题领域进行逻辑上的分解，每一块在设计上都与其他块协调工作。// TODO 这一段好难翻译啊。

我关于 CSP 的理解也许完全错了，但是在实际过程中我并没有看到两个任意的 generator 函数能够以某种方式胶合在一起成为一个 CSP 模式，这两个 generator 函数必然需要某些特殊的设计才能够相互的通信，比如双方都遵守相同的通信协议等。



#### 通过 JS 实现 CSP 模式

在通过 JS 实现 CSP 理论的过程中已经有一些有趣的探索了。

上文我们提及的 David Nolen 有一些有趣的项目，包括 [Om](https://github.com/swannodette/om)和 [core.async](http://www.hakkalabs.co/articles/core-async-a-clojure-library/) ，[Koa](http://koajs.com/)通过其`use(..)`方法对 CSP 也有些有趣的尝试。另外一个库 [js-csp](https://github.com/ubolonton/js-csp)完全忠实于 core.async/Go CSP API。

你应该切实的去浏览下上述的几个杰出的项目，去发现通过 JS实现 CSP 的的不同途径和实例的探讨。

#### asynquence 中的 `runner(..)` 方法：为 CSP 而设计

由于我强烈地想要在我的 JS 代码中运用 CSP 模式，很自然地想到了扩展我现有的异步控制流的库[asynquence](http://github.com/getify/asynquence) ，为其添加 CSP 处理能力。

我已经有了 [`runner(..)`](https://github.com/getify/asynquence/tree/master/contrib#runner-plugin)插件工具能够帮助我异步运行 generator 函数（参见[第三篇文章Going Async With Generators](https://davidwalsh.name/async-generators/#rungenerator-library-utility)），因此对于我来说，通过扩展该方法使得其具有像[CSP 形式](https://github.com/getify/asynquence/tree/master/contrib#csp-style-concurrency)一样处理多个 generator函数的能力变得相对容易很多。

首选我需要解决的设计问题：我怎样知道下一个处理哪个 generator 函数呢？

如果我们在每个 generator 函数上面添加类似 ID一样的标示，这样别的 generator 函数就能够很容易分清楚彼此，并且能够准确的将消息或者控制权传递给其他进程，但是这种方法显得累赘且冗余。经过众多尝试后，我找到了一种简便的方法，称之为「循环调度法」。如果你要处理一组三个的 generator 函数 A, B, C，A 首先获得控制权，当 A 调用 yield 表达式将控制权移交给 B，再后来 B 通过 yield 表达式将控制权移交给 C，一个循环后，控制权又重新回到了 A generator 函数，如此往复。

但是我们究竟如何转移控制权呢？是否需要一个明确的 API 来处理它呢？再次，经过众多尝试后，我找到了一个更加明确的途径，该方法和[Koa 处理有些类似](http://koajs.com/#cascading)（完全是巧合）：每一个 generator 对同一个共享的「token」具有引用，`yield`表达式的作用仅仅是转移控制权。

另外一个问题，消息渠道究竟应该采取什么样的形式呢。一端的频谱就是你将看到和 core.async 和 js-csp(`put(..`和`take(..)`)相似的 API 设计。经过我的尝试后，我倾向于频谱的另一端，你将看到一个不那么正式的途径（甚至不是一个 API，仅仅是共享一个像`array`一样的数据结构），但是它又是那么的合适且有效。

我决定使用一个数组（称作`messages`）来作为消息渠道，你可以采取任意必要的数组方法来填充/消耗数组。你可以使用`push()`方法来想数组中推入消息，你也可以使用`pop()`方法来将消息从数组中推出，你也可以按照一些约定惯例想数组中插入不同的消息，这些消息也许是更加复杂的数据接口，等等。

我的疑虑是一些任务需要相当简单的消息来传递，而另外一些任务（消息）却更加复杂，因此我没有在这简单的例子上面花费过多的精力，而是选择了不去对 message 渠道进行格式化，它就是简简单单的一个数组。（因此也就没有为`array`本身设计特殊的 API）。同时，在你觉得格式化消息渠道有用的时候，你也可以很容易的为该消息传递机制添加格外的格式化（参见下面的状态机的事例）。

最后，我发现这些 generator 函数「进程」依然受益于[单独的 generator 函数的异步能力](https://davidwalsh.name/async-generators/)。换句话说，如果你通过 yield 表达式不是传递的一个「control-token」，你通过 yield 表达式传递的一个 Promise （或者异步序列），`runner(..)`的运行机制会暂停并等待返回值，并且不会**转移控制权**。他会将该返回值传递会当前进程（generator 函数）并保持该控制权。

上面最后一点（如果我说明得正确的话）是和其他库最具争议的地方，从其他库看来，真是的 CSP 模式在 yield 表达式执行后移交控制权，然而，我发现在我的库中我这样处理却相当有用。（译者注：作者就是这样自信）





#### 一个简单的 FooBar 例子

我们已经理论充足了，让我们看一些代码：

```javascript
// Note: omitting fictional `multBy20(..)` and
// `addTo2(..)` asynchronous-math functions, for brevity

function *foo(token) {
    // grab message off the top of the channel
    var value = token.messages.pop(); // 2

    // put another message onto the channel
    // `multBy20(..)` is a promise-generating function
    // that multiplies a value by `20` after some delay
    token.messages.push( yield multBy20( value ) );

    // transfer control
    yield token;

    // a final message from the CSP run
    yield "meaning of life: " + token.messages[0];
}

function *bar(token) {
    // grab message off the top of the channel
    var value = token.messages.pop(); // 40

    // put another message onto the channel
    // `addTo2(..)` is a promise-generating function
    // that adds value to `2` after some delay
    token.messages.push( yield addTo2( value ) );

    // transfer control
    yield token;
}
```

OK，上面出现了两个 generator「进程」，`*foo()` 和 `*bar()`。你会发现这两个进程都将操作`token`对象（当然，你可以以你喜欢的方式称呼它）。`token`对象上的`messages`属性值就是我们的共享的消息渠道。我们可以在 CSP 初始化运行的时候给它添加一些初始值。

`yield token`明确的将控制权转一个「下一个」generator 函数（循环调度法）。然后`yield multBy20(value)`和`yield addTo2(value)`两个表达式都是传递的 promises（从上面虚构的延迟数学计算方法），这也意味着，generator 函数将在该处暂停知道 promise 完成。当 promise 被解决后（fulfill 或者 reject），当前掌管控制权的 generator 函数重新启动继续执行。

无论最终的 yield的值是什么，在我们的例子中`yield "meaning of..."`表达式的值，将是我们 CSP 执行的最终返回数据。

现在我们两个 CSP 模式的 generator 进程，我们怎么运行他们呢？当然是使用 asynquence：

```javascript
// start out a sequence with the initial message value of `2`
ASQ( 2 )

// run the two CSP processes paired together
.runner(
    foo,
    bar
)

// whatever message we get out, pass it onto the next
// step in our sequence
.val( function(msg){
    console.log( msg ); // "meaning of life: 42"
} );
```

很明显，上面仅是一个无关紧要的例子，但是其也能足以很好的表达 CSP 的概念了。

现在是时候去尝试一下上面的[例子](http://jsbin.com/tunec/2/edit?js,console)（尝试着修改下值）来搞明白这一概念的含义，进而能够编写自己的 CSP 模式代码。



#### 另外一个「玩具」演示用例

如果那我们来看看最为经典的 CSP 例子，但是希望大家从文章上面的解释及发现来入手，而不是像通常情况一样，从一些学术纯化论者的观点中导出。

**Ping-pong**。多么好玩的游戏，啊！它也是我最喜欢的体育运动了。

让我们想象一下，你已经完全实现了打乒乓球游戏的代码，你通过一个循环来运行这个游戏，你有两个片段的代码（通常，通过`if`或者`switch`语句来进行分支）来分别代表两个玩家。

你的代码运行良好，并且你的游戏就像真是玩耍乒乓球一样！

但是还记得为什么我说 CSP 模式是如此有用呢？它完成了**关注点和功能模块的分离**。在上面的乒乓球游戏中我们怎么分离的功能点呢？就是这两位玩家！

因此，我们可以在一个比较高的层次上，通过两个「进程」（generator 函数）来对我们的游戏建模，每个进程代表一位玩家，我们还需要关注一些细节问题，我们很快就感觉到还需要一些「胶水代码」来在两位玩家之间进行控制权的分配（交换），这些代码可以作为第三个 generator 函数进程，我们可以称之为裁判员。

我们已经消除了所有可能会遇到的与专业领域相关的问题，比如得分，游戏机制，物理学常识，游戏策略，电脑玩家，控制等。在我们的用例中我们只关心模拟玩耍乒乓球的反复往复的过程，（这一过程也正隐喻了 CSP 模式中的转移控制权）。

**想要亲自尝试下演示用例**？那就运行把（注意：使用最新每夜版 FF 或者 Chrome，并且带有支持 ES6，来看看 generators 如何工作）

现在，让我们来一段一段的阅读代码。

首先，asynquence 序列长什么样呢？

```javascript
ASQ(
    ["ping","pong"], // player names
    { hits: 0 } // the ball
)
.runner(
    referee,
    player,
    player
)
.val( function(msg){
    message( "referee", msg );
} );
```

我们给我们的序列设置了两个初始值`["ping", "pong"]`和`{hits: 0}`。我们将在后面讨论它们。

接下来，我们设置 CSP 运行 3 个进程（协作程序）：`*referee()` 和 两个`*player()`实例。

游戏最后的消息传递给了我们序列的第二步，我们将在序列第二步中输出裁判传递的消息。

裁判进程的代码实现：

```javascript
function *referee(table){
    var alarm = false;

    // referee sets an alarm timer for the game on
    // his stopwatch (10 seconds)
    setTimeout( function(){ alarm = true; }, 10000 );

    // keep the game going until the stopwatch
    // alarm sounds
    while (!alarm) {
        // let the players keep playing
        yield table;
    }

    // signal to players that the game is over
    table.messages[2] = "CLOSED";

    // what does the referee say?
    yield "Time's up!";
}
```

我们称「控制中token」为`table`，这正好和（乒乓球游戏）专业领域中的称呼想一致，这是一个很好的语义化，一个游戏玩家通过用拍子将球「yields 传递 table」给另外一个玩家，难道不够形象吗？

`while`循环的作用就是在`*referee()`进程中，只要警报器没有吹响，他将不断地通过 yield 表达式将 table 传递给玩家。当警报器吹响，他掌管了控制权，宣布游戏结束「时间到了」。

现在，让我们来看看`*player()`generator 函数（在我们的代码中我们两次使用了该实例）：

```javascript
function *player(table) {
    var name = table.messages[0].shift();
    var ball = table.messages[1];

    while (table.messages[2] !== "CLOSED") {
        // hit the ball
        ball.hits++;
        message( name, ball.hits );

        // artificial delay as ball goes back to other player
        yield ASQ.after( 500 );

        // game still going?
        if (table.messages[2] !== "CLOSED") {
            // ball's now back in other player's court
            yield table;
        }
    }

    message( name, "Game over!" );
}
```

第一位玩家从消息数组中取得他的名字「ping」，然后，第二位玩家取得他的名字「pong」，这样他们可以很好的分辨彼此的身份。两位玩家同时共享`ball`这个对象的引用（通过他的`hits`计数）。

只要玩家没有从裁判口中听到结束的消息，他们就将通过将计数器加一来「hit」`ball`（并且会输入一条计数器消息），然后，等待`500`ms（仅仅是模拟乒乓球的飞行耗时，不要还以为乒乓球以光速飞行呢）。

如果游戏依然进行，游戏玩家「yield 传递 table」给另外一位玩家。

就是这样！

[查看一下演示用例的代码](http://jsbin.com/qutabu/1/edit?js,output)获取一份完整用例的代码，看看不同代码片段之间是如何协同工作的。



#### 状态机：Generator 协同程序

最后一个例子，通过一个 generator 函数集合组成的协同程序来定义一个状态机，这一协同程序都是通过一个简单的工具函数来运行的。

[演示用例](http://jsbin.com/luron/1/edit?js,console)（注意：使用最新的每夜版 FF 或者 Chrome，并且支持 ES6的语法特性，看看 generator 函数如何工作）

首先让我们来定义一个工具函数，来帮助我们控制我们有限的状态：

```javascript
function state(val, handler) {
    // make a coroutine handler (wrapper) for this state
    return function*(token) {
        // state transition handler
        function transition(to) {
            token.messages[0] = to;
        }

        // default initial state (if none set yet)
        if (token.messages.length < 1) {
            token.messages[0] = val;
        }

        // keep going until final state (false) is reached
        while (token.messages[0] !== false) {
            // current state matches this handler?
            if (token.messages[0] === val) {
                // delegate to state handler
                yield *handler( transition );
            }

            // transfer control to another state handler?
            if (token.messages[0] !== false) {
                yield token;
            }
        }
    };
}
```

`state(..)` 工具函数为一个特殊的状态值创建了一个[generator 代理](https://davidwalsh.name/es6-generators-dive#delegating-generators)的上层封装，它将自动的运行状态机，并且在不同的状态转换下转移控制权。

按照惯例来说，我已经决定使用的`token.messages[0]`中的共享数据插槽来储存状态机的当前状态值，这也意味着你可以在序列的前一个步骤来对该状态值进行初始化，但是，如果没有传递该初始化状态，我们简单的在定义第一个状态是将该状态设置为初始状态。同时，按照惯例，最后终止的状态值设置为`false`。正如你认为合适，也很容易改变该状态。

状态值可以是多种数据格式之一，数字，字符串等等，只要改数据可以通过严格的`===`来检测相等性，你就可以使用它来作为状态值。

在接下来的例子中，我展示了一个拥有四个数组状态的状态机，并且其运行运行：`1 -> 4 -> 3 -> 2`。该顺序仅仅为了演示所需，我们使用了一个计数器来帮助我们在不同状态间能够多次传递，当我们的 generator 状态机最终遇到了终止状态`false`时，异步序列运行至下一个步骤，正如你所期待那样。

```javascript
// counter (for demo purposes only)
var counter = 0;

ASQ( /* optional: initial state value */ )

// run our state machine, transitions: 1 -> 4 -> 3 -> 2
.runner(

    // state `1` handler
    state( 1, function*(transition){
        console.log( "in state 1" );
        yield ASQ.after( 1000 ); // pause state for 1s
        yield transition( 4 ); // goto state `4`
    } ),

    // state `2` handler
    state( 2, function*(transition){
        console.log( "in state 2" );
        yield ASQ.after( 1000 ); // pause state for 1s

        // for demo purposes only, keep going in a
        // state loop?
        if (++counter < 2) {
            yield transition( 1 ); // goto state `1`
        }
        // all done!
        else {
            yield "That's all folks!";
            yield transition( false ); // goto terminal state
        }
    } ),

    // state `3` handler
    state( 3, function*(transition){
        console.log( "in state 3" );
        yield ASQ.after( 1000 ); // pause state for 1s
        yield transition( 2 ); // goto state `2`
    } ),

    // state `4` handler
    state( 4, function*(transition){
        console.log( "in state 4" );
        yield ASQ.after( 1000 ); // pause state for 1s
        yield transition( 3 ); // goto state `3`
    } )

)

// state machine complete, so move on
.val(function(msg){
    console.log( msg );
});
```

上面代码的运行机制是不是非常简单。

`yield ASQ.after(1000)`表示这些 generator 函数可以进行 promise/sequence等异步工作，正如我们先前缩减，`yield transition(..)`告诉我们怎样将控制权传递给下一个状态。

我们的`state(..)`工具函数真实的完成了[yield *代理](https://davidwalsh.name/es6-generators-dive#delegating-generators)这一艰难的工作，像变戏法一样，使得我们能够以一种简单自然的形式来对状态进行操控。



#### 总结

CSP 模式的关键点在于将两个或者多个 generator「进程」组合在一起，并为他们提供一个共享的通信渠道，和一个在其彼此之间传递控制权的方法。

市面上已经有很多库多多少少实现了GO 和 Clojure/ClojureScript APIs 相同或者相同语义的 CSP 模式。在这些库的背后是一些聪明而富有创造力的开发者门，这些库的出现，也意味着需要更大的资源投入以及研究。

[asynquence](http://github.com/getify/asynquence) 尝试着通过着通过不那么正式的方法却依然希望给大家呈现 CSP 的运行机制，只不过，asynquence 的`runner(..)`方法使得了我们通过 generator 模拟 CSP 模式变得如此简单，正如你在本篇文章所学的那样。

asynquence CSP 模式中最为出色的部分就是你将所有的[异步处理手段](https://davidwalsh.name/asynquence-part-2)（promise，generators，flow control 等）以及[剩下的](https://davidwalsh.name/asynquence-part-1)有机的组合在了一起，你不同异步处理结合在一起，因此你可以任何合适的手段来处理你的任务，而且，都在同一个小小的库中。

现在，在结束该系列最后一篇文章后，我们已经完成了对 generator 函数详尽的研究，我所希望的是你能够在阅读这些文章后有所启发，并对你现有的代码进行一次彻底革命！你将会用 generator 函数创造什么奇迹呢？