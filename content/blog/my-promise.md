---
external: false
title: "ES6 实现自己的 Promise"
description: "实现一个简单的 Promise."
date: 2016-09-22
---

### 一、JavaScript异步编程背景

​ 从去年ES2015发布至今，已经过去了一年多，ES2015发布的新的语言特性中最为流行的也就莫过于Promise了，Promise使得如今JavaScript异步编程如此轻松惬意，甚至慢慢遗忘了曾经那不堪回首的痛楚。其实从JavaScript诞生，JavaScript中的异步编程就已经出现，例如点击鼠标、敲击键盘这些事件的处理函数都是异步的，时间到了2009年，Node.js横空出世，在整个Node.js的实现中，将回调模式的异步编程机制发挥的淋漓尽致，Node的流行也是的越来越多的JavaScripter开始了异步编程，但是回调模式的副作用也慢慢展现在人们眼前，错误处理不够优雅以及嵌套回调带来的“回调地狱”。这些副作用使得人们从回调模式的温柔乡中慢慢清醒过来，开始寻找更为优雅的异步编程模式，_路漫漫其修远兮、吾将上下而求索_。时间到了2015年，Promise拯救那些苦苦探索的先驱。行使它历史使命的时代似乎已经到来。

​ 每个事物的诞生有他的历史使命，更有其历史成因，促进其被那些探索的先驱们所发现。了解nodejs或者熟悉浏览器的人都知道，JavaScript引擎是基于事件循环或单线程这两个特性的。更为甚者在浏览器中，更新UI(也就是浏览器重绘、重拍页面布局)和执行JavaScript代码也在一个单线程中，可想而知，一个线程就相当于只有一条马路，如果一辆马车抛锚在路上了阻塞了马路，那么别的马车也就拥堵在了那儿，这个单线程容易被阻塞是一个道理，单线程也只能允许某一时间点只能够执行一段代码。同时，JavaScript没有想它的哥哥姐姐们那么财大气粗，像Java或者C++，一个线程不够，那么再加一个线程，这样就能够同时执行多段代码了，但是这样就会带来的隐患就是状态不容易维护，JavaScript选择了单线程非阻塞式的方式，也就是异步编程的方式，就像上面的马车抛锚在了路上，那么把马车推到路边的维修站，让其他马车先过去，等马车修好了再回到马路上继续行驶，这就是单线程非阻塞方式。正如Promise的工作方式一样，通过Promise去向服务器发起一个请求，毕竟请求有网络开销，不可能马上就返回请求结果的，这个时候Promise就处于pending状态，但是其并不会阻塞其他代码的执行，当请求返回时，修改Promise状态为fulfilled或者rejected（失败请求）。同时执行绑定到这两个状态上面的“处理函数”。这就是异步编程的模式，也就是Promise兢兢业业的工作方式，在下面一个部分将详细讨论Promise。
### 二、Promise基础

​ 怎么一句话解释Promise呢？**Promise可以代指那些尚未完成的一些操作，但是其在未来的某个时间会返回某一特定的结果。** 

​ 当创建一个Promise实例后，其代表一个未知的值，在将来的某个时间会返回一个成功的返回值，或者失败的返回值，我们可以为这些返回值添加处理函数，当值返回时，处理函数被调用。Promise总是处于下面三种状态之一：
- _pending_： Promise的初始状态，也就是未被fulfilled或者rejected的状态。
- _fulfilled_： 意味着promise代指的操作已经成功完成。
- _rejected_：意味着promise代指的操作由于某些原因失败。

一个处于pending状态的promise可能由于某个成功返回值而发展为fulfilled状态，也有可能因为某些错误而进入rejected状态，无论是进入fulfilled状态或者rejected状态，绑定到这两种状态上面的处理函数就会被执行。并且进入fulfilled或者rejected状态也就不能再返回pending状态了。

