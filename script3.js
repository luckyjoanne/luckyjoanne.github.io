class GoExpertAI {
    constructor() {
        this.board = Array(9).fill().map(() => Array(9).fill(0));
        this.currentPlayer = 1; 
        this.history = [];
        this.gameOver = false;
        this.moveCount = 0;
        this.lastMove = null;
        this.init();
    }

    init() {
        const grid = document.getElementById('intersections');
        grid.innerHTML = '';
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.id = `cell-${r}-${c}`;
                cell.onclick = () => this.handleUserMove(r, c);
                grid.appendChild(cell);
            }
        }
        this.updateUI();
    }

    handleUserMove(r, c) {
        if (this.gameOver || this.currentPlayer !== 1 || this.board[r][c] !== 0) return;
        if (this.executeMove(r, c, 1)) {
            this.moveCount++;
            this.lastMove = {r, c};
            this.currentPlayer = -1;
            this.updateUI();
            setTimeout(() => this.aiMove(), 600);
        } else {
            alert("⚠️ 這是禁著點！");
        }
    }

    executeMove(r, c, player, isSimulate = false) {
        let tempBoard = JSON.parse(JSON.stringify(this.board));
        tempBoard[r][c] = player;
        let capturedAny = false;
        let capturedCoords = [];

        this.getNeighbors(r, c).forEach(([nr, nc]) => {
            if (tempBoard[nr][nc] === -player) {
                const group = this.getGroup(tempBoard, nr, nc);
                if (group.liberties.size === 0) {
                    group.stones.forEach(([sr, sc]) => {
                        tempBoard[sr][sc] = 0;
                        capturedCoords.push([sr, sc]);
                    });
                    capturedAny = true;
                }
            }
        });

        const selfGroup = this.getGroup(tempBoard, r, c);
        if (!capturedAny && selfGroup.liberties.size === 0) return false;

        if (!isSimulate) {
            capturedCoords.forEach(([sr, sc]) => {
                const el = document.querySelector(`#cell-${sr}-${sc} .stone`);
                if (el) el.classList.add('captured');
            });
            setTimeout(() => {
                this.board = tempBoard;
                this.history.push(JSON.parse(JSON.stringify(this.board)));
                this.updateUI();
            }, capturedCoords.length > 0 ? 300 : 0);
        }
        return true;
    }

    aiMove() {
        if (this.gameOver) return;
        let bestScore = -Infinity;
        let bestMove = null;

        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (this.board[r][c] === 0) {
                    let score = this.evaluateMove(r, c, -1);
                    if (score > bestScore) {
                        bestScore = score;
                        bestMove = {r, c};
                    }
                }
            }
        }

        // 提升 Pass 門檻：如果剩餘落點價值極低，則 AI 寧願虛手也不填眼
        const passThreshold = this.moveCount < 30 ? -1000 : 40;

        if (bestMove && bestScore > passThreshold) {
            this.lastMove = {r: bestMove.r, c: bestMove.c};
            this.executeMove(bestMove.r, bestMove.c, -1);
            this.moveCount++;
            this.currentPlayer = 1;
        } else {
            this.pass(true);
        }
    }

    // 核心實力強化：防填眼評估邏輯
    evaluateMove(r, c, player) {
        // 基本合法性檢查 (包含禁著點)
        if (!this.executeMove(r, c, player, true)) return -10000;

        let score = 0;
        const neighbors = this.getNeighbors(r, c);
        
        // --- [新增] 真眼防護邏輯 ---
        let selfCount = 0;
        let enemyCount = 0;
        neighbors.forEach(([nr, nc]) => {
            if (this.board[nr][nc] === player) selfCount++;
            if (this.board[nr][nc] === -player) enemyCount++;
        });

        // 如果這個點被自己的子包圍(>=3面)，且周圍沒有敵人可以提吃
        // 這極大機率是自己的「活眼」，填進去會造成自殺行為或減氣
        if (selfCount >= 3 && enemyCount === 0) {
            // 除非這手能提掉對方的子，否則絕不落子
            let tempBoard = JSON.parse(JSON.stringify(this.board));
            tempBoard[r][c] = player;
            let willCapture = false;
            neighbors.forEach(([nr, nc]) => {
                if (this.board[nr][nc] === -player) {
                    const g = this.getGroup(tempBoard, nr, nc);
                    if (g.liberties.size === 0) willCapture = true;
                }
            });
            if (!willCapture) return -8000; // 標記為極差的落點 (保護眼位)
        }

        // --- 策略強化：天元與星位 ---
        if (r === 4 && c === 4) score += 250;
        if ([2, 6].includes(r) && [2, 6].includes(c)) score += 150;
        
        // --- 攻防評估 ---
        neighbors.forEach(([nr, nc]) => {
            const stone = this.board[nr][nc];
            if (stone === -player) {
                const g = this.getGroup(this.board, nr, nc);
                if (g.liberties.size === 1) score += 1500; // 提子(最高優先)
                if (g.liberties.size === 2) score += 400;  // 叫吃
            } else if (stone === player) {
                const g = this.getGroup(this.board, nr, nc);
                if (g.liberties.size === 1) score += 1200; // 救己方危棋
                if (g.liberties.size === 2) score += 300;  // 連結與防禦
                score += 60; 
            } else {
                score += 35; // 擴張領地
            }
        });

        // 避免在第一線(邊緣)亂下棋
        if (r === 0 || r === 8 || c === 0 || c === 8) score -= 50;

        return score + Math.random() * 20;
    }

    pass(isAI) {
        if (isAI) {
            const agree = confirm("🤖 電腦 AI 認為局面已定（為保護活眼不填子），請求進行「終局決算」。");
            if (agree) {
                this.calculateFinal();
            } else {
                this.currentPlayer = 1;
                this.updateUI();
                alert("你拒絕了結算，請繼續下棋。");
            }
        } else {
            alert("你選擇了虛手 (Pass)。電腦 AI 正在評估是否同意結算...");
            let aiBestPotential = -Infinity;
            for (let r = 0; r < 9; r++) {
                for (let c = 0; c < 9; c++) {
                    if (this.board[r][c] === 0) {
                        aiBestPotential = Math.max(aiBestPotential, this.evaluateMove(r, c, -1));
                    }
                }
            }
            if (aiBestPotential > 50) {
                alert("電腦 AI 認為盤面還有更高價值的落點，拒絕結束！白棋回合繼續。");
                this.currentPlayer = -1;
                setTimeout(() => this.aiMove(), 500);
            } else {
                alert("電腦 AI 也認為無處可落子，達成協議開始結算。");
                this.calculateFinal();
            }
        }
    }

    calculateFinal() {
        this.gameOver = true;
        let bCount = 0, wCount = 0;
        const visited = new Set();
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (this.board[r][c] === 1) bCount++;
                else if (this.board[r][c] === -1) wCount++;
                else if (!visited.has(`${r},${c}`)) {
                    const area = this.findTerritory(r, c, visited);
                    if (area.owner === 1) bCount += area.size;
                    if (area.owner === -1) wCount += area.size;
                }
            }
        }
        const winMsg = bCount > wCount ? "黑棋(User) 獲勝！" : "白棋(AI) 獲勝！";
        alert(`🏆 終局決算結果：\n黑(User): ${bCount}\n白(AI): ${wCount}\n\n${winMsg}`);
        document.getElementById('status').innerText = `🏁 遊戲結束：${winMsg}`;
        document.getElementById('blackScore').innerText = bCount;
        document.getElementById('whiteScore').innerText = wCount;
        this.updateUI();
    }

    findTerritory(r, c, globalVisited) {
        const stack = [[r, c]], area = [], localVisited = new Set([`${r},${c}`]);
        let owners = new Set();
        while (stack.length > 0) {
            const [currR, currC] = stack.pop();
            area.push([currR, currC]);
            globalVisited.add(`${currR},${currC}`);
            this.getNeighbors(currR, currC).forEach(([nr, nc]) => {
                if (this.board[nr][nc] === 0) {
                    if (!localVisited.has(`${nr},${nc}`)) {
                        localVisited.add(`${nr},${nc}`);
                        stack.push([nr, nc]);
                    }
                } else owners.add(this.board[nr][nc]);
            });
        }
        let owner = owners.size === 1 ? Array.from(owners)[0] : 0;
        return { size: area.length, owner };
    }

    getGroup(board, r, c) {
        const player = board[r][c];
        const stones = [], liberties = new Set();
        const stack = [[r, c]], visited = new Set([`${r},${c}`]);
        while (stack.length > 0) {
            const [currR, currC] = stack.pop();
            stones.push([currR, currC]);
            this.getNeighbors(currR, currC).forEach(([nr, nc]) => {
                if (board[nr][nc] === 0) liberties.add(`${nr},${nc}`);
                else if (board[nr][nc] === player && !visited.has(`${nr},${nc}`)) {
                    visited.add(`${nr},${nc}`);
                    stack.push([nr, nc]);
                }
            });
        }
        return { stones, liberties };
    }

    getNeighbors(r, c) {
        return [[r-1, c], [r+1, c], [r, c-1], [r, c+1]].filter(([nr, nc]) => nr >= 0 && nr < 9 && nc >= 0 && nc < 9);
    }

    updateUI() {
        const cells = document.querySelectorAll('.cell');
        this.board.forEach((row, r) => {
            row.forEach((val, c) => {
                const cell = document.getElementById(`cell-${r}-${c}`);
                cell.innerHTML = '';
                if (val !== 0) {
                    const stone = document.createElement('div');
                    stone.className = `stone ${val === 1 ? 'black' : 'white'}`;
                    const g = this.getGroup(this.board, r, c);
                    if (g.liberties.size === 1) stone.classList.add('atari');
                    stone.onclick = (e) => { e.stopPropagation(); this.showLiberties(g.liberties); };
                    cell.appendChild(stone);
                    if (this.lastMove && this.lastMove.r === r && this.lastMove.c === c) {
                        const m = document.createElement('div'); m.className = 'last-move-marker'; cell.appendChild(m);
                    }
                }
            });
        });
        if (!this.gameOver) {
            document.getElementById('status').innerText = this.currentPlayer === 1 ? "🖤 黑棋回合 (User)" : "⚪ 白棋回合 (AI)";
        }
    }

    showLiberties(liberties) {
        document.querySelectorAll('.liberty-hint').forEach(el => el.remove());
        liberties.forEach(pos => {
            const [r, c] = pos.split(',').map(Number);
            const hint = document.createElement('div');
            hint.className = 'liberty-hint';
            document.getElementById(`cell-${r}-${c}`).appendChild(hint);
        });
        setTimeout(() => document.querySelectorAll('.liberty-hint').forEach(el => el.remove()), 2000);
    }

    undoMove() {
        if (this.history.length >= 2 && !this.gameOver) {
            this.history.splice(-2);
            this.moveCount -= 2;
            this.board = this.history.length > 0 ? JSON.parse(JSON.stringify(this.history[this.history.length - 1])) : Array(9).fill().map(() => Array(9).fill(0));
            this.lastMove = null;
            this.updateUI();
        }
    }
}
let game;
function newGame() { game = new GoExpertAI(); }
window.onload = newGame;