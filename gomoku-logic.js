// gomoku-logic.js — pure game logic, no DOM dependencies
// ES5 compatible, CommonJS module for testing

var BOARD_SIZE = 15;

var DIRECTIONS = [
  [0, 1],   // horizontal
  [1, 0],   // vertical
  [1, 1],   // diagonal backslash
  [1, -1]   // diagonal slash
];

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
function lineScore(count, openEnds) {
  if (openEnds === 0) return 0;
  if (count >= 5) return 100000;
  if (count === 4) return openEnds === 2 ? 50000 : 10000;
  if (count === 3) return openEnds === 2 ? 5000 : 500;
  if (count === 2) return openEnds === 2 ? 100 : 10;
  if (count === 1) return openEnds === 2 ? 5 : 1;
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

    // forward
    nr = r + dr; nc = c + dc;
    while (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === player) {
      count++;
      nr += dr; nc += dc;
    }
    if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === 0) {
      openEnds++;
    }

    // backward
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

// Return candidate cells: empty cells within `range` steps of any existing stone
function getCandidates(board, range) {
  var r, c, dr, dc, nr, nc;
  var seen = {};
  var candidates = [];

  for (r = 0; r < BOARD_SIZE; r++) {
    for (c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === 0) continue; // only expand around placed stones
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

  // Fallback: board is empty, play center
  if (candidates.length === 0) {
    var mid = Math.floor(BOARD_SIZE / 2);
    candidates.push({ r: mid, c: mid });
  }

  return candidates;
}

// Pick best move for `aiPlayer` against `humanPlayer`
// Returns {r, c} or null if board is full
function getAiMove(board, aiPlayer, humanPlayer) {
  var i, move, attackScore, defenseScore, totalScore;
  var bestScore = -1;
  var bestMoves = [];

  var candidates = getCandidates(board, 2);

  for (i = 0; i < candidates.length; i++) {
    move = candidates[i];

    // Temporarily place stone to evaluate
    board[move.r][move.c] = aiPlayer;
    attackScore = evalCell(board, move.r, move.c, aiPlayer);
    board[move.r][move.c] = 0;

    board[move.r][move.c] = humanPlayer;
    defenseScore = evalCell(board, move.r, move.c, humanPlayer);
    board[move.r][move.c] = 0;

    // Slightly favour attack; heavily penalise letting opponent win
    totalScore = attackScore * 1.1 + defenseScore;

    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestMoves = [{ r: move.r, c: move.c }];
    } else if (totalScore === bestScore) {
      bestMoves.push({ r: move.r, c: move.c });
    }
  }

  if (bestMoves.length === 0) return null;
  // Break ties randomly for variety
  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}

// ---------- game state ----------

// Place a stone; returns 'win', 'draw', or 'continue'
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
  createBoard: createBoard,
  createState: createState,
  checkWin: checkWin,
  evalCell: evalCell,
  lineScore: lineScore,
  getCandidates: getCandidates,
  getAiMove: getAiMove,
  placeStone: placeStone,
  undoMove: undoMove
};
