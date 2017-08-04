### ES6 Generator 基础

> 本文翻译自：[The Basics Of ES6 Generators](https://davidwalsh.name/es6-generators)

One of the most exciting new features coming in JavaScript ES6 is a new breed of function, called a **generator**. The name is a little strange, but the behavior may seem *a lot stranger* at first glance. This article aims to explain the basics of how they work, and build you up to understanding why they are so powerful for the future of JS.

**generator**是ES6中最令人兴奋不已的特性之一，它是一种全新的函数类型。它的名字有些奇怪，初见起功能时甚至会有些陌生。本篇文章旨在解释其基本工作原理，并帮助你理解为什么Generator将在未来JS中发挥强大作用。



#### Generator从运行到完成的工作方式

The first thing to observe as we talk about generators is how they differ from normal functions with respect to the "run to completion" expectation.

但我们谈论Generator函数时，我们首先应该注意到的是，从“运行到完成”其和普通的函数表现有什么不同之处。

Whether you realized it or not, you've always been able to assume something fairly fundamental about your functions: once the function starts running, it will always run to completion before any other JS code can run.

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

Here, the `for` loop will take a fairly long time to complete, well more than one millisecond, but our timer callback with the `console.log(..)` statement cannot interrupt the `foo()` function while it's running, so it gets stuck at the back of the line (on the event-loop) and it patiently waits its turn.

上面的代码中，`for`循环会执行相当长的时间，长于1秒钟，但是在`foo()`函数执行的过程中，我们带有`console.log(...)`的定时器并不能够中断`foo()`函数的运行。因此代码被阻塞，定时器被推入事件循环的最后，耐心等待`foo`函数执行完成。

What if `foo()` could be interrupted, though? Wouldn't that cause havoc in our programs?

倘若`foo()`可以被中断执行？它不会给我们的带来前所未有的浩劫吗？

That's exactly the ~~nightmares~~ challenges of multi-threaded programming, but we are quite fortunate in JavaScript land to not have to worry about such things, because JS is always single-threaded (only one command/function executing at any given time).

函数可以被中断对于多线程编程来说确实是一个挑战，但是我们应该庆幸的是，在JavaScript的世界中我们没必要为此而担心，因为JS总是单线程的（在任何时间只有一天命令/函数被执行）。

**Note:** Web Workers are a mechanism where you can spin up a whole separate thread for a part of a JS program to run in, totally in parallel to your main JS program thread. The reason this doesn't introduce multi-threaded complications into our programs is that the two threads can only communicate with each other through normal async events, which always abide by（遵守） the event-loop *one-at-a-time* behavior required by run-to-completion.

**注意：** Web Workers是JavaScript中实现与JS主线程分离的独立线程机制，总的说来，Web Workers是与JS主线程平行的另外一个线程。在这儿我们并不介绍多线程并发的一个原因是，主线程和Web Workers线程只能够通过异步事件进行通信，因此每个线程内部从运行到结束依然遵循一个接一个的事件循环机制。

#### 运行-停止-运行

With ES6 generators, we have a different kind of function, which may be *paused* in the middle, one or many times, and resumed（继续执行） *later*, allowing other code to run during these paused periods.

由于ES6的Generators，我们拥有了另外一种类型的函数，这种函数可以在执行的过程中暂停一次或多次，在将来的某个时间继续执行，并且允许在Generator暂停的过程中运行其他代码。

If you've ever read anything about concurrency or threaded programming, you may have seen the term "cooperative（协程）", which basically indicates that a process (in our case, a function) itself chooses when it will allow an interruption, so that it can **cooperate** with other code. This concept is contrasted with "preemptive", which suggests that a process/function could be interrupted against its will.

如果你曾经阅读过关于并发或者多线程编程的资料，那你一定熟悉“协程”这一概念，“协程”的意思就是一个进程（就是一个函数）其可以自行选择终止运行，以便可以和其他代码“协作”完成一些功能。这一概念和“preemptive”相对，preemptive认为可以在进程/函数外部对其终止运行。

ES6 generator functions are "cooperative" in their concurrency behavior. Inside the generator function body, you use the new `yield` keyword to pause the function from inside itself. Nothing can pause a generator from the outside; it pauses itself when it comes across a `yield`.

根据ES6 Generator函数的并发行为，我们可以认为其是一种“协程”。在Generator函数体内部，你可以使用`yield`关键字在函数内部暂停函数的执行，在Generator函数外部是无法暂停一个Generator函数执行的；每当Generator函数遇到一个`yield`关键字就将暂停执行。

However, once a generator has `yield`-paused itself, it cannot resume on its own. An external control must be used to restart the generator. We'll explain how that happens in just a moment.

然后，一旦一个Generator函数通过`yield`暂停执行，其不能够自行恢复执行，需要通过外部的控制来重新启动generator函数，我们将在文章后面部分介绍这是怎么发生的。

So, basically, a generator function can stop and be restarted, as many times as you choose. In fact, you can specify a generator function with an infinite loop (like the infamous `while (true) { .. }`) that essentially never finishes. While that's usually madness or a mistake in a normal JS program, with generator functions it's perfectly sane（理智的、明智的） and sometimes exactly what you want to do!

基本上，只要你愿意，一个Generator函数可以暂停执行/重新启动任意多次。实际上，你可以再Generator函数内部使用无限循环（比如非著名的`while (true) { .. }`）来是的函数可以无尽的暂停/重新启动。然后这在普通的JS程序中却是疯狂的行径，甚至会抛出错误。但是Generator函数却能够表现的非常明智，有些时候你确实想利用Generator函数这种无尽机制。

Even more importantly, this stopping and starting is not *just* a control on the execution of the generator function, but it also enables 2-way message passing into and out of the generator, as it progresses. With normal functions, you get parameters at the beginning and a `return` value at the end. With generator functions, you send messages out with each `yield`, and you send messages back in with each restart.

更为重要的是，暂停/重新启动不仅仅用于控制Generator函数执行，它也可以在generator函数内部和外部进行双向的通信。在普通的JavaScript函数中，你可以通过传参的形式将数据传入函数内容，在函数内部通过`return`语句将函数的返回值传递到函数外部。在generator函数中，我们通过`yield`表达式将信息传递到外部，然后通过每次重启generator函数将其他信息传递给generator。

#### Generator 函数的语法

Let's dig into the syntax of these new and exciting generator functions.

然我们看看新奇并且令人兴奋的generator函数的语法是怎样书写的。

First, the new declaration syntax:

首先，新的函数声明语法：

```javascript
function *foo() {
    // ..
}
```

Notice the `*` there? That's new and a bit strange looking. To those from some other languages, it may look an awful lot（经常） like a function return-value pointer. But don't get confused! This is just a way to signal the special generator function type.

发现`*`符号没？显得有些陌生且有些奇怪。对于从其他语言转向JavaScript的人来说，it may look an awful lot（经常） like a function return-value pointer。但是不要被迷惑到了，`*`只是用于标识generator函数而已。

You've probably seen other articles/documentation which use `function* foo(){ }`instead of `function *foo(){ }` (difference in placement of the `*`). Both are valid, but I've recently decided that I think `function *foo() { }` is more accurate, so that's what I'm using here.

你可能会在其他的文章/文档中看到如下形式书写generator函数`function* foo(){}`，而不是这样`function *foo() {}`(`*`号的位置有所不同)。其实两种形式都是合法的，但是最近我认为后面一种形式更为准确，因此在本篇文章中都是使用后面一种形式。

Now, let's talk about the contents of our generator functions. Generator functions are just normal JS functions in most respects. There's very little new syntax to learn *inside* the generator function.

现在，让我们来讨论下generator函数的内部构成吧。在很多方面，generator函数和普通函数无异，只有在generator函数内部有一些新的语法。

The main new toy we have to play with, as mentioned above, is the `yield` keyword. `yield ___` is called a "yield expression" (and not a statement) because when we restart the generator, we will send a value back in, and whatever we send in will be the computed result of that `yield ___` expression.



例如:

```javascript
function *foo() {
    var x = 1 + (yield "foo");
    console.log(x);
}
```

The `yield "foo"` expression will send the `"foo"` string value out when pausing the generator function at that point, and whenever (if ever) the generator is restarted, whatever value is sent in will be the result of that expression, which will then get added to `1` and assigned to the `x` variable.

See the 2-way communication? You send the value `"foo"` out, pause yourself, and at some point *later* (could be immediately, could be a long time from now!), the generator will be restarted and will give you a value back. It's almost as if the `yield`keyword is sort of making a request for a value.

In any expression location, you *can* just use `yield` by itself in the expression/statement, and there's an assumed `undefined` value `yield`ed out. So:

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

## Generator Iterator

"Generator Iterator". Quite a mouthful（晦涩难懂）, huh?

Iterators are a special kind of behavior, a design pattern actually, where we step through an ordered set of values one at a time by calling `next()`. Imagine for example using an iterator on an array that has five values in it: `[1,2,3,4,5]`. The first `next()`call would return `1`, the second `next()` call would return `2`, and so on. After all values had been returned, `next()` would return `null` or `false` or otherwise signal to you that you've iterated over all the values in the data container.

The way we control generator functions from the outside is to construct and interact with a *generator iterator*. That sounds a lot more complicated than it really is. Consider this silly(愚蠢的) example:

```javascript
function *foo() {
    yield 1;
    yield 2;
    yield 3;
    yield 4;
    yield 5;
}
```

To step through the values of that `*foo()` generator function, we need an iterator to be constructed. How do we do that? Easy!

```javascript
var it = foo();
```

Oh! So, calling the generator function in the normal way doesn't actually execute any of its contents.

That's a little strange to wrap your head around（增加理解难度）. You also may be tempted to wonder, why isn't it `var it = new foo()`. Shrugs. The whys behind the syntax are complicated and beyond our scope of discussion here.

So now, to start iterating on our generator function, we just do:

```javascript
var message = it.next();
```

That will give us back our `1` from the `yield 1` statment, but that's not the only thing we get back.

```javascript
console.log(message); // { value:1, done:false }
```

We actually get back an object from each `next()` call, which has a `value` property for the `yield`ed-out value, and `done` is a boolean that indicates if the generator function has fully completed or not.

Let's keep going with our iteration:

```javascript
console.log( it.next() ); // { value:2, done:false }
console.log( it.next() ); // { value:3, done:false }
console.log( it.next() ); // { value:4, done:false }
console.log( it.next() ); // { value:5, done:false }
```

Interesting to note, `done` is still `false` when we get the value of `5` out. That's because *technically*, the generator function is not complete. We still have to call a final `next()` call, and if we send in a value, it has to be set as the result of that `yield 5`expression. Only **then** is the generator function complete.

So, now:

```javascript
console.log( it.next() ); // { value:undefined, done:true }
```

So, the final result of our generator function was that we completed the function, but there was no result given (since we'd already exhausted all the `yield ___`statements).

You may wonder at this point, can I use `return` from a generator function, and if I do, does that value get sent out in the `value` property?

**Yes**...

```javascript
function *foo() {
    yield 1;
    return 2;
}

var it = foo();

console.log( it.next() ); // { value:1, done:false }
console.log( it.next() ); // { value:2, done:true }
```

... **and no.**

It may not be a good idea to rely on the `return` value from generators, because when iterating generator functions with `for..of` loops (see below), the final `return`ed value would be thrown away.

For completeness sake, let's also take a look at sending messages both into and out of a generator function as we iterate it:

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

You can see that we can still pass in parameters (`x` in our example) with the initial `foo( 5 )` iterator-instantiation call, just like with normal functions, making `x` be value `5`.

The first `next(..)` call, we don't send in anything. Why? Because there's no `yield`expression to receive what we pass in.

But if we *did* pass in a value to that first `next(..)` call, nothing bad would happen. It would just be a tossed-away value. ES6 says for generator functions to ignore the unused value in this case. (**Note:** At the time of writing, nightlies of both Chrome and FF are fine, but other browsers may not yet be fully compliant and may incorrectly throw an error in this case).

The `yield (x + 1)` is what sends out value `6`. The second `next(12)` call sends `12`to that waiting `yield (x + 1)` expression, so `y` is set to `12 * 2`, value `24`. Then the subsequent `yield (y / 3)` (`yield (24 / 3)`) is what sends out the value `8`. The third `next(13)` call sends `13` to that waiting `yield (y / 3)` expression, making `z` set to `13`.

Finally, `return (x + y + z)` is `return (5 + 24 + 13)`, or `42` being returned out as the last `value`.

**Re-read that a few times.** It's weird for most, the first several times they see it.

### `for..of`

ES6 also embraces this iterator pattern at the syntactic level, by providing direct support for running iterators to completion: the `for..of` loop.

Example:

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

As you can see, the iterator created by `foo()` is automatically captured by the `for..of` loop, and it's automatically iterated for you, one iteration for each value, until a `done:true` comes out. As long as `done` is `false`, it automatically extracts the `value` property and assigns it to your iteration variable (`v` in our case). Once `done`is `true`, the loop iteration stops (and does nothing with any final `value` returned, if any).

As noted above, you can see that the `for..of` loop ignores and throws away the `return 6` value. Also, since there's no exposed `next()` call, the `for..of` loop cannot be used in situations where you need to pass in values to the generator steps as we did above.

## Summary

OK, so that's it for the basics of generators. Don't worry if it's a little mind-bending（令人费解的） still. All of us have felt that way at first!

It's natural to wonder what this new exotic（异国的、外来的） toy is going to do practically for your code. There's a **lot** more to them, though. We've just scratched（挖出、掌握？） the surface. So we have to dive deeper before we can discover just how powerful they can/will be.

After you've played around with the above code snippets (try Chrome nightly/canary or FF nightly, or node 0.11+ with the `--harmony` flag), the following questions may arise:

1. How does error handling work?
2. Can one generator call another generator?
3. How does async coding work with generators?

Those questions, and more, will be covered in subsequent（随后的） articles here, so stay tuned（敬请期待）!