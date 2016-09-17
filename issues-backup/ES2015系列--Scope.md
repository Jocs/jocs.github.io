### ES2015系列--块级作用域

当Brendan Eich在1995年设计**JavaScript**第一个版本的时候，考虑的不是很周到，以至于最初版本的JavaScript有很多不完善的地方，在Douglas Crockford的《JavaScript：The Good Parts》中就总结了很多JavaScript不好的地方，比如允许`!=`和`==`的使用，会导致隐式的类型转换，比如在全局作用域中通过`var`声明变量会成为全局对象（在浏览器环境中是window对象）的一个属性，在比如`var`声明的变量可以覆盖window对象上面原生的方法和属性等。

但是作为一门已经被广泛用于web开发的计算机语言来说，去纠正这些设计错误显得相当困难，因为如果新的语法和老的语法有冲突的话，那么已有的web应用无法运行，浏览器生产厂商肯定不会去冒这个险去实现这些和老的语法完全冲突的功能的，因为谁都不想失去自己的客户，不是吗？因此向下兼容便成了解决上述问题的唯一途径，也就是说在不改变原有语法特性的基础上，增加一些新的语法或变量声明方式等，来把新的语言特性引入到JavaScript语言中。

早在九年前，Brendan Eich在Firefox中就实现了第一版的`let`.但是`let`的功能和现有的ES2015标准规定有些出入，后来由Shu-yu Guo将`let`的实现升级到符合现有的ES2015标准，现在才有了我们现在在最新的Firefox中使用的`let `声明变量语法。

#### 问题一：没有块级作用域

在ES2015之前，在函数中通过`var`声明的变量，不论其在`{}`中还是外面，其都可以在整个函数范围内访问到，因此在函数中声明的变量被称为局部变量，作用域被称为局部作用域，而在全局中声明的变量存在整个全局作用域中。但是在很多情境下，我们迫切的需要块级作用域的存在，也就是说在`{}`内部声明的变量只能够在`{}`内部访问到，在`{}`外部无法访问到其内部声明的变量，比如下面的例子：

```javascript
function foo() {
	var bar = 'hello'
	if (true) {
		var zar = 'world'
		console.log(zar)
	}
	console.log(zar) // 如果存在块级作用域那么将报语法错误：Uncaught ReferenceError
}
```

在上面的例子中，如果JavaScript在ES2015之前就存在块级作用域，那么在`{}`之外将无法访问到其内部声明的变量`zar`，但是实际上，第二个console却打印了zar的赋值，'world'。

#### 问题二：for循环中共享迭代变量值

在for循环初始循环变量时，如果使用`var`声明初始变量`i`，那么在整个循环中，for循环内部将共享`i`的值。如下代码：

```javascript
var funcs = []
for (var i = 0; i < 10; i++) {
	funcs.push(function() {
		return i
	})
}
funcs.forEach(function(f) {
	console.log(f()) // 将在打印10数字10次
})
```

上面的代码并没有按着我们希望的方式执行，我们本来希望是最后打印0、1、2...9这10个数字。但是最后的结果却出乎我们的意料，而是将数字10打印了10次，究其原因，声明的变量`i`在上面的整个代码块能够访问到，也就是说，funcs数组中每一个函数返回的`i`都是全局声明的变量`i`。也就说在funcs中函数执行时，将返回同一个值，而变量`i`初始值为0，当迭代最后一次进行累加，9+1 = 10时，通过条件语句`i < 10`判断为`false`，循环运行完毕。最后`i`的值为10.也就是为什么最后所有的函数都打印为10。那么在ES2015之前能够使上面的循环打印0、1、2、… 9吗？答案是肯定的。

```javascript
var funcs = []
for (var i = 1; i < 10; i++) {
	funcs.push((function(value) {
		return function() {
			return value
		}
	})(i))
}
funcs.forEach(function(f) {
	console.log(f())
})
```

在这儿我们使用了JavaScript中的两个很棒的特性，立即执行函数（IIFEs）和闭包（closure）。在JavaScript的闭包中，闭包函数能够访问到包庇函数中的变量，这些闭包函数能够访问到的变量也因此被称为**自由变量**。只要闭包没有被销毁，那么外部函数将一直在内存中保存着这些变量，在上面的代码中，形参`value`就是自由变量，return的函数是一个闭包，闭包内部能够访问到自由变量`value`。同时这儿我们还使用了立即执行函数，立即函数的作用就是在每次迭代的过程中，将`i`的值作为实参传入立即执行函数，并执行返回一个闭包函数，这个闭包函数保存了外部的自由变量，也就是保存了当次迭代时`i`的值。最后，就能够达到我们想要的结果，调用funcs中每个函数，最终返回0、1、2、… 9。

#### 问题三：变量提升（Hoisting）

