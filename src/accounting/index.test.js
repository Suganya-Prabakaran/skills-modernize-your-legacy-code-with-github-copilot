const test = require('node:test');
const assert = require('node:assert/strict');

const {
  DEFAULT_BALANCE,
  readBalance,
  resetBalance,
  runOperation,
  main,
} = require('./index');

function createWriter() {
  const lines = [];
  return {
    lines,
    write(text) {
      lines.push(text);
    },
  };
}

function createQuestionStub(answers) {
  const queue = [...answers];
  return {
    async question() {
      return queue.shift() ?? '';
    },
    close() {},
  };
}

test.beforeEach(() => {
  resetBalance();
});

test('TC-002: view initial balance', async () => {
  const writer = createWriter();
  await runOperation('TOTAL', createQuestionStub([]), writer);
  assert.equal(writer.lines.at(-1), 'Current balance: 1000.00\n');
});

test('TC-003: credit valid amount', async () => {
  const writer = createWriter();
  await runOperation('CREDIT', createQuestionStub(['500']), writer);
  assert.equal(readBalance(), 1500);
  assert.equal(writer.lines.at(-1), 'Amount credited. New balance: 1500.00\n');
});

test('TC-004: credit zero amount', async () => {
  const writer = createWriter();
  await runOperation('CREDIT', createQuestionStub(['0']), writer);
  assert.equal(readBalance(), 1000);
  assert.equal(writer.lines.at(-1), 'Amount credited. New balance: 1000.00\n');
});

test('TC-005: credit decimal amount', async () => {
  const writer = createWriter();
  await runOperation('CREDIT', createQuestionStub(['250.50']), writer);
  assert.equal(readBalance(), 1250.5);
  assert.equal(writer.lines.at(-1), 'Amount credited. New balance: 1250.50\n');
});

test('TC-007: debit valid amount with sufficient funds', async () => {
  const writer = createWriter();
  await runOperation('DEBIT', createQuestionStub(['200']), writer);
  assert.equal(readBalance(), 800);
  assert.equal(writer.lines.at(-1), 'Amount debited. New balance: 800.00\n');
});

test('TC-008: debit exact balance boundary case', async () => {
  const writer = createWriter();
  await runOperation('DEBIT', createQuestionStub(['1000']), writer);
  assert.equal(readBalance(), 0);
  assert.equal(writer.lines.at(-1), 'Amount debited. New balance: 0.00\n');
});

test('TC-009: debit insufficient funds', async () => {
  const writer = createWriter();
  await runOperation('DEBIT', createQuestionStub(['1500']), writer);
  assert.equal(readBalance(), 1000);
  assert.equal(writer.lines.at(-1), 'Insufficient funds for this debit.\n');
});

test('TC-010: debit zero amount', async () => {
  const writer = createWriter();
  await runOperation('DEBIT', createQuestionStub(['0']), writer);
  assert.equal(readBalance(), 1000);
  assert.equal(writer.lines.at(-1), 'Amount debited. New balance: 1000.00\n');
});

test('TC-011: debit decimal amount', async () => {
  const writer = createWriter();
  await runOperation('DEBIT', createQuestionStub(['100.75']), writer);
  assert.equal(readBalance(), 899.25);
  assert.equal(writer.lines.at(-1), 'Amount debited. New balance: 899.25\n');
});

test('TC-012: sequential credit then debit', async () => {
  const writer = createWriter();
  await runOperation('CREDIT', createQuestionStub(['300']), writer);
  await runOperation('DEBIT', createQuestionStub(['400']), writer);
  assert.equal(readBalance(), 900);
});

test('TC-013: sequential debit then credit', async () => {
  const writer = createWriter();
  await runOperation('DEBIT', createQuestionStub(['500']), writer);
  await runOperation('CREDIT', createQuestionStub(['200']), writer);
  assert.equal(readBalance(), 700);
});

test('TC-014: multiple credits accumulate', async () => {
  const writer = createWriter();
  await runOperation('CREDIT', createQuestionStub(['100']), writer);
  await runOperation('CREDIT', createQuestionStub(['100']), writer);
  await runOperation('TOTAL', createQuestionStub([]), writer);
  assert.equal(writer.lines.at(-1), 'Current balance: 1200.00\n');
});

test('TC-015: multiple debits reduce correctly', async () => {
  const writer = createWriter();
  await runOperation('DEBIT', createQuestionStub(['200']), writer);
  await runOperation('DEBIT', createQuestionStub(['300']), writer);
  await runOperation('TOTAL', createQuestionStub([]), writer);
  assert.equal(writer.lines.at(-1), 'Current balance: 500.00\n');
});

test('TC-016 and TC-017: view balance after success and failed debit', async () => {
  const writer = createWriter();
  await runOperation('CREDIT', createQuestionStub(['250']), writer);
  await runOperation('TOTAL', createQuestionStub([]), writer);
  assert.equal(writer.lines.at(-1), 'Current balance: 1250.00\n');

  resetBalance();
  const writer2 = createWriter();
  await runOperation('DEBIT', createQuestionStub(['2000']), writer2);
  await runOperation('TOTAL', createQuestionStub([]), writer2);
  assert.equal(writer2.lines.at(-1), 'Current balance: 1000.00\n');
});

test('TC-018 and TC-020: invalid menu choice then exit in main loop', async () => {
  const writer = createWriter();
  const answers = createQuestionStub(['5', '4']);
  await main({ input: process.stdin, output: writer, rl: answers });
  const joined = writer.lines.join('');
  assert.match(joined, /Invalid choice, please select 1-4\./);
  assert.match(joined, /Exiting the program\. Goodbye!/);
});

test('TC-021: menu loops after each operation until exit', async () => {
  const writer = createWriter();
  const answers = createQuestionStub(['1', '4']);
  await main({ input: process.stdin, output: writer, rl: answers });
  const joined = writer.lines.join('');
  const menuCount = (joined.match(/Account Management System/g) || []).length;
  assert.equal(menuCount, 2);
});

test('TC-022: balance resets on restart simulation', async () => {
  const writer = createWriter();
  await runOperation('CREDIT', createQuestionStub(['500']), writer);
  assert.equal(readBalance(), 1500);
  resetBalance();
  assert.equal(readBalance(), DEFAULT_BALANCE);
});

test('TC-023 and TC-024: zero balance then fail debit then credit', async () => {
  const writer = createWriter();
  await runOperation('DEBIT', createQuestionStub(['1000']), writer);
  await runOperation('DEBIT', createQuestionStub(['1']), writer);
  assert.equal(writer.lines.at(-1), 'Insufficient funds for this debit.\n');
  await runOperation('CREDIT', createQuestionStub(['500']), writer);
  assert.equal(readBalance(), 500);
});

test('input validation: reject negative and non-numeric amounts', async () => {
  const writer = createWriter();
  await runOperation('CREDIT', createQuestionStub(['-1']), writer);
  await runOperation('DEBIT', createQuestionStub(['abc']), writer);
  const joined = writer.lines.join('');
  assert.match(joined, /Invalid amount\. Please enter a non-negative number\./);
  assert.equal(readBalance(), 1000);
});
