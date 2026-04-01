// test.js — TDD tests for gomoku-logic.js
// Run: node test.js

var logic = require('./gomoku-logic');
var BOARD_SIZE = logic.BOARD_SIZE;
var createBoard = logic.createBoard;
var createState = logic.createState;
var checkWin = logic.checkWin;
var evalCell = logic.evalCell;
var lineScore = logic.lineScore;
var getCandidates = logic.getCandidates;
var countThreats = logic.countThreats;
var DIFF_EASY = logic.DIFF_EASY;
var DIFF_NORMAL = logic.DIFF_NORMAL;
var DIFF_HARD = logic.DIFF_HARD;
var getAiMove = logic.getAiMove;
var placeStone = logic.placeStone;
var undoMove = logic.undoMove;

// ---------- minimal test runner ----------
var passed = 0;
var failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log('  PASS: ' + message);
    passed++;
  } else {
    console.log('  FAIL: ' + message);
    failed++;
  }
}

function describe(name, fn) {
  console.log('\n[' + name + ']');
  fn();
}

// ---------- helpers ----------
function fillRow(board, row, colStart, len, player) {
  var i;
  for (i = 0; i < len; i++) {
    board[row][colStart + i] = player;
  }
}

function fillCol(board, col, rowStart, len, player) {
  var i;
  for (i = 0; i < len; i++) {
    board[rowStart + i][col] = player;
  }
}

function fillDiagDown(board, rowStart, colStart, len, player) {
  var i;
  for (i = 0; i < len; i++) {
    board[rowStart + i][colStart + i] = player;
  }
}

function fillDiagUp(board, rowStart, colStart, len, player) {
  var i;
  for (i = 0; i < len; i++) {
    board[rowStart - i][colStart + i] = player;
  }
}

// ==================== TESTS ====================

describe('createBoard', function() {
  var board = createBoard();
  assert(board.length === BOARD_SIZE, 'board has ' + BOARD_SIZE + ' rows');
  assert(board[0].length === BOARD_SIZE, 'each row has ' + BOARD_SIZE + ' cells');
  var allZero = true;
  var r, c;
  for (r = 0; r < BOARD_SIZE; r++) {
    for (c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] !== 0) { allZero = false; break; }
    }
  }
  assert(allZero, 'all cells initialized to 0');
});

describe('createState', function() {
  var s = createState();
  assert(s.currentPlayer === 1, 'black (1) goes first');
  assert(s.gameOver === false, 'game not over at start');
  assert(s.history.length === 0, 'history empty at start');
});

describe('checkWin — horizontal', function() {
  var board;

  board = createBoard();
  fillRow(board, 7, 0, 5, 1);
  assert(checkWin(board, 7, 4, 1) === true, '5 in a row at left edge');

  board = createBoard();
  fillRow(board, 7, 10, 5, 1);
  assert(checkWin(board, 7, 14, 1) === true, '5 in a row at right edge');

  board = createBoard();
  fillRow(board, 7, 5, 5, 2);
  assert(checkWin(board, 7, 7, 2) === true, '5 in a row for white, checked from middle');

  board = createBoard();
  fillRow(board, 7, 5, 4, 1);
  assert(checkWin(board, 7, 8, 1) === false, '4 in a row is not a win');
});

describe('checkWin — vertical', function() {
  var board;

  board = createBoard();
  fillCol(board, 7, 0, 5, 1);
  assert(checkWin(board, 4, 7, 1) === true, '5 in a column at top');

  board = createBoard();
  fillCol(board, 7, 10, 5, 1);
  assert(checkWin(board, 14, 7, 1) === true, '5 in a column at bottom');

  board = createBoard();
  fillCol(board, 7, 3, 4, 1);
  assert(checkWin(board, 6, 7, 1) === false, '4 in a column is not a win');
});

