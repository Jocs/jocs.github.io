### Diving Deeper With ES6 Generators

### ES6 Generators: Complete Series

1. [The Basics Of ES6 Generators](https://davidwalsh.name/es6-generators)
2. [Diving Deeper With ES6 Generators](https://davidwalsh.name/es6-generators-dive)
3. [Going Async With ES6 Generators](https://davidwalsh.name/async-generators)
4. [Getting Concurrent With ES6 Generators](https://davidwalsh.name/concurrent-generators)

If you're still unfamiliar with ES6 generators, first go read and play around with the code in ["Part 1: The Basics Of ES6 Generators"](https://davidwalsh.name/es6-generators). Once you think you've got the basics down, now we can dive into some of the deeper details.

## Error Handling

One of the most powerful parts of the ES6 generators design is that the semantics of the code inside a generator are **synchronous**, even if the external iteration control proceeds asynchronously.

That's a fancy/complicated way of saying that you can use simple error handling techniques that you're probably very familiar with -- namely the `try..catch`mechanism.

For example:

```
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

But, how exactly would an error get sent back into this generator?

```
var it = foo();

var res = it.next(); // { value:3, done:false }

// instead of resuming normally with another `next(..)` call,
// let's throw a wrench (an error) into the gears:
it.throw( "Oops!" ); // Error: Oops!
```

Here, you can see we use another method on the iterator -- `throw(..)` -- which "throws" an error into the generator as if it had occurred at the exact point where the generator is currently `yield`-paused. The `try..catch` catches that error just like you'd expect!

**Note:** If you `throw(..)` an error into a generator, but no `try..catch` catches it, the error will (just like normal) propagate right back out (and if not caught eventually end up as an unhandled rejection). So:

```
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

```
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

Another thing you may find yourself wanting to do is call another generator from inside of your generator function. I don't just mean instantiating a generator in the normal way, but actually *delegating* your own iteration control *to* that other generator. To do so, we use a variation of the `yield` keyword: `yield *` ("yield star").

Example:

```
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

Let's break down how this works. The `yield 1` and `yield 2` send their values directly out to the `for..of` loop's (hidden) calls of `next()`, as we already understand and expect.

But then `yield*` is encountered, and you'll notice that we're yielding to another generator by actually instantiating it (`foo()`). So we're basically yielding/delegating to another generator's iterator -- probably the most accurate way to think about it.

Once `yield*` has delegated (temporarily) from `*bar()` to `*foo()`, now the `for..of` loop's `next()` calls are actually controlling `foo()`, thus the `yield 3`and `yield 4` send their values all the way back out to the `for..of` loop.

Once `*foo()` is finished, control returns back to the original generator, which finally calls the `yield 5`.

For simplicity, this example only `yield`s values out. But of course, if you don't use a `for..of` loop, but just manually call the iterator's `next(..)` and pass in messages, those messages will pass through the `yield*` delegation in the same expected manner:

```
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

Another "trick" that `yield*` can do is receive a `return`ed value from the delegated generator.

```
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

That's an interesting distinction between `yield` and `yield*`: with `yield`expressions, the result is whatever is sent in with the subsequent `next(..)`, but with the `yield*` expression, it receives its result only from the delegated generator's `return` value (since `next(..)` sent values pass through the delegation transparently).

You can also do error handling (see above) in both directions across a `yield*`delegation:

```
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

## Summary

Generators have synchronous execution semantics, which means you can use the `try..catch` error handling mechanism across a `yield` statement. The generator iterator also has a `throw(..)` method to throw an error into the generator at its paused position, which can of course also be caught by a `try..catch` inside the generator.

`yield*` allows you to delegate the iteration control from the current generator to another one. The result is that `yield*` acts as a pass-through in both directions, both for messages as well as errors.

But, one fundamental question remains unanswered so far: how do generators help us with async code patterns? Everything we've seen so far in these two articles is synchronous iteration of generator functions.

The key will be to construct a mechanism where the generator pauses to start an async task, and then resumes (via its iterator's `next()` call) at the end of the async task. We will explore various ways of going about creating such asynchronicity-control with generators in the next article. Stay tuned!