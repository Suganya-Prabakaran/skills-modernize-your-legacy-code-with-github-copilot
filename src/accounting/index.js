const readline = require('node:readline/promises');
const { stdin: input, stdout: output } = require('node:process');

const DEFAULT_BALANCE = 1000.0;
let storageBalance = DEFAULT_BALANCE;

function formatAmount(value) {
  return value.toFixed(2);
}

function readBalance() {
  return storageBalance;
}

function writeBalance(newBalance) {
  storageBalance = newBalance;
}

function resetBalance() {
  storageBalance = DEFAULT_BALANCE;
}

async function runOperation(operationType, rl, writer = output) {
  if (operationType === 'TOTAL') {
    const currentBalance = readBalance();
    writer.write(`Current balance: ${formatAmount(currentBalance)}\n`);
    return;
  }

  if (operationType === 'CREDIT') {
    const amountInput = await rl.question('Enter credit amount: ');
    const amount = Number.parseFloat(amountInput);

    if (Number.isNaN(amount) || amount < 0) {
      writer.write('Invalid amount. Please enter a non-negative number.\n');
      return;
    }

    const currentBalance = readBalance();
    const updatedBalance = currentBalance + amount;
    writeBalance(updatedBalance);
    writer.write(`Amount credited. New balance: ${formatAmount(updatedBalance)}\n`);
    return;
  }

  if (operationType === 'DEBIT') {
    const amountInput = await rl.question('Enter debit amount: ');
    const amount = Number.parseFloat(amountInput);

    if (Number.isNaN(amount) || amount < 0) {
      writer.write('Invalid amount. Please enter a non-negative number.\n');
      return;
    }

    const currentBalance = readBalance();

    if (currentBalance >= amount) {
      const updatedBalance = currentBalance - amount;
      writeBalance(updatedBalance);
      writer.write(`Amount debited. New balance: ${formatAmount(updatedBalance)}\n`);
      return;
    }

    writer.write('Insufficient funds for this debit.\n');
  }
}

async function main(io = {}) {
  const readerInput = io.input || input;
  const writer = io.output || output;
  const rl = io.rl || readline.createInterface({ input: readerInput, output: writer });
  let continueProgram = true;

  while (continueProgram) {
    writer.write('--------------------------------\n');
    writer.write('Account Management System\n');
    writer.write('1. View Balance\n');
    writer.write('2. Credit Account\n');
    writer.write('3. Debit Account\n');
    writer.write('4. Exit\n');
    writer.write('--------------------------------\n');

    const choice = await rl.question('Enter your choice (1-4): ');

    switch (choice.trim()) {
      case '1':
        await runOperation('TOTAL', rl, writer);
        break;
      case '2':
        await runOperation('CREDIT', rl, writer);
        break;
      case '3':
        await runOperation('DEBIT', rl, writer);
        break;
      case '4':
        continueProgram = false;
        break;
      default:
        writer.write('Invalid choice, please select 1-4.\n');
    }
  }

  writer.write('Exiting the program. Goodbye!\n');
  rl.close();
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Unexpected error:', error);
    process.exitCode = 1;
  });
}

module.exports = {
  DEFAULT_BALANCE,
  formatAmount,
  readBalance,
  writeBalance,
  resetBalance,
  runOperation,
  main,
};