describe('checkWin — diagonal backslash (↘)', function() {
  var board;

  board = createBoard();
  fillDiagDown(board, 0, 0, 5, 1);
  assert(checkWin(board, 4, 4, 1) === true, '5 on main diagonal from corner');

  board = createBoard();
  fillDiagDown(board, 5, 5, 5, 2);
  assert(checkWin(board, 7, 7, 2) === true, '5 on diagonal in center (white)');

  board = createBoard();
  fillDiagDown(board, 5, 5, 4, 1);
  assert(checkWin(board, 8, 8, 1) === false, '4 on diagonal is not a win');
});

describe('checkWin — diagonal slash (↗)', function() {
  var board;

  board = createBoard();
  fillDiagUp(board, 4, 0, 5, 1);
  assert(checkWin(board, 0, 4, 1) === true, '5 on anti-diagonal from left');

  board = createBoard();
  fillDiagUp(board, 14, 5, 5, 2);
  assert(checkWin(board, 10, 9, 2) === true, '5 on anti-diagonal (white)');

  board = createBoard();
  fillDiagUp(board, 10, 5, 4, 1);
  assert(checkWin(board, 7, 8, 1) === false, '4 on anti-diagonal is not a win');
});

describe('checkWin — opponent stones do not count', function() {
  var board = createBoard();
  fillRow(board, 7, 3, 4, 1);
  board[7][7] = 2;
  assert(checkWin(board, 7, 6, 1) === false, 'opponent stone breaks the chain');
});

describe('checkWin — overline still wins', function() {
  var board = createBoard();
  fillRow(board, 7, 2, 6, 1);
  assert(checkWin(board, 7, 4, 1) === true, '6 in a row still wins in standard rules');
});

describe('lineScore — updated weights', function() {
  assert(lineScore(5, 1) === 100000, '五連 scores max');
  assert(lineScore(5, 2) === 100000, '五連 scores max (open both)');
  assert(lineScore(4, 2) === 50000,  '活四 scores 50000');
  assert(lineScore(4, 1) === 10000,  '死四 scores 10000');
  assert(lineScore(3, 2) === 8000,   '活三 scores 8000');
  assert(lineScore(3, 1) === 500,    '眠三 scores 500');
  assert(lineScore(2, 2) === 200,    '活二 scores 200');
  assert(lineScore(2, 1) === 10,     '眠二 scores 10');
  assert(lineScore(1, 0) === 0,      'blocked single scores 0');
  assert(lineScore(4, 0) === 0,      'fully blocked four scores 0');
  // 活三 must be significantly stronger than 眠三
  assert(lineScore(3, 2) > lineScore(3, 1) * 10, '活三 >> 眠三 by >10x');
});

describe('evalCell — single stone on empty board', function() {
  var board = createBoard();
  board[7][7] = 1;
  var score = evalCell(board, 7, 7, 1);
  assert(score > 0, 'center stone has positive score');

  var edgeBoard = createBoard();
  edgeBoard[0][0] = 1;
  var edgeScore = evalCell(edgeBoard, 0, 0, 1);
  assert(score > edgeScore, 'center scores higher than corner');
});

describe('evalCell — recognises four-in-a-row', function() {
  var board = createBoard();
  fillRow(board, 7, 3, 4, 1); // 4 black stones in a row
  board[7][7] = 1;             // completing 5th
  var score = evalCell(board, 7, 7, 1);
  assert(score >= 100000, 'completing 5-in-a-row scores max');
});

describe('getAiMove — blocks immediate human win', function() {
  var board = createBoard();
  // Human (black=1) has 4 in a row, AI must block
  fillRow(board, 7, 3, 4, 1);
  // board[7][7] is the winning cell for human — AI should block it
  var move = getAiMove(board, 2, 1);
  assert(move !== null, 'AI returns a move');
  assert(move.r === 7 && (move.c === 2 || move.c === 7),
    'AI blocks at row 7 (either end of the four)');
});

describe('getAiMove — takes immediate win', function() {
  var board = createBoard();
  // AI (white=2) has 4 in a row; should complete to 5
  fillRow(board, 7, 3, 4, 2);
  // board[7][7] wins for AI
  var move = getAiMove(board, 2, 1);
  assert(move !== null, 'AI returns a move');
  assert(move.r === 7 && (move.c === 2 || move.c === 7),
    'AI takes winning move at row 7');
});

