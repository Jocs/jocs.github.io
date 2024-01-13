const length = ([x, ...xs]) => x === undefined ? 0 : 1 + length(xs)

const flip = f => (x, y) => f(y, x)

const reverse = ([x, ...xs]) => 
	x === undefined ?
	[] :
	[...reverse(xs), x]

const foldl = f => acc => ([x, ...xs]) =>
	x === undefined ?
	acc : 
	foldl(f)(f(acc, x))(xs)

const foldr = f => acc => xs => foldl(flip(f))(acc)(reverse(xs))

const map1 = f => xs => foldl((acc, x) => acc.push(f(x)) && acc)([])(xs)

const map = f => ([x, ...xs]) => x === undefined ? [] : [f(x), ...map(f)(xs)]

const filter = f => ([x, ...xs]) => 
	x === undefined ? 
	[] : 
	f(x) ? [x, ...filter(f)(xs)] : filter(f)(xs)

const every = f => ([x, ...xs]) => 
	x === undefined ?
	true : 
	f(x) && every(f)(xs)

const some = f => ([x, ...xs]) => 
	x === undefined ?
	false : 
	f(x) || some(f)(xs)

const includes = ele => ([x, ...xs]) =>
	x === undefined ?
	false :
	ele === x ? true : includes(ele)(xs)

const zipWith = f => ([x, ...xs], [y, ...xy]) => 
	x === undefined || y === undefined ?
	[] : 
	[f(x, y), ...zipWith(f)(xs, xy)]

const even = n => n % 2 === 0
const odd = n => !even(n)

const range = n =>
	n === 1 ?
	[1] : 
	[...range(n - 1), n]

const preRange = (n, acc) => 
	n === 1 ?
	acc : 
	() => preRange(n - 1, acc.slice(0, 1).concat(n, acc.slice(1)))

const isFunction = f => !!~Object.prototype.toString.call(f).indexOf('Function')

const trampoline = f => (...args) => {
	var result = f.apply(f, args)
	while(isFunction(result)) {
		result = result()
	}
	return result
}

const compose = (...xs) => init => foldr((x, acc) => x(acc))(init)(xs)

const asyncSequence = (...xs) => init => foldl((acc, x) => {
	return acc.then ?
	new Promise((resolve, reject) => {
		acc
		.then(compose(resolve, x))
		.catch(reject)
	}) : x(init)
})(init)(xs)

const quickSort = ([x, ...xs]) =>
	x === undefined ?
	[] :
	[...quickSort(filter(i => i <= x)(xs)), x, ...quickSort(filter(i => i > x)(xs))]

const chain = n => 
	n === 1 ? 
	[1] :
	even(n) ? [n, ...chain(n / 2)] : [n, ...chain(n * 3 + 1)]


// 下面两个是等价的。
length(filter(i => length(i) > 15)(map(chain)(range(100))))
compose(

	length, 
	filter(i => length(i) > 15), 
	map(chain)

)(range(100))

const action1 = asyncSequence(
	n => new Promise((resolve, reject) => setTimeout(() => resolve(n + 1), 1000)),
	n => {
		console.log(n)
		return n
	},
	n => new Promise((resolve, reject) => setTimeout(() => resolve(n + 'hello'), 1000))
)
const action2 = asyncSequence(
	n => new Promise((resolve, reject) => setTimeout(() => resolve(n + ' world'), 1000)),
	n => {
		console.log(n)
		return n
	},
	n => new Promise((resolve, reject) => setTimeout(() => resolve(n + ' my name is Jocs'), 1000))
)

const action3 = asyncSequence(
	action1,
	action2
)

action3(5)
.then(result => console.log(result))

// asyncSequence(
// 	params => fetch1(url1, params),
// 	params => fetch2(url2, params),
// 	params => fetch3(url3, params)
// )(params)
// .then(handleSuccessResponse)
// .catch(handleErrorResponse)