我们先来看看函数中的变量提升， 在函数中通过`var`定义的变量，不论其在函数中什么位置定义的，都将被视作在函数顶部定义，这一特定被称为**提升（Hoisting）**。想知道变量提升具体是怎样操作的，我们可以看看下面的代码：

```javascript
function foo() {
	console.log(a) // undefined
	var a = 'hello'
	console.log(a) // 'hello'
}
```

在上面的代码中，我们可以看到，第一个console并没有报错（ReferenceError）。说明在第一个`console.log(a)`的时候，变量`a`已经被定义了，JavaScript引擎在解析上面的代码时实际上是像下面这样的：

```javascript
function foo() {
  var a
  console.log(a)
  a = 'hello'
  console.log(a)
}
```

也就是说，JavaScript引擎把变量的定义和赋值分开了，首先对变量进行提升，将变量提升到函数的顶部，注意，这儿变量的赋值并没有得到提升，也就是说`a = "hello"`依然是在后面赋值的。因此第一次`console.log(a)`并没有打印`hello`也没有报`ReferenceError`错误。而是打印`undefined`。无论是函数内部还是外部，变量提升都会给我们带来意想不到的bug。比如下面代码：

```javascript
if (!('a' in window)) {
  var a = 'hello'
}
console.log(a) // undefined
```

很多公司都把上面的代码作为面试前端工程师JavaScript基础的面试题，其考点也就是考察全局环境下的变量提升，首先，答案是`undefined`，并不是我们期许的`hello`。原因就在于变量`a`被提升到了最上面，上面的代码JavaScript其实是这样解析的：

```javascript
var a
if (!('a' in window)) {
  a = 'hello'
}
console.log(a) // undefined
```

现在就很明了了，bianliang`a`被提升到了全局环境最顶部，但是变量`a`的赋值还是在条件语句内部，我们知道通过关键字`var`在全局作用域中声明的变量将作为全局对象（window）的一个属性，因此`'a' in window`为`true`。所以if语句中的判断语句就为`false`。因此条件语句内部就根本不会执行，也就是说不会执行赋值语句。最后通过`console.log(a)`打印也就是`undefined`，而不是我们想要的`hello`。

虽然使用关键词`let`进行变量声明也会有变量提升，但是其和通过`var`申明的变量带来的变量提升是不一样的，这一点将在后面的`let`和`var`的区别中讨论到。

#### 关于ES2015之前作用域的概念

上面提及的一些问题，很多都是由于JavaScript中关于作用域的细分粒度不够，这儿我们稍微回顾一下ES2015之前关于作用域的概念。

> Scope： collects and maintains a look-up list of all the declared identifiers (variables), and enforces a strict set of rules as to how these are accessible to currently executing code.

上面是关于作用域的定义，作用域就是一些规则的集合，通过这些规则我们能够查找到当前执行代码所需变量的值，这就是作用域的概念。在ES2015之前最常见的两种作用域，全局作用局和函数作用域（局部作用域）。函数作用域可以嵌套，这样就形成了一条作用域链，如果我们自顶向下的看，一个作用域内部可以嵌套几个子作用域，子作用域又可以嵌套更多的作用域，这就更像一个‘’作用域树‘’而非作用域链了，作用域链是一个自底向上的概念，在变量查找的过程中很有用的。在ES3时，引入了try catch语句，在catch语句中形成了新的作用域，外部是访问不到catch语句中的错误变量。代码如下：

```javascript
try {
  throw new Error()
} catch(err) {
  console.log(err)
}
console.log(err) //Uncaught ReferenceError
```

再到ES5的时候，在严格模式下（use strict），函数中使用eval函数并不会再在原有函数中的作用域中执行代码或变量赋值了，而是会动态生成一个作用域嵌套在原有函数作用域内部。如下面代码：

```javascript
'use strict'
var a = function() {
	var b = '123'
	eval('var c = 456;console.log(c + b)') // '456123'
	console.log(b) // '123'
	console.log(c) // 报错
}
```

在非严格模式下，a函数内部的`console.log(c)`是不会报错的，因为eval会共享a函数中的作用域，但是在严格模式下，eval将会动态创建一个新的子作用域嵌套在a函数内部，而外部是访问不到这个子作用域的，也就是为什么`console.log(c)`会报错。

#### 通过`let`来声明变量

通过`let`关键字来声明变量也通过`var`来声明变量的语法形式相同，在某些场景下你甚至可以直接把`var`替换成`let`。但是使用`let`来申明变量与使用`var`来声明变量最大的区别就是作用域的边界不再是函数，而是包含`let`变量声明的代码块（`{}`）。下面的代码将说明`let`声明的变量只在代码块内部能够访问到，在代码块外部将无法访问到代码块内部使用`let`声明的变量。

```javascript
if (true) {
  let foo = 'bar'
}
console.log(foo) // Uncaught ReferenceError
```

