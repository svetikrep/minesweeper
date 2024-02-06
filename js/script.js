const field = document.getElementById('field');
const bombsN = 20;
const sizeX = 12;
const sizeY = 12;

let bombs = [];
let nearBombs = {};

let table = '';
let cells = [];
let first = true;
let focus = 'x0y0';
let isCtrl = false;
let opened = 0;
let bombsLeft = bombsN;

function initializeGame() {
    generateField();
    addEventListeners();
}

function generateField() {
    for (let i = 0; i < sizeY; i++) {
        table += '<tr>';
        for (let j = 0; j < sizeX; j++)
            table += '<td id="x' + j + 'y' + i + '" class="closed"></td>';
        table += '</tr>';
    }
    field.innerHTML = table;
    cells = [...document.querySelectorAll('td')];
    document.getElementById('bombsLeft').innerHTML = bombsLeft;
}

function addEventListeners() {
    cells.forEach((el) => el.addEventListener('click', () => openCells(el, bombsLeft)));
    cells.forEach((el) => el.addEventListener('contextmenu', (e) => mark(el, bombsLeft)));
    field.addEventListener('contextmenu', (event) => event.preventDefault());
    document.addEventListener('keyup', keyUp);
    document.addEventListener('keydown', keyDown);
}

function openCell(cell) {
    cell.classList.remove('closed');
    opened++;
}

function keyUp(event) {
    if (event.key == 'Control') isCtrl = false;
}

function keyDown(event) {
    if (event.key == 'Control') {
        isCtrl = true;
    }
    controlKeys(event);
}

function controlKeys(event) {
    switch (event.key) {
        case 'ArrowLeft':
            moveFocus(-1, 0);
            break;
        case 'ArrowUp':
            moveFocus(0, -1);
            break;
        case 'ArrowRight':
            moveFocus(1, 0);
            break;
        case 'ArrowDown':
            moveFocus(0, 1);
            break;
        case ' ':
        case 'Enter':
            if (isCtrl) {
                mark(document.getElementById(focus));
            } else {
                openCells(document.getElementById(focus));
            }
            break;
        default:
            return;
    }

    document.getElementById(focus).style.cssText = 'outline: 1px solid black';
}

function moveFocus(deltaX, deltaY) {
    const x = parse(focus).x + deltaX;
    const y = parse(focus).y + deltaY;

    const newFocus = 'x' + x + 'y' + y;
    const targetCell = document.getElementById(newFocus);

    if (targetCell !== null) {
        document.getElementById(focus).style.cssText = 'outline-width: 0';
        focus = newFocus;
    }
}

function openCells(el) {
    if (first == true) {
        first = el.id;
        spawn(first);
    }
    if (el.classList.contains('flag') || !el.classList.contains('closed'))
        return;
    if (el.classList.contains('bomb')) {
        document.getElementById('bombsLeft').innerHTML = bombsN - document.querySelectorAll('.bomb.flag').length;
        showWarn('lose');
        return;
    }
    openCell(el);
    const { x, y } = parse(el.id);
    openNearCells(el, x, y);
    if (opened == sizeX*sizeY - bombsN) {
        showWarn('win');
        document.getElementById('bombsLeft').innerHTML = 0;
    }
}

function parse(coords) {
    const [x, y] = coords.slice(1).split('y').map(Number);
    return { x, y };
}


function rand(max) {
    return Math.floor(Math.random() * max);
}


function nearestCells(x, y) {
    x = Number(x); y = Number(y);
    return [('x' + (x + 1) + 'y' + (y)),
    ('x' + (x + 1) + 'y' + (y + 1)),
    ('x' + (x + 1) + 'y' + (y - 1)),
    ('x' + (x - 1) + 'y' + (y)),
    ('x' + (x - 1) + 'y' + (y + 1)),
    ('x' + (x - 1) + 'y' + (y - 1)),
    ('x' + (x) + 'y' + (y + 1)),
    ('x' + (x) + 'y' + (y - 1))];
}

function addnearBombs(el, ar) {
    if (!document.getElementById(el))
        return;
    if (el in ar)
        ar[el] += 1;
    else
        ar[el] = 1;
}

function openNearCells(el, x, y) {
    const cellIndices = nearestCells(x, y);
    cellIndices.forEach((index) => {
        const cell = document.getElementById(index);
        if (cell && cell.classList.contains('closed') && !cell.classList.contains('bomb')) {
            if (el.classList.contains('nearBombs') && cell.classList.contains('nearBombs'))
                return;
            openCell(cell);
            if (cell.classList.contains('nearBombs')) {
                return;
            }
            openNearCells(cell, parse(index).x, parse(index).y);
        }
    });
}

function showWarn(content) {
    document.querySelectorAll('td').forEach((el) => el.classList.remove('closed'));
    document.querySelectorAll('.bomb.flag').forEach((el) => {
        el.classList.remove('flag');
    });

    document.getElementById('smile').src = 'img/' + content + '.svg';

    document.querySelector('table').style.pointerEvents = 'none';
    document.getElementById('bombsLeft').innerHTML = 0;
    document.removeEventListener('keydown', keyDown);
    document.removeEventListener('keyup', keyUp);
}

window.addEventListener("keydown", function (e) {
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(e.code) > -1) {
        e.preventDefault();
    }
}, false);

function mark(el) {
    if (first == true || !el.classList.contains('closed')) {
        return;
    }
    if (el.classList.contains('flag')) {
        el.classList.remove('flag');
        bombsLeft++;
    } else if (bombsLeft > 0) {
        el.classList.add('flag');
        bombsLeft--;
    }
    document.getElementById('bombsLeft').innerHTML = bombsLeft;
}

function spawn(first) {
    const firstX = parse(first).x;
    const firstY = parse(first).y;

    bombs.length = 0;

    while (bombs.length < bombsN) {
        const x = rand(sizeX);
        const y = rand(sizeY);

        const distance = Math.sqrt((firstX - x) ** 2 + (firstY - y) ** 2);
        if (distance >= 2 && bombs.indexOf('x' + x + 'y' + y) === -1) {
            nearestCells(x, y).forEach((index) => addnearBombs(index, nearBombs));
            bombs.push('x' + x + 'y' + y);
            document.getElementById('x' + x + 'y' + y).classList.add('bomb');
        }
    }

    for (const bomb of bombs) {
        if (bomb in nearBombs) {
            delete nearBombs[bomb];
        }
    }

    for (const cell in nearBombs) {
        document.getElementById(cell).innerHTML = nearBombs[cell];
        document.getElementById(cell).classList.add('nearBombs');
    }
}

// начать игру
initializeGame();