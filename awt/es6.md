Sure! Here is a JavaScript program that demonstrates ES6 features such as arrow functions, destructuring, and function generators.

```javascript
// 1. Fat Arrow Functions
const add = (a, b) => a + b;
const greet = (name) => `Hello, ${name}!`;

console.log(add(2, 3)); // Output: 5
console.log(greet("World")); // Output: Hello, World!

// 2. Destructuring
const person = {
  name: "John Doe",
  age: 30,
  address: {
    city: "New York",
    country: "USA",
  },
};

// Object destructuring
const {
  name,
  age,
  address: { city, country },
} = person;
console.log(name); // Output: John Doe
console.log(age); // Output: 30
console.log(city); // Output: New York
console.log(country); // Output: USA

// Array destructuring
const numbers = [1, 2, 3, 4, 5];
const [first, second, ...rest] = numbers;
console.log(first); // Output: 1
console.log(second); // Output: 2
console.log(rest); // Output: [3, 4, 5]

// 3. Function Generators
function* generateSequence() {
  yield 1;
  yield 2;
  yield 3;
  return 4; // This return value is not yielded but can be accessed using the generator's return value
}

const generator = generateSequence();

console.log(generator.next()); // Output: { value: 1, done: false }
console.log(generator.next()); // Output: { value: 2, done: false }
console.log(generator.next()); // Output: { value: 3, done: false }
console.log(generator.next()); // Output: { value: 4, done: true }
console.log(generator.next()); // Output: { value: undefined, done: true }

// Using for...of loop to iterate over generator
for (const value of generateSequence()) {
  console.log(value); // Output: 1 2 3
}
```

### Explanation:

1. **Fat Arrow Functions**:

   - `add` and `greet` are defined using arrow function syntax, which provides a shorter and lexically bound `this`.

2. **Destructuring**:

   - **Object Destructuring**: Extracts `name`, `age`, `city`, and `country` from the `person` object.
   - **Array Destructuring**: Extracts the first and second elements and the rest of the elements into separate variables.

3. **Function Generators**:
   - `generateSequence` is a generator function defined using the `function*` syntax.
   - The `yield` keyword is used to pause the function and return a value.
   - The `next` method resumes the generator's execution and returns an object with `value` and `done` properties.
   - The `for...of` loop iterates over the values yielded by the generator.
