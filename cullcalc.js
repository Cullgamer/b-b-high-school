
function factorial(n) {
  let num = new BigNumber(n);
  if (num.isNaN() || num.isNegative()) return "Error";
  if (num > "9999999")
    return "to large number!";
  
  if (num.isEqualTo(0) || num.isEqualTo(1)) return new BigNumber(1);

  let result = new BigNumber(1);
  let limit = num.toNumber();
  for (let i = 2; i <= limit; i++) {
    result = result.multipliedBy(i);
  }
  return result;
}

// 2. Core BODMAS Engine
function bodmask(userInput) {
  let myChest = [];
  let bucket = "";

  for (let i = 0; i < userInput.length; i++) {
    let char = userInput[i];
    let prevChar = userInput[i - 1];

    if (char === "e" || char === "E") {
      bucket += char;
      continue;
    }
    if ((char === "+" || char === "-") && (prevChar === "e" || prevChar === "E")) {
      bucket += char;
      continue;
    }
    
    if (char === "³" && userInput[i + 1] === "√") {
      char = "³√";
      i++; 
    }

    if (userInput.includes("sin") || userInput.includes("cos") || userInput.includes("tan")) {
      if (char === "s" && userInput[i + 1] === "i" && userInput[i + 2] === "n" && userInput[i + 3] === "⁻" && userInput[i + 4] === "¹") {
        char = "sin⁻¹"; i += 4;
      } else if (char === "c" && userInput[i + 1] === "o" && userInput[i + 2] === "s" && userInput[i + 3] === "⁻" && userInput[i + 4] === "¹") {
        char = "cos⁻¹"; i += 4;
      } else if (char === "t" && userInput[i + 1] === "a" && userInput[i + 2] === "n" && userInput[i + 3] === "⁻" && userInput[i + 4] === "¹") {
        char = "tan⁻¹"; i += 4;
      } else if (char === "s" && userInput[i + 1] === "i" && userInput[i + 2] === "n") {
        char = "sin"; i += 2;
      } else if (char === "c" && userInput[i + 1] === "o" && userInput[i + 2] === "s") {
        char = "cos"; i += 2;
      } else if (char === "t" && userInput[i + 1] === "a" && userInput[i + 2] === "n") {
        char = "tan"; i += 2;
      }
    }

    if (["+", "-", "×", "÷", "√", "³√", "%", "^", "!", "sin", "cos", "tan", "sin⁻¹", "cos⁻¹", "tan⁻¹"].includes(char)) {
      if (["√", "³√", "sin", "cos", "tan", "sin⁻¹", "cos⁻¹", "tan⁻¹"].includes(char) && bucket !== "") {
        myChest.push(BigNumber(bucket));
        myChest.push("×");
      } else if (bucket !== "") {
        myChest.push(BigNumber(bucket));
      }
      myChest.push(char);
      bucket = "";
    } else {
      bucket = bucket + char;
    }
  }

  if (bucket !== "") {
    myChest.push(BigNumber(bucket));
  }

  // Factorial (!)
  while (myChest.includes("!")) {
    let index = myChest.indexOf('!');
    myChest.splice(index - 1, 2, factorial(myChest[index - 1]));
  }

  // Percentage (%)
  while (myChest.includes("%")) {
    let opI = myChest.indexOf("%");
    let result = BigNumber.isBigNumber(myChest[opI - 1]) 
      ? myChest[opI - 1].dividedBy(100) 
      : BigNumber(myChest[opI - 1]).dividedBy(100);
    myChest.splice(opI - 1, 2, result);
  }

  // Trailing operators clean up
  let lastIdx = myChest.length - 1;
  if (!BigNumber.isBigNumber(myChest[lastIdx]) && !BigNumber.isBigNumber(myChest[lastIdx - 1]) && !BigNumber.isBigNumber(myChest[lastIdx - 2])) {
    myChest.splice(lastIdx - 2, 3);
  } else if (!BigNumber.isBigNumber(myChest[lastIdx]) && !BigNumber.isBigNumber(myChest[lastIdx - 1])) {
    myChest.splice(lastIdx - 1, 2);
  } else if (!BigNumber.isBigNumber(myChest[lastIdx])) {
    myChest.splice(lastIdx, 1);
  }

  // Negative sign handling
  if (myChest[0] === "-") {
    let negative = myChest[1].multipliedBy(-1);
    myChest.splice(0, 2, negative);
  }
  for (let m = 0; m < myChest.length; m++) {
    if (myChest[m] === "-" && !BigNumber.isBigNumber(myChest[m - 1])) {
      let neg = myChest[m + 1].multipliedBy(-1);
      myChest.splice(m, 2, neg);
    }
  }

  // Power (^)
  while (myChest.includes("^")) {
    let opIndex = -1;
    for (let i = myChest.length - 1; i >= 0; i--) {
      if (myChest[i] === "^" && BigNumber.isBigNumber(myChest[i - 1]) && BigNumber.isBigNumber(myChest[i + 1])) {
        opIndex = i;
        break;
      }
    }
    if (opIndex === -1) break;
    let result = myChest[opIndex - 1].exponentiatedBy(myChest[opIndex + 1].toNumber());
    myChest.splice(opIndex - 1, 3, result);
  }

  // Roots & Trigonometry
  while (myChest.some(op => ["√", "³√", "sin", "cos", "tan", "sin⁻¹", "cos⁻¹", "tan⁻¹"].includes(op))) {
    let opIndex = -1;
    for (let i = myChest.length - 1; i >= 0; i--) {
      if (["√", "³√", "sin", "cos", "tan", "sin⁻¹", "cos⁻¹", "tan⁻¹"].includes(myChest[i]) && BigNumber.isBigNumber(myChest[i + 1])) {
        opIndex = i;
        break;
      }
    }
    if (opIndex === -1) break;

    let targetNum = myChest[opIndex + 1].toNumber();
    let result;
    let op = myChest[opIndex];

    if (op === "√") result = myChest[opIndex + 1].sqrt();
    else if (op === "³√") result = BigNumber(Math.cbrt(targetNum));
    else if (op === "sin") result = BigNumber(Math.sin(targetNum * Math.PI / 180));
    else if (op === "cos") result = BigNumber(Math.cos(targetNum * Math.PI / 180));
    else if (op === "tan") result = BigNumber(Math.tan(targetNum * Math.PI / 180));
    else if (op === "sin⁻¹") result = BigNumber(Math.asin(targetNum) * (180 / Math.PI));
    else if (op === "cos⁻¹") result = BigNumber(Math.acos(targetNum) * (180 / Math.PI));
    else if (op === "tan⁻¹") result = BigNumber(Math.atan(targetNum) * (180 / Math.PI));

    myChest.splice(opIndex, 2, result);
  }

  // Multiplication & Division
  while (myChest.includes("×") || myChest.includes("÷")) {
    let div = myChest.indexOf("÷");
    let mult = myChest.indexOf("×");
    if (div !== -1 && (mult === -1 || div < mult)) {
      let result = myChest[div - 1].dividedBy(myChest[div + 1]);
      myChest.splice(div - 1, 3, result);
    } else {
      let result = myChest[mult - 1].multipliedBy(myChest[mult + 1]);
      myChest.splice(mult - 1, 3, result);
    }
  }

  // Addition & Subtraction
  while (myChest.includes("+") || myChest.includes("-")) {
    let addIndex = myChest.indexOf("+");
    let subIndex = myChest.indexOf("-");
    if (subIndex !== -1 && (addIndex === -1 || subIndex < addIndex)) {
      let result = myChest[subIndex - 1].minus(myChest[subIndex + 1]);
      myChest.splice(subIndex - 1, 3, result);
    } else {
      let result = myChest[addIndex - 1].plus(myChest[addIndex + 1]);
      myChest.splice(addIndex - 1, 3, result);
    }
  }

  return myChest[0];
}

