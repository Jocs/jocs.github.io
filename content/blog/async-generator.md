---
external: false
title: "通过ES6 Generator函数实现异步操作"
description: "通过ES6 Generator函数实现异步操作."
date: 2017-08-19
---

> 本文翻译自 [Going Async With ES6 Generators](https://davidwalsh.name/async-generators)
>
> 由于个人能力知识有限，翻译过程中难免有纰漏和错误，还望指正

#### ES6 Generators：完整系列

1. [The Basics Of ES6 Generators](https://davidwalsh.name/es6-generators)
2. [Diving Deeper With ES6 Generators](https://davidwalsh.name/es6-generators-dive)
3. [Going Async With ES6 Generators](https://davidwalsh.name/async-generators)
4. [Getting Concurrent With ES6 Generators](https://davidwalsh.name/concurrent-generators)

到目前为止，你已经对[ES6 generators](https://davidwalsh.name/es6-generators/)有了初步了解并且能够[方便的使用它](https://davidwalsh.name/es6-generators-dive/)，是时候准备将其运用到真实项目中提高现有代码质量。

Generator函数的强大在于**允许你通过一些实现细节来将异步过程隐藏起来，**依然使代码保持一个单线程、同步语法的代码风格。这样的语法使得我们能够很自然的方式表达我们程序的步骤/语句流程，而不需要同时去操作一些异步的语法格式。

换句话说，我们很好的对代码的功能/关注点进行了分离：通过将使用（消费）值得地方（generator函数中的逻辑）和通过异步流程来获取值（generator迭代器的`next()`方法）进行了有效的分离。

结果就是？不仅我们的代码具有强大的异步能力， 同时又保持了可读性和可维护性的同步语法的代码风格。

那么我们怎么实现这些功能呢？

#### 最简单的异步实现

最简单的情况，generator函数不需要额外的代码来处理异步功能，因为你的程序也不需要这样做。

例如，让我们假象你已经写下了如下代码：

```javascript
function makeAjaxCall(url,cb) {
    // do some ajax fun
    // call `cb(result)` when complete
}

makeAjaxCall( "http://some.url.1", function(result1){
    var data = JSON.parse( result1 );

    makeAjaxCall( "http://some.url.2/?id=" + data.id, function(result2){
        var resp = JSON.parse( result2 );
        console.log( "The value you asked for: " + resp.value );
    });
} );
```

通过generator函数（不带任何其他装饰）来实现和上面代码相同的功能，实现代码如下：

```javascript
function request(url) {
    // this is where we're hiding the asynchronicity,
    // away from the main code of our generator
    // `it.next(..)` is the generator's iterator-resume
    // call
    makeAjaxCall( url, function(response){
        it.next( response );
    } );
    // Note: nothing returned here!
}

function *main() {
    var result1 = yield request( "http://some.url.1" );
    var data = JSON.parse( result1 );

    var result2 = yield request( "http://some.url.2?id=" + data.id );
    var resp = JSON.parse( result2 );
    console.log( "The value you asked for: " + resp.value );
}

var it = main();
it.next(); // get it all started
```

让我来解释下上面代码是如何工作的。

`request(..)`帮助函数主要对普通的`makeAjaxCall(..)`实用函数进行包装，保证在在其回调函数中调用generator迭代器的`next(..)`方法。

在调用`request(..)`的过程中，你可能已经发现函数并没有显式的返回值（换句话说，其返回`undefined`）。这没有什么大不了的，但是与本文后面的方法相比，返回值就显得比较重要了。这儿我们生效的`yield undefined`。

当我们代码执行到`yield..`时（`yield`表达式返回`undefined`值），我们仅仅在这一点暂停了我们的generator函数而没有做其他任何事。等待着`it.next(..)`方法的执行来重新启动该generator函数，而`it.next()`方法是在Ajax获取数据结束后的回调函数（推入异步队列等待执行）中执行的。

我们对`yield..`表达式的结果做了什么呢？我们将其结果赋值给了变量`result1`。那么我们是怎么将Ajax请求结果放到该`yield..`表达式的返回值中的呢？

因为当我们在Ajax的回调函数中调用`it.next(..)`方法的时候，我们将Ajax的返回值作为参数传递给`next(..)`方法，这意味着该Ajax返回值传递到了generator函数内部，当前函数内部暂停的位置，也就是`result1 = yield..`语句中部。

上面的代码真的很酷并且强大。本质上，`result1 = yield request(..)`的**作用是用来请求值**，但是请求的过程几乎完全对我们不可见- -或者至少在此处我们不用怎么担心它 - - 因为底层的实现使得该步骤成为了异步操作。generator函数通过通过在`yield`表达式中隐藏的暂停功能以及将重新启动generator函数的功能分离到另外一个函数中，来实现了异步操作。因此在主要代码中我们通过一个**同步的代码风格来请求值**。

第二句`result2 = yield result()`（译者注：作者的笔误，应该是`result2 = yield request(..)`）代码，和上面的代码工作原理几乎无异：通过明显的暂停和重新启动机制来获取到我们请求的数据，而在generator函数内部我们不用再为一些异步代码细节为烦恼。

当然，`yield`的出现，也就微妙的暗示一些神奇（啊！异步）的事情*可能*在此处发生。和嵌套回调函数带来的回调地狱相比，`yield`在语法层面上优于回调函数（甚至在API上优于promise的链式调用）。

需要注意上面我说的是“可能”。generator函数完成上面的工作，这本身就是一件非常强大的事情。上面的程序始终发送一个异步的Ajax请求，假如不发送异步Ajax请求呢？倘若我们改变我们的程序来从缓存中获取到先前（或者预先请求）Ajax请求的结果？或者从我们的URL路由中获取数据来立刻`fulfill`Ajax请求，而不用真正的向后端请求数据。

我们可以改变我们的`request(..)`函数来满足上面的需求，如下：

```javascript
var cache = {};

function request(url) {
    if (cache[url]) {
        // "defer" cached response long enough for current
        // execution thread to complete
        setTimeout( function(){
            it.next( cache[url] );
        }, 0 );
    }
    else {
        makeAjaxCall( url, function(resp){
            cache[url] = resp;
            it.next( resp );
        } );
    }
}
```

**注意：**在上面的代码中我们使用了一个细微的技巧`setTimeout(..0)`，当从缓存中获取结果时来延迟代码的执行。如果我们不延迟而是立即执行`it.next(..)`方法，这将会导致错误的发生，因为（这就是技巧所在）此时generator函数还没有停止执行。首先我们执行`request(..)`函数，然后通过`yield`来暂停generator函数。因此不能够在`request(..)`函数中立即调用`it.next(..)`方法，因为在此时，generator函数依然在运行（`yield` 还没有被调用）。但是我们可以在当前线程运行结束后，立即执行`it.next(..)`。这就是`setTimeout(..0)`将要完成的工作。**在文章后面我们将看到一个更加完美的解答。**

现在，我们generator函数内部主要代码依然如下：

```javascript
var result1 = yield request( "http://some.url.1" );
var data = JSON.parse( result1 );
..
```

**看到没！？**当我们代码从没有缓存到上面有缓存的版本，我们generator函数内部逻辑（我们的控制流程）竟然没有变化。

`*main()`函数内部代码依然是请求数据，暂停generator函数的执行来等待数据的返回，数据传回后继续执行。在我们当前场景中，这个`暂停`可能相对比较长（真实的向服务器发送请求，这可能会耗时300~800ms）或者几乎立即执行（使用`setTimeout(..0)`手段延迟执行）。但是我们`*main`函数中的控制流程不用关心数据从何而来。

这就是**从实现细节中将异步流程分离出来**的强大力量。

#### 更好的异步编程

利用上面提及的方法（回调函数），generators函数能够完成一些简单的异步工作。但是却相当局限，因此我们需要一个更加强大的异步机制来与我们的generator函数匹配结合。完成一些更加繁重的异步流程。什么异步机制呢？**Promises**。

如果你依然对ES6 Promises感到困惑，我写过关于Promise的[系列文章](http://blog.getify.com/promises-part-1/)。去阅读一下。我会等待你回来，<滴答，滴答>。老掉牙的异步笑话了。

先前的Ajax代码例子依然存在[反转控制](http://blog.getify.com/promises-part-2/)的问题（啊，回调地狱）正如文章最初的嵌套回调函数例子一样。到目前为止，我们应该已经明显察觉到了上面的例子存在一些待完善的地方：

1. 到目前为止没有明确的错误处理机制，正如我们[上一篇学习的文章](https://davidwalsh.name/es6-generators-dive/#error-handling)，在发送Ajax请求的过程中我们可能检测到错误（在某处），通过`it.throw(..)`方法将错误传递会generator函数，然后在generator函数内部通过`try..catch`模块来处理该错误。但是，我们在“后面”将要手动处理更多工作（更多的代码来处理我们的generator迭代器），如果在我们的程序中多次使用generators函数，这些错误处理代码很难被复用。
2. 如果`makeAjaxCall(..)`工具函数不受我们控制，碰巧它多次调用了回调函数，或者同时将成功值或者错误返回到generator函数中，等等。我们的generator函数就将变得极难控制（未捕获的错误，意外的返回值等）。处理、阻止上述问题的发生很多都是一些重复的工作，同时也都不是轻轻松松能够完成的。
3. 很多时候我们需要同时并行处理多个任务（例如两个并行的Ajax请求）。由于generator函数中的`yield`表达式执行后都会暂停函数的执行，不能够同时运行两个或多个`yield`表达式，也就是说`yield`表达式只能按顺序一个接一个的运行。因此在没有大量手写代码的前提下，一个`yield`表达式中同时执行多个任务依然不太明朗。

正如你所见，上面的所有问题都*可以被解决*，但是又有谁愿意每次重复手写这些代码呢？我们需要一种更加强大的模式，该模式是可信赖且高度复用的，并且能够很好的解决generator函数处理异步流程问题。

什么模式？**yield 表达式内部是promise**，当这些promise被fulfill后重新启动generator函数。

回忆上面代码，我们使用`yield request(..)`，但是`request(..)`工具函数并没有返回任何值，那么它仅仅`yield undefined`吗?

让我们稍微调整下上面的代码。我们把`request(..)`函数改为以promise为基础的函数，因此该函数返回一个promise，现在我们通过`yield`表达式**返回了一个真实的promise**（而不是`undefined`）。

```javascript
function request(url) {
    // Note: returning a promise now!
    return new Promise( function(resolve,reject){
        makeAjaxCall( url, resolve );
    } );
}
```

`request(..)`函数通过构建一个promise来监听Ajax的完成并且resolve返回值，并且返回该promise，因此promise也能够被`yield`传递到generator函数外部，接下来呢？

我们需要一个工具函数来控制generator函数的迭代器，该工具函数接收`yield`表达式传递出来的promise，然后在promie 状态转为fulfill或者reject时，通过迭代器的`next(..)`方法重新启动generator函数。现在我为这个工具函数取名`runGenerator(..)`:

```javascript
// run (async) a generator to completion
// Note: simplified approach: no error handling here
function runGenerator(g) {
    var it = g(), ret;

    // asynchronously iterate over generator
    (function iterate(val){
        ret = it.next( val );

        if (!ret.done) {
            // poor man's "is it a promise?" test
            if ("then" in ret.value) {
                // wait on the promise
                ret.value.then( iterate );
            }
            // immediate value: just send right back in
            else {
                // avoid synchronous recursion
                setTimeout( function(){
                    iterate( ret.value );
                }, 0 );
            }
        }
    })();
}
```

需要注意的关键点：

1. 我们自动的初始化了generator函数（创建了`it`迭代器），然后我们异步运行`it`来完成generator函数的执行（`done: true`）。
2. 我们寻找被`yield`表达式传递出来的promise（啊，也就是执行`it.next(..)`方法后返回的对象中的`value`字段）。如此，我们通过在promise的`then(..)`方法中注册函数来监听器完成。
3. 如果一个非promise值被传递出来，我们仅仅将该值原样返回到generator函数内部，因此看上去立即重新启动了generator函数。

现在我们怎么使用它呢？

```javascript
runGenerator( function *main(){
    var result1 = yield request( "http://some.url.1" );
    var data = JSON.parse( result1 );

    var result2 = yield request( "http://some.url.2?id=" + data.id );
    var resp = JSON.parse( result2 );
    console.log( "The value you asked for: " + resp.value );
} );
```

骗人！等等...上面代码**和更早的代码几乎完全一样？**哈哈，generator函数再次向我们炫耀了它的强大之处。实际上我们创建了promise，通过`yield`将其传递出去，然后重新启动generator函数，直到函数执行完成- - **所有被''隐藏''的实现细节！**实际上并没有隐藏起来，只是和我们消费该异步流程的代码（generator中的控制流程）隔离开来了。

通过等待`yield`出去的promise的完成，然后将fulfill的值通过`it.next(..)`方法传递回函数中，`result1 = yield request(..)`表达式就回获取到正如先前一样的请求值。

但是现在我们通过promises来管理generator代码的异步流程部分，我们解决了回调函数所带来的反转控制等问题。通过generator+promises的模式我们“免费”解决上述所遇到的问题：

1. 现在我们用易用的内部错误处理机制。在`runGenerator(..)`函数中我们并没有提及，但是监听promise的错误并非难事，我们只需通过`it.throw(..)`方法将promise捕获的错误抛进generator函数内部，在函数内部通过`try...catch`模块进行错误捕获及处理。

2. promise给我们提供了[可控性/可依赖性](http://blog.getify.com/promises-part-2/#uninversion)。不用担心，也不用疑惑。

3. Promises拥有一些强大的抽象工具方法，利用这些方法可以自动处理一些复杂的“并行”任务等。

   例如，`yield Prmise.all([ .. ])`可以接受一个promise数组然后“并行”执行这些任务，然后`yield`出去一个单独的promise（给generator函数处理），该promise将会等待所有并行的promise都完成后才被完成，你可以通过`yield`表达式的返回数组（当promise完成后）来获取到所有并行promise的结果。数组中的结果和并行promises任务一一对应（因此其完全忽略promise完成的顺序）。

首先，让我们研究下错误处理：

```javascript
// assume: `makeAjaxCall(..)` now expects an "error-first style" callback (omitted for brevity)
// assume: `runGenerator(..)` now also handles error handling (omitted for brevity)

function request(url) {
    return new Promise( function(resolve,reject){
        // pass an error-first style callback
        makeAjaxCall( url, function(err,text){
            if (err) reject( err );
            else resolve( text );
        } );
    } );
}

runGenerator( function *main(){
    try {
        var result1 = yield request( "http://some.url.1" );
    }
    catch (err) {
        console.log( "Error: " + err );
        return;
    }
    var data = JSON.parse( result1 );

    try {
        var result2 = yield request( "http://some.url.2?id=" + data.id );
    } catch (err) {
        console.log( "Error: " + err );
        return;
    }
    var resp = JSON.parse( result2 );
    console.log( "The value you asked for: " + resp.value );
} );
```

当再URL 请求发出后一个promise被reject后（或者其他的错误或异常），这个promise的reject值将会映射到一个generator函数错误（通过`runGenerator(..)`内部隐式的`it.throw(..)`来传递错误），该错误将会被`try..catch`模块捕获。

现在，让我们看一个通过promises来管理更加错综复杂的异步流程的事例：

```javascript
function request(url) {
    return new Promise( function(resolve,reject){
        makeAjaxCall( url, resolve );
    } )
    // do some post-processing on the returned text
    .then( function(text){
        // did we just get a (redirect) URL back?
        if (/^https?:\/\/.+/.test( text )) {
            // make another sub-request to the new URL
            return request( text );
        }
        // otherwise, assume text is what we expected to get back
        else {
            return text;
        }
    } );
}

runGenerator( function *main(){
    var search_terms = yield Promise.all( [
        request( "http://some.url.1" ),
        request( "http://some.url.2" ),
        request( "http://some.url.3" )
    ] );

    var search_results = yield request(
        "http://some.url.4?search=" + search_terms.join( "+" )
    );
    var resp = JSON.parse( search_results );

    console.log( "Search results: " + resp.value );
} );
```

`Promise.all([ .. ])`会构建一个新的promise来等待其内部的三个并行promise的完成，该新的promise将会被`yield`表达式传递到外部给`runGenerator(..)`工具函数中，`runGenerator()`函数监听该新生成的promise的完成，以便重新启动generator函数。并行的promise的返回值可能会成为另外一个URL的组成部分，然后通过`yield`表达式将另外一个promise传递到外部。关于更多的promise链式调用，参见[文章](http://blog.getify.com/promises-part-5/#the-chains-that-bind-us)

promise可以处理任何复杂的异步过程，你可以通过generator函数`yield`出去promises（或者promise返回promise）来获取到同步代码的语法形式。（对于promise或者generator两个ES6的新特性，他们的结合或许是最好的模式）

#### `runGenerator(..)`: 实用函数库

在上面我们已经定义了`runGenerator(..)`工具函数来顺利帮助我们充分发挥generator+promise模式的卓越能力。我们甚至省略了（为了简略起见）该工具函数的完整实现，在错误处理方面依然有些细微细节我们需要处理。

但是，你不愿意实现一个你自己的`runGenerator(..)`是吗？

我不这么认为。

许多promise/async库都提供了上述工具函数。在此我不会一一论述，但是你一个查阅`Q.spawn(..)`和`co(..)`库，等等。

但是我会简要的阐述我自己的库[asynquence](http://github.com/getify/asynquence)中的[`runner(..)`插件](https://github.com/getify/asynquence/tree/master/contrib#runner-plugin)，相对于其他库，我想提供一些独一无二的特性。如果对此感兴趣并想学习更多关于`asynquence`的知识而不是浅尝辄止，可以看看以前的两篇文章[深入asynquence](https://davidwalsh.name/asynquence-part-1/)

首先，*asynquence*提供了自动处理上面代码片段中的”error-first-style“回调函数的工具函数：

```javascript
function request(url) {
    return ASQ( function(done){
        // pass an error-first style callback
        makeAjaxCall( url, done.errfcb );
    } );
}
```

是不是看起来**更加**好看，不是吗！？

接下来，*asynquence*提供了`runner(..)`插件来在异步序列（异步流程）中执行generator函数，因此你可以在`runner`前面的步骤传递信息到generator函数内，同时generator函数也可以传递消息出去到下一个步骤中，同时如你所愿，所有的错误都自动冒泡被最后的`or`所捕获。

```javascript
// first call `getSomeValues()` which produces a sequence/promise,
// then chain off that sequence for more async steps
getSomeValues()

// now use a generator to process the retrieved values
.runner( function*(token){
    // token.messages will be prefilled with any messages
    // from the previous step
    var value1 = token.messages[0];
    var value2 = token.messages[1];
    var value3 = token.messages[2];

    // make all 3 Ajax requests in parallel, wait for
    // all of them to finish (in whatever order)
    // Note: `ASQ().all(..)` is like `Promise.all(..)`
    var msgs = yield ASQ().all(
        request( "http://some.url.1?v=" + value1 ),
        request( "http://some.url.2?v=" + value2 ),
        request( "http://some.url.3?v=" + value3 )
    );

    // send this message onto the next step
    yield (msgs[0] + msgs[1] + msgs[2]);
} )

// now, send the final result of previous generator
// off to another request
.seq( function(msg){
    return request( "http://some.url.4?msg=" + msg );
} )

// now we're finally all done!
.val( function(result){
    console.log( result ); // success, all done!
} )

// or, we had some error!
.or( function(err) {
    console.log( "Error: " + err );
} );
```

asyquence的`runner(..)`工具接受上一步序列传递下来的值（也有可能没有值）来启动generator函数，可以通过`token.messages`数组来获取到传入的值。

然后，和上面我们所描述的`runGenerator(..)`工具函数类似，`runner(..)`也会监听`yield`一个promise或者`yield`一个*asynquence*序列（在本例中，是指通过`ASQ().all()`方法生成的”并行”任务），然后等待promise或者asynquence序列的完成后重新启动generator函数。

当generator函数执行完成后，最后通过`yield`表达式传递的值将作为参数传递到下一个序列步骤中。

最后，如果在某个序列步骤中出现错误，甚至在generator内部，错误都会冒泡到被注册的`or(..)`方法中进行错误处理。

*asynquence*通过尽可能简单的方式来混合匹配promises和generator。你可以自由的在以promise为基础的序列流程后面接generator控制流程，正如上面代码。

#### ES7 `async`

在ES7的时间轴上有一个提案，并且有极大可能被接受，该提案将在JavaScript中添加另外一个函数类型：`async`函数，该函数相当于用类似于`runGenerator(..)`（或者asynquence的`runner(..)`）工具函数在generator函数外部包装一下，来使得其自动执行。通过async函数，你可以把promises传递到外部然后async函数在promises状态变为fulfill时自动重新启动直到函数执行完成。（甚至不需要复杂的迭代器参与）

async函数大概形式如下：

```javascript
async function main() {
    var result1 = await request( "http://some.url.1" );
    var data = JSON.parse( result1 );

    var result2 = await request( "http://some.url.2?id=" + data.id );
    var resp = JSON.parse( result2 );
    console.log( "The value you asked for: " + resp.value );
}

main();
```

正如你所见，`async 函数`可以想普通函数一样被调用（如`main()`），而不需要包装函数如`runGenerator(..)`或者`ASQ().runner(..)`的帮助。同时，函数内部不再使用`yield`，而是使用`await`（另外一个JavaScript关键字）关键字来告诉`async 函数`等待当前promise得到返回值后继续执行。

基本上，async函数拥有通过一些包装库调用generator函数的大部分功能，同时关键是其被**原生语法所支持**。

是不是很酷！？

同时，像*asynquence*这样的工具集使得我们能够轻易的且充分利用generator函数完成异步工作。

#### 总结

简单地说：通过把promise和generator函数两个世界组合起来成为`generator + yield promise(s)`模式，该模式具有强大的能力及同步语法形式的异步表达能力。通过一些简单包装的工具（很多库已经提供了这些工具），我们可以让generator函数自动执行完成，并且提供了健全和同步语法形式的错误处理机制。

同时在ES7+的将来，我们也许将迎来`async function`函数，async 函数将不需要上面那些工具库就能够解决上面遇到的那些问题（至少对于基础问题是可行的）！

**JavaScript的异步处理机制的未来是光明的**，而且会越来越光明！我要带墨镜了。（译者注：这儿是作者幽默的说法）

但是，我们并没有在这儿就结束本系列文章，这儿还有最后一个方面我们想要研究：

倘若你想要将两个或多个generator函数结合在一起，让他们独立平行的运行，并且在它们执行的过程中来来回回得传递信息？这一定会成为一个相当强大的特性，难道不是吗？这一模式被称作“CSP”(communicating sequential processes)。我们将在下面一篇文章中解锁CSP的能力。敬请密切关注。