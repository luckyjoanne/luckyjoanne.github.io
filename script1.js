// 遊戲主變數
let board = Array(9).fill(null);
let current = 'X';
let active = true;
const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
];

const statusEl = () => document.getElementById('status');
const boardEl = () => document.getElementById('board');
const showHintCheckbox = () => document.getElementById('showHint');

function init() {
    const boardContainer = boardEl();
    boardContainer.innerHTML = '';
    board = Array(9).fill(null);
    active = true;
    current = 'X';
    statusEl().innerText = '玩家 (X) 先手';

    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.setAttribute('data-index', i);
        cell.onclick = () => playerMove(i);
        boardContainer.appendChild(cell);
    }

    document.getElementById('resetBtn').onclick = resetGame;
}

// 玩家下
function playerMove(i) {
    if (!active || board[i]) return;

    board[i] = 'X';
    updateBoard();

    const winner = getWinner();
    if (winner) {
        endGame(winner === 'X' ? '玩家 (X) 勝利！' : '電腦 (O) 勝利！', winner.line);
        return;
    } else if (isFull()) {
        endGame('平手！');
        return;
    }

    current = 'O';
    statusEl().innerText = '電腦思考中...';

    // 讓使用者看到變化，維持短延遲
    setTimeout(() => {
        computerMove();
    }, 400);
}

// 電腦下棋（使用 minimax）
function computerMove() {
    if (!active) return;

    // 1) 先嘗試直接獲勝
    let move = findWinningMove('O');
    // 2) 再嘗試阻擋玩家
    if (move === null) move = findWinningMove('X');
    // 3) 否則讓 minimax 決定（理論上包含 above 情況，但先檢查能加速決策）
    if (move === null) {
        // minimax (alpha-beta)
        move = bestMoveMinimax();
    }
    // fallback 防護
    if (move === null || board[move] !== null) move = getRandomMove();

    board[move] = 'O';
    updateBoard();

    const winner = getWinner();
    if (winner) {
        endGame(winner === 'X' ? '玩家 (X) 勝利！' : '電腦 (O) 勝利！', winner.line);
        return;
    } else if (isFull()) {
        endGame('平手！');
        return;
    }
    current = 'X';
    statusEl().innerText = '輪到玩家 (X)';
}

// 找能贏或能被阻止的那一步（回傳 index 或 null）
function findWinningMove(player) {
    for (let [a,b,c] of wins) {
        const line = [board[a], board[b], board[c]];
        if (line.filter(v => v === player).length === 2 && line.includes(null)) {
            return [a,b,c][line.indexOf(null)];
        }
    }
    return null;
}

function getRandomMove() {
    const empty = board.map((v, i) => v ? null : i).filter(v => v !== null);
    if (empty.length === 0) return null;
    // 優先中心，再角落，再邊
    if (empty.includes(4)) return 4;
    const corners = [0,2,6,8].filter(i => empty.includes(i));
    if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
    return empty[Math.floor(Math.random() * empty.length)];
}

// 更新畫面並清除贏線樣式
function updateBoard() {
    const cells = document.getElementsByClassName('cell');
    for (let i = 0; i < 9; i++) {
        cells[i].innerText = board[i] || '';
        cells[i].classList.remove('disabled', 'win');
    }
    // disable occupied cells' pointer
    for (let i = 0; i < 9; i++) {
        if (board[i]) document.getElementsByClassName('cell')[i].classList.add('disabled');
    }
}

// 判斷勝利者，回傳 {player: 'X'/'O', line: [a,b,c]} 或 null
function getWinner() {
    for (let [a,b,c] of wins) {
        if (board[a] && board[a] === board[b] && board[b] === board[c]) {
            return { player: board[a], line: [a,b,c] };
        }
    }
    return null;
}

function isFull() {
    return board.every(cell => cell !== null);
}

function endGame(message, winLine = null) {
    statusEl().innerText = message;
    active = false;
    if (winLine && Array.isArray(winLine)) {
        const cells = document.getElementsByClassName('cell');
        for (let idx of winLine) cells[idx].classList.add('win');
    }
}

// 重開一局
function resetGame() {
    init();
}

// ===== minimax with alpha-beta pruning =====
function bestMoveMinimax() {
    // If showHint checked, we will mark the evaluated best move temporarily
    const hint = showHintCheckbox() && showHintCheckbox().checked;

    let bestScore = -Infinity;
    let move = null;
    for (let i = 0; i < 9; i++) {
        if (!board[i]) {
            board[i] = 'O';
            const score = minimax(board, 0, false, -Infinity, Infinity);
            board[i] = null;
            if (score > bestScore) {
                bestScore = score;
                move = i;
            }
        }
    }

    // optional hint visual (very brief)
    if (hint && move !== null) {
        const cell = document.querySelector(`.cell[data-index="${move}"]`);
        if (cell) {
            cell.classList.add('win');
            setTimeout(() => cell.classList.remove('win'), 350);
        }
    }

    return move;
}

// 返回評分：O 贏 -> +10 - depth, X 贏 -> -10 + depth, 平手 -> 0
function evaluate(boardState, depth) {
    // check wins
    for (let [a,b,c] of wins) {
        if (boardState[a] && boardState[a] === boardState[b] && boardState[b] === boardState[c]) {
            if (boardState[a] === 'O') return 10 - depth;
            if (boardState[a] === 'X') return -10 + depth;
        }
    }
    return 0;
}

function minimax(boardState, depth, isMaximizing, alpha, beta) {
    const winner = getWinnerFromState(boardState);
    if (winner) {
        return winner.player === 'O' ? 10 - depth : -10 + depth;
    }
    if (boardState.every(cell => cell !== null)) {
        return 0; // draw
    }

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (!boardState[i]) {
                boardState[i] = 'O';
                const evalScore = minimax(boardState, depth + 1, false, alpha, beta);
                boardState[i] = null;
                maxEval = Math.max(maxEval, evalScore);
                alpha = Math.max(alpha, evalScore);
                if (beta <= alpha) break; // beta cutoff
            }
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (let i = 0; i < 9; i++) {
            if (!boardState[i]) {
                boardState[i] = 'X';
                const evalScore = minimax(boardState, depth + 1, true, alpha, beta);
                boardState[i] = null;
                minEval = Math.min(minEval, evalScore);
                beta = Math.min(beta, evalScore);
                if (beta <= alpha) break; // alpha cutoff
            }
        }
        return minEval;
    }
}

// 檢查某個狀態的勝利（不使用全域 board）
function getWinnerFromState(state) {
    for (let [a,b,c] of wins) {
        if (state[a] && state[a] === state[b] && state[b] === state[c]) {
            return { player: state[a], line: [a,b,c] };
        }
    }
    return null;
}

// 初始化
init();