在上面的代码中，`foo`变量在if语句中声明并赋值。if语句外部却访问不到foo变量，报ReferenceError错误。

#### `let`和`var`的区别

###### 变量提升的区别

在ECMAScript 2015中，`let`也会提升到代码块的顶部，在变量声明之前去访问变量会导致`ReferenceError`错误，也就是说，变量被提升到了一个所谓的“temporal dead zone”（以下简称TDZ）。TDZ区域从代码块开始，直到显示得变量声明结束，在这一区域访问变量都会报ReferenceError错误。如下代码：

```javascript
function do_something() {
  console.log(foo); // ReferenceError
  let foo = 2;
}
```

而通过`var`声明的变量不会形成TDZ,因此在定义变量之前访问变量只会提示`undefined`，也就是上文以及讨论过的`var`的变量提升。

###### 全局环境声明变量的区别

在全局环境中，通过`var`声明的变量会成为window对象的一个属性，甚至对一些原生方法的赋值会导致原生方法的覆盖。比如下面对变量`parseInt`进行赋值，将覆盖原生parseInt方法。

```javascript
var parseInt = function(number) {
  return 'hello'
}
parseInt(123) // 'hello'
window.parseInt(123) // 'hello'
```

而通过关键字`let`在全局环境中进行变量声明时，新的变量将不会成为全局对象的一个属性，因此也就不会覆盖window对象上面的一些原生方法了。如下面的例子：

```javascript
let parseInt = function(number) {
  return 'hello'
}
parseInt(123) // 'hello'
window.parseInt(123) // 123
```

在上面的例子中，我们看到`let`生命的函数`parsetInt`并没有覆盖window对象上面的parseInt方法，因此我们通过调用`window.parseInt`方法时，返回结果123。

###### 在多次声明同一变量时处理不同

在ES2015之前，可以通过`var`多次声明同一个变量而不会报错。下面的代码是不会报错的，但是是不推荐的。

```javaScript
var a = 'xiaoming'
var a = 'huangxiaoming'
```

其实这一特性不利于我们找出程序中的问题，虽然有一些代码检测工具，比如ESLint能够检测到对同一个变量进行多次声明赋值，能够大大减少我们程序出错的可能性，但毕竟不是原生支持的。不用担心，ES2015来了，如果一个变量已经被声明，不论是通过`var`还是`let`或者`const`,该变量再次通过`let`声明时都会语法报错（SyntaxError）。如下代码：

```javascript
var a = 345
let a = 123 // Uncaught SyntaxError: Identifier 'a' has already been declared
```

#### 最好的总是放在最后：const

通过`const`生命的变量将会创建一个对该值的一个只读引用，也就是说，通过`const`声明的原始数据类型（number、string、boolean等），声明后就不能够再改变了。通过const声明的对象，也不能改变对对象的引用，也就是说不能够再将另外一个对象赋值给该const声明的变量，但是，`const`声明的变量并不表示该对象就是不可变的，依然可以改变对象的属性值，只是该变量不能再被赋值了。

```javascript
const MY_FAV = 7
MY_FAY = 20 // 重复赋值将会报错(Uncaught TypeError: Assignment to constant variable)
const foo = {bar: 'zar'}
foo.bar = 'hello world' // 改变对象的属性并不会报错
```

通过`const`生命的对象并不是不可变的。但是在很多场景下，比如在函数式编程中，我们希望声明的变量是不可变的，不论其是原始数据类型还是引用数据类型。显然现有的变量声明不能够满足我们的需求，如下是一种声明不可变对象的一种实现：

```javascript
const deepFreeze = function(obj) {
	Object.freeze(obj)
	for (const key in obj) {
		if (typeof obj[key] === 'object') deepFreeze(obj[key])
	}
	return obj
}
const foo = deepFreeze({
  a: {b: 'bar'}
})
foo.a.b = 'zar'
console.log(foo.a.b) // bar
```

#### 最佳实践

在ECMAScript 2015成为最新标准之前，很多人都认为`let`是解决本文开始罗列的一系列问题的最佳方案，对于很多JavaScript开发者而言，他们认为一开始`var`就应该像现在`let`一样，现在`let`出来了，我们只需要根据现有的语法把以前代码中的`var`换成`let`就好了。然后使用`const`声明那些我们永远不会修改的值。

但是，当很多开发者开始将自己的项目迁移到ECMAScript2015后，他们发现，最佳实践应该是，尽可能的使用`const`,在`const`不能够满足需求的时候才使用`let`，永远不要使用`var`。为什么要尽可能的使用`const`呢？在JavaScript中，很多bug都是因为无意的改变了某值或者对象而导致的，通过尽可能使用`const`，或者上面的`deepFreeze`能够很好地规避这些bug的出现，而我的建议是：如果你喜欢函数式编程，永远不改变已经声明的对象，而是生成一个新的对象，那么对于你来说，`const`就完全够用了。