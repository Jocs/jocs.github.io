### ES6 Generator 基础

> 本文翻译自：[The Basics Of ES6 Generators](https://davidwalsh.name/es6-generators)

One of the most exciting new features coming in JavaScript ES6 is a new breed of function, called a **generator**. The name is a little strange, but the behavior may seem *a lot stranger* at first glance. This article aims to explain the basics of how they work, and build you up to understanding why they are so powerful for the future of JS.

**generator**是ES6中最令人兴奋不已的特性之一，它是一种全新的函数类型。它的名字有些奇怪，初见起功能时甚至会有些陌生。本篇文章旨在解释其基本工作原理，并帮助你理解为什么Generator将在未来JS中发挥强大作用。



#### Generator从运行到完成的工作方式

The first thing to observe as we talk about generators is how they differ from normal functions with respect to the "run to completion" expectation.

Whether you realized it or not, you've always been able to assume something fairly fundamental about your functions: once the function starts running, it will always run to completion before any other JS code can run.

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

What if `foo()` could be interrupted, though? Wouldn't that cause havoc in our programs?

That's exactly the ~~nightmares~~ challenges of multi-threaded programming, but we are quite fortunate in JavaScript land to not have to worry about such things, because JS is always single-threaded (only one command/function executing at any given time).

**Note:** Web Workers are a mechanism where you can spin up a whole separate thread for a part of a JS program to run in, totally in parallel to your main JS program thread. The reason this doesn't introduce multi-threaded complications into our programs is that the two threads can only communicate with each other through normal async events, which always abide by（遵守） the event-loop *one-at-a-time* behavior required by run-to-completion.

## Run..Stop..Run

With ES6 generators, we have a different kind of function, which may be *paused* in the middle, one or many times, and resumed（继续执行） *later*, allowing other code to run during these paused periods.

If you've ever read anything about concurrency or threaded programming, you may have seen the term "cooperative（协程）", which basically indicates that a process (in our case, a function) itself chooses when it will allow an interruption, so that it can **cooperate** with other code. This concept is contrasted with "preemptive", which suggests that a process/function could be interrupted against its will.

ES6 generator functions are "cooperative" in their concurrency behavior. Inside the generator function body, you use the new `yield` keyword to pause the function from inside itself. Nothing can pause a generator from the outside; it pauses itself when it comes across a `yield`.

However, once a generator has `yield`-paused itself, it cannot resume on its own. An external control must be used to restart the generator. We'll explain how that happens in just a moment.

So, basically, a generator function can stop and be restarted, as many times as you choose. In fact, you can specify a generator function with an infinite loop (like the infamous `while (true) { .. }`) that essentially never finishes. While that's usually madness or a mistake in a normal JS program, with generator functions it's perfectly sane（理智的、明智的） and sometimes exactly what you want to do!

Even more importantly, this stopping and starting is not *just* a control on the execution of the generator function, but it also enables 2-way message passing into and out of the generator, as it progresses. With normal functions, you get parameters at the beginning and a `return` value at the end. With generator functions, you send messages out with each `yield`, and you send messages back in with each restart.

## Syntax Please!

Let's dig into the syntax of these new and exciting generator functions.

First, the new declaration syntax:

```javascript
function *foo() {
    // ..
}
```

Notice the `*` there? That's new and a bit strange looking. To those from some other languages, it may look an awful lot（经常） like a function return-value pointer. But don't get confused! This is just a way to signal the special generator function type.

You've probably seen other articles/documentation which use `function* foo(){ }`instead of `function *foo(){ }` (difference in placement of the `*`). Both are valid, but I've recently decided that I think `function *foo() { }` is more accurate, so that's what I'm using here.

Now, let's talk about the contents of our generator functions. Generator functions are just normal JS functions in most respects. There's very little new syntax to learn *inside* the generator function.

The main new toy we have to play with, as mentioned above, is the `yield` keyword. `yield ___` is called a "yield expression" (and not a statement) because when we restart the generator, we will send a value back in, and whatever we send in will be the computed result of that `yield ___` expression.

Example:

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