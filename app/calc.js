exports.add = function add(a, b) {
  return a + b;
};

exports.subtract = function subtract(a, b) {
  return a - b;
};

exports.multiply = function multiply(a, b) {
  return a * b;
};

exports.divide = function divide(a, b) {
  if (b === 0) {
    throw new Error("Cannot divide by zero");
  }
  return a / b;
};