describe('getAiMove — first move on empty board', function() {
  var board = createBoard();
  var move = getAiMove(board, 2, 1);
  assert(move !== null, 'AI moves on empty board');
  assert(move.r >= 0 && move.r < BOARD_SIZE, 'row in bounds');
  assert(move.c >= 0 && move.c < BOARD_SIZE, 'col in bounds');
  assert(board[move.r][move.c] === 0, 'AI targets empty cell');
});

describe('countThreats — detects 活三', function() {
  var board = createBoard();
  // Place 2 black stones → placing a 3rd makes 活三
  board[7][5] = 1;
  board[7][6] = 1;
  board[7][7] = 1; // temporarily place to measure
  var threats = countThreats(board, 7, 7, 1);
  board[7][7] = 0;
  assert(threats >= 1, '三連活三 counts ≥1 threat');
});

describe('countThreats — fork detection', function() {
  var board = createBoard();
  // Create a position where one move creates two 活三 simultaneously (fork)
  board[5][7] = 1; board[6][7] = 1; // vertical pair
  board[7][5] = 1; board[7][6] = 1; // horizontal pair
  // Placing at [7][7] should create threats in both directions
  board[7][7] = 1;
  var threats = countThreats(board, 7, 7, 1);
  board[7][7] = 0;
  assert(threats >= 2, 'fork position detects ≥2 threats');
});

describe('getAiMove — difficulty easy returns valid move', function() {
  var board = createBoard();
  board[7][7] = 1;
  var move = getAiMove(board, 2, 1, DIFF_EASY);
  assert(move !== null, 'easy AI returns a move');
  assert(board[move.r][move.c] === 0, 'easy AI targets empty cell');
});

describe('getAiMove — difficulty hard blocks win', function() {
  var board = createBoard();
  fillRow(board, 7, 3, 4, 1); // human 4-in-a-row
  var move = getAiMove(board, 2, 1, DIFF_HARD);
  assert(move !== null, 'hard AI returns a move');
  assert(move.r === 7 && (move.c === 2 || move.c === 7), 'hard AI blocks at row 7');
});

describe('getCandidates — empty board returns center', function() {
  var board = createBoard();
  var mid = Math.floor(BOARD_SIZE / 2);
  var cands = getCandidates(board, 2);
  assert(cands.length === 1, 'empty board yields 1 candidate');
  assert(cands[0].r === mid && cands[0].c === mid, 'candidate is center');
});

describe('getCandidates — range 2 around single stone', function() {
  var board = createBoard();
  board[7][7] = 1;
  var cands = getCandidates(board, 2);
  // 5x5 area around (7,7) minus the stone itself = 24 cells
  assert(cands.length === 24, '24 candidates around single center stone');
  var hasDup = false;
  var seen = {};
  var i, k;
  for (i = 0; i < cands.length; i++) {
    k = cands[i].r + ',' + cands[i].c;
    if (seen[k]) { hasDup = true; break; }
    seen[k] = true;
  }
  assert(!hasDup, 'no duplicate candidates');
});

describe('getCandidates — all candidates are empty', function() {
  var board = createBoard();
  board[7][7] = 1;
  board[7][8] = 2;
  var cands = getCandidates(board, 2);
  var allEmpty = true;
  var i;
  for (i = 0; i < cands.length; i++) {
    if (board[cands[i].r][cands[i].c] !== 0) { allEmpty = false; break; }
  }
  assert(allEmpty, 'all candidates are empty cells');
});

describe('getCandidates — does not go out of bounds', function() {
  var board = createBoard();
  board[0][0] = 1; // corner stone
  var cands = getCandidates(board, 2);
  var inBounds = true;
  var i, c;
  for (i = 0; i < cands.length; i++) {
    c = cands[i];
    if (c.r < 0 || c.r >= BOARD_SIZE || c.c < 0 || c.c >= BOARD_SIZE) {
      inBounds = false; break;
    }
  }
  assert(inBounds, 'all candidates within board bounds');
});

