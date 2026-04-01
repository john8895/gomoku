// gomoku-logic.js — pure game logic, no DOM dependencies
// ES5 compatible, CommonJS module for testing

var BOARD_SIZE = 15;

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
  var directions = [
    [0, 1],   // horizontal
    [1, 0],   // vertical
    [1, 1],   // diagonal backslash
    [1, -1]   // diagonal slash
  ];
  var i, dr, dc, count, nr, nc;
  for (i = 0; i < directions.length; i++) {
    dr = directions[i][0];
    dc = directions[i][1];
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
  placeStone: placeStone,
  undoMove: undoMove
};
