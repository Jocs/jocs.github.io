[Share this page](https://twitter.com/intent/tweet?url=https%3A%2F%2Flearnxinyminutes.com%2Fdocs%2Felm%2F&text=Learn+X+in+Y+minutes%2C+where+X%3DElm)

# [Learn X in Y minutes](https://learnxinyminutes.com/)

## Where X=Elm

## 初识Elm语言你只需Y分钟

Elm is a functional reactive programming language that compiles to (client-side) JavaScript. Elm is statically typed, meaning that the compiler catches most errors immediately and provides a clear and understandable error message. Elm is great for designing user interfaces and games for the web.

Elm是一种函数响应式编程语言，可以被编译成（客户端）JavaScript。同时Elm也是一种静态类型语言，这意味着编译器能够在编译的过程中立即捕获大部分错误，并且Elm提供了清晰、易懂的错误信息。Elm语言在设计用户交互（user interfaces）和网页游戏方面表现格外出色。

```haskell
-- Single line comments start with two dashes.
-- 通过两个连续破折号来进行单行注释
{- Multiline comments can be enclosed in a block like this.
{- They can be nested. -}
-}
{- 多行注释可以包含在像这样的一个代码块中。
{- 多行注释支持嵌套 -}
-}

{-- The Basics --}
{-- 基础部分 --}

-- Arithmetic
-- 算术
1 + 1 -- 2
8 - 1 -- 7
10 * 2 -- 20

-- Every number literal without a decimal point can be either an Int or a Float.
-- 没有小数点的数字字面量即可能是Int型，也可能是Float型。
33 / 2 -- 16.5 with floating point division
33 // 2 -- 16 with integer division

-- Exponents
-- 指数
5 ^ 2 -- 25

-- Booleans
-- 布尔值
not True -- False
not False -- True
1 == 1 -- True
1 /= 1 -- False
1 < 10 -- True

-- Strings and characters
-- 字符串和单个字符
"This is a string because it uses double quotes."
'a' -- characters in single quotes -- 单个字符通过单引号表示


-- Strings can be appended.
-- 字符串可以拼接(译者注：Elm中字符串拼接是通过两个加号，而JavaScript字符串拼接是通过一个加号或者
-- 模板语法)
"Hello " ++ "world!" -- "Hello world!"

{-- Lists, Tuples, and Records --}
{-- 列表，元组， Records (译者注：Records没有翻译 )--}

-- Every element in a list must have the same type.
-- 列表中的每一个元素必须是相同的类型(译者注：JavaScript中的Array中的元素可以是任意类型)
["the", "quick", "brown", "fox"]
[1, 2, 3, 4, 5]
-- The second example can also be written with two dots.
-- 上面的第二个例子也可以写成如下形式，1和5之间通过连个点表示1到5连续数字组成的list。
[1..5]

-- Append lists just like strings.
-- 列表也可以像字符串一样通过加号进行拼接
[1..5] ++ [6..10] == [1..10] -- True

-- To add one item, use "cons".
-- 通过"cons"向一个列表添加一个元素
0 :: [1..5] -- [0, 1, 2, 3, 4, 5]

-- The head and tail of a list are returned as a Maybe. Instead of checking
-- every value to see if it's null, you deal with missing values explicitly.
-- 通过head或者tail方法获取一个列表的头部或者尾部会返回一个Maybe类型。
-- 通过Maybe类型能够更明确的处理缺失值，而不需要检查list中的每个元素是否为null。
List.head [1..5] -- Just 1
List.tail [1..5] -- Just [2, 3, 4, 5]
List.head [] -- Nothing
-- List.functionName means the function lives in the List module.
-- List.functionName 意味着该方法存在于List模块中。

-- Every element in a tuple can be a different type, but a tuple has a
-- fixed length.
-- 元组中的元素可以是不同的类型，但是元组是固定长度的。
-- (译者注：JavaScript中的数组可以任意添加或删除某个元素，因此长度是不固定的。)
("elm", 42)

-- Access the elements of a pair with the first and second functions.
-- (This is a shortcut; we'll come to the "real way" in a bit.)
-- 可以通过first和second 方法来获取元组中的特定元素。
-- (这是一种快捷方式，稍后我们将使用一些“真正”的方法来获取元组中的值)
fst ("elm", 42) -- "elm"
snd ("elm", 42) -- 42

-- The empty tuple, or "unit", is sometimes used as a placeholder.
-- It is the only value of its type, also called "Unit".
-- 空元组，或者称为"unit",通常被用作占位符。
-- 空元组诗该类型的唯一值，通常也被称为"Unit"。
()

-- Records are like tuples but the fields have names. The order of fields
-- doesn't matter. Notice that record values use equals signs, not colons.
-- Records 类似元组，但是每个字断有自己的名字，并且Records对字断的顺序没有要求，需要注意的是，
-- record 中的值使用的‘等号’而非‘冒号’来表示的。
{ x = 3, y = 7 }

-- Access a field with a dot and the field name.
-- 获取record中某个字断的值可以用过dot语法形式。
{ x = 3, y = 7 }.x -- 3

-- Or with an accessor function, which is a dot and the field name on its own.
-- 也可以通过一个获取函数，通过一个‘点’号和该record的字断名作为函数名来获取该字断值。
.y { x = 3, y = 7 } -- 7

-- Update the fields of a record. (It must have the fields already.)
-- 更新record中的某一字段。(record中必须包含该字段)
{ person |
  name = "George" }

-- Update multiple fields at once, using the current values.
-- 通过record中的当前值一次更新record中多个字段。
{ particle |
  position = particle.position + particle.velocity,
  velocity = particle.velocity + particle.acceleration }

{-- Control Flow --}
{-- 控制流 --}

-- If statements always have an else, and the branches must be the same type.
-- If语句总是会紧接一个else语句，同时分支值必须是相同类型。(译者注：JavaScript中的If语句可以独立
-- else语句单独使用)
if powerLevel > 9000 then
  "WHOA!"
else
  "meh"

-- If statements can be chained.
-- If语句可以链式使用。
if n < 0 then
  "n is negative"
else if n > 0 then
  "n is positive"
else
  "n is zero"

-- Use case statements to pattern match on different possibilities.
-- 通过case语句可以对各种可能性进行模式匹配。
case aList of
  [] -> "matches the empty list"
  [x]-> "matches a list of exactly one item, " ++ toString x
  x::xs -> "matches a list of at least one item whose head is " ++ toString x
-- Pattern matches go in order. If we put [x] last, it would never match because
-- x::xs also matches (xs would be the empty list). Matches do not "fall through".
-- The compiler will alert you to missing or extra cases.
-- 模式匹配是按顺序执行。如果我们把[x]放在上面表达式最后面，作为case语句的最后一个可能性，它将永远
-- 不会被匹配到。因为x::xs也会匹配到只包含一个元素的列表(因为xs可能为空列表)。模式匹配不会"fall
-- through",也就是说，当匹配到某一可能性后，就不会再往下匹配了。当我们的case语句并没有包含所有可能
-- 性或者多余的case语句时，编译器都会报错。


-- Pattern match on a Maybe.
-- 对Maybe类型进行模式匹配
case List.head aList of
  Just x -> "The head is " ++ toString x
  Nothing -> "The list was empty."

{-- Functions --}
{-- 函数 --}

-- Elm's syntax for functions is very minimal, relying mostly on whitespace
-- rather than parentheses and curly brackets. There is no "return" keyword.
-- Elm的函数语法非常简洁，依赖空格符而非小括号或者大括号来进行函数调用或者函数申明。
-- Elm语言中的函数没有"return"语句。

-- Define a function with its name, arguments, an equals sign, and the body.
-- 通过函数名、形参、等号和函数主体这几个部分来定义一个函数。
multiply a b =
  a * b

-- Apply (call) a function by passing it arguments (no commas necessary).
-- 通过传递实参来调用一个函数(在参数之间没有逗号)
multiply 7 6 -- 42

-- Partially apply a function by passing only some of its arguments.
-- Then give that function a new name.
-- 通过传递部分参数到一个函数中来对函数进行部分应用。
-- 同时给该部分应用函数一个新的名字。
double =
  multiply 2

-- Constants are similar, except there are no arguments.
-- 定义常量和定义函数类似，除了定义常量没有参数。
answer =
  42

-- Pass functions as arguments to other functions.
-- 可以把函数作为参数传递给另一个函数。
List.map double [1..4] -- [2, 4, 6, 8]

-- Or write an anonymous function.
-- 或者通过匿名函数形式。
List.map (\a -> a * 2) [1..4] -- [2, 4, 6, 8]

-- You can pattern match in function definitions when there's only one case.
-- This function takes one tuple rather than two arguments.
-- 在进行函数定义同时只有唯一可能性的时候，我们可以使用到模式匹配。
-- 下面的例子中函数使用了一个元组作为参数而不是两个独立的参数。
area (width, height) =
  width * height

area (6, 7) -- 42

-- Use curly brackets to pattern match record field names.
-- Use let to define intermediate values.
-- 通过大括号语法可以匹配record的字段名。
-- 通过let...in...语句来定义来定义一些将要立即使用的值。
volume {width, height, depth} =
  let
    area = width * height
  in
    area * depth

volume { width = 3, height = 2, depth = 7 } -- 42

-- Functions can be recursive.
-- 函数可以递归调用。
fib n =
  if n < 2 then
    1
  else
    fib (n - 1) + fib (n - 2)

List.map fib [0..8] -- [1, 1, 2, 3, 5, 8, 13, 21, 34]

-- Another recursive function (use List.length in real code).
-- 另一个递归函数的例子(通过递归函数来实现List.length方法)
listLength aList =
  case aList of
    [] -> 0
    x::xs -> 1 + listLength xs

-- Function calls happen before any infix operator. Parens indicate precedence.
-- 函数调用的优先级比任何中缀运算符都高，使用小括号意味着更高的优先级。
cos (degrees 30) ^ 2 + sin (degrees 30) ^ 2 -- 1
-- First degrees is applied to 30, then the result is passed to the trig
-- functions, which is then squared, and the addition happens last.
-- 首先degrees方法运用到30上面，然后该方法调用的结果传递个三角函数，再然后取平方，最后才是
-- 加法运算符

{-- Types and Type Annotations --}
{-- 类型及类型推断 --}

-- The compiler will infer the type of every value in your program.
-- Types are always uppercase. Read x : T as "x has type T".
-- Some common types, which you might see in Elm's REPL.
-- 编译器会推断你的程序中的每一个值的类型。
-- 类型通常是首字母大写。Read x : T意思是"x 属于 T类型"
-- 你可以通过Elm REPL来查看Elm的常用类型。

5 : Int
6.7 : Float
"hello" : String
True : Bool

-- Functions have types too. Read -> as "goes to". Think of the rightmost type
-- as the type of the return value, and the others as arguments.
-- 函数也具有类型，'->'符号的右边是函数返回值的类型，左边是函数参数的类型。
not : Bool -> Bool
round : Float -> Int

-- When you define a value, it's good practice to write its type above it.
-- The annotation is a form of documentation, which is verified by the compiler.
-- 当你定义一个值的时候，最佳实践就是把该值的类型写在定义的上面。
-- 该类型声明是文档的一种形式，编译器可以通过该类型声明来验证函数调用的正确性。
double : Int -> Int
double x = x * 2

-- Function arguments are passed in parentheses.
-- Lowercase types are type variables: they can be any type, as long as each
-- call is consistent.
-- 当函数作为参数传递给另一个函数时，函数类型声明通常需要使用小括号括起来。
-- 小写的类型是类型参数，类型参数可以是任意类型，只要每次传递给类型构造函数都是一致的就行了。
List.map : (a -> b) -> List a -> List b
-- "List dot map has type a-goes-to-b, goes to list of a, goes to list of b."

-- There are three special lowercase types: number, comparable, and appendable.
-- Numbers allow you to use arithmetic on Ints and Floats.
-- Comparable allows you to order numbers and strings, like a < b.
-- Appendable things can be combined with a ++ b.
-- 有三种比较特殊的小写开头的类型：number、comparable、和appendable。
-- Numbers类型类允许你对Int或者Float类型的值进行算术运算。
-- Comparable类型类允许你比较数字或者字符串，比如：a < b。
-- Appendable类型类是具有如下特征的类型的集合，具有该特征的类型的值可以进行拼接运算a ++ b。

{-- Type Aliases and Union Types --}
{-- 类型别名和Union类型 --}

-- When you write a record or tuple, its type already exists.
-- (Notice that record types use colon and record values use equals.)
-- 当你书写一个record或者元组的时候，其类型已经存在。
-- (注意record类型使用冒号而record值定义时使用等号)
origin : { x : Float, y : Float, z : Float }
origin =
  { x = 0, y = 0, z = 0 }

-- You can give existing types a nice name with a type alias.
-- 通过type alias 可一个已经存在的类型去一个好听的别名。
type alias Point3D =
  { x : Float, y : Float, z : Float }

-- If you alias a record, you can use the name as a constructor function.
-- 如果你给一个record取了一个别名，你也就可以使用该别名作为一个构造函数来定义变量。
otherOrigin : Point3D
otherOrigin =
  Point3D 0 0 0

-- But it's still the same type, so you can equate them.
-- 因为无论是用别名还是最初的类型，它们始终具有相同类型，因此它们也应该相等。
origin == otherOrigin -- True

-- By contrast, defining a union type creates a type that didn't exist before.
-- A union type is so called because it can be one of many possibilities.
-- Each of the possibilities is represented as a "tag".
--  与type aliases相比之下，定义一个union 类型意味着该类型以前时不存在的。
-- 一个union type之所以称之为‘并集’类型时因为该类型可以取不同的值。
-- 并且每一个值代表一个'tag'。
type Direction =
  North | South | East | West

-- Tags can carry other values of known type. This can work recursively.
-- Tags可以包含其他已知类型的值，并且支持递归。
type IntTree =
  Leaf | Node Int IntTree IntTree
-- "Leaf" and "Node" are the tags. Everything following a tag is a type.
-- "Leaf"和"Node"是tags.任何tag之后的都是某一类型。

-- Tags can be used as values or functions.
-- Tags可以被当作某一值使用也可以作为函数调用。
root : IntTree
root =
  Node 7 Leaf Leaf

-- Union types (and type aliases) can use type variables.
-- Union types(和类型别名)可以拥有自己的类型变量。
type Tree a =
  Leaf | Node a (Tree a) (Tree a)
-- "The type tree-of-a is a leaf, or a node of a, tree-of-a, and tree-of-a."

-- Pattern match union tags. The uppercase tags will be matched exactly. The
-- lowercase variables will match anything. Underscore also matches anything,
-- but signifies that you aren't using it.
-- 对union tags进行模式匹配，大写的tags将被明确的匹配，而小写的变量讲匹配任意类型。
-- 下划线匹配任意值。
-- 但是也意味着你不会使用到下划线表示的值。
leftmostElement : Tree a -> Maybe a
leftmostElement tree =
  case tree of
    Leaf -> Nothing
    Node x Leaf _ -> Just x
    Node _ subtree _ -> leftmostElement subtree

-- That's pretty much it for the language itself. Now let's see how to organize
-- and run your code.
-- 上面的介绍对于Elm语言本身已经介绍够多了，现在让我们来组织我们的代码并让其运行起来吧。

{-- Modules and Imports --}
{-- 模块和模块引入 --}

-- The core libraries are organized into modules, as are any third-party
-- libraries you may use. For large projects, you can define your own modules.
-- Elm的核心库是通过模块来组织的，同时其他第三方的类库也是通过模块开组织的。
-- 对于大型的项目，你可能会使用到类库，同时也会定义自己的模块。


-- Put this at the top of the file. If omitted, you're in Main.
-- 把模块申明放到文件的顶部，如果没有模块申明，这些代码将在Main中。
module Name where

-- By default, everything is exported. You can specify exports explicity.
-- 默认情况下，模块中的所有函数、类型都是暴露出去的，你也可以通过如下形式暴露特定的方法或者类型到外部。
module Name (MyType, myValue) where

-- One common pattern is to export a union type but not its tags. This is known
-- as an "opaque type", and is frequently used in libraries.
-- 一种常见的模式就是暴露union type而非union type的tags到外部，该模式通常被称作"opaque type"
-- 该模式在类库中经常被使用到。

-- Import code from other modules to use it in this one.
-- Places Dict in scope, so you can call Dict.insert.
-- 通过import关键字来引入其他模块到本模块中。
-- 通过import语句，我们把Dict引入到了我们的代码中，这样我也就能够使用Dict.insert方法了。
import Dict

-- Imports the Dict module and the Dict type, so your annotations don't have to
-- say Dict.Dict. You can still use Dict.insert.
-- 引入Dict模块和Dict类型，因此你的类型注释没必要写成Dict.Dict。
-- 你依然可以写成Dict.insert。
import Dict exposing (Dict)

-- Rename an import.
-- 重命名引入的模块
import Graphics.Collage as C

{-- Ports --}
{-- 端口 --}

-- A port indicates that you will be communicating with the outside world.
-- Ports are only allowed in the Main module.
-- 一个端口意味着你可以通过该端口和外部世界通信。
-- 同时端口只允许在主模块中使用。

-- An incoming port is just a type signature.
-- 一个输入的端口其实就是一个类型注解。
port clientID : Int

-- An outgoing port has a definition.
-- 一个输出的端口需要进行定义。
port clientOrders : List String
port clientOrders = ["Books", "Groceries", "Furniture"]

-- We won't go into the details, but you set up callbacks in JavaScript to send
-- on incoming ports and receive on outgoing ports.
-- 我们并不会详细的讨论什么是端口及端口的使用，你仅需知道当我们使用端口的时候，我们还需要设置好
-- JavaScript的回调函数来发送信息到接收端口和通过回调函数来接收输出端口的信息。
-- (译者注：this part need review)

{-- Command Line Tools --}
{-- 命令行工具 --}

-- Compile a file.
-- 编译一个.elm文件。
$ elm make MyFile.elm

-- The first time you do this, Elm will install the core libraries and create
-- elm-package.json, where information about your project is kept.
-- 当你第一个使用上面的命令进行编译文件时，Elm会自动安装核心库并生成一个elm-package.json文件，
-- 该文件用来保存你项目的主要信息。

-- The reactor is a server that compiles and runs your files.
-- Click the wrench next to file names to enter the time-travelling debugger!
-- reactor是一个服务器，用来编译和运行你的代码。
-- 点击文件名旁边的扳手符号可以启动时空之旅来进行debugger。
-- (译者注：the part need review)
$ elm reactor

-- Experiment with simple expressions in a Read-Eval-Print Loop.
-- 可以通过如下命令在Read-Eval-Print中进行一些代码片段的测试。
$ elm repl

-- Packages are identified by GitHub username and repo name.
-- Install a new package, and record it in elm-package.json.
-- 包名通常通过GitHub的用户名和仓库名来标示。
-- 安装一个Elm依赖包，elm-package.json会自动记录该依赖包。
$ elm package install evancz/elm-html

-- See what changed between versions of a package.
-- 通过如下命令我们可以看到某一依赖包在不同版本下的差异。
$ elm package diff evancz/elm-html 3.0.0 4.0.2
-- Elm's package manager enforces semantic versioning, so minor version bumps
-- will never break your build!
-- elm 依赖包的管理使用了语义化的版本号，因此微笑的版本差异永远不会影响到你代码的构建。
```

The Elm language is surprisingly small. You can now look through almost any Elm source code and have a rough idea of what is going on. However, the possibilities for error-resistant and easy-to-refactor code are endless!

Elm编程语言惊奇的简洁，你现在可以浏览几乎所有的Elm源码并对Elm语言有一个初步的认识，了解Elm语言是怎样运行了。然而，写出稳健并且容易重构的代码依然是无止尽的。

Here are some useful resources.

下面是一些有用的资源。(译者注：以下内容不做翻译)

- The [Elm website](http://elm-lang.org/). Includes:
  - Links to the [installers](http://elm-lang.org/install)
  - [Documentation guides](http://elm-lang.org/docs), including the [syntax reference](http://elm-lang.org/docs/syntax)
  - Lots of helpful [examples](http://elm-lang.org/examples)
- Documentation for [Elm’s core libraries](http://package.elm-lang.org/packages/elm-lang/core/latest/). Take note of:
  - [Basics](http://package.elm-lang.org/packages/elm-lang/core/latest/Basics), which is imported by default
  - [Maybe](http://package.elm-lang.org/packages/elm-lang/core/latest/Maybe) and its cousin [Result](http://package.elm-lang.org/packages/elm-lang/core/latest/Result), commonly used for missing values or error handling
  - Data structures like [List](http://package.elm-lang.org/packages/elm-lang/core/latest/List), [Array](http://package.elm-lang.org/packages/elm-lang/core/latest/Array), [Dict](http://package.elm-lang.org/packages/elm-lang/core/latest/Dict), and [Set](http://package.elm-lang.org/packages/elm-lang/core/latest/Set)
  - JSON [encoding](http://package.elm-lang.org/packages/elm-lang/core/latest/Json-Encode) and [decoding](http://package.elm-lang.org/packages/elm-lang/core/latest/Json-Decode)
- [The Elm Architecture](https://github.com/evancz/elm-architecture-tutorial#the-elm-architecture). An essay by Elm’s creator with examples on how to organize code into components.
- The [Elm mailing list](https://groups.google.com/forum/#!forum/elm-discuss). Everyone is friendly and helpful.
- [Scope in Elm](https://github.com/elm-guides/elm-for-js/blob/master/Scope.md#scope-in-elm) and [How to Read a Type Annotation](https://github.com/elm-guides/elm-for-js/blob/master/How%20to%20Read%20a%20Type%20Annotation.md#how-to-read-a-type-annotation). More community guides on the basics of Elm, written for JavaScript developers.

Go out and write some Elm!

停止阅读文章，开始写几行Elm代码吧！