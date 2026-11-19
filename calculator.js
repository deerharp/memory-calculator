const OPERATION_SYMBOLS = {
  add: "+",
  subtract: "−",
  multiply: "×",
  divide: "÷",
};

const MAX_FRACTION_DIGITS = 2;

export function createCalculator() {
  let displayValue = "0";
  let expression = "准备计算";
  let accumulator = null;
  let pendingOperation = null;
  let expressionPrefix = "";
  let currentOperandLabel = null;
  let currentOperandValue = null;
  let shouldStartNewNumber = true;
  let hasError = false;

  function getState() {
    return {
      displayValue,
      expression,
      pendingOperation,
      hasError,
    };
  }

  function inputValue(value) {
    if (hasError) {
      resetState();
    }

    if (value === ".") {
      inputDecimal();
      return;
    }

    currentOperandLabel = null;
    currentOperandValue = null;

    if (shouldStartNewNumber || displayValue === "0" || displayValue === "-0") {
      displayValue = displayValue === "-0" ? `-${value}` : value;
      shouldStartNewNumber = false;
      updateInputExpression();
      return;
    }

    if (displayValue.replace("-", "").replace(".", "").length >= 12) {
      return;
    }

    displayValue += value;
    updateInputExpression();
  }

  function inputDecimal() {
    if (shouldStartNewNumber) {
      displayValue = "0.";
      currentOperandLabel = null;
      currentOperandValue = null;
      shouldStartNewNumber = false;
      updateInputExpression();
      return;
    }

    if (!displayValue.includes(".")) {
      displayValue += ".";
      currentOperandLabel = null;
      currentOperandValue = null;
      updateInputExpression();
    }
  }

  function chooseOperation(operation) {
    if (hasError || !OPERATION_SYMBOLS[operation]) {
      return;
    }

    const currentValue = getCurrentOperandValue();

    if (pendingOperation && shouldStartNewNumber) {
      pendingOperation = operation;
      expressionPrefix = expressionPrefix.replace(/[+−×÷]$/, OPERATION_SYMBOLS[operation]);
      expression = expressionPrefix;
      return;
    }

    if (accumulator === null) {
      accumulator = currentValue;
      expressionPrefix = `${getCurrentOperandLabel(currentValue)} ${OPERATION_SYMBOLS[operation]}`;
    } else if (pendingOperation) {
      const calculation = performCalculation(accumulator, currentValue, pendingOperation);

      if (calculation === null) {
        showDivisionError();
        return;
      }

      accumulator = calculation.rawValue;
      displayValue = toRawDisplay(calculation.value);
      expressionPrefix = `${expressionPrefix} ${getCurrentOperandLabel(currentValue)} ${OPERATION_SYMBOLS[operation]}`;
    }

    currentOperandLabel = null;
    currentOperandValue = null;
    pendingOperation = operation;
    shouldStartNewNumber = true;
    expression = expressionPrefix;
  }

  function calculateResult() {
    if (hasError || accumulator === null || !pendingOperation || shouldStartNewNumber) {
      return null;
    }

    const rightValue = getCurrentOperandValue();
    const leftValue = accumulator;
    const operation = pendingOperation;
    const calculation = performCalculation(leftValue, rightValue, operation);

    if (calculation === null) {
      showDivisionError();
      return null;
    }

    const completedCalculation = {
      expression: `${expressionPrefix} ${getCurrentOperandLabel(rightValue)}`,
      result: calculation.value,
      isApproximate: calculation.isApproximate,
    };

    displayValue = toRawDisplay(calculation.value);
    expression = completedCalculation.expression;
    accumulator = null;
    pendingOperation = null;
    expressionPrefix = "";
    currentOperandLabel = null;
    currentOperandValue = null;
    shouldStartNewNumber = true;

    return completedCalculation;
  }

  function clear() {
    resetState();
  }

  function toggleSign() {
    if (hasError) {
      resetState();
    }

    if (currentOperandLabel?.endsWith("%")) {
      currentOperandValue = -getCurrentOperandValue();
      currentOperandLabel = currentOperandLabel.startsWith("-")
        ? currentOperandLabel.slice(1)
        : `-${currentOperandLabel}`;
      displayValue = toRawDisplay(currentOperandValue);
      updateInputExpression();
      return;
    }

    if (shouldStartNewNumber) {
      displayValue = "-0";
      shouldStartNewNumber = false;
    } else if (displayValue.startsWith("-")) {
      displayValue = displayValue.slice(1);
    } else {
      displayValue = `-${displayValue}`;
    }

    currentOperandLabel = null;
    currentOperandValue = null;
    updateInputExpression();
  }

  function inputPercent() {
    if (hasError || shouldStartNewNumber || currentOperandLabel?.endsWith("%")) {
      return;
    }

    const enteredValue = getCurrentOperandValue();
    const enteredLabel = formatDisplayValue(displayValue);
    const rawPercentage =
      pendingOperation === "add" || pendingOperation === "subtract"
        ? accumulator * enteredValue / 100
        : enteredValue / 100;
    currentOperandLabel = `${enteredLabel}%`;
    currentOperandValue = rawPercentage;
    displayValue = toRawDisplay(rawPercentage);
    updateInputExpression();
  }

  function backspace() {
    if (hasError) {
      resetState();
      return;
    }

    if (pendingOperation && shouldStartNewNumber) {
      pendingOperation = null;
      accumulator = null;
      expressionPrefix = "";
      currentOperandLabel = null;
      currentOperandValue = null;
      expression = "";
      shouldStartNewNumber = false;
      return;
    }

    if (shouldStartNewNumber) {
      resetState();
      return;
    }

    if (displayValue.length > 1) {
      currentOperandLabel = null;
      currentOperandValue = null;
      displayValue = displayValue.slice(0, -1);
      updateInputExpression();
      return;
    }

    if (pendingOperation) {
      displayValue = toRawDisplay(accumulator);
      shouldStartNewNumber = true;
      expression = expressionPrefix;
      return;
    }

    displayValue = "0";
    currentOperandLabel = null;
    currentOperandValue = null;
    expression = "";
    shouldStartNewNumber = true;
  }

  function updateInputExpression() {
    expression = pendingOperation
      ? `${expressionPrefix} ${currentOperandLabel ?? formatDisplayValue(displayValue)}`
      : "";
  }

  function getCurrentOperandLabel(value) {
    return currentOperandLabel ?? formatNumber(value);
  }

  function getCurrentOperandValue() {
    return currentOperandValue ?? Number(displayValue);
  }

  function resetState() {
    displayValue = "0";
    expression = "准备计算";
    accumulator = null;
    pendingOperation = null;
    expressionPrefix = "";
    currentOperandLabel = null;
    currentOperandValue = null;
    shouldStartNewNumber = true;
    hasError = false;
  }

  function showDivisionError() {
    displayValue = "0";
    expression = "不能除以零";
    accumulator = null;
    pendingOperation = null;
    expressionPrefix = "";
    currentOperandLabel = null;
    currentOperandValue = null;
    shouldStartNewNumber = true;
    hasError = true;
  }

  return {
    backspace,
    calculateResult,
    chooseOperation,
    clear,
    getState,
    inputPercent,
    inputValue,
    toggleSign,
  };
}

