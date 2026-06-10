# Test Plan — Mergington High School COBOL Accounting System

## Overview

This test plan covers all business logic in the legacy COBOL accounting system (`main.cob`, `operations.cob`, `data.cob`). It is intended to be used to validate the current implementation with business stakeholders and to guide the creation of unit and integration tests in the modernized Node.js application.

---

## Test Cases

| Test Case ID | Test Case Description | Pre-conditions | Test Steps | Expected Result | Actual Result | Status (Pass/Fail) | Comments |
|---|---|---|---|---|---|---|---|
| TC-001 | Display main menu | Application is compiled and executable | 1. Launch `./accountsystem` | Menu displays with options: 1. View Balance, 2. Credit Account, 3. Debit Account, 4. Exit | | | |
| TC-002 | View initial balance | Application is running; no prior transactions | 1. Launch app<br>2. Enter `1` (View Balance) | Displays "Current balance: 1000.00" (the default starting balance) | | | Default balance is hardcoded to 1000.00 |
| TC-003 | Credit account — valid amount | Application is running | 1. Enter `2` (Credit Account)<br>2. Enter `500` | Displays "Amount credited. New balance: 1500.00" | | | Balance should increase by the credited amount |
| TC-004 | Credit account — zero amount | Application is running | 1. Enter `2` (Credit Account)<br>2. Enter `0` | Displays "Amount credited. New balance: 1000.00" (balance unchanged) | | | Crediting zero should be a no-op |
| TC-005 | Credit account — decimal amount | Application is running | 1. Enter `2` (Credit Account)<br>2. Enter `250.50` | Displays "Amount credited. New balance: 1250.50" | | | System supports 2 decimal places |
| TC-006 | Credit account — large amount (near max) | Application is running | 1. Enter `2` (Credit Account)<br>2. Enter `999999` (max 6-digit integer) | Displays new balance up to 999999.00 without overflow error | | | PIC 9(6)V99 supports up to 999999.99 |
| TC-007 | Debit account — valid amount with sufficient funds | Application is running; balance is 1000.00 | 1. Enter `3` (Debit Account)<br>2. Enter `200` | Displays "Amount debited. New balance: 800.00" | | | |
| TC-008 | Debit account — exact balance (boundary case) | Application is running; balance is 1000.00 | 1. Enter `3` (Debit Account)<br>2. Enter `1000` | Displays "Amount debited. New balance: 0.00" | | | Debit of exact balance should succeed |
| TC-009 | Debit account — insufficient funds | Application is running; balance is 1000.00 | 1. Enter `3` (Debit Account)<br>2. Enter `1500` | Displays "Insufficient funds for this debit." and balance remains 1000.00 | | | Balance must not change on failed debit |
| TC-010 | Debit account — zero amount | Application is running | 1. Enter `3` (Debit Account)<br>2. Enter `0` | Displays "Amount debited. New balance: 1000.00" (balance unchanged) | | | Debiting zero should be a no-op |
| TC-011 | Debit account — decimal amount | Application is running; balance is 1000.00 | 1. Enter `3` (Debit Account)<br>2. Enter `100.75` | Displays "Amount debited. New balance: 899.25" | | | System supports 2 decimal places |
| TC-012 | Sequential credit then debit | Application is running; initial balance 1000.00 | 1. Enter `2`, credit `300`<br>2. Enter `3`, debit `400` | After credit: 1300.00; After debit: 900.00 | | | Verifies state is correctly persisted between operations |
| TC-013 | Sequential debit then credit | Application is running; initial balance 1000.00 | 1. Enter `3`, debit `500`<br>2. Enter `2`, credit `200` | After debit: 500.00; After credit: 700.00 | | | |
| TC-014 | Multiple credits accumulate correctly | Application is running; initial balance 1000.00 | 1. Enter `2`, credit `100`<br>2. Enter `2`, credit `100`<br>3. Enter `1` (View Balance) | Balance shows 1200.00 | | | |
| TC-015 | Multiple debits reduce balance correctly | Application is running; initial balance 1000.00 | 1. Enter `3`, debit `200`<br>2. Enter `3`, debit `300`<br>3. Enter `1` (View Balance) | Balance shows 500.00 | | | |
| TC-016 | View balance after credit | Application is running | 1. Enter `2`, credit `250`<br>2. Enter `1` (View Balance) | Displays updated balance (1250.00) | | | READ operation must reflect latest WRITE |
| TC-017 | View balance after failed debit | Application is running; balance 1000.00 | 1. Enter `3`, debit `2000`<br>2. Enter `1` (View Balance) | Balance remains 1000.00 | | | Failed debit must not modify stored balance |
| TC-018 | Invalid menu choice | Application is running | 1. Enter `5` (invalid option) | Displays "Invalid choice, please select 1-4." and menu re-displays | | | |
| TC-019 | Invalid menu choice — character input | Application is running | 1. Enter `A` (non-numeric) | Application handles gracefully; menu re-displays or shows error | | | COBOL ACCEPT behavior may vary |
| TC-020 | Exit application | Application is running | 1. Enter `4` (Exit) | Displays "Exiting the program. Goodbye!" and application terminates cleanly | | | |
| TC-021 | Menu loops after each operation | Application is running | 1. Perform any operation (e.g., View Balance)<br>2. Observe behavior after operation completes | Menu re-displays after each operation until Exit is selected | | | CONTINUE-FLAG loop must work correctly |
| TC-022 | Balance resets on application restart | Application has been run and modified; restart app | 1. Run app, credit `500`<br>2. Exit<br>3. Re-launch `./accountsystem`<br>4. Enter `1` (View Balance) | Balance shows 1000.00 (default) — not the previously modified value | | | No file/DB persistence; in-memory only |
| TC-023 | Debit reduces balance to exactly zero, then debit again | Application running; balance 1000.00 | 1. Debit `1000`<br>2. Debit `1` | Step 1: balance 0.00; Step 2: "Insufficient funds for this debit." | | | Boundary test for zero balance |
| TC-024 | Credit after zero balance | Application running; balance reduced to 0.00 | 1. Debit `1000` (balance → 0.00)<br>2. Credit `500` | Balance shows 500.00 | | | Ensures credit works from zero state |

---

## Test Environment

| Item | Details |
|------|---------|
| Language | COBOL (GnuCOBOL compiler) |
| Target Platform | Linux (Ubuntu) |
| Compiler Command | `cobc -x src/cobol/main.cob src/cobol/operations.cob src/cobol/data.cob -o accountsystem` |
| Run Command | `./accountsystem` |
| Future Target | Node.js (modernized application) |

---

## Notes

- **No persistence:** The balance is stored in-memory only. Every application restart resets the balance to the default `1000.00`. TC-022 explicitly validates this behavior.
- **Decimal precision:** The balance field uses `PIC 9(6)V99` (6 integer digits, 2 decimal places). Maximum balance is `999999.99`.
- **Insufficient funds guard:** The system enforces `FINAL-BALANCE >= AMOUNT` before processing any debit. This is the primary business rule to protect against negative balances.
- **Node.js modernization:** When porting to Node.js, all 24 test cases should be implemented as automated unit/integration tests to ensure behavioral parity with the legacy system.
