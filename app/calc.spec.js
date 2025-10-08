/* eslint-disable */
const calc = require("./calc");

test("adds 1 + 2 to equal 3", () => {
  expect(calc.add(1, 2)).toBe(3);
});

test("subtracts 5 - 2 to equal 3", () => {
  expect(calc.subtract(5, 2)).toBe(3);
});

test("multiplies 3 * 4 to equal 12", () => {
  expect(calc.multiply(3, 4)).toBe(12);
});

test("divides 10 / 2 to equal 5", () => {
  expect(calc.divide(10, 2)).toBe(5);
});

test("dividing by zero throws an error", () => {
  expect(() => {
    calc.divide(10, 0);
  }).toThrow("Cannot divide by zero");
});
