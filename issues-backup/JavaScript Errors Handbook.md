# JavaScript Errors 指南

在README文件中包含了这么多年我对JavaScript errors的学习和理解，包括把错误报告给服务器、在众多bug中根据错误信息追溯产生错误的原因，这些都使得处理JavaScript 错误变得困难。浏览器厂商在处理JavaScript错误方面也有所改进，但是保证应用程序能够稳健地处理JavaScript错误仍然有提升的空间。

关于本手册测测试用例可以从下面这个网站找到：https://mknichel.github.io/javascript-errors/

**目录**

* [Introduction](#introduction)
* [Anatomy of a JavaScript Error](#anatomy-of-a-javascript-error)
  * [Producing a JavaScript Error](#producing-a-javascript-error)
  * [Error Messages](#error-messages)
  * [Stack Trace Format](#stack-trace-format)
* [Catching JavaScript Errors](#catching-javascript-errors)
  * [window.onerror](#windowonerror)
  * [try/catch](#trycatch)
  * [Protected Entry Points](#protected-entry-points)
  * [Promises](#promises)
  * [Web Workers](#web-workers)
  * [Chrome Extensions](#chrome-extensions)

## Introduction

捕获、报告、以及修改错误是维护和保持应用程序健康稳定运行的重要方面。由于Javascript代码主要是在客户端运行、客户端环境又包括了各种各样的浏览器。因此使得消除应用程序中 JS 错误变得相对困难。关于如何报告在不同浏览器中引起的 JS 错误依然也没有一个正式的规范。除此之外，浏览器在报告JS错误也有些bug，这些原因导致了消除应用程序中的JS 错误变得更加困难。这篇文章将会以以上问题作为出发点，分析JS错误的产生、JS错误包含哪些部分、怎么去捕获一个JS错误。期待这篇文章能够帮助到以后的开发者更好的处理JS错误、不同浏览器厂商能够就JS错误找到一个标准的解决方案。

## JavaScript 错误剖析

一个JavaScript 错误由 **错误信息（error message）** 和 **追溯栈(stack trace)** 两个主要部分组成。错误信息是一个字符串用来描述代码出了什么问题。追溯栈用来记录JS错误具体出现在代码中的位置。JS 错误可以通过两种方式产生、要么是浏览器自身在解析JavaScript代码时抛出错误，要么可以通过应用程序代码本身抛出错误。（**译者注：例如可以通过`throw new Error()` 抛出错误）

### 产生一个JavaScript 错误

当JavaScript代码不能够被浏览器正确执行的时候，浏览器就会抛出一个JS错误，或者应用程序代码本身也可以直接抛出一个JS错误。

例如：

``` javascript
var a = 3;
a();
```

在如上例子中，a 变量类型是一个数值，不能够作为一个函数来调用执行。浏览器在解析上面代码时就会抛出如下错误`TypeError: a is not a function` 并通过追溯栈指出代码出错的位置。

开发者也通常在条件语句中当条件不满足的前提下，抛出一个错误，例如：

``` javascript
if (!checkPrecondition()) {
  throw new Error("Doesn't meet precondition!");
}
```

在这种情况下，浏览器控制台中的错误信息如是`Error: Dosen't meet precondition!`. 这条错误也会包含一个追溯栈用来指示代码错误的位置，通过浏览器抛出的错误或是通过应用本身抛出的错误可以通过相同的处理手段来处理。

开发者可以通过不同方式来抛出一个JavaScript 错误：

* `throw new Error('Problem description.')`
* `throw Error('Problem description.')` <-- equivalent to the first one
* `throw 'Problem description.'` <-- bad
* `throw null` <-- even worse

直接通过`throw` 操作符抛出一个字符串错误（**译者注：上面第三种方式）或者或者抛出`null` 这两种方式都是不推荐的，因为浏览器无法就以上两种方式生成追溯栈，也就导致了无法追溯错误在代码中的位置，因为推荐抛出一个Error 对象，Error对象不仅包含一个错误信息，同时也包含一个追溯栈这样你就可以很容易通过追溯栈找到代码出错的行数了。

### Error Messages

不同浏览器在就错误信息的格式有不同的实现形式，比如上面的例子，在把一个原始类型的变量当做函数执行的时候，不同浏览器都在试图找到一个相同的方式来抛出这个错误，但是又没有统一标准，因此相同的形式也就没有了保证，比如在Chrome和Firefox中，会使用`{0} is not a function` 形式来抛出错误信息，而IE11 会抛出`Function expected` 错误信息（IE浏览器甚至不会指出是哪个变量被当做了函数调用而产生错误）

然而，不同浏览器在就错误信息上也有可能产生分歧，比如当`switch` 语句中有多个default 语句时，Chrome会抛出 `"More than one default clause in switch statement"`  而FireFox会抛出`"more than one switch default"`.  当新特性加入到JavaScript语言中时，错误信息也应该实时更新。当处理容易产生混淆代码导致的错误时，往往也需要使用到不同的处理手段。

你可以通过如下地址找到不同浏览器厂商在处理错误信息上面的做法：

* Firefox - http://mxr.mozilla.org/mozilla1.9.1/source/js/src/js.msg
* Chrome - https://code.google.com/p/v8/source/browse/branches/bleeding_edge/src/messages.js
* Internet Explorer - https://github.com/Microsoft/ChakraCore/blob/4e4d4f00f11b2ded23d1885e85fc26fcc96555da/lib/Parser/rterrors.h

**![error message warning](https://mknichel.github.io/javascript-errors/ic_warning_black_18px.svg) Browsers will produce different error messages for some exceptions.**

### 追溯栈格式

追溯栈是用来描述错误出现在代码中什么位置。追溯栈通过一系列相互关联的帧组成，每一帧描述一行特定的代码，追溯栈最上面的那一帧就是错误抛出的位置，追溯栈下面的帧就是一个函数调用栈 - 也就是浏览器在执行JavaScript代码时一步一步怎么到抛出错误代码那一行的。

一个基本的追溯栈如下：

``` 
  at throwError (http://mknichel.github.io/javascript-errors/throw-error-basic.html:8:9)
  at http://mknichel.github.io/javascript-errors/throw-error-basic.html:12:3
```

追溯栈中的每一帧由以下三个部分组成：一个函数名（发生错误的代码不是在全局作用域中执行），发生错误的脚本在网络中的地址，以及发生错误代码的行数和列数。

遗憾的是，追溯栈还没有一个标准形式，因此不同浏览器厂商在实现上也是有差异的。

IE 11的追溯栈和Chrome 的追溯栈很相似，除了在全局作用域中的代码上有些差异：

``` 
  at throwError (http://mknichel.github.io/javascript-errors/throw-error-basic.html:8:3)
  at Global code (http://mknichel.github.io/javascript-errors/throw-error-basic.html:12:3)
```

Firefox 的追溯栈如下格式：

``` 
  throwError@http://mknichel.github.io/javascript-errors/throw-error-basic.html:8:9
  @http://mknichel.github.io/javascript-errors/throw-error-basic.html:12:3
```

Safari 的追溯栈格式和Firefox很相似，但是仍然有些出入：

``` 
  throwError@http://mknichel.github.io/javascript-errors/throw-error-basic.html:8:18
  global code@http://mknichel.github.io/javascript-errors/throw-error-basic.html:12:13
```

所有的浏览器厂商追溯栈基本信息差不多，但是格式上有些差异：

在上面Safari追溯栈的例子中，除了在追溯栈格式上和Chrome有差异外，发生错误的列数也和Chrome和Firefox不同。在不同的错误情境中，行数也会有所不同，比如如下代码：

``` javascript
(function namedFunction() { throwError(); })();
```

Chrome 会从throwError()开始计数行数，而IE11会从上面代码开始位置计算行数。这些不同浏览器之间在追溯栈格式上和计数上的差异也为后期解析追溯栈带来了困难。

See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/Stack for more information on the stack property of errors.

通过如下网站 https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/Stack 了解更多关于追溯栈的问题。

**![stack trace format warning](https://mknichel.github.io/javascript-errors/ic_warning_black_18px.svg) 不同浏览器厂商在追溯栈格式以及列数上都有可能存在差异**

深入研究，浏览器厂商关于追溯栈还有很多细微差异，将在下面部分详细讨论。

#### 为匿名函数取名

默认情况下，匿名函数没有名字，同时在追溯栈中要么表现为空字符串要么就是Anonymous function（根据不同浏览器会有区别）。为了提升代码的可调试性，你应该为所用的函数添加一个函数名，以使得其在追溯栈中出现，而不是空字符串或者Anonymous function。最简单的方法就是在所有的匿名函数前面加一个函数名，甚至该函数名不会在其他任何场合使用到。如下:

``` javascript
setTimeout(function nameOfTheAnonymousFunction() { ... }, 0);
```

上面代码的改变将使得追溯栈中也发生如下改变，从

``` 
at http://mknichel.github.io/javascript-errors/javascript-errors.js:125:17
```

变成了如下形式

``` 
at nameOfTheAnonymousFunction (http://mknichel.github.io/javascript-errors/javascript-errors.js:121:31)
```

上面给匿名函数添加姓名的方法可以保证函数名出现在追溯栈中，这样也使得代码更易调试，通过如下网站你可以了解更多关于代码调试的信息。 http://www.html5rocks.com/en/tutorials/developertools/async-call-stack/

##### 将函数赋值给一个变量

浏览器通常也会使用匿名函数赋值给的变量作为函数名，在追溯帧中出现。举个例子：

``` javascript
var fnVariableName = function() { ... };
```

浏览器会使用`fnVariableName`作为函数名在追溯栈中出现。

``` 
    at throwError (http://mknichel.github.io/javascript-errors/javascript-errors.js:27:9)
    at fnVariableName (http://mknichel.github.io/javascript-errors/javascript-errors.js:169:37)
```



浏览器厂商在追溯栈上甚至还有更加细微的差异，如果一个函数被赋值给了一个变量，并且这个函数定义在另外一个函数内，几乎所有的浏览器都会使用被赋值的变量作为追溯帧中的函数名，但是，Firefox有所不同，在Firefox中，会使用外面的函数名加上内部的函数名（变量名）作为追溯帧中的函数名。举个例子：

``` javascript
function throwErrorFromInnerFunctionAssignedToVariable() {
  var fnVariableName = function() { throw new Error("foo"); };
  fnVariableName();
}
```

在Firefox中追溯帧格式如下：

``` 
throwErrorFromInnerFunctionAssignedToVariable/fnVariableName@http://mknichel.github.io/javascript-errors/javascript-errors.js:169:37
```

在其他的浏览器，追溯帧格式如下：

``` 
at fnVariableName (http://mknichel.github.io/javascript-errors/javascript-errors.js:169:37)
```

**![inner function Firefox stack frame warning](https://mknichel.github.io/javascript-errors/ic_warning_black_18px.svg) 在一个函数定义在另外一个函数内部的情景下（闭包）Firefox会使用不同于其他浏览器厂商的格式来处理函数名**

##### displayName 属性

除了IE11，函数名的展现也可以通过给函数定义一个`displayName` 属性，displayName会出现在浏览器的devtools debugger中。而Safari displayName还会出现在追溯帧中。

``` javascript
var someFunction = function() {};
someFunction.displayName = " # A longer description of the function.";
```

虽然关于displayName还没有官方的标准，但是该属性已经在主要的浏览器中实现了。通过如下网站你可以了解更多关于displayName的信息： https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/displayName 和 http://www.alertdebugging.com/2009/04/29/building-a-better-javascript-profiler-with-webkit/ 

**![IE11 no displayName property](https://mknichel.github.io/javascript-errors/ic_bug_report_black_18px.svg) IE11不支持displayName属性**

**![Safari displayName property bug](https://mknichel.github.io/javascript-errors/ic_bug_report_black_18px.svg) Safari 会使用displayName作为函数名在追溯帧中出现**

#### 通过编程来获取追溯栈

当抛出一个错误但又没有追溯栈的时候（通过下面的内容了解更多），我们可以通过一些编程的手段来捕获追溯栈。

在Chrome中，可以简单的调用Error.captureStackTrace API来获取到追溯栈，关于该API的使用可以通过如下链接了解： https://github.com/v8/v8/wiki/Stack%20Trace%20API 

举个例子：

``` javascript
function ignoreThisFunctionInStackTrace() {
  var err = new Error();
  Error.captureStackTrace(err, ignoreThisFunctionInStackTrace);
  return err.stack;
}
```

在其它浏览器中，追溯栈也可以通过生成一个错误，然后通过stack属性来获取追溯栈。

``` javascript
var err = new Error('');
return err.stack;
```

但是在IE10中，只有当错误真正抛出后才能够获取到追溯栈。

``` javascript
try {
  throw new Error('');
} catch (e) {
  return e.stack;
}
```

如果上面的方法都起作用时，我们可以通过`arguments.callee.caller` 对象来粗糙的获取一个没有行数和列数的追溯栈，但是这种方法在ES5严格模式下不起作用，因此这种方法也不是一种推荐的做法。

#### Async stack traces

#### 异步追溯栈

在JavaScript代码中异步代码是非常常见的。比如`setTimeout`的使用，或者Promise对象的使用，这些异步调用入口往往会给追溯栈带来问题，因为异步代码会生成一个新的执行上下文，而追溯栈又会重新形成追溯帧。

Chrome DevTools 已经支持了异步追溯栈，换句话说，追溯栈在追溯一个错误的时候也会显示引入异步调用的那一调用帧。在使用setTimeout的情况下，在Chrome中会捕获谁调用了产生错误的setTimeout 函数。关于上面内容，可以从如下网站获取信息： http://www.html5rocks.com/en/tutorials/developertools/async-call-stack/ 

一个异步追溯栈会采用如下形式：

``` 
  throwError	@	throw-error.js:2
  setTimeout (async)		
  throwErrorAsync	@	throw-error.js:10
  (anonymous function)	@	throw-error-basic.html:14
```

目前，异步追溯栈只有Chrome DevTools支持，而且只有在DevTools代开的情况下才会捕获，在代码中通过Error对象不会获取到异步追溯栈。

虽然可以模拟异步调用栈，但是这往往会代指应用性能的消耗，因为这种方法也显得并不可取。

**![Only Chrome supports async stack traces](https://mknichel.github.io/javascript-errors/ic_warning_black_18px.svg) 只有Chrome DevTools原生支持异步追溯栈**

#### 命名行内JS代码或者使用eval情况

在追溯使用eval或者HTML 中写JS的情况，追溯栈通常会使用HTML的URL 以及代码执行的行数和列数。

例如：

``` 
  at throwError (http://mknichel.github.io/javascript-errors/throw-error-basic.html:8:9)
  at http://mknichel.github.io/javascript-errors/throw-error-basic.html:12:3
```

出于一些性能或代码优化的原因，HTML中往往会有行内脚本，而且这种情况下，URL, 行数、列数也有可能出错，为了解决这些问题，Chrome和Firefox 支持`//# sourceURL=` 声明，（Safari 和 IE 暂不支持）。通过这种形式声明的URL会在追溯栈中使用到，而且行数和列数也会通过`\<script>` 标签开始计算。比如上面相同的错误，通过sourceURL的声明，往往会在追溯帧后面添加一个`inline.js`.

``` 
  at throwError (http://mknichel.github.io/javascript-errors/inline.js:8:9)
  at http://mknichel.github.io/javascript-errors/inline.js:12:3
```

保证行内脚本及使用eval的情况下追溯栈的正确性依然是迫在眉睫的技术问题。

可以通过如下网站了解更多关于sourceurl的内容http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/

**![Lack of sourceURL support](https://mknichel.github.io/javascript-errors/ic_bug_report_black_18px.svg) Safari 和 IE 现在都不支持sourceURL 申明来命名 行内脚本和使用eval情况。如果你在这两个浏览器内使用行内脚本，那么在这些脚本中出现的错误往往不能够很好的解析**

**![Chrome bug for computing line numbers with sourceURL](https://mknichel.github.io/javascript-errors/ic_bug_report_black_18px.svg) 直到Chrome 42， Chrome也没有正确得计算行内脚本中发生错误的行数。访问如下链接，了解更多关于行内脚本内容： https://bugs.chromium.org/p/v8/issues/detail?id=3920**

**![Chrome bug in line numbers from inline scripts](https://mknichel.github.io/javascript-errors/ic_bug_report_black_18px.svg) 在使用sourceURL声明情况下，在行内脚本中，行数通常是从html文档开始位置开始计数，而不是从script标签处开始计数的，从html文档开始计数通常被认为是不正确的 https://code.google.com/p/chromium/issues/detail?id=578269**

##### 使用eval情景下的追溯栈

除了是否使用sourceURL声明，在代码中使用eval的情况下，不同浏览器在追溯栈上也有诸多差异：举个例子：

在Chrome在代码中使用eval，追溯栈如下：

``` 
Error: Error from eval
    at evaledFunction (eval at evalError (http://mknichel.github.io/javascript-errors/javascript-errors.js:137:3), <anonymous>:1:36)
    at eval (eval at evalError (http://mknichel.github.io/javascript-errors/javascript-errors.js:137:3), <anonymous>:1:68)
    at evalError (http://mknichel.github.io/javascript-errors/javascript-errors.js:137:3)
```

在IE11，中会是这样的。

``` 
Error from eval
    at evaledFunction (eval code:1:30)
    at eval code (eval code:1:2)
    at evalError (http://mknichel.github.io/javascript-errors/javascript-errors.js:137:3)
```

在Safari中：

``` 
Error from eval
    evaledFunction
    eval code
    eval@[native code]
    evalError@http://mknichel.github.io/javascript-errors/javascript-errors.js:137:7
```

在Firefox中：

``` 
Error from eval
    evaledFunction@http://mknichel.github.io/javascript-errors/javascript-errors.js line 137 > eval:1:36
    @http://mknichel.github.io/javascript-errors/javascript-errors.js line 137 > eval:1:11
    evalError@http://mknichel.github.io/javascript-errors/javascript-errors.js:137:3
```

兼容不同浏览器解析eval代码将变得异常困难。

**![Different eval stack trace format across browsers](https://mknichel.github.io/javascript-errors/ic_warning_black_18px.svg) 不同浏览器都有自己处理eval代码错误的追溯栈格式**

## 捕获JavaScript 错误

当发现应用程序中有错误的时候，程序中一些代码必须能够捕获错误，并且能够报告错误。现目前已经有很多方法能够捕获错误，他们有各自的优点和缺点：

### window.onerror

`window.onerror`是开始捕获错误最简单的方法了，通过在window.onerror上定义一个事件监听函数，程序中其他代码产生的未被捕获的错误往往就会被window.onerror上面注册的监听函数捕获到。并且同时捕获到一些关于错误的信息。举个例子：

``` javascript
window.onerror = function(msg, url, line, col, err) {
  console.log('Application encountered an error: ' + msg);
  console.log('Stack trace: ' + err.stack);
}
```

访问https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onerror了解更过关于window.onerror的内容

在使用window.onerror方法捕获错误存在如下问题：

**No Error object provided**

window.onerror注册的监听函数的第五个参数是一个Error对象，这是2013年加入到WHATWG规范中的。https://html.spec.whatwg.org/multipage/webappapis.html#errorevent.Chrome ，Firefox， IE11现在都能够正确的在window.onerror中提供一个error对象（并且带有一个stack属性），但是Safari 和 IE10现在还没有，Firefox是从14版本加入Error对象的 (https://bugzilla.mozilla.org/show_bug.cgi?id=355430) ，而Chrome是从2013年晚期在window.onerror监听函数中加入Error对象的 (https://mikewest.org/2013/08/debugging-runtime-errors-with-window-onerror, https://code.google.com/p/chromium/issues/detail?id=147127)。

**![Lack of support for Error in window.onerror](https://mknichel.github.io/javascript-errors/ic_bug_report_black_18px.svg) Safari 和 IE10还不支持在window.onerror的回调函数中使用第五个参数，也就是一个Error对象并带有一个追溯栈**

**Cross domain sanitization**

在Chrome中，window.onerror能够检测到从别的域引用的script文件中的错误（**译者注：比如从CDN上面引用的jQuery源文件）并且将这些错误标记为`Script error` .如果你不想处理这些从别的域引入的script文件，那么可以在程序中通过`script error`标记将其过滤掉。然而，在Firefox、Safari或者IE11中，并不会引入跨域的JS错误，及时在Chrome中，如果使用try/catch将这些讨厌的代码包围，那么Chrome也不会再检测到这些跨域错误。

在Chrome中，如果你想通过window.onerror来获取到完整的跨域错误信息，那么这些跨域资源必须提供合适的跨域头信息。可以参考下面地址 https://mikewest.org/2013/08/debugging-runtime-errors-with-window-onerror 

**![Cross domain sanitization in window.onerror](https://mknichel.github.io/javascript-errors/ic_warning_black_18px.svg) Chrome 是唯一一个能够通过window.onerror检测到其他源上面的文件错误的浏览器，要么将其过滤掉，要么为其设置合适的跨域头信息**

**Chrome Extensions**

在早期版本的Chrome浏览器中，安装在用户电脑中Chrome插件抛出的JS错误依然会被window.onerror检测到，这一bug在新版本的Chrome中已经被修正，参见下面Chrome插件部分。

#### window.addEventListener("error")

`window.addEventListener("error")` API 的效果和window.onerror API相同，可以通过下面网站了解更多信息： http://www.w3.org/html/wg/drafts/html/master/webappapis.html#runtime-script-errors

#### Showing errors in DevTools console for development

通过window.error并不能够阻止错误显示在浏览器控制台中，这通常是正确的，也是开发需要的，因为开发者可以很容易从控制台中看到错误信息。如果你不希望这些错误在生产环境中显示给最终用户，那么在window.addEventListener中使用`e.preventDefault()` 可以有效的避免错误显示在控制台上。举个例子：（**译者注：该例子为译者举例）

``` javascript
window.addEventListener('error', function(e) {
	e.preventDefault()
	//report error
})
```

#### 推荐做法

window.onerror是捕获JS 错误最好的方法，我们推荐只有当JS错误带有一个合法的Error 对象和追溯栈时才将其报告给服务器（**译者注：搜集错误的服务器），因为其他不合法的错误不容易被分析，或者你可能会捕获到很多垃圾JS错误（从Chrome插件中得到）或者是从跨域资源上获取到一些信息不全的错误。

### try/catch

鉴于以上window.onerror的不足之处，我们不能够完全依赖于window.onerror来获取全部的JS错误，如果只是需要在本地（**译者注：并不希望把错误抛到全局，然后在控制台中显示）捕获错误，那么try/catch 代码块将是一个更好的选择，我们甚至可以将所用的JavaScript代码通过一个try/catch包围来获取window.onerror获取不到的错误。这种方法能够改善有些浏览器不支持window.onerror的情况，但是try/catch依然会有如下一些劣势：

#### 不能够捕获所有错误

try/catch并不能够捕获程序中的所有错误，比如try/catch就不能够捕获`window.setTimeout`异步操作抛出的错误。但是Try/catch可以通过 [Protected Entry Points](#protected-entry-points) 来改善这一缺点。(**译者注：虽然try/catch不能够捕获异步代码中的错误，但是其将会把错误抛向全局然后window.onerror可以将其捕获，Chrome中已测试)

**![Use protected entry points with try/catch](https://mknichel.github.io/javascript-errors/ic_warning_black_18px.svg) try/catch 包围所有的程序代码，但是依然不能够捕获所有的JS错误**

#### try/catch 不利于性能优化

在V8（其他JS引擎也可能出现相同情况）函数中使用了try/catch语句不能够被V8编译器优化。参考 http://www.html5rocks.com/en/tutorials/speed/v8/ 

### Protected Entry Points

一个JavaScript的''代码入口''就是指任意开始执行你代码的浏览器API.例如，setTimeout、setInterval、事件监听函数、XHR、web sockets、或者promise。都可以是代码入口。通过这些入口代码抛出的JS错误能够被window.onerror捕获到，但是遗憾的是，在浏览器中这些代码入口抛出的错误并不是完整的Error对象，(**译者注：在最新版Chrome中可以捕获到完整的Error对象)，由于try/catch也不能够捕获到代码入口产生的JS错误，因为一个可替代的方案急需被使用。

庆幸的是，JavaScript运行我们对这些入口代码进行包装，这样就是的在函数调用之前我们就可以引入try/catch语句，这样也就能够捕获入口代码抛出的错误了。

每个入口代码需要进行一些改变（**译者注：猴子补丁），这也就是所谓的「保护」代码入口，举个例子如下：

``` javascript
function protectEntryPoint(fn) {
  return function protectedFn() {
    try {
      return fn();
    } catch (e) {
      // Handle error.
    }
  }
}
_oldSetTimeout = window.setTimeout;
window.setTimeout = function protectedSetTimeout(fn, time) {
  return _oldSetTimeout.call(window, protectEntryPoint(fn), time);
};
```

### Promises

遗憾的是，在Promises中产生的错误很容易就被掩盖而不能够观察到，Promise中的错误只会被rejection处理函数（**译者注：就是`.catch()`）捕获到，而不会在其他任何地方捕获到Promise中的错误，也就是说，window.onerror是无法捕获到promise中的错误的。甚至即使promise自身带有rejection处理函数，我们也应该手动去处理错误。可以从下面的网站了解更多关于promise错误处理的信息。 http://www.html5rocks.com/en/tutorials/es6/promises/#toc-error-handling。举个例子：

``` javascript
window.onerror = function(...) {
  // This will never be invoked by Promise code.
};

var p = new Promise(...);
p.then(function() {
  throw new Error("This error will be not handled anywhere.");
});

var p2 = new Promise(...);
p2.then(function() {
  throw new Error("This error will be handled in the chain.");
}).catch(function(error) {
  // Show error message to user
  // This code should manually report the error for it to be logged on the server, if applicable.
});
```

我们可以使用 [Protected Entry Points](#protected-entry-points) 来包装一些Promise的方法，在其中添加一个try/catch语句来处理错误，使用这种方法可使使得我们捕获更多错误信息。

``` javascript
  var _oldPromiseThen = Promise.prototype.then;
  Promise.prototype.then = function protectedThen(callback, errorHandler) {
    return _oldPromiseThen.call(this, protectEntryPoint(callback), protectEntryPoint(errorHandler));
  };
```

**![Errors in Promises will go unhandled by default](https://mknichel.github.io/javascript-errors/ic_warning_black_18px.svg) 遗憾的是，默认情况下Promises中的错误不会被捕获到**

#### Error handling in Promise polyfills

一些Promise实现，比如Q， Bluebird 和 Closure,这些Promise实现在处理JS错误时各有自己的方式，但是都比原生浏览器实现的Promise在处理错误上表现出色。

* 在Q中，我们可以通过`.done()`来结束Pormise链，这样就保证了及时在Promise链中没有处理的错误依然会被抛出，然后可以通过其他方式处理。可以通过如下地址了解更多关于Q处理JS错误的信息。https://github.com/kriskowal/q#handling-errors
* 在[Bluebird](http://bluebirdjs.com/)中，没有处理的rejections会立即在控制台打印和报出。参见 http://bluebirdjs.com/docs/features.html#surfacing-unhandled-errors
* 在[Closure's goog.Promise](https://github.com/google/closure-library/blob/master/closure/goog/promise/promise.js) 的Promise实现中，（**译者注，不了解，没翻译）unhandled rejections are logged and reported if no chain in the Promise handles the rejection within a configurable time interval (in order to allow code later in the program to add a rejection handler).

#### Long stack traces

在 [async stack trace](#async-stack-traces) 部分，我们已经讨论了浏览器并不会捕获异步hook中的发生的错误的追溯栈信息，例如调用Promise.prototype.then时，一些Promise polyfills能够获取到异步错误的追溯栈信息，也使得诊断错误变得相对容易。虽然这样做有些代价，但是我们可以从这些方法中获取到更多有用的信息。

* 在Q中，可以使用 `Q.longStackSupport = true;`. 参见 https://github.com/kriskowal/q#long-stack-traces
* 在Bluebird，在程序的某个地方调用`Promise.longStackTraces()` 。参见 http://bluebirdjs.com/docs/features.html#long-stack-traces.


* 在Closure中，把 `goog.Promise.LONG_STACK_TRACES` 设置为true。

### Web Workers

Web workers，包括dedicated workers、shared workers和service workers， 现在这些worker已经在应用程序中广泛被使用，由于所有的worker都是单独的JavaScript文件，因此他们应该有自己的错误处理代码，推荐的做法就是每个worker文件又应该有自己的错误处理和报告的脚本，这样就能够更加高效的处理workers中的错误了。

#### Dedicated workers

Dedicated web workers 在不同于主文件的另外一个上下文环境中运行，因此上面叙述的那些捕获错误的机制都不能够捕获Dedicated web workers中的错误，因此我需要采取一些额外的手段来捕获worker中的错误。

当我们生成一个worker时，我们可以吧onerror属性设置到worker上面，如下：

``` javascript
var worker = new Worker('worker.js');
worker.onerror = function(errorEvent) { ... };
```

这样做可以从下面的网站找到根据， https://html.spec.whatwg.org/multipage/workers.html#handler-abstractworker-onerror.这和window.onerror有所不同的是，我们把on error绑定到了worker上面，同时，监听的函数也不再接受五个参数，而是只有一个errorEvent对象作为参数。这个错误对象上面的API可以参考 https://developer.mozilla.org/en-US/docs/Web/API/ErrorEvent.这个对象包括错误信息、文件名、错误行数、错误列数，但是并没有追溯栈了（也就是errorEvent.error是null），由于这个API是在父文件中执行，因此我们也可以采取父文件中的发送错误机制来发送worker中的错误，但是遗憾的是，由于这个错误对象没有追溯栈，因此这个API使用也受到了限制。

在worker运行内部，我们也可以定义一个类似常规的window.onerror的API,参见，https://html.spec.whatwg.org/multipage/webappapis.html#onerroreventhandler.

``` javascript
self.onerror = function(message, filename, line, col, error) { ... };
```

关于self.onerror这个API的讨论可以参上上面关于window.onerror的讨论。然后，仍然有两点需要注意：

**![](https://mknichel.github.io/javascript-errors/ic_bug_report_black_18px.svg) self.onerror中，FireFox和Safari在self.onerror的回调函数中不会有第五个参数，因此，在这连个浏览器中也就无法从worker错误中获取追溯栈（Chrome 和 IE11 能够获取到追溯栈），但是我们依然可以通过Protected Entry Points 对onmessage 函数进行包装，然后我们就能够在Firefox和Safari中获取到worker 错误的追溯栈了。**

由于错误捕获代码在worker中执行，因此我们应该选择怎么把错误发送到错误搜集服务器中，我们可以选择`postMessage` 把错误信息发送给父级页面，或者直接在worker中通过XHR把错误直接报告给错误收集的服务器。

**![](https://mknichel.github.io/javascript-errors/ic_warning_black_18px.svg) 需要注意的是，在Firefox、Safari和IE11(不包括Chrome)，父级页面中window.onerror在worker脚本中的onerror注册监听函数被调用后，依然会被调用，但是，父级页面中的window.onerror捕获的错误对象并不会包含追溯栈，我们也应该注意的是，不应该把相同的错误重复发送到服务器。**

#### Shared workers

Chrome和Firefox支持ShareWorker API，这样worker就可以在多个页面共享了，由于worker是共享的，因此该worker也不从属与某一个父级页面，这也就导致了错误处理方式的不同，ShareWorker 通常可以采取和dedicated web worker相同的错误处理方式。

在Chrome中，当ShareWorker出现JS错误时，只有worker内部的错误捕获代码能够被执行（比如self .onerror），父级页面中的window.onerror不会被执行，同时Chrome还不支持虽然已在规范中定义了的`AbstracWorker.onerror`。.

在Firefox，行为又有些不同，worker中的错误会使得父级页面的window.onerror的监听函数也被调用，但是虽然父级页面也能捕获到错误，依然缺少第五个参数，也就是说捕获到的错误对象上面没有追溯栈，因此这也会有使用上的限制。

**![](https://mknichel.github.io/javascript-errors/ic_warning_black_18px.svg) shared workers的错误处理在浏览期间差异性很大**

#### Service Workers

[Service Workers](http://www.w3.org/TR/service-workers/)是新规范中提出的，现目前仅在Chrome和Firefox最近版本中实现，该worker和dedicated web worker的错误处理机制差不多。

Service workers是通过调用`navigator.serviceWorker.register` 开引入的，该方法返回一个Promise，当service worker引入失败，该Promise就会被reject掉。如果引入失败，那么在Service worker初始化时就会抛出一个错误，该错误仅包含一条错误信息。除此之外，由于Promise不会把错误暴露给window.onerror 事件监听函数，因此我们需要给上面方法返回的Promise添加一个catch代码块，用来捕获该Promise中抛出的错误。

``` javascript
navigator.serviceWorker.register('service-worker-installation-error.js').catch(function(error) {
  // error typeof string
});
```

和其他workers一样，service worker也可以设置self.onerror来捕获错误，service worker初始化错误会被self.onerror不会，但是遗憾的是，捕获的错误依然没有第五个参数，也就是没有追溯栈。

service worker API从AbstractWorker 接口上继承了onerror 属性，但是遗憾的是，Chrome并不支持该属性。

#### Worker Try/Catch

为了能够在Firefox和Safari浏览器的worker中捕获到追溯栈，onmessage监听函数内部可以通过一个try/catch 代码块包围，这样就可以捕获仍和冒泡上来的错误了。

``` javascript
self.onmessage = function(event) {
  try {
    // logic here
  } catch (e) {
    // Report exception.
  }
};
```

常规的try/catch 代码块能够捕获这些错误中的追溯栈，举个例子，产生错误的追溯栈如下：

``` 
Error from worker
throwError@http://mknichel.github.io/javascript-errors/worker.js:4:9
throwErrorWrapper@http://mknichel.github.io/javascript-errors/worker.js:8:3
self.onmessage@http://mknichel.github.io/javascript-errors/worker.js:14:7
```

### Chrome Extensions

由于[Chrome Extensions](https://developer.chrome.com/extensions) 不同的Chrome 扩展错误的表现也有所不同，因此他们应该有自己处理错误的方式，同时，Chrome 扩展中的错误在大型项目中的危害也不容小觑的。

#### Content Scripts

所谓的Content script就是当用户访问网站时，这些脚本在一个相对独立的执行环境中运行，可以在这些script中操作DOM，但是却不能够获取到网站中的其它JavaScript脚本。

由于content scripts有他们独立的执行环境，因此也可以使用window.onerror来捕获Content script中的错误，但是遗憾的是，在content script中通过window.onerror捕获的错误会被标记为"Script error"。没有文件名，行数和列数也被标记为0.可以通过以下网站了解 https://code.google.com/p/chromium/issues/detail?id=457785. 在这bug被解决之前，我们依然可以通过try/catch语句或者protected entry points来捕获Content script中带有追溯栈的JS错误。

在很多年前，Content script中的错误还会被父级网页中的window.onerror捕获到，这样就导致了父级网页中捕获到很多垃圾的错误信息，这一bug在2013年后期已被修复。 (https://code.google.com/p/chromium/issues/detail?id=225513). 

**![](https://mknichel.github.io/javascript-errors/ic_bug_report_black_18px.svg) Chrome 扩展中的JS错误应该在被window.onerror捕获之前被过滤掉**

#### Browser Actions

Chrome扩展可以产生一个弹出窗口，这些弹出窗口是一个小型的HTML文件，有用户点击URL栏右边的Chrome 扩展图标所致。这些弹出窗口可以在一个完全不同的环境中执行JavaScript代码，window.onerror也会捕获到这些窗口产生的错误。

## Reporting Errors to the Server

一旦客户端将带有正确的追溯栈的JS错误捕获到后，这些错误应该发回错误处理服务器，以便进一步对错误进行追踪、分析、和消除错误。通常吧错误发送到服务器是通过XHR来完成的，发送到服务器的错误包括：错误信息、追溯栈以及其他客户端和错误相关的信息，比如应用程序所用框架的版本号，用户代理（user agent），用户的地址，以及网页的URL。

如果应用程序使用了多种机制来捕获错误，那么应该注意的地方就是不要把相同的错误发送两次，同时，发送的错误信息最后带有一个追溯栈，这样在大型应用程序中才能够更好的找出问题根源。