export function formatDisplayValue(rawValue) {
  if (typeof rawValue !== "string") {
    return "0";
  }

  if (rawValue.endsWith(".")) {
    return `${formatIntegerPart(rawValue.slice(0, -1))}.`;
  }

  const [integerPart, fractionPart] = rawValue.split(".");
  const formattedInteger = formatIntegerPart(integerPart);
  return fractionPart === undefined ? formattedInteger : `${formattedInteger}.${fractionPart}`;
}

export function formatNumber(value) {
  if (!Number.isFinite(value)) {
    return "0";
  }

  return new Intl.NumberFormat("zh-CN", {
    maximumFractionDigits: MAX_FRACTION_DIGITS,
    useGrouping: true,
  }).format(normalizeResult(value));
}

function formatIntegerPart(integerPart) {
  const numericValue = Number(integerPart || "0");

  if (!Number.isFinite(numericValue)) {
    return integerPart;
  }

  return new Intl.NumberFormat("zh-CN", {
    maximumFractionDigits: 0,
    useGrouping: true,
  }).format(numericValue);
}

function performCalculation(leftValue, rightValue, operation) {
  let rawResult;

  switch (operation) {
    case "add":
      rawResult = leftValue + rightValue;
      break;
    case "subtract":
      rawResult = leftValue - rightValue;
      break;
    case "multiply":
      rawResult = leftValue * rightValue;
      break;
    case "divide":
      if (rightValue === 0) {
        return null;
      }
      rawResult = leftValue / rightValue;
      break;
    default:
      rawResult = leftValue;
  }

  const value = normalizeResult(rawResult);
  return {
    rawValue: rawResult,
    value,
    isApproximate: Math.abs(rawResult - value) > 1e-10,
  };
}

function normalizeResult(value) {
  const factor = 10 ** MAX_FRACTION_DIGITS;
  return Math.round((value + Math.sign(value) * Number.EPSILON) * factor) / factor;
}

function toRawDisplay(value) {
  const normalizedValue = normalizeResult(value);

  if (Math.abs(normalizedValue) >= 1e12) {
    return normalizedValue.toExponential(8);
  }

  return String(normalizedValue);
}
