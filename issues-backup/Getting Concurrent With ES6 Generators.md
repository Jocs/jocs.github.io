### ES6 Generators: Complete Series

1. [The Basics Of ES6 Generators](https://davidwalsh.name/es6-generators)
2. [Diving Deeper With ES6 Generators](https://davidwalsh.name/es6-generators-dive)
3. [Going Async With ES6 Generators](https://davidwalsh.name/async-generators)
4. [Getting Concurrent With ES6 Generators](https://davidwalsh.name/concurrent-generators)

If you've read and digested [part 1](https://davidwalsh.name/es6-generators/), [part 2](https://davidwalsh.name/es6-generators-dive/), and [part 3](https://davidwalsh.name/async-generators/) of this blog post series, you're probably feeling pretty confident with ES6 generators at this point. Hopefully you're inspired to really push the envelope and see what you can do with them.

Our final topic to explore is kinda bleeding edge stuff, and may twist your brain a bit (still twisting mine, TBH). Take your time working through and thinking about these concepts and examples. Definitely read other writings on the topic.

The investment you make here will really pay off in the long run. I'm totally convinced that the future of sophisticated async capability in JS is going to rise from these ideas.

## Formal CSP (Communicating Sequential Processes)

First off, I am completely inspired in this topic almost entirely due to the fantastic work of [David Nolen](http://github.com/swannodette) [@swannodette](http://twitter.com/swannodette). Seriously, read whatever he writes on the topic. Here's some links to get you started:

- ["Communicating Sequential Processes"](http://swannodette.github.io/2013/07/12/communicating-sequential-processes/)
- ["ES6 Generators Deliver Go Style Concurrency"](http://swannodette.github.io/2013/08/24/es6-generators-and-csp/)
- ["Extracting Processes"](http://swannodette.github.io/2013/07/31/extracting-processes/)

OK, now to my exploration of the topic. I don't come to JS from a formal background in Clojure, nor do I have any experience with Go or ClojureScript. I found myself quickly getting kinda lost in those readings, and I had to do a lot of experimentation and educated guessing to glean useful bits from it.

In the process, I think I've arrived at something that's of the same spirit, and goes after the same goals, but comes at it from a much-less-formal way of thinking.

What I've tried to do is build up a simpler take on the Go-style CSP (and ClojureScript core.async) APIs, while preserving (I hope!) most of the underlying capabilities. It's entirely possible that those smarter than me on this topic will quickly see things I've missed in my explorations thus far. If so, I hope my explorations will evolve and progress, and I'll keep sharing such revelations with you readers!

## Breaking CSP Theory Down (a bit)

What is CSP all about? What does it mean to say "communicating"? "Sequential"? What are these "processes"?

First and foremost, CSP comes from [Tony Hoare's book *"Communicating Sequential Processes"*](http://www.usingcsp.com/). It's heavy CS theory stuff, but if you're interested in the academic side of things, that's the best place to start. I am by no means going to tackle the topic in a heady, esoteric, computer sciency way. I'm going to come at it quite informally.

So, let's start with "sequential". This is the part you should already be familiar with. It's another way of talking about single-threaded behavior and the sync-looking code that we get from ES6 generators.

Remember how generators have syntax like this:

```javascript
function *main() {
    var x = yield 1;
    var y = yield x;
    var z = yield (y * 2);
}
```

Each of those statements is executed sequentially (in order), one at a time. The `yield` keyword annotates points in the code where a blocking pause (blocking only in the sense of the generator code itself, not the surrounding program!) may occur, but that doesn't change anything about the top-down handling of the code inside `*main()`. Easy enough, right?

Next, let's talk about "processes". What's that all about?

Essentially, a generator sort of acts like a virtual "process". It's a self-contained piece of our program that could, if JavaScript allowed such things, run totally in parallel to the rest of the program.

Actually, that'd fudging things a little bit. If the generator accesses shared memory (that is, if it accessed "free variables" besides its own internal local variables), it's not quite so independent. But let's just assume for now we have a generator function that doesn't access outside variables (so FP theory would call it a "combinator"). So, it could *in theory* run in/as its own process.

But we said "processes" -- plural -- because the important part here is having two or more going *at once*. In other words, two or more generators that are paired together, generally to cooperate to complete some bigger task.

Why separate generators instead of just one? The most important reason: **separation of capabilities/concerns**. If you can look at task XYZ and break it down into constituent sub-tasks like X, Y, and Z, then implementing each in its own generator tends to lead to code that can be more easily reasoned about and maintained.

This is the same sort of reasoning you use when you take a function like `function XYZ()` and break it down into `X()`, `Y()`, and `Z()` functions, where `X()`calls `Y()`, and `Y()` calls `Z()`, etc. We break down functions into separate functions to get better separation of code, which makes code easier to maintain.

**We can do the same thing with multiple generators.**

Finally, "communicating". What's that all about? It flows from the above -- cooperation -- that if the generators are going to work together, they need a communication channel (not just access to the shared surrounding lexical scope, but a real shared communication channel they all are given exclusive access to).

What goes over this communication channel? Whatever you need to send (numbers, strings, etc). In fact, you don't even need to actually send a message over the channel to communicate over the channel. "Communication" can be as simple as coordination -- like transferring control from one to another.

Why transferring control? Primarily because JS is single-threaded and literally only one of them can be actively running at any given moment. The others then are in a running-paused state, which means they're in the middle of their tasks, but are just suspended, waiting to be resumed when necessary.

It doesn't seem to be realistic that arbitrary independent "processes" could *magically*cooperate and communicate. The goal of loose coupling is admirable but impractical.

Instead, it seems like any successful implementation of CSP is an intentional factorization of an existing, well-known set of logic for a problem domain, where each piece is designed specifically to work well with the other pieces.

Maybe I'm totally wrong on this, but I don't see any pragmatic way yet that any two random generator functions could somehow easily be glued together into a CSP pairing. They would both need to be designed to work with the other, agree on the communication protocol, etc.

## CSP In JS

There are several interesting explorations in CSP theory applied to JS.

The aforementioned David Nolen has several interesting projects, including [Om](https://github.com/swannodette/om), as well as [core.async](http://www.hakkalabs.co/articles/core-async-a-clojure-library/). The [Koa](http://koajs.com/) library (for node.js) has a very interesting take, primarily through its `use(..)` method. Another library that's pretty faithful to the core.async/Go CSP API is [js-csp](https://github.com/ubolonton/js-csp).

You should definitely check out those great projects to see various approaches and examples of how CSP in JS is being explored.

### asynquence's `runner(..)`: Designing CSP

Since I've been trying intensely to explore applying the CSP pattern of concurrency to my own JS code, it was a natural fit for me to extend my async flow-control lib [asynquence](http://github.com/getify/asynquence) with CSP capability.

I already had the [`runner(..)`](https://github.com/getify/asynquence/tree/master/contrib#runner-plugin) plugin utility which handles async running of generators (see ["Part 3: Going Async With Generators"](https://davidwalsh.name/async-generators/#rungenerator-library-utility)), so it occurred to me that it could be fairly easily extended to handle multiple generators at the same time [in a CSP-like fashion](https://github.com/getify/asynquence/tree/master/contrib#csp-style-concurrency).

The first design question I tackled: how do you know which generator gets control *next*?

It seemed overly cumbersome/clunky to have each one have some sort of *ID* that the others have to know about, so they can address their messages or control-transfer explicitly to another process. After various experiments, I settled on a simple round-robin scheduling approach. So if you pair three generators A, B, and C, A will get control first, then B takes over when A yields control, then C when B yields control, then A again, and so on.

But how should we actually transfer control? Should there be an explicit API for it? Again, after many experiments, I settled on a more implicit approach, which seems to (completely accidentally) be similar to how [Koa does it](http://koajs.com/#cascading): each generator gets a reference to a shared "token" -- `yield`ing it will signal control-transfer.

Another issue is what the message channel should *look* like. On one end of the spectrum you have a pretty formalized communication API like that in core.async and js-csp (`put(..)` and `take(..)`). After my own experiments, I leaned toward the other end of the spectrum, where a much less formal approach (not even an API, just a shared data structure like an `array`) seemed appropriate and sufficient.

I decided on having an array (called `messages`) that you can arbitrarily decide how you want to fill/drain as necessary. You can `push()` messages onto the array, `pop()`messages off the array, designate by convention specific slots in the array for different messages, stuff more complex data structures in these slots, etc.

My suspicion is that some tasks will need really simple message passing, and some will be much more complex, so rather than forcing complexity on the simple cases, I chose not to formalize the message channel beyond it being an `array` (and thus no API except that of `array`s themselves). It's easy to layer on additional formalism to the message passing mechanism in the cases where you'll find it useful (see the *state machine* example below).

Finally, I observed that these generator "processes" still benefit from the [async capabilities that stand-alone generators](https://davidwalsh.name/async-generators/) can use. In other words, if instead of `yield`ing out the control-token, you `yield` out a Promise (or *asynquence* sequence), the `runner(..)` mechanism will indeed pause to wait for that future value, but will **not transfer control** -- instead, it will return the result value back to the current process (generator) so it retains control.

That last point might be (if I interpret things correctly) the most controversial or unlike the other libraries in this space. It seems that true CSP kind of turns its nose at such approaches. However, I'm finding having that option at my disposal to be very, very useful.

## A Silly FooBar Example

Enough theory. Let's just dive into some code:

```javascript
// Note: omitting fictional `multBy20(..)` and
// `addTo2(..)` asynchronous-math functions, for brevity

function *foo(token) {
    // grab message off the top of the channel
    var value = token.messages.pop(); // 2

    // put another message onto the channel
    // `multBy20(..)` is a promise-generating function
    // that multiplies a value by `20` after some delay
    token.messages.push( yield multBy20( value ) );

    // transfer control
    yield token;

    // a final message from the CSP run
    yield "meaning of life: " + token.messages[0];
}

function *bar(token) {
    // grab message off the top of the channel
    var value = token.messages.pop(); // 40

    // put another message onto the channel
    // `addTo2(..)` is a promise-generating function
    // that adds value to `2` after some delay
    token.messages.push( yield addTo2( value ) );

    // transfer control
    yield token;
}
```

OK, so there's our two generator "processes", `*foo()` and `*bar()`. You'll notice both of them are handed the `token` object (you could call it whatever you want, of course). The `messages` property on the `token` is our shared message channel. It starts out filled with the message(s) passed to it from the initialization of our CSP run (see below).

`yield token` explicitly transfers control to the "next" generator (round-robin order). However, `yield multBy20(value)` and `yield addTo2(value)` are both yielding promises (from these fictional delayed-math functions), which means that the generator is paused at that moment until the promise completes. Upon promise resolution, the currently-in-control generator picks back up and keeps going.

Whatever the final `yield`ed value is, in this case the `yield "meaning of...`expression statement, that's the completion message of our CSP run (see below).

Now that we have our two CSP process generators, how do we run them? Using *asynquence*:

```javascript
// start out a sequence with the initial message value of `2`
ASQ( 2 )

// run the two CSP processes paired together
.runner(
    foo,
    bar
)

// whatever message we get out, pass it onto the next
// step in our sequence
.val( function(msg){
    console.log( msg ); // "meaning of life: 42"
} );
```

Obviously, this is a trivial example. But I think it illustrates the concepts pretty well.

Now might be a good time to [go try it yourself](http://jsbin.com/tunec/2/edit?js,console) (try changing the values around!) to make sure these concepts make sense and that you can code it up yourself!

## Another Toy Demo Example

Let's now examine one of the classic CSP examples, but let's come at it from the simple observations I've made thus far, rather than from the academic-purist perspective it's usually derived from.

**Ping-pong**. What a fun game, huh!? It's my favorite *sport*.

Let's imagine you have implemented code that plays a ping-pong game. You have a loop that runs the game, and you have two pieces of code (for instance, branches in an `if` or `switch` statement) that each represent the respective player.

Your code works fine, and your game runs like a ping-pong champ!

But what did I observe above about why CSP is useful? **Separation of concerns/capabilities.** What are our separate capabilities in the ping-pong game? *The two players!*

So, we could, at a very high level, model our game with two "processes" (generators), one for each *player*. As we get into the details of it, we will realize that the "glue code" that's shuffling control between the two players is a task in and of itself, and *this* code could be in a third generator, which we could model as the game *referee*.

We're gonna skip over all kinds of domain-specific questions, like scoring, game mechanics, physics, game strategy, AI, controls, etc. The only part we care about here is really just simulating the back-and-forth pinging (which is actually our metaphor for CSP control-transfer).

**Wanna see the demo? Run it now** (note: use a very recent nightly of FF or Chrome, with ES6 JavaScript support, to see generators work)

Now, let's look at the code piece by piece.

First, what does the *asynquence* sequence look like?

```javascript
ASQ(
    ["ping","pong"], // player names
    { hits: 0 } // the ball
)
.runner(
    referee,
    player,
    player
)
.val( function(msg){
    message( "referee", msg );
} );
```

We set up our sequence with two initial messages: `["ping","pong"]` and `{ hits: 0 }`. We'll get to those in a moment.

Then, we set up a CSP run of 3 processes (coroutines): the `*referee()` and two `*player()` instances.

The final message at the end of the game is passed along to the next step in our sequence, which we then output as a message *from the referee*.

The implementation of the referee:

```javascript
function *referee(table){
    var alarm = false;

    // referee sets an alarm timer for the game on
    // his stopwatch (10 seconds)
    setTimeout( function(){ alarm = true; }, 10000 );

    // keep the game going until the stopwatch
    // alarm sounds
    while (!alarm) {
        // let the players keep playing
        yield table;
    }

    // signal to players that the game is over
    table.messages[2] = "CLOSED";

    // what does the referee say?
    yield "Time's up!";
}
```

I've called the control-token `table` to match the problem domain (a ping-pong game). It's a nice semantic that a player "yields the table" to the other when he hits the ball back, isn't it?

The `while` loop in `*referee()` just keeps yielding the `table` back to the players as long as his alarm on his stopwatch hasn't gone off. When it does, he takes over and declares the game over with `"Time's up!"`.

Now, let's look at the `*player()` generator (which we use two instances of):

```javascript
function *player(table) {
    var name = table.messages[0].shift();
    var ball = table.messages[1];

    while (table.messages[2] !== "CLOSED") {
        // hit the ball
        ball.hits++;
        message( name, ball.hits );

        // artificial delay as ball goes back to other player
        yield ASQ.after( 500 );

        // game still going?
        if (table.messages[2] !== "CLOSED") {
            // ball's now back in other player's court
            yield table;
        }
    }

    message( name, "Game over!" );
}
```

The first player takes his name off the first message's array (`"ping"`), then the second player takes his name (`"pong"`), so they can both identify themselves properly. Both players also keep a reference to the shared `ball` object (with its `hits` counter).

While the players haven't yet heard the closing message from the referee, they "hit" the `ball` by upping its `hits` counter (and outputting a message to announce it), then they wait for `500` ms (just to fake the ball *not* traveling at the speed of light!).

If the game is still going, they then "yield the table" back to the other player.

That's it!

[Take a look at the demo's code](http://jsbin.com/qutabu/1/edit?js,output) to get a complete in-context code listing to see all the pieces working together.

## State Machine: Generator Coroutines

One last example: defining a [state machine](http://en.wikipedia.org/wiki/Finite-state_machine) as a set of generator coroutines that are driven by a simple helper.

[Demo](http://jsbin.com/luron/1/edit?js,console) (note: use a very recent nightly of FF or Chrome, with ES6 JavaScript support, to see generators work)

First, let's define a helper for controlling our finite state handlers:

```javascript
function state(val,handler) {
    // make a coroutine handler (wrapper) for this state
    return function*(token) {
        // state transition handler
        function transition(to) {
            token.messages[0] = to;
        }

        // default initial state (if none set yet)
        if (token.messages.length < 1) {
            token.messages[0] = val;
        }

        // keep going until final state (false) is reached
        while (token.messages[0] !== false) {
            // current state matches this handler?
            if (token.messages[0] === val) {
                // delegate to state handler
                yield *handler( transition );
            }

            // transfer control to another state handler?
            if (token.messages[0] !== false) {
                yield token;
            }
        }
    };
}
```

This `state(..)` helper utility creates a [delegating-generator](https://davidwalsh.name/es6-generators-dive#delegating-generators) wrapper for a specific state value, which automatically runs the state machine, and transfers control at each state transition.

Purely by convention, I've decided the shared `token.messages[0]` slot will hold the current state of our state machine. That means you can seed the initial state by passing in a message from the previous sequence step. But if no such initial message is passed along, we simply default to the first defined state as our initial state. Also, by convention, the final terminal state is assumed to be `false`. That's easy to change as you see fit.

State values can be whatever sort of value you'd like: `number`s, `string`s, etc. As long as the value can be strict-tested for equality with a `===`, you can use it for your states.

In the following example, I show a state machine that transitions between four `number` value states, in this particular order: `1 -> 4 -> 3 -> 2`. For demo purposes only, it also uses a counter so that it can perform the transition loop more than once. When our generator state machine finally reaches the terminal state (`false`), the *asynquence* sequence moves onto the next step, just as you'd expect.

```javascript
// counter (for demo purposes only)
var counter = 0;

ASQ( /* optional: initial state value */ )

// run our state machine, transitions: 1 -> 4 -> 3 -> 2
.runner(

    // state `1` handler
    state( 1, function*(transition){
        console.log( "in state 1" );
        yield ASQ.after( 1000 ); // pause state for 1s
        yield transition( 4 ); // goto state `4`
    } ),

    // state `2` handler
    state( 2, function*(transition){
        console.log( "in state 2" );
        yield ASQ.after( 1000 ); // pause state for 1s

        // for demo purposes only, keep going in a
        // state loop?
        if (++counter < 2) {
            yield transition( 1 ); // goto state `1`
        }
        // all done!
        else {
            yield "That's all folks!";
            yield transition( false ); // goto terminal state
        }
    } ),

    // state `3` handler
    state( 3, function*(transition){
        console.log( "in state 3" );
        yield ASQ.after( 1000 ); // pause state for 1s
        yield transition( 2 ); // goto state `2`
    } ),

    // state `4` handler
    state( 4, function*(transition){
        console.log( "in state 4" );
        yield ASQ.after( 1000 ); // pause state for 1s
        yield transition( 3 ); // goto state `3`
    } )

)

// state machine complete, so move on
.val(function(msg){
    console.log( msg );
});
```

Should be fairly easy to trace what's going on here.

`yield ASQ.after(1000)` shows these generators can do any sort of promise/sequence based async work as necessary, as we've seen earlier. `yield transition(..)` is how we transition to a new state.

Our `state(..)` helper above actually does the *hard work* of handling the [`yield*`delegation](https://davidwalsh.name/es6-generators-dive#delegating-generators) and transition juggling, leaving our state handlers to be expressed in a very simple and natural fashion.

## Summary

The key to CSP is joining two or more generator "processes" together, giving them a shared communication channel, and a way to transfer control between each other.

There are a number of libraries that have more-or-less taken a fairly formal approach in JS that matches Go and Clojure/ClojureScript APIs and/or semantics. All of these libraries have really smart developers behind them, and they all represent great resources for further investigation/exploration.

[asynquence](http://github.com/getify/asynquence) tries to take a somewhat less-formal approach while hopefully still preserving the main mechanics. If nothing else, *asynquence*'s [`runner(..)`](https://github.com/getify/asynquence/tree/master/contrib#runner-plugin) makes it pretty easy to start [playing around with CSP-like generators](https://github.com/getify/asynquence/tree/master/contrib#csp-style-concurrency) as you experiment and learn.

The best part though is that *asynquence* CSP works inline [with the rest of](https://davidwalsh.name/asynquence-part-1) its [other async capabilities](https://davidwalsh.name/asynquence-part-2) (promises, generators, flow control, etc). That way, you get the best of all worlds, and you can use whichever tools are appropriate for the task at hand, all in one small lib.

Now that we've explored generators in quite a bit of detail over these last four posts, my hope is that you're excited and inspired to explore how you can revolutionize your own async JS code! What will you build with generators?