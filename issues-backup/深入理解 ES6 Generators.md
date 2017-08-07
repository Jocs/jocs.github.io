#### ES6 Generators:完整系列

1. [The Basics Of ES6 Generators](https://davidwalsh.name/es6-generators)
2. [Diving Deeper With ES6 Generators](https://davidwalsh.name/es6-generators-dive)
3. [Going Async With ES6 Generators](https://davidwalsh.name/async-generators)
4. [Getting Concurrent With ES6 Generators](https://davidwalsh.name/concurrent-generators)

If you're still unfamiliar with ES6 generators, first go read and play around（练习） with the code in ["Part 1: The Basics Of ES6 Generators"](https://davidwalsh.name/es6-generators). Once you think you've got the basics down, now we can dive into some of the deeper details.

如果你依然对ES6 generators不是很熟悉，建议你阅读本系列第一篇文章“第一部分：[ES6 Generators基础指南](https://davidwalsh.name/es6-generators)”，并练习其中的代码片段。一旦你觉得对基础部分掌握透彻了，那我们就可以开始深入理解Generator函数的一些细节部分。

## Error Handling

#### 错误处理

One of the most powerful parts of the ES6 generators design is that the semantics of the code inside a generator are **synchronous**, even if the external iteration control proceeds asynchronously.

ES6 generators设计中最为强大部分莫过于从语义上理解generator中的代码都是同步的，尽管外部的迭代控制器是异步执行的。

That's a fancy/complicated way of saying that you can use simple error handling techniques that you're probably very familiar with -- namely the `try..catch`mechanism.

也就是说，你可以使用简单的错误处理技术来对generators函数进行容错处理， 也就是你最为熟悉的`try...catch`机制。

例如:

```Javascript
function *foo() {
    try {
        var x = yield 3;
        console.log( "x: " + x ); // may never get here!
    }
    catch (err) {
        console.log( "Error: " + err );
    }
}
```

Even though the function will pause at the `yield 3` expression, and may remain paused an arbitrary amount of time, if an error gets sent back to the generator, that `try..catch` will catch it! Try doing that with normal async capabilities like callbacks. :)

尽管上面例子中的`foo` generator函数会在`yield 3`表达式后暂停执行，并且可能暂停任意长的时间，如果向generator函数内部传入一个错误，generator函数内部的`try...catch`模块将会捕获传入的错误！就像通过回调函数等常见的异步处理机制一样来处理错误。

But, how exactly would an error get sent back into this generator?

但是，错误究竟是怎样传递到generator函数内部的呢？

```javascript
var it = foo();

var res = it.next(); // { value:3, done:false }

// instead of resuming normally with another `next(..)` call,
// let's throw a wrench (an error) into the gears:
it.throw( "Oops!" ); // Error: Oops!
```

Here, you can see we use another method on the iterator -- `throw(..)` -- which "throws" an error into the generator as if it had occurred at the exact point where the generator is currently `yield`-paused. The `try..catch` catches that error just like you'd expect!

如上代码，你会看到iterator的另外一个方法- -`throw(..)`- -，该方法向generator函数内部传入一个错误，该错误就如同在generator函数内部暂停执行的`yield`语句处抛出的错误一样，正如你所愿，`try...catch`模块捕获了通过`throw`方法抛出的错误。

**Note:** If you `throw(..)` an error into a generator, but no `try..catch` catches it, the error will (just like normal) propagate right back out (and if not caught eventually end up as an unhandled rejection). So:

**注意：**如果你通过`throw(..)`方法向generator函数内部抛出一个错误，同时在函数内部又没有`try...catch`模块来捕获错误，该错误（如同正常的错误冒泡机制）将从generator函数冒泡到函数外部（如果始终都没对该错误进行处理，该错误将冒泡到最外层成为未捕获错误）。代码如下：

```javascript
function *foo() { }

var it = foo();
try {
    it.throw( "Oops!" );
}
catch (err) {
    console.log( "Error: " + err ); // Error: Oops!
}
```

Obviously, the reverse direction of error handling also works:

显而易见，反向的错误处理依然能够正常工作（译者注：generator函数内部抛出错误，在generator外部捕获）：

```javascript
function *foo() {
    var x = yield 3;
    var y = x.toUpperCase(); // could be a TypeError error!
    yield y;
}

var it = foo();

it.next(); // { value:3, done:false }

try {
    it.next( 42 ); // `42` won't have `toUpperCase()`
}
catch (err) {
    console.log( err ); // TypeError (from `toUpperCase()` call)
}
```

## Delegating Generators

#### 代理 Generators函数

Another thing you may find yourself wanting to do is call another generator from inside of your generator function. I don't just mean instantiating a generator in the normal way, but actually *delegating* your own iteration control *to* that other generator. To do so, we use a variation of the `yield` keyword: `yield *` ("yield star").

在使用generator函数的过程中，另外一件你可能想要做的事就是在generator函数内部调用另外一个generator函数。这儿我并不是指在普通函数内部执行generator函数，实际上是把迭代控制权*委托*给另外一个generator函数。为了完成这件工作，我们使用了`yield`关键字的变种：`yield *`(“yield star”)。

例如:

```javascript
function *foo() {
    yield 3;
    yield 4;
}

function *bar() {
    yield 1;
    yield 2;
    yield *foo(); // `yield *` delegates iteration control to `foo()`
    yield 5;
}

for (var v of bar()) {
    console.log( v );
}
// 1 2 3 4 5
```

Just as explained in part 1 (where I used `function *foo() { }` instead of `function* foo() { }`), I also use `yield *foo()` here instead of `yield* foo()` as many other articles/docs do. I think this is more accurate/clear to illustrate what's going on.

在第一篇文章中已经提及（在第一篇文章中，我使用`function *foo() { }`的语法格式，而不是`function* foo() { }`），在这里，我们依然使用`yield *foo()`，而不是`yield* foo()`，尽管很多文章/文档喜欢采用后面一种语法格式。我认为前面一种语法格式更加准确/清晰得表达此语法含义。

Let's break down（分解） how this works. The `yield 1` and `yield 2` send their values directly out to the `for..of` loop's (hidden) calls of `next()`, as we already understand and expect.

让我们来分解上面代码是如何工作的。`yield 1`和`yield 2`表达式直接将值通过`for..of`循环（隐式）调用`next()`传递到外部，正如我们已经理解并期待的那样。

But then `yield*` is encountered, and you'll notice that we're yielding to another generator by actually instantiating it (`foo()`). So we're basically yielding/delegating to another generator's iterator -- probably the most accurate way to think about it.

在代码执行过程中，我们遇到了`yield *`表达式，你将看到我们通过执行`foo()`将控制权交给了另外一个generator函数。因此我们基本上就是出产/委托给了另外一个generator函数的迭代器- -也许这就是最准确的理解代理generator函数如何工作的。

Once `yield*` has delegated (temporarily) from `*bar()` to `*foo()`, now the `for..of` loop's `next()` calls are actually controlling `foo()`, thus the `yield 3`and `yield 4` send their values all the way back out to the `for..of` loop.

一旦`yield *`表达式（临时的）在`*bar()`函数中将控制权委托给`*foo()`函数，那么现在`for..of`循环中的`next()`方法的执行将完全控制`foo()`，因此`yield 3`和`yield 4`表达式将他们的值通过`for..of`循环返回到外部。

Once `*foo()` is finished, control returns back to the original generator, which finally calls the `yield 5`.

当`*foo()`运行结束，控制权重新交回最初的generator函数，最后在外层`bar`函数中执行`yield 5`。

For simplicity, this example only `yield`s values out. But of course, if you don't use a `for..of` loop, but just manually call the iterator's `next(..)` and pass in messages, those messages will pass through the `yield*` delegation in the same expected manner:

简单起见，在上面的实例中，我们仅通过`yield`表达式将值传递到generator函数外部，当然，如果我们不用`for..of`循环，而是手动的执行迭代器的`next()`方法来向函数内部传递值，这些值也会按你所期待的方式传递给通过`yield *`代理的generator函数中：

```javascript
function *foo() {
    var z = yield 3;
    var w = yield 4;
    console.log( "z: " + z + ", w: " + w );
}

function *bar() {
    var x = yield 1;
    var y = yield 2;
    yield *foo(); // `yield*` delegates iteration control to `foo()`
    var v = yield 5;
    console.log( "x: " + x + ", y: " + y + ", v: " + v );
}

var it = bar();

it.next();      // { value:1, done:false }
it.next( "X" ); // { value:2, done:false }
it.next( "Y" ); // { value:3, done:false }
it.next( "Z" ); // { value:4, done:false }
it.next( "W" ); // { value:5, done:false }
// z: Z, w: W

it.next( "V" ); // { value:undefined, done:true }
// x: X, y: Y, v: V
```

Though we only showed one level of delegation here, there's no reason why `*foo()` couldn't `yield*` delegate to another generator iterator, and that to another, and so on.

尽管上面的代码中我们只展示了嵌套一层的代理generator函数，但是没有理由`*foo()`不可以通过`yield *`表达式继续代理其他的generator迭代器，甚至继续嵌套代理其他generator函数，等等。

Another "trick" that `yield*` can do is receive a `return`ed value from the delegated generator.

`yield *`表达式可以实现另外一个窍门，就是`yield *`表达式将会返回被代理generator函数的函数返回值。

```javascript
function *foo() {
    yield 2;
    yield 3;
    return "foo"; // return value back to `yield*` expression
}

function *bar() {
    yield 1;
    var v = yield *foo();
    console.log( "v: " + v );
    yield 4;
}

var it = bar();

it.next(); // { value:1, done:false }
it.next(); // { value:2, done:false }
it.next(); // { value:3, done:false }
it.next(); // "v: foo"   { value:4, done:false }
it.next(); // { value:undefined, done:true }
```

As you can see, `yield *foo()` was delegating iteration control (the `next()`calls) until it completed, then once it did, any `return` value from `foo()` (in this case, the string value `"foo"`) is set as the result value of the `yield*` expression, to then be assigned to the local variable `v`.

正如你所见，`yield *foo()`正在代理迭代器的控制权（调用`next()`方法）至到其运行完成，当前执行完成，`foo()`函数的函数`return`值（本例中是`"foo"`字符串）将会作为`yield *`表达式的值，在上例中将该值赋值给变量`v`。

That's an interesting distinction between `yield` and `yield*`: with `yield`expressions, the result is whatever is sent in with the subsequent `next(..)`, but with the `yield*` expression, it receives its result only from the delegated generator's `return` value (since `next(..)` sent values pass through the delegation transparently).

这是一个`yield`和`yield*`表达式有趣的区别：在`yield`表达式中，表达式的返回值是通过随后的`next()`方法调用传递进来的，但是在`yield *`表达式中，它将获取到被代理generator函数的`return`值（因为`next()`方法显式的将值传递到被代理的generator函数中）。

You can also do error handling (see above) in both directions across a `yield*`delegation:

你依然可以双向的对`yield *`代理进行错误处理（如上所述）：

```javascript
function *foo() {
    try {
        yield 2;
    }
    catch (err) {
        console.log( "foo caught: " + err );
    }

    yield; // pause

    // now, throw another error
    throw "Oops!";
}

function *bar() {
    yield 1;
    try {
        yield *foo();
    }
    catch (err) {
        console.log( "bar caught: " + err );
    }
}

var it = bar();

it.next(); // { value:1, done:false }
it.next(); // { value:2, done:false }

it.throw( "Uh oh!" ); // will be caught inside `foo()`
// foo caught: Uh oh!

it.next(); // { value:undefined, done:true }  --> No error here!
// bar caught: Oops!
```

As you can see, the `throw("Uh oh!")` throws the error through the `yield*`delegation to the `try..catch` inside of `*foo()`. Likewise, the `throw "Oops!"`inside of `*foo()` throws back out to `*bar()`, which then catches that error with another `try..catch`. Had we not caught either of them, the errors would have continued to propagate out as you'd normally expect.

如你所见，`throw("Uh oh!")`通过`yield*`代理将错误抛出，然后`*foo()`函数内部的`try..catch`模块捕获到错误。同样地，在`*foo()`函数内部通过`throw "Oops!"`抛出错误冒泡到`*bar()`函数中被另外一个`try..catch`模块捕获，如果我们没有捕获到其中的某一条错误，该错误将会按你所期待的方式继续向上冒泡。

## Summary

#### 总结

Generators have synchronous execution semantics, which means you can use the `try..catch` error handling mechanism across a `yield` statement. The generator iterator also has a `throw(..)` method to throw an error into the generator at its paused position, which can of course also be caught by a `try..catch` inside the generator.

Generators函数拥有同步执行的语义，这也意味着你可以通过`try..catch`错误处理机制来横跨`yield`语句进行错误处理。同时，generator迭代器有一个`throw()`方法来向generator函数中暂停处抛出一个错误，该错误依然可以通过generator函数内部的`try..catch`模块进行捕获处理。

`yield*` allows you to delegate the iteration control from the current generator to another one. The result is that `yield*` acts as a pass-through in both directions, both for messages as well as errors.

`yield *`关键字允许你将迭代控制权从当前generator函数委托给其他generator函数。结果就是，`yield *`将扮演一个双向的信息和错误传递角色。

But, one fundamental question remains unanswered so far: how do generators help us with async code patterns? Everything we've seen so far in these two articles is synchronous iteration of generator functions.

但是到目前为止，一个基础的问题依然没有解决：generator函数怎么帮助我们处理异步模式？在以上两篇文章中我们一直讨论generator函数的同步迭代模式。

The key will be to construct a mechanism where the generator pauses to start an async task, and then resumes (via its iterator's `next()` call) at the end of the async task. We will explore various ways of going about creating such asynchronicity-control with generators in the next article. Stay tuned!

构想generator函数异步机制的关键点在于，通过generator函数的暂停执行来开始一个异步任务，然后通过generator函数的重新启动（通过迭代器的`next()`方法的执行）来结束上面的异步任务。我们可以在接下来的文章中发现generator函数形式各样的异步控制机制。近期期待！

