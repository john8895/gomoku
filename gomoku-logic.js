// gomoku-logic.js — pure game logic, no DOM dependencies
// ES5 compatible, CommonJS module for testing

var BOARD_SIZE = 15;

var DIRECTIONS = [
  [0, 1],   // horizontal
  [1, 0],   // vertical
  [1, 1],   // diagonal backslash
  [1, -1]   // diagonal slash
];

// Difficulty constants
var DIFF_EASY   = 0;
var DIFF_NORMAL = 1;
var DIFF_HARD   = 2;

function createBoard() {
  var i, j, board = [];
  for (i = 0; i < BOARD_SIZE; i++) {
    board[i] = [];
    for (j = 0; j < BOARD_SIZE; j++) {
      board[i][j] = 0;
    }
  }
  return board;
}

function checkWin(board, r, c, player) {
  var i, dr, dc, count, nr, nc;
  for (i = 0; i < DIRECTIONS.length; i++) {
    dr = DIRECTIONS[i][0];
    dc = DIRECTIONS[i][1];
    count = 1;
    nr = r + dr; nc = c + dc;
    while (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === player) {
      count++;
      nr += dr; nc += dc;
    }
    nr = r - dr; nc = c - dc;
    while (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === player) {
      count++;
      nr -= dr; nc -= dc;
    }
    if (count >= 5) return true;
  }
  return false;
}

// ---------- AI scoring ----------

// Score a line of `count` consecutive stones with `openEnds` open endpoints
// 活四(4,2)=50000  死四(4,1)=10000
// 活三(3,2)=8000   眠三(3,1)=500
// 活二(2,2)=200    眠二(2,1)=10
function lineScore(count, openEnds) {
  if (openEnds === 0) return 0;
  if (count >= 5) return 100000;
  if (count === 4) return openEnds === 2 ? 50000 : 10000;
  if (count === 3) return openEnds === 2 ? 8000  : 500;
  if (count === 2) return openEnds === 2 ? 200   : 10;
  if (count === 1) return openEnds === 2 ? 5     : 1;
  return 0;
}

// Evaluate the score gained by placing `player` at (r, c) on board
function evalCell(board, r, c, player) {
  var i, dr, dc, count, openEnds, nr, nc, score = 0;
  for (i = 0; i < DIRECTIONS.length; i++) {
    dr = DIRECTIONS[i][0];
    dc = DIRECTIONS[i][1];
    count = 1;
    openEnds = 0;

    nr = r + dr; nc = c + dc;
    while (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === player) {
      count++;
      nr += dr; nc += dc;
    }
    if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === 0) {
      openEnds++;
    }

    nr = r - dr; nc = c - dc;
    while (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === player) {
      count++;
      nr -= dr; nc -= dc;
    }
    if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === 0) {
      openEnds++;
    }

    score += lineScore(count, openEnds);
  }
  return score;
}

// Count directions where placing at (r,c) creates a 活三 or stronger threat
function countThreats(board, r, c, player) {
  var i, dr, dc, count, openEnds, nr, nc, threats = 0;
  for (i = 0; i < DIRECTIONS.length; i++) {
    dr = DIRECTIONS[i][0];
    dc = DIRECTIONS[i][1];
    count = 1;
    openEnds = 0;

    nr = r + dr; nc = c + dc;
    while (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === player) {
      count++;
      nr += dr; nc += dc;
    }
    if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === 0) {
      openEnds++;
    }

    nr = r - dr; nc = c - dc;
    while (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === player) {
      count++;
      nr -= dr; nc -= dc;
    }
    if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === 0) {
      openEnds++;
    }

    if (lineScore(count, openEnds) >= 8000) threats++; // 活三 or better
  }
  return threats;
}