// 3. Main Exported Function (Call this from any app)
function CullCalc(inputString) {
  if (!inputString || inputString.trim() === "") return "0";

  let userInput = inputString.replace(/\*/g, '×').replace(/\//g, '÷').replace(/[^0-9+\-×÷%^!().a-zA-Z³√⁻¹πθ]/g, '')
    .replace(/(\d)\(/g, "$1×(")
    .replace(/\)(\d)/g, ")×$1")
    .replace(/%(?=[0-9\(/])/g, '%×')
    .replace(/\%(\d)/g, "%×$1")
    .replace(/\)\(/g, ")×(")
    .replace(/!(?=[0-9\(/])/g, '!×');
    
  while (/(\+\+|--|\+-|-\+|\+×|\+÷|×\+|÷\+)/.test(userInput)) {
  userInput = userInput
    .replace(/\+\+/g, '+')
    .replace(/\-\-/g, '+')
    .replace(/\+\-/g, '-')
    .replace(/\-\+/g, '-')
    .replace(/\+×/g, '×')
    .replace(/\+÷/g, '÷')
    .replace(/×\+/g, '×')
    .replace(/÷\+/g, '÷');
}

  let openBrackets = (userInput.match(/\(/g) || []).length;
  let closeBrackets = (userInput.match(/\)/g) || []).length;

  while (openBrackets > closeBrackets) {
    userInput += ")";
    closeBrackets++;
  }

  while (userInput.includes("(")) {
    let match = userInput.match(/\(([^()]+)\)/);
    if (!match) break;
    let bracketResult = bodmask(match[1]);
    userInput = userInput.replace(match[0], bracketResult);
  }

  let finalCalcValue = bodmask(userInput);
  let fv = BigNumber.isBigNumber(finalCalcValue) ? finalCalcValue.toString() : finalCalcValue;

  if (fv.includes("NaN")) return "Syntax Error!";
  if (fv.includes("Infinity")) {
    return (userInput.includes("÷0") || userInput.includes("/0")) 
      ? "Cannot divide by zero" 
      : "Number Too Large!";
  }

  return fv;
}
