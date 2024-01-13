function tailFactorial(n, total){
	if (n === 1) return total
	return tailFactorial(n - 1, n * total)
}

tailFactorial(1000, 1)

const factorial = n => n === 1 ? 1 : n * factorial(n - 1)

const fibonacii = n => n <= 2 ? n - 1 : febolaqie(n - 1) + febolaqie(n - 2)

const fibonaciiContination = (n, continuation) =>
	n < 2 ? continuation(n) :
	fibonaciiContination(n - 1, r1 => fibonaciiContination(n - 2, r2 => continuation(r1 + r2)))

const fibonaciiTailRecursion = (n, acc1, acc2) =>
	n === 1 ?
	acc1 :
	() => fibonaciiTailRecursion(n - 1, acc2, acc1 + acc2)

const isFunction = f => !!~Object.prototype.toString.call(f).indexOf('Function')

const trampoline = f => (...args) => {
	var result = f.apply(f, args)
	while(isFunction(result)) {
		result = result()
	}
	return result
}

var i = 0
try {
	(function callSelf() {
		i++
		callSelf()
	})()
} catch(err) {
	console.log(i)
}

function factorial1(n, continuation) {
	if (n === 1) return continuation(1)
	return factorial1(n - 1, r => continuation(n * r))
}
factorial1(5, r => r)

function foo(a) { 
	var b = a * 2
	function bar(c) { 
		console.log( a, b, c )
	}
	bar(b * 3)
}
foo( 2 ); // 2, 4, 12

try {
	throw Error('test try-catch block scope')
} catch (err) {
	console.log(`inner${err}`)
}
console.log(err) 



var a = 4;
function testEval() {
	eval('var a = 5')
	console.log(a)
}
testEval()

var a = 1;
function foo() {
	console.log(a);
}
function testDynamic() {
	var a = 2;
	foo()
}
testDynamic() // ?

const list = [1, 2, 3]
list.map(i => i * 2)

const repeat = (times, VALUE) => _.map(_.range(times), () => VALUE)
repeat(4, 'Major') // ['Major', 'Major', 'Major', 'Major']

const repeatedly = (times, fun) => _.map(_.range(times), fun)
repeatedly(10, n => Math.pow(2, n + 1)) // [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024]

const iterateUntil = (fun, check, init) => {
	const ret = []
	let result = fun(init)
	while (check(result)) {
		ret.push(result)
		result = fun(result)
	}
	return ret
}
iterateUntil(n =>  n * 2, n => n <= 1024, 1) 
// [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024]

const always = VALUE => () => VALUE
const noop = always(function() {})
noop() === noop() // true

// Chrome Canary : 17846
// FireFox Night: 109279
// Opera Develop : 17792

const fibonacci = trampoline(fibonaciiTailRecursion)
fibonacci(6, 0, 1) // 5

const add = (a, b) => a + b


const add = a => b => a + b

const curry = (f, arg2) => arg1 => f(arg1, arg2)

const map2 = ([x, ...xs], f) => 
	x === undefined ? 
	[] : [f(x), ...map2(xs, f)]

const sq = curry(map2, x => x * x)

const partial = (f, ...args1) => (...args2) => f(...args1, ...args2)

const addMult = (a, b, c, d) => a + b + c + d

const alreadyAdd4And5 = partial(addMult, 4, 5)

alreadyAdd4And5(1, 2) // 12

!Array.isArray([])

// (!Array.isArray)([])

const compose = (...xs) => init => foldr((x, acc) => x(acc))(init)(xs)

const notArray = compose(x => !x, Array.isArray)

notArray([])
















