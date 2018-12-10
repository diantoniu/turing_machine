# Welcome to Algorithm Simulator project.

Currently the project contains two following algorithms:
* __Turing machine algorithm;__
* __Markov algorithm.__

In the following sections you will see a short information 
and examples for the algorithms.

You can also access more documentation by following [link (in ukr)](https://docs.google.com/document/d/14754ouaBgO_RfGjSyRqqN4__binkFO0bNTNBlVl8IVQ/edit?usp=sharing).

Active website: [https://turing-machine.sloppy.zone](https://turing-machine.sloppy.zone/).

## Turing machine (TM)

Turing machine is a mathematical model of computation that 
defines an abstract machine, __which manipulates symbols on
a strip of tape according to a table of rules__. Despite the
model's simplicity, given any computer algorithm, a
Turing machine capable of simulating that algorithm's
logic can be constructed.

### Example

Write a Turing machine that calculates the sum of two 
numbers written in the unary number system.
The type of source data for any algorithm must be strictly
defined.

Therefore, it is impossible to write a 
TM that calculates the sum of two numbers until the 
number system is specified. The unary number system is 
the so-called unitary (or bar) system: what is the 
number - so many ones.

The initial configuration of the Turing machine will be 
_q1_ (111...1 + 1...1)‚ where the number of ones in the 
first addend is ___x___, and the number of ones in the 
second addend is ___y___. The final configuration is required 
to be _q0_ (1...1), where the number of ones equals ___x___ + ___y___. 

To do this, let's develop a plan for the operation of the TM:
1. Erase the first unit;
2. Move the head to the right until the ___+___ sign, which should be replaced by 1;
3. Move the head to the left until the ___λ___ (empty character) sign;
4. Shift the head one character to the right and stop.

The implementation of each item of this plan requires 
its own state, so after writing down commands that implement 
the item of the plan,
the state of the Turing machine should be changed.

Here you have the code. If you put "11+111" to the input - you'll 
get "11111" after running this code.

```
q0 1 → q0 1 R
q0 + → q1 1 R
q1 1→q1 1 R
q1 λ →  q2 λ L
q2 1 → q* λ
```


## Markov algorithm

In theoretical computer science, a Markov algorithm is a 
string rewriting system that uses grammar-like rules to 
operate on strings of symbols. Markov algorithms have been 
shown to be Turing-complete, which means that they are 
suitable as a general model of computation and can represent 
any mathematical expression from its simple notation. 

A Markov Algorithm over an alphabet ___A___ is a finite 
ordered sequence of productions ___x → y___, where ___x___, 
___y ∈ A*___. Some productions may be “Halt” productions. e.g.

```
abc → b
ba → x (halt)
```

Execution proceeds as follows:

1. Let the input string be ___w___;

2. The productions are scanned in sequence, looking for
a production ___x → y___ where ___x___ is a substring of ___w___;

3. The left-most ___x___ in ___w___ is replaced by ___y___;

4. If the production is a halt production, we halt;

5. If no matching production is found, the process halts;

6. If a replacement was made, we repeat from step 2.

### Example

The algoritm:
````
aba → b
ba → b
b → a
````

Execution:
```
aabaaa
abaa
ba
b
a
```



