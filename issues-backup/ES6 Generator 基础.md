### ES6 Generator 基础指南

> 本文翻译自：[The Basics Of ES6 Generators](https://davidwalsh.name/es6-generators)

JavaScript ES6(译者注：ECMAScript 2015)中最令人兴奋的特性之一莫过于**Generator**函数，它是一种全新的函数类型。它的名字有些奇怪，初见其功能时甚至更会有些陌生。本篇文章旨在解释其基本工作原理，并帮助你理解为什么Generator将在未来JS中发挥强大作用。



#### Generator从运行到完成的工作方式

但我们谈论Generator函数时，我们首先应该注意到的是，从“运行到完成”其和普通的函数表现有什么不同之处。

不论你是否已经意识到，你已经潜意识得认为函数具有一些非常基础的特性：函数一旦开始执行，那么在其结束之前，不会执行其他JavaScript代码。

例如:

```javascript
setTimeout(function(){
    console.log("Hello World");
},1);

function foo() {
    // NOTE: don't ever do crazy long-running loops like this
    for (var i=0; i<=1E10; i++) {
        console.log(i);
    }
}

foo();
// 0..1E10
// "Hello World"
```

上面的代码中，`for`循环会执行相当长的时间，长于1秒钟，但是在`foo()`函数执行的过程中，我们带有`console.log(...)`的定时器并不能够中断`foo()`函数的运行。因此代码被阻塞，定时器被推入事件循环的最后，耐心等待`foo`函数执行完成。

倘若`foo()`可以被中断执行？它不会给我们的带来前所未有的浩劫吗？

函数可以被中断对于多线程编程来说确实是一个挑战，但是值得庆幸的是，在JavaScript的世界中我们没必要为此而担心，因为JS总是单线程的（在任何时间只有一条命令/函数被执行）。

**注意：** Web Workers是JavaScript中实现与JS主线程分离的独立线程机制，总的说来，Web Workers是与JS主线程平行的另外一个线程。在这儿我们并不介绍多线程并发的一个原因是，主线程和Web Workers线程只能够通过异步事件进行通信，因此每个线程内部从运行到结束依然遵循一个接一个的事件循环机制。

#### 运行-停止-运行

由于ES6Generators的到来，我们拥有了另外一种类型的函数，这种函数可以在执行的过程中暂停一次或多次，在将来的某个时间继续执行，并且允许在Generator函数暂停的过程中运行其他代码。

如果你曾经阅读过关于并发或者多线程编程的资料，那你一定熟悉“协程”这一概念，“协程”的意思就是一个进程（就是一个函数）其可以自行选择终止运行，以便可以和其他代码**“协作”**完成一些功能。这一概念和“preemptive”相对，preemptive认为可以在进程/函数外部对其终止运行。

根据ES6 Generator函数的并发行为，我们可以认为其是一种“协程”。在Generator函数体内部，你可以使用`yield`关键字在函数内部暂停函数的执行，在Generator函数外部是无法暂停一个Generator函数执行的；每当Generator函数遇到一个`yield`关键字就将暂停执行。

然后，一旦一个Generator函数通过`yield`暂停执行，其不能够自行恢复执行，需要通过外部的控制来重新启动generator函数，我们将在文章后面部分介绍这是怎么发生的。

基本上，只要你愿意，一个Generator函数可以暂停执行/重新启动任意多次。实际上，你可以再Generator函数内部使用无限循环（比如非著名的`while (true) { .. }`）来使得函数可以无尽的暂停/重新启动。然后这在普通的JS程序中却是疯狂的行径，甚至会抛出错误。但是Generator函数却能够表现的非常明智，有些时候你确实想利用Generator函数这种无尽机制。

更为重要的是，暂停/重新启动不仅仅用于控制Generator函数执行，它也可以在generator函数内部和外部进行双向的通信。在普通的JavaScript函数中，你可以通过传参的形式将数据传入函数内容，在函数内部通过`return`语句将函数的返回值传递到函数外部。在generator函数中，我们通过`yield`表达式将信息传递到外部，然后通过每次重启generator函数将其他信息传递给generator。

#### Generator 函数的语法

然我们看看新奇并且令人兴奋的generator函数的语法是怎样书写的。

首先，新的函数声明语法：

```javascript
function *foo() {
    // ..
}
```

发现`*`符号没？显得有些陌生且有些奇怪。对于从其他语言转向JavaScript的人来说，它看起来很像函数返回值指针。但是不要被迷惑到了，`*`只是用于标识generator函数而已。

你可能会在其他的文章/文档中看到如下形式书写generator函数`function* foo(){}`，而不是这样`function *foo() {}`(`*`号的位置有所不同)。其实两种形式都是合法的，但是最近我认为后面一种形式更为准确，因此在本篇文章中都是使用后面一种形式。

现在，让我们来讨论下generator函数的内部构成吧。在很多方面，generator函数和普通函数无异，只有在generator函数内部有一些新的语法。

正如上面已经提及，我们最先需要了解的就是`yield`关键字，`yield__`被视为“yield表达式”（并不是一条语句），因为当我们重新启动generator函数的时候，我们可以传递信息到generator函数内部，不论我们传递什么进去，都将被视为`yield__`表达式的运行结果。

例如:

```javascript
function *foo() {
    var x = 1 + (yield "foo");
    console.log(x);
}
```

`yield "foo"`表达式会在generator函数暂停时把“foo”字符串传递到外部。同时，当generator函数恢复执行的时候，其他的值又会通过其他表达式传入到函数里面作为`yield`表达式的返回值加`1`最后再将结果赋值给`x`变量。

看到generator函数的双向通信了吗？generator函数将‘’foo‘’字符串传递到外部，暂停函数执行，在将来的某个时间点（可能是立即也可能是很长一段时间后），generator会被重启，并且会传递一个值给generator函数，就好像`yield`关键字就是某种发送请求获取值的请求形式。

在任意表达式中，你可以仅使用`yield`关键字，后面不跟任何表达式或值。在这种情况下，就相当于将`undefined`通过`yield`传递出去。如下代码：

```javascript
// note: `foo(..)` here is NOT a generator!!
function foo(x) {
    console.log("x: " + x);
}

function *bar() {
    yield; // just pause
    foo( yield ); // pause waiting for a parameter to pass into `foo(..)`
}
```

#### Generator 迭代器

“Generator 迭代器”，是不是相当晦涩难懂？

迭代器是一种特殊的行为，准确说是一种设计模式，当我们通过调用`next()`方法去遍历一组值的集合时，例如，我们通过在长度为5的数组`[1, 2, 3, 4, 5]`上面实现了迭代器。当我们第一次调用`next()`的时候，会返回`1`。第二次调用`next()`返回`2`,如此下去，当所有的值都返回后，再次调用`next()`将返回`null`或者`false`或其他值，这意味着你已经遍历完真个数组中的值了。

我们是通过和generator迭代器进行交互来在generator函数外部控制generator函数，这听起来比起实际上有些复杂，考虑下面这个愚蠢的（简单的）例子：

```javascript
function *foo() {
    yield 1;
    yield 2;
    yield 3;
    yield 4;
    yield 5;
}
```

为了遍历`*foo()`generator函数中的所有值，我们首先需要构建一个迭代器，我们怎么去构建这个迭代器呢？非常简单！

```javascript
var it = foo();
```

如此之简单，我们仅仅想执行普通函数一样执行generator函数，其将返回一个迭代器，但是generator函数中的代码并不会运行。

这似乎有些奇怪，并且增加了你的理解难度。你甚至会停下来思考，问为什么不通过`var it = new foo()`的形式来执行generator函数呢，这语法后面的原因可能相当复杂并超出了我们的讨论范畴。

好的，现在让我们开始迭代我们的generator函数，如下：

```javascript
var message = it.next();
```

通过上面的语句，`yield`表达式将1返回到函数外部，但是返回的值可能比想象中会多一些。

```javascript
console.log(message); // { value:1, done:false }
```

在每一调用`next()`后，我们实际上从`yield`表达式的返回值中获取到了一个对象，这个对象中有`value`字段，就是`yield`返回的值，同时还有一个布尔类型的`done`字段，其用来表示generator函数是否已经执行完毕。

然我们把迭代执行完成。

```javascript
console.log( it.next() ); // { value:2, done:false }
console.log( it.next() ); // { value:3, done:false }
console.log( it.next() ); // { value:4, done:false }
console.log( it.next() ); // { value:5, done:false }
```

有趣的是，当我们获取到值为`5`的时候，`done`字段依然是`false`。这因为，实际上generator函数还么有执行完全，我们还可以再次调用`next()`。如果我们向函数内部传递一个值，其将被设置为`yield 5`表达式的返回值，只有在这**时候**，generator函数才执行完全。

代码如下:

```javascript
console.log( it.next() ); // { value:undefined, done:true }
```

所以最终结果是，我们迭代执行完我们的generator函数，但是最终却没有结果（由于我们已经执行完所有的`yield__`表达式）。

你可能会想，我能不能在generator函数中使用`return`语句，如果我这样这，返回值会不会在最终的`value`字段里面呢？

**是**...

```javascript
function *foo() {
    yield 1;
    return 2;
}

var it = foo();

console.log( it.next() ); // { value:1, done:false }
console.log( it.next() ); // { value:2, done:true }
```

... **不是.**

依赖于generator函数的最终返回值也许并不是一个最佳实践，因为当我们通过`for--of`循环来迭代generator函数的时候（如下），最终`return`的返回值将被丢弃（无视）。

为了完整，让我们来看一个同时有双向数据通信的generator函数的例子：

```javascript
function *foo(x) {
    var y = 2 * (yield (x + 1));
    var z = yield (y / 3);
    return (x + y + z);
}

var it = foo( 5 );

// note: not sending anything into `next()` here
console.log( it.next() );       // { value:6, done:false }
console.log( it.next( 12 ) );   // { value:8, done:false }
console.log( it.next( 13 ) );   // { value:42, done:true }
```

你可以看到，我们依然可以通过`foo(5)`传递参数（在例子中是`x`）给generator函数，就像普通函数一样，是的参数`x`为`5`.

在第一次执行`next(..)`的时候，我们并没有传递任何值，为什么？因为在generator内部并没有`yield`表达式来接收我们传递的值。

假如我们真的在第一次调用`next(..)`的时候传递了值进去，也不会带来什么坏处，它只是将这个传入的值抛弃而已。ES6表明，generator函数在这种情况只是忽略了这些没有被用到的值。（**注意**：在写这篇文章的时候，Chrome和FF的每夜版支持这一特性，但是其他浏览有可能没有完全支持这一特性甚至可能会抛出错误）（译者注：文章发布于2014年）

`yield(x + 1)`表达式将传递值`6`到外部，在第二次调用`next(12)`时候，传递`12`到generator函数内部作为`yield(x + 1)`表达式的值，因此`y`被赋值为`12 * 2`，值为`24`。接下来，下一条`yield(y / 3)`(`yield (24 / 3)`)将向外传递值`8`。第三次调用`next(13)`传递`13`到generator函数内部，给`yield(y / 3)`。是的`z`被设置为`13`.

最后，`return (x + y + z)`就是`return (5 + 24 + 13)`，也就是`42`将会作为最终的值返回出去。

**重新阅读几遍上面的实例**。最开始有些难以理解。

#### `for..of`循环

ES6在语法层面上大力拥抱迭代器模式，提供了`for..of`循环来直接支持迭代器的遍历。

例如:

```javascript
function *foo() {
    yield 1;
    yield 2;
    yield 3;
    yield 4;
    yield 5;
    return 6;
}

for (var v of foo()) {
    console.log( v );
}
// 1 2 3 4 5

console.log( v ); // still `5`, not `6` :(
```

正如你所见，通过调用`foo()`生成的迭代器通过`for..of`循环来迭代，循环自动帮你对迭代器进行遍历迭代，每次迭代返回一个值，直到`done: true`，只要`done: false`，每次循环都将从`value`属性上获取到值赋值给迭代的变量（例子中的`v`）。一旦当`done`为`true`。循环迭代结束。（`for..of`循环不会对generator函数最终的return值进行处理）

正如你所看到的，`for..of`循环忽略了generator最后的`return 6`的值，同时，循环没有暴露`next()`出来，因此我们也不能够向generator函数内传递数据。

#### 总结

OK,上面是关于generator函数的基本用法，如果你依然对generator函数感到费解，不要担心，我们所有人在一开始感觉都是那样的。

我们很自然的想到这一外来的语法对我们实际代码有什么作用呢？generator函数有很多作用，我们只是挖掘了其非常粗浅的一部分。在我们发现generator函数如此强大之前我们应该更加深入的了解它。

在你练习上面代码片段之后（在Chrome或者FF每夜版本，或者0.11+带有`--harmony`的node环境下），下面的问题也许会浮出水面：（译者注：现代浏览器最新版本都已支持Generator函数）

1. 怎样处理generator内部错误？
2. 在generator函数内部怎么调用其他generator函数？
3. 异步代码怎么和generator函数协同工作？

这些问题，或者其他的问题都将在随后的文章中覆盖，敬请期待。