describe('getCandidates vs full-scan speed', function() {
  var board = createBoard();
  var i;
  // Place 10 stones in center area
  var stones = [[7,7],[7,8],[8,7],[8,8],[6,7],[7,6],[9,7],[7,9],[6,6],[9,9]];
  for (i = 0; i < stones.length; i++) {
    board[stones[i][0]][stones[i][1]] = (i % 2 === 0) ? 1 : 2;
  }

  var REPS = 500;
  var t0, t1;

  // Full scan (old approach)
  t0 = Date.now();
  for (i = 0; i < REPS; i++) {
    var fullCount = 0;
    var r, c;
    for (r = 0; r < BOARD_SIZE; r++) {
      for (c = 0; c < BOARD_SIZE; c++) {
        if (board[r][c] === 0) fullCount++;
      }
    }
  }
  t1 = Date.now();
  var fullMs = t1 - t0;

  // Candidate scan (new approach)
  t0 = Date.now();
  for (i = 0; i < REPS; i++) {
    getCandidates(board, 2);
  }
  t1 = Date.now();
  var candMs = t1 - t0;

  var cands = getCandidates(board, 2);
  console.log('  INFO: candidates=' + cands.length + '/215 empty cells, full=' + fullMs + 'ms vs candidate=' + candMs + 'ms (' + REPS + ' reps)');
  assert(cands.length < BOARD_SIZE * BOARD_SIZE - 10, 'candidate set smaller than full board');
  assert(cands.length > 0, 'candidate set non-empty');
});

describe('placeStone — basic placement', function() {
  var s = createState();
  var result = placeStone(s, 7, 7);
  assert(result === 'continue', 'first move returns continue');
  assert(s.board[7][7] === 1, 'stone placed on board');
  assert(s.currentPlayer === 2, 'turn switches to white');
  assert(s.history.length === 1, 'history records the move');
});

describe('placeStone — invalid moves', function() {
  var s = createState();
  placeStone(s, 7, 7);
  var result = placeStone(s, 7, 7);
  assert(result === null, 'cannot place on occupied cell');
  assert(s.currentPlayer === 2, 'player does not change on invalid move');

  result = placeStone(s, -1, 7);
  assert(result === null, 'out-of-bounds row rejected');

  result = placeStone(s, 7, 15);
  assert(result === null, 'out-of-bounds col rejected');
});

describe('placeStone — win detection', function() {
  var s = createState();
  placeStone(s, 7, 0); placeStone(s, 0, 0);
  placeStone(s, 7, 1); placeStone(s, 0, 1);
  placeStone(s, 7, 2); placeStone(s, 0, 2);
  placeStone(s, 7, 3); placeStone(s, 0, 3);
  var result = placeStone(s, 7, 4);
  assert(result === 'win', 'horizontal 5-in-a-row detected as win');
  assert(s.gameOver === true, 'gameOver set to true');
  assert(s.currentPlayer === 1, 'winning player is black (1)');
});

describe('placeStone — no move after game over', function() {
  var s = createState();
  s.gameOver = true;
  var result = placeStone(s, 0, 0);
  assert(result === null, 'cannot place stone after game over');
});

describe('undoMove', function() {
  var s = createState();
  placeStone(s, 7, 7);
  placeStone(s, 8, 8);

  var ok = undoMove(s);
  assert(ok === true, 'undo returns true on success');
  assert(s.board[8][8] === 0, 'stone removed from board');
  assert(s.currentPlayer === 2, 'turn restored to white');
  assert(s.history.length === 1, 'history shrinks by 1');

  undoMove(s);
  assert(s.board[7][7] === 0, 'black stone also removable');
  assert(s.currentPlayer === 1, 'turn back to black');
  assert(s.history.length === 0, 'history empty');
});

describe('undoMove — edge cases', function() {
  var s = createState();
  var ok = undoMove(s);
  assert(ok === false, 'undo on empty history returns false');

  s.gameOver = true;
  ok = undoMove(s);
  assert(ok === false, 'undo not allowed after game over');
});

// ---------- summary ----------
console.log('\n========================================');
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) {
  process.exit(1);
} else {
  console.log('All tests passed!');
}
