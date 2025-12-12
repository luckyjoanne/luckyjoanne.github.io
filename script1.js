// ====== 遊戲主變數 ======
let board = Array(9).fill(null);
let current = 'X';
let active = true;

let playerScore = 0;
let computerScore = 0;
let drawScore = 0;

const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
];

const statusEl = () => document.getElementById('status');
const boardEl = () => document.getElementById('board');
const showHintCheckbox = () => document.getElementById('showHint');

function updateScoreboard() {
    document.getElementById("playerScore").innerText = playerScore;
    document.getElementById("computerScore").innerText = computerScore;
    document.getElementById("drawScore").innerText = drawScore;
}

// ===== 初始化 =====
function init() {
    const container = boardEl();
    container.innerHTML = '';

    board = Array(9).fill(null);
    active = true;
    current = 'X';
    statusEl().innerText = "玩家 (X) 先手";

    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.setAttribute("data-index", i);
        cell.onclick = () => playerMove(i);
        container.appendChild(cell);
    }

    document.getElementById("resetBtn").onclick = resetGame;
    updateScoreboard();
}

// ===== 玩家行動 =====
function playerMove(i) {
    if (!active || board[i]) return;

    board[i] = 'X';
    updateBoard();

    const winner = getWinner();
    if (winner) {
        playerScore++;
        endGame("玩家 (X) 勝利！", winner.line);
        return;
    }

    if (isFull()) {
        drawScore++;
        endGame("平手！");
        return;
    }

    current = 'O';
    statusEl().innerText = "電腦思考中...";

    setTimeout(computerMove, 400);
}

// ===== 電腦 AI 行動 =====
function computerMove() {
    if (!active) return;

    // 優先快速處理
    let move = findWinningMove('O');
    if (move === null) move = findWinningMove('X');
    if (move === null) move = bestMoveMinimax();
    if (move === null) move = getRandomMove();

    board[move] = 'O';
    updateBoard();

    const winner = getWinner();
    if (winner) {
        computerScore++;
        endGame("電腦 (O) 勝利！", winner.line);
        return;
    }

    if (isFull()) {
        drawScore++;
        endGame("平手！");
        return;
    }

    current = 'X';
    statusEl().innerText = "輪到玩家 (X)";
}

// ===== 核心功能 =====
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
    const empty = board.map((v,i)=>v?null:i).filter(v=>v!==null);
    if (empty.includes(4)) return 4;
    const corners = [0,2,6,8].filter(i => empty.includes(i));
    if (corners.length) return corners[Math.floor(Math.random()*corners.length)];
    return empty[Math.floor(Math.random()*empty.length)];
}

function updateBoard() {
    const cells = document.getElementsByClassName("cell");
    for (let i = 0; i < 9; i++) {
        cells[i].innerText = board[i] || "";
        cells[i].classList.remove("disabled", "win");
        if (board[i]) cells[i].classList.add("disabled");
    }
}

function getWinner() {
    for (let [a,b,c] of wins) {
        if (board[a] && board[a] === board[b] && board[b] === board[c]) {
            return {player: board[a], line:[a,b,c]};
        }
    }
    return null;
}

function isFull() {
    return board.every(v => v !== null);
}

function endGame(msg, line=null) {
    statusEl().innerText = msg;
    active = false;

    updateScoreboard();

    if (line) {
        const cells = document.getElementsByClassName("cell");
        for (let i of line) cells[i].classList.add("win");
    }
}

function resetGame() { init(); }

// ===== minimax + alpha-beta =====
function bestMoveMinimax() {
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
    return move;
}

function minimax(state, depth, isMax, alpha, beta) {
    const winner = getWinnerFromState(state);
    if (winner) return winner.player === "O" ? 10 - depth : -10 + depth;
    if (state.every(v=>v!==null)) return 0;

    if (isMax) {
        let best = -Infinity;
        for (let i=0;i<9;i++){
            if (!state[i]) {
                state[i] = "O";
                let value = minimax(state, depth+1, false, alpha, beta);
                state[i] = null;
                best = Math.max(best, value);
                alpha = Math.max(alpha, value);
                if (beta <= alpha) break;
            }
        }
        return best;
    } else {
        let best = Infinity;
        for (let i=0;i<9;i++){
            if (!state[i]) {
                state[i] = "X";
                let value = minimax(state, depth+1, true, alpha, beta);
                state[i] = null;
                best = Math.min(best, value);
                beta = Math.min(beta, value);
                if (beta <= alpha) break;
            }
        }
        return best;
    }
}

function getWinnerFromState(s) {
    for (let [a,b,c] of wins) {
        if (s[a] && s[a] === s[b] && s[b] === s[c]) {
            return {player: s[a], line:[a,b,c]};
        }
    }
    return null;
}

// ===== 啟動 =====
init();
