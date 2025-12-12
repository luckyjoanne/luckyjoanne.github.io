const boardE1 = document.getElementById('board');
const cells = Array.from(document.querySelectorAll('.cell'));
const btnResetAll = document.getElementById('reset-all');
const btnReset = document.getElementById('reset');
const turnEl = document.getElementById('turn');
const stateEl = document.getElementById('state');
const scoreXEl = document.getElementById('score-x');
const scoreOEl = document.getElementById('score-o');
const scoreDrawEl = document.getElementById('score-draw');

const winLineEl = document.getElementById('win-line');

let board, current, active;
let scoreX = 0;
let scoreO = 0;
let scoreDraw = 0;

const WIN_LINES = [
    [0,1,2],[3,4,5],[6,7,8], // rows
    [0,3,6],[1,4,7],[2,5,8], // cols
    [0,4,8],[2,4,6] // diags
];

function init(){
    board = Array(9).fill('');
    current = 'X';
    active = true;
    cells.forEach(c=>{
        c.textContent = '';
        c.className = 'cell';
        c.disabled = false;
    });
    turnEl.textContent = current;
    stateEl.textContent = '';


    winLineEl.style.opacity = 0;
    winLineEl.style.width = 0;

}

function clearBoard(){
cells.forEach(c=>{
c.textContent = '';
c.removeAttribute('data-mark');
c.disabled = false;
});
}

function place(idx){
    if(!active || board[idx]) return;
    board[idx] = current;
    const cell = cells[idx];
    cell.textContent = current;
    cell.classList.add(current.toLowerCase());
    const result = evaluate();
    if(result.finished){
    endGame(result);
    }else{
    switchTurn();
}
}

function switchTurn(){
    current = current==='X' ? 'O' : 'X';
    turnEl.textContent = current;
}

function evaluate(){
    for(const line of WIN_LINES){
    const [a,b,c] = line;
    if(board[a] && board[a]===board[b] && board[a]===board[c]){
    return { finished:true, winner:board[a], line };
    }
    }
    if(board.every(v=>v)) return { finished:true, winner:null };
    return { finished:false };
}



cells.forEach(cell=>{
    cell.addEventListener('click', ()=>{
        const idx = +cell.getAttribute('data-idx');
        place(idx);
    });
});
btnReset.addEventListener('click', init);
//
init();



function drawWinLine(line) {
    const positions = {
        0: [0, 0], 1: [1, 0], 2: [2, 0],
        3: [0, 1], 4: [1, 1], 5: [2, 1],
        6: [0, 2], 7: [1, 2], 8: [2, 2]
    };

    const [a, b, c] = line;
    const boardRect = boardE1.getBoundingClientRect();

    const start = positions[a];
    const end = positions[c];

    const cellW = boardRect.width / 3;
    const cellH = boardRect.height / 3;

    const x1 = boardRect.left + start[0] * cellW + cellW / 2;
    const y1 = boardRect.top + start[1] * cellH + cellH / 2;

    const x2 = boardRect.left + end[0] * cellW + cellW / 2;
    const y2 = boardRect.top + end[1] * cellH + cellH / 2;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;

    winLineEl.style.width = length + "px";
    winLineEl.style.transform = `rotate(${angle}deg)`;
    winLineEl.style.left = x1 + "px";
    winLineEl.style.top = y1 + "px";
    winLineEl.style.opacity = 1;
}



function endGame({winner, line}){
    active = false;
    if(winner){
        stateEl.textContent = `${winner} 勝利！`;
        line.forEach(i=> cells[i].classList.add('win'));
        drawWinLine(line); 
        if(winner==='X') scoreX++; else scoreO++;
    }else{
            stateEl.textContent = '平手';
            scoreDraw++;
    }
    updateScoreboard();
    cells.forEach(c=> c.disabled = true);
}



function updateScoreboard(){
scoreXEl.textContent = scoreX;
scoreOEl.textContent = scoreO;
scoreDrawEl.textContent = scoreDraw;
}

btnReset.addEventListener('click', init);

btnResetAll.addEventListener('click', ()=>{
    scoreX = scoreO = scoreDraw = 0;
    updateScoreboard();
    init();
});


