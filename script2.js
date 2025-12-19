const SIZE = 8;
let board = [];
let turn = 1; // 1 黑棋
let gameEnd = false;

const boardDiv = document.getElementById("board");
const restartBtn = document.getElementById("restart");
const statusDiv = document.getElementById("status");
const aiSelect = document.getElementById("ai-level");

restartBtn.onclick = init;

init();

/*** 初始化棋局 ***/
function init() {

    gameEnd = false;

    board = [...Array(SIZE)].map(() => Array(SIZE).fill(0));

    board[3][3] = 2;
    board[3][4] = 1;
    board[4][3] = 1;
    board[4][4] = 2;

    turn = 1;

    draw();
}

/*** 更新棋盤畫面 ***/
function draw() {

    boardDiv.innerHTML = "";

    for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) {

        let div = document.createElement("div");
        div.className = "cell";
        div.dataset.r = r;
        div.dataset.c = c;
        div.onclick = playerClick;

        if (board[r][c] !== 0) {
            let d = document.createElement("div");
            d.className = "disc " + (board[r][c] === 1 ? "black" : "white");
            d.id = `disc-${r}-${c}`;
            div.appendChild(d);
        }

        if (turn === 1 && canFlip(r,c,1).length > 0)
            div.classList.add("possible");

        boardDiv.appendChild(div);
    }

    updateText();
}

function updateText() {

    let b = board.flat().filter(v=>v===1).length;
    let w = board.flat().filter(v=>v===2).length;

    statusDiv.innerHTML =
        `黑棋 ${b}  :  白棋 ${w} <br>` +
        `${turn===1 ? "輪到玩家" : "電腦思考中…"}`;
}

/*** 點擊棋盤 ***/
function playerClick() {

    if (turn !== 1 || gameEnd) return;

    let r = +this.dataset.r;
    let c = +this.dataset.c;

    let flips = canFlip(r,c,1);

    if (flips.length === 0) return;

    move(r,c,1,flips);

    setTimeout(computerMove,600);
}

/*** 檢查合法翻棋 ***/
function canFlip(r,c,color){
    if (board[r][c] !== 0) return [];

    let enemy = color === 1 ? 2 : 1;
    let dirs = [-1,0,1];
    let list = [];

    for (let dr of dirs)
    for (let dc of dirs)
    {
        if (!dr && !dc) continue;

        let temp = [];
        let rr = r + dr, cc = c + dc;

        while (inside(rr,cc) && board[rr][cc] === enemy){
            temp.push([rr,cc]);
            rr += dr;
            cc += dc;
        }

        if (temp.length > 0 && inside(rr,cc) && board[rr][cc] === color)
            list.push(...temp);
    }
    return list;
}

function inside(r,c){
    return r>=0 && r<SIZE && c>=0 && c<SIZE;
}

function move(r,c,color,flips){

    // 先放玩家/電腦棋子
    board[r][c] = color;
    draw();

    // 動畫延遲起點
    let delay = 0;
    
    flips.forEach(([rr,cc]) => {

        setTimeout(()=>{

            let chip = document.getElementById(`disc-${rr}-${cc}`);

            if (!chip) return;

            chip.classList.add("flip-anim");

            setTimeout(()=>{
                board[rr][cc] = color;
                draw();
            },230);

        },delay);

        delay += 500; // 依序動畫間隔

    });

    // 換手延後到所有動畫完成後
    setTimeout(()=>{

        turn = (turn===1 ? 2 : 1);
        draw();
        checkGameEnd();

    }, delay + 200);
}



/*** 檢查遊戲結束 ***/
function checkGameEnd(){

    if (legalMoves(1).length > 0) return;
    if (legalMoves(2).length > 0) return;

    gameEnd = true;

    let b = board.flat().filter(v=>v===1).length;
    let w = board.flat().filter(v=>v===2).length;

    if (b>w) statusDiv.innerHTML="遊戲結束：黑棋勝！";
    else if (b<w) statusDiv.innerHTML="遊戲結束：白棋勝！";
    else statusDiv.innerHTML="遊戲結束：平手！";
}

/*** 找合法棋步 ***/
function legalMoves(color){
    let list=[];
    for(let r=0;r<SIZE;r++)
    for(let c=0;c<SIZE;c++)
        if (canFlip(r,c,color).length>0)
            list.push([r,c]);
    return list;
}

/*** 電腦落子 ***/
function computerMove(){

    if (gameEnd) return;

    let moves = legalMoves(2);

    if (moves.length === 0){
        turn = 1;
        draw();
        return;
    }

    let r,c;

    if (aiSelect.value === "basic")
        [r,c] = greedyMove(moves);
    else
        [r,c] = advancedMove(moves);

    move(r,c,2,canFlip(r,c,2));
}

/*** Basic AI：翻最多子 ***/
function greedyMove(moves){

    let scores = moves.map(([r,c]) => canFlip(r,c,2).length);

    let max = Math.max(...scores);

    let best = moves.filter((_,i)=>scores[i]===max);

    return best[Math.floor(Math.random()*best.length)];
}

/*** Advanced AI：角落優先 → Greedy ***/
function advancedMove(moves){

    let corner = [[0,0],[0,7],[7,0],[7,7]];

    for (let c of corner)
        if (moves.some(m=>m[0]===c[0] && m[1]===c[1]))
            return c;

    return greedyMove(moves);
}