// Return candidate cells: empty cells within `range` steps of any existing stone
function getCandidates(board, range) {
  var r, c, dr, dc, nr, nc;
  var seen = {};
  var candidates = [];

  for (r = 0; r < BOARD_SIZE; r++) {
    for (c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === 0) continue;
      for (dr = -range; dr <= range; dr++) {
        for (dc = -range; dc <= range; dc++) {
          nr = r + dr;
          nc = c + dc;
          if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) continue;
          if (board[nr][nc] !== 0) continue;
          var key = nr * BOARD_SIZE + nc;
          if (seen[key]) continue;
          seen[key] = true;
          candidates.push({ r: nr, c: nc });
        }
      }
    }
  }

  if (candidates.length === 0) {
    var mid = Math.floor(BOARD_SIZE / 2);
    candidates.push({ r: mid, c: mid });
  }

  return candidates;
}

// Pick best move for `aiPlayer` against `humanPlayer` at given difficulty
// difficulty: DIFF_EASY=0, DIFF_NORMAL=1, DIFF_HARD=2
function getAiMove(board, aiPlayer, humanPlayer, difficulty) {
  if (difficulty === undefined) difficulty = DIFF_NORMAL;

  var i, move, attackScore, defenseScore, totalScore;
  var scored = [];

  var candidates = getCandidates(board, 2);

  for (i = 0; i < candidates.length; i++) {
    move = candidates[i];

    board[move.r][move.c] = aiPlayer;
    attackScore = evalCell(board, move.r, move.c, aiPlayer);

    // Hard: bonus for double-threat (fork)
    if (difficulty === DIFF_HARD && attackScore < 100000) {
      var threats = countThreats(board, move.r, move.c, aiPlayer);
      if (threats >= 2) attackScore *= 3;
    }
    board[move.r][move.c] = 0;

    board[move.r][move.c] = humanPlayer;
    defenseScore = evalCell(board, move.r, move.c, humanPlayer);
    board[move.r][move.c] = 0;

    totalScore = attackScore * 1.1 + defenseScore;
    scored.push({ r: move.r, c: move.c, score: totalScore });
  }

  if (scored.length === 0) return null;

  // Sort descending by score
  scored.sort(function(a, b) { return b.score - a.score; });

  if (difficulty === DIFF_EASY) {
    // Pick randomly from top-5 (or fewer)
    var pool = scored.slice(0, Math.min(5, scored.length));
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // Normal / Hard: pick best, break ties randomly
  var best = scored[0].score;
  var bestMoves = [];
  for (i = 0; i < scored.length; i++) {
    if (scored[i].score < best) break;
    bestMoves.push(scored[i]);
  }
  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}

// ---------- game state ----------

function placeStone(state, r, c) {
  if (state.gameOver) return null;
  if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) return null;
  if (state.board[r][c] !== 0) return null;

  state.board[r][c] = state.currentPlayer;
  state.history.push({ r: r, c: c, player: state.currentPlayer });

  if (checkWin(state.board, r, c, state.currentPlayer)) {
    state.gameOver = true;
    return 'win';
  }

  if (state.history.length === BOARD_SIZE * BOARD_SIZE) {
    state.gameOver = true;
    return 'draw';
  }

  state.currentPlayer = (state.currentPlayer === 1) ? 2 : 1;
  return 'continue';
}

function undoMove(state) {
  if (state.gameOver) return false;
  if (state.history.length === 0) return false;
  var last = state.history.pop();
  state.board[last.r][last.c] = 0;
  state.currentPlayer = last.player;
  return true;
}

function createState() {
  return {
    board: createBoard(),
    history: [],
    currentPlayer: 1,
    gameOver: false
  };
}

module.exports = {
  BOARD_SIZE: BOARD_SIZE,
  DIFF_EASY: DIFF_EASY,
  DIFF_NORMAL: DIFF_NORMAL,
  DIFF_HARD: DIFF_HARD,
  createBoard: createBoard,
  createState: createState,
  checkWin: checkWin,
  evalCell: evalCell,
  lineScore: lineScore,
  countThreats: countThreats,
  getCandidates: getCandidates,
  getAiMove: getAiMove,
  placeStone: placeStone,
  undoMove: undoMove
};