​  ![](http://content-management.b0.upaiyun.com/1474508952985.png)
### 三、边学边写

上面说了那么多，其实都是铺垫。接下来我们就开始实现自己的Promise对象。go go go！！！
##### 第一步：Promise构造函数

Promise有三种状态，pending、fulfilled、rejected。

``` javascript
const PENDING = 'PENDING' // Promise 的 初始状态
const FULFILLED = 'FULFILLED' // Promise 成功返回后的状态
const REJECTED = 'REJECTED' // Promise 失败后的状态
```

有了三种状态后，那么我们怎么创建一个Promise实例呢？

> const promise = new Promise(executor) // 创建Promise的语法

通过上面生成promise语法我们知道，Promise实例是调用Promise构造函数通过new操作符生成的。这个构造函数我们可以先这样写：

``` javascript
class Promise {
    constructor(executor) {
        this.status = PENDING // 创建一个promise时，首先进行状态初始化。pending
        this.result = undefined // result属性用来缓存promise的返回结果，可以是成功的返回结果，或失败的返回结果
    }
}
```

我们可以看到上面构造函数接受的参数executor。它是一个函数，并且接受其他两个函数（resolve和reject）作为参数，当resolve函数调用后，promise的状态转化为fulfilled，并且执行成功返回的处理函数（不用着急后面会说到怎么添加处理函数）。当reject函数调用后，promise状态转化为rejected，并且执行失败返回的处理函数。

现在我们的代码大概是这样的：

``` javascript
class Promise {
    constructor(executor) {
        this.status = PENDING 
        this.result = undefined
        executor(data => resolveProvider(this, data), err => rejectProvider(this, err))
    }
}

function resolveProvider(promise, data) {
    if (promise.status !== PENDING) return false
    promise.status = FULFILLED
}
function rejectProvider(promise, data) {
    if (promise.status !== PENDING) return false
    promise.status = FULFILLED
}
```

Dont Repeat Yourselt！！！我们可以看到上面代码后面两个函数基本相同，其实我们可以把它整合成一个函数，在结合高阶函数的使用。

``` javascript
const statusProvider = (promise, status) => data => {
    if (promise.status !== PENDING) return false
    promise.status = status
    promise.result = data
}
class Promise {
    constructor(executor) {
        this.status = PENDING 
        this.result = undefined
        executor(statusProvider(this, FULFILLED), statusProvider(this, REJECTED))
    }
}
```

现在我们的代码就看上去简洁多了。
##### 第二步：为Promise添加处理函数

其实通过 `new Promise(executor)`已经可以生成一个Promise实例了，甚至我们可以通过传递到executor中的resolve和reject方法来改变promise状态，但是！现在的promise依然没啥卵用！！！因为我们并没有给它添加成功和失败返回的处理函数。

首先我们需要给我们的promise增加两个属性，successListener和failureListener用来分别缓存成功处理函数和失败处理函数。

``` javascript
class Promise {
    constructor(executor) {
        this.status = PENDING
         this.successListener = []
         this.failureListener = []
        this.result = undefined
        executor(statusProvider(this, FULFILLED), statusProvider(this, REJECTED))
    }
}
```

怎么添加处理函数呢？ECMASCRIPT标准中说到，我们可以通过promise原型上面的then方法为promise添加成功处理函数和失败处理函数，可以通过catch方法为promise添加失败处理函数。

``` javascript
const statusProvider = (promise, status) => data => {
    if (promise.status !== PENDING) return false
    promise.status = status
    promise.result = data
    switch(status) {
        case FULFILLED: return promise.successListener.forEach(fn => fn(data))
        case REJECTED: return promise.failurelistener.forEach(fn => fn(data))
    }
}
class Promise {
    constructor(executor) {
        this.status = PENDING
        this.successListener = []
        this.failurelistener = []
        this.result = undefined
        executor(statusProvider(this, FULFILLED), statusProvider(this, REJECTED))
    }
    /**
     * Promise原型上面的方法
     */
    then(...args) {
        switch (this.status) {
            case PENDING: {
                this.successListener.push(args[0])
                this.failurelistener.push(args[1])
                break
            }
            case FULFILLED: {
                args[0](this.result)
                break
            }
            case REJECTED: {
                args[1](this.result)
            }
        }
    }
    catch(arg) {
        return this.then(undefined, arg)
    }
}
```

我们现在的Promise基本初具雏形了。甚至可以运用到一些简单的场景中了。举个例子。

``` javascript
/*创建一个延时resolve的pormise*/
new Promise((resolve, reject) => {setTimeout(() => resolve(5), 2000)}).then(data => console.log(data)) // 5
/*创建一个及时resolve的promise*/
new Promise((resolve, reject) => resolve(5)).then(data => console.log(data)) // 5
/*链式调用then方法还不能够使用！*/
new Promise(resolve=> resolve(5)).then(data => data).then(data => console.log(data))
// Uncaught TypeError: Cannot read property 'then' of undefined
```
##### 第三步：Promise的链式调用

Promise需要实现链式调用，我们需要再次回顾下then方法的定义：

> then方法为pormise添加成功和失败的处理函数，同时then方法返回一个新的promise对象，这个新的promise对象resolve处理函数的返回值，或者当没有提供处理函数时直接resolve原始的值。

可以看出，promise能够链式调用归功于then方法返回一个全新的promise，并且resolve处理函数的返回值，当然，如果then方法的处理函数本身就返回一个promise，那么久不用我们自己手动生成一个promise了。了解了这些，就开始动手写代码了。

``` javascript
const isPromise = object => object && object.then && typeof object.then === 'function'
const noop = () => {}

const statusProvider = (promise, status) => data => {
    // 同上面代码
}

class Promise {
    constructor(executor) {
        // 同上面代码
    }
    then(...args) {
        const child = new this.constructor(noop)

        const handler = fn => data => {
            if (typeof fn === 'function') {
                const result = fn(data)
                if (isPromise(result)) {
                    const successHandler = child.successListener[0]
		    const errorHandler = child.failureListener[0]
		    result
		    .then(successHandler, errorHandler)
                } else {
                    statusProvider(child, FULFILLED)(result)
                }   
            } else if(!fn) {
                statusProvider(child, this.status)(data)
            }
        }
        switch (this.status) {
            case PENDING: {
                this.successListener.push(handler(args[0]))
                this.failureListener.push(handler(args[1]))
                break
            }
            case FULFILLED: {
                handler(args[0])(this.result)
                break
            }
            case REJECTED: {
                handler(args[1])(this.result)
                break
            }
        }
        return child
    }
    catch(arg) {
        return this.then(undefined, arg)
    }
}
```

​ 首先我们写了一个isPromise方法，用于判断一个对象是否是promise。就是判断对象是否有一个`then`方法，**免责声明**为了实现上的简单，我们不区分thenable和promise的区别，但是我们应该是知道。所有的promise都是thenable的，而并不是所有的thenable对象都是promise。（thenable对象是指带有一个then方法的对象，该then方法其实就是一个executor。）isPromise的作用就是用于判断then方法返回值是否是一个promise，如果是promise，就直接返回该promise，如果不是，就新生成一个promise并返回该promise。

​ 由于需要链式调用，我们对successListener和failureListener中处理函数进行了重写，并不是直接push进去then方法接受的参数函数了，因为then方法需要返回一个promise，所以当then方法里面的处理函数被执行的同时，我们也需要对then方法返回的这个promise进行处理，要么resolve，要么reject掉。当然，大部分情况都是需要resolve掉的，只有当then方法没有添加第二个参数函数，同时调用then方法的promise就是rejected的时候，才需要把then方法返回的pormise进行reject处理，也就是调用`statusProvider(child, REJECTED)(data)`.

toy Promise实现的完整代码：

``` javascript
const PENDING = 'PENDING' // Promise 的 初始状态
const FULFILLED = 'FULFILLED' // Promise 成功返回后的状态
const REJECTED = 'REJECTED' // Promise 失败后的状态

const isPromise = object => object && object.then && typeof object.then === 'function'
const noop = () => {}

const statusProvider = (promise, status) => data => {
    if (promise.status !== PENDING) return false
    promise.status = status
    promise.result = data
    switch(status) {
        case FULFILLED: return promise.successListener.forEach(fn => fn(data))
        case REJECTED: return promise.failureListener.forEach(fn => fn(data))
    }
}

class Promise {
    constructor(executor) {
        this.status = PENDING
        this.successListener = []
        this.failureListener = []
        this.result = undefined 
        executor(statusProvider(this, FULFILLED), statusProvider(this, REJECTED))
    }
    /**
     * Promise原型上面的方法
     */
    then(...args) {
        const child = new this.constructor(noop)

        const handler = fn => data => {
            if (typeof fn === 'function') {
                const result = fn(data)
                if (isPromise(result)) {
                    	const successHandler = child.successListener[0]
			const errorHandler = child.failureListener[0]
			result
			.then(successHandler, errorHandler)
                } else {
                    statusProvider(child, FULFILLED)(result)
                }   
            } else if(!fn) {
                statusProvider(child, this.status)(data)
            }
        }
        switch (this.status) {
            case PENDING: {
                this.successListener.push(handler(args[0]))
                this.failurelistener.push(handler(args[1]))
                break
            }
            case FULFILLED: {
                handler(args[0])(this.result)
                break
            }
            case REJECTED: {
                handler(args[1])(this.result)
                break
            }
        }
        return child
    }
    catch(arg) {
        return this.then(undefined, arg)
    }
}
```
### 四、怎么让我们的toy Promise变强健
1. 在ECMAScript标准中，Promise构造函数上面还提供了一些静态方法，比如`Promise.resolve`、`Promise.reject`、`Promsie.all`、`Promise.race`。当我们有了上面的基础实现后，为我们的toy Promise添加上面这些新的功能一定能让其更加实用。
2. 在我们的基本实现中，我们并没有区分thenable对象，其实`Promise.resolve`和`then`方法都可以接受一个thenable对象，并把该thenable对象转化为一个promise对象，如果想让我们的toy Promise用于生产的话，这也是要考虑的。
3. 为了让我们的toy Promise变得更强壮，我们需要拥有强健的错误处理机制，比如验证executor必须是一个函数、then方法的参数只能是函数或者undefined或null，又比如executor和then方法中抛出的错误并不能够被window.onerror监测到，而只能够通过错误处理函数来处理，这也是需要考虑的因素。
4. 如果我们的Promise polyfill是考虑支持多平台，那么首要考虑的就是浏览器环境或Node.js环境，其实在这两个平台，原生Promise都是支持两个事件的。就拿浏览器端举例：
   - `unhandledrejection`: 在一个事件循环中，如果我们没有对promise返回的错误进行处理，那么就会在window对象上面触发该事件。
   - `rejectionhandled`:如果在一个事件循环后，我们才去对promise返回的错误进行处理，那么就会在window对象上面监听到此事件。
   
   关于这两个事件以及node.js平台上面类似的事件请参考Nicholas C. Zakas新书[<understanding es6>](https://github.com/nzakas/understandinges6)

Promise能够很棒的处理异步编程，要想学好它我认为最好的方法就是亲自动手去实现一个自己的Promise，下面的项目[Jocs/promise](https://github.com/Jocs/promise)是我的实现，欢迎大家pr和star。
