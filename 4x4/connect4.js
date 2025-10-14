class Connect4Game {
    constructor() {
        this.currentPlayer = 1;
        this.gameBoard = Array(6).fill().map(() => Array(7).fill(0));
        this.gameActive = true;
        this.movesHistory = [];
        this.scores = { player1: 0, player2: 0 };
        this.soundEnabled = true;
        this.gameMode = 'multiplayer';
        this.theme = 'classic';
        this.lastMoveTime = 0;
        this.winningCells = [];
        
        this.init();
    }

    init() {
        this.createBoard();
        this.loadScores();
        this.setupEventListeners();
        this.updateStatus();
        this.setTheme(this.theme);
        this.updatePlayerIndicators();
    }

    createBoard() {
        const board = document.getElementById('gameBoard');
        board.innerHTML = '';
        
        const containerWidth = board.clientWidth;
        const slotSize = Math.min((containerWidth - 40) / 7, 70);
        board.style.gap = `${slotSize * 0.1}px`;
        
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 7; col++) {
                const slot = this.createSlot(col, row);
                board.appendChild(slot);
            }
        }
    }

    createSlot(col, row) {
        const slot = document.createElement('div');
        slot.className = 'slot';
        slot.dataset.col = col;
        slot.dataset.row = row;
        slot.setAttribute('role', 'gridcell');
        slot.setAttribute('aria-label', `Στήλη ${col + 1}, Σειρά ${row + 1}`);
        
        const disc = document.createElement('div');
        disc.className = `disc ${this.theme}-theme`;
        disc.id = `disc-${col}-${row}`;
        
        slot.appendChild(disc);
        
        slot.addEventListener('click', (e) => this.handleInteraction(col, e));
        slot.addEventListener('touchend', (e) => this.handleInteraction(col, e));

        return slot;
    }

    handleInteraction(col, e) {
        e.preventDefault();
        const now = Date.now();
        if (now - this.lastMoveTime < 300) return;
        this.lastMoveTime = now;
        this.makeMove(col);
    }

    makeMove(col) {
        if (!this.gameActive) return;
        
        const row = this.findAvailableRow(col);
        if (row === -1) {
            this.playSound('invalid');
            this.showMessage('Η στήλη είναι γεμάτη!', 'error');
            return;
        }

        this.gameBoard[col][row] = this.currentPlayer;
        this.movesHistory.push({ col, row, player: this.currentPlayer });
        
        const disc = document.getElementById(`disc-${col}-${row}`);
        disc.classList.add(this.currentPlayer === 1 ? 'red' : 'yellow');
        
        this.playSound('drop');
        
        if (this.checkWin(col, row)) {
            this.handleWin();
            return;
        }
        
        if (this.checkDraw()) {
            this.handleDraw();
            return;
        }
        
        this.switchPlayer();
        
        if (this.gameMode === 'computer' && this.currentPlayer === 2) {
            setTimeout(() => this.makeAIMove(), 800);
        }
    }

    findAvailableRow(col) {
        for (let row = 5; row >= 0; row--) {
            if (this.gameBoard[col][row] === 0) {
                return row;
            }
        }
        return -1;
    }

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.updateStatus();
        this.updatePlayerIndicators();
    }

    updatePlayerIndicators() {
        const player1 = document.getElementById('player1');
        const player2 = document.getElementById('player2');
        
        if (this.currentPlayer === 1) {
            player1.classList.add('active');
            player2.classList.remove('active');
        } else {
            player2.classList.add('active');
            player1.classList.remove('active');
        }
    }

    checkWin(col, row) {
        const player = this.gameBoard[col][row];
        const directions = [
            [0, 1],   // κάθετα
            [1, 0],   // οριζόντια
            [1, 1],   // διαγώνια ↘
            [1, -1]   // διαγώνια ↗
        ];
        
        for (const [dx, dy] of directions) {
            let count = 1;
            
            // Check positive direction
            for (let i = 1; i < 4; i++) {
                const newCol = col + dx * i;
                const newRow = row + dy * i;
                if (this.isValidPosition(newCol, newRow) && 
                    this.gameBoard[newCol][newRow] === player) {
                    count++;
                } else {
                    break;
                }
            }
            
            // Check negative direction
            for (let i = 1; i < 4; i++) {
                const newCol = col - dx * i;
                const newRow = row - dy * i;
                if (this.isValidPosition(newCol, newRow) && 
                    this.gameBoard[newCol][newRow] === player) {
                    count++;
                } else {
                    break;
                }
            }
            
            if (count >= 4) {
                this.winningCells = this.getWinningCells(col, row, dx, dy);
                return true;
            }
        }
        
        return false;
    }

    isValidPosition(col, row) {
        return col >= 0 && col < 7 && row >= 0 && row < 6;
    }

    getWinningCells(col, row, dx, dy) {
        const player = this.gameBoard[col][row];
        const winningCells = [{ col, row }];
        
        // Check positive direction
        for (let i = 1; i < 4; i++) {
            const newCol = col + dx * i;
            const newRow = row + dy * i;
            if (this.isValidPosition(newCol, newRow) && 
                this.gameBoard[newCol][newRow] === player) {
                winningCells.push({ col: newCol, row: newRow });
            } else {
                break;
            }
        }
        
        // Check negative direction  
        for (let i = 1; i < 4; i++) {
            const newCol = col - dx * i;
            const newRow = row - dy * i;
            if (this.isValidPosition(newCol, newRow) && 
                this.gameBoard[newCol][newRow] === player) {
                winningCells.push({ col: newCol, row: newRow });
            } else {
                break;
            }
        }
        
        return winningCells;
    }

    handleWin() {
        this.gameActive = false;
        this.playSound('win');
        
        if (this.currentPlayer === 1) {
            this.scores.player1++;
        } else {
            this.scores.player2++;
        }
        
        this.saveScores();
        this.updateScoresDisplay();
        this.highlightWinningCells();
        
        document.getElementById('status').innerHTML = 
            `🎉 Ο Παίκτης ${this.currentPlayer} κέρδισε! 🎉`;
            
        this.showConfetti();
    }

    handleDraw() {
        this.gameActive = false;
        this.playSound('draw');
        document.getElementById('status').textContent = 'Ισοπαλία! 🤝';
    }

    highlightWinningCells() {
        this.winningCells.forEach(({ col, row }) => {
            const disc = document.getElementById(`disc-${col}-${row}`);
            disc.style.animation = 'pulse 1s infinite';
            disc.classList.add('winner');
        });
    }

    checkDraw() {
        return this.gameBoard.every(column => column.every(cell => cell !== 0));
    }

    makeAIMove() {
        if (!this.gameActive) return;
        
        let moveCol = this.findWinningMove(2);
        if (moveCol === -1) {
            moveCol = this.findWinningMove(1);
        }
        if (moveCol === -1) {
            moveCol = this.findStrategicMove();
        }
        if (moveCol === -1) {
            moveCol = this.getRandomMove();
        }
        
        if (moveCol !== -1 && this.gameActive) {
            this.makeMove(moveCol);
        }
    }

    findWinningMove(player) {
        for (let col = 0; col < 7; col++) {
            const row = this.findAvailableRow(col);
            if (row !== -1) {
                this.gameBoard[col][row] = player;
                if (this.checkWin(col, row)) {
                    this.gameBoard[col][row] = 0;
                    return col;
                }
                this.gameBoard[col][row] = 0;
            }
        }
        return -1;
    }

    findStrategicMove() {
        const centerCols = [3, 2, 4, 1, 5, 0, 6];
        for (let col of centerCols) {
            if (this.findAvailableRow(col) !== -1) {
                return col;
            }
        }
        return -1;
    }

    getRandomMove() {
        const availableCols = [];
        for (let col = 0; col < 7; col++) {
            if (this.findAvailableRow(col) !== -1) {
                availableCols.push(col);
            }
        }
        return availableCols.length > 0 ? 
            availableCols[Math.floor(Math.random() * availableCols.length)] : -1;
    }

    resetGame() {
        this.gameBoard = Array(6).fill().map(() => Array(7).fill(0));
        this.currentPlayer = 1;
        this.gameActive = true;
        this.movesHistory = [];
        this.lastMoveTime = 0;
        this.winningCells = [];
        this.createBoard();
        this.updateStatus();
        this.updatePlayerIndicators();
    }

    undoMove() {
        if (this.movesHistory.length === 0 || !this.gameActive) return;
        
        const lastMove = this.movesHistory.pop();
        this.gameBoard[lastMove.col][lastMove.row] = 0;
        
        const disc = document.getElementById(`disc-${lastMove.col}-${lastMove.row}`);
        disc.className = `disc ${this.theme}-theme`;
        
        this.currentPlayer = lastMove.player;
        this.updateStatus();
        this.updatePlayerIndicators();
        this.playSound('undo');
        this.lastMoveTime = 0;
    }

    updateStatus() {
        const status = document.getElementById('status');
        status.textContent = `Σειρά του Παίκτη ${this.currentPlayer}`;
    }

    updateScoresDisplay() {
        const scoresElement = document.getElementById('scores');
        if (scoresElement) {
            scoresElement.innerHTML = `
                <div class="score">${this.scores.player1} - ${this.scores.player2}</div>
            `;
        }
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (!this.gameActive) return;
            
            if (e.key >= '1' && e.key <= '7') {
                const col = parseInt(e.key) - 1;
                this.handleInteraction(col, e);
            } else if (e.key === 'r' || e.key === 'R') {
                this.resetGame();
            } else if (e.key === 'z' && e.ctrlKey) {
                e.preventDefault();
                this.undoMove();
            }
        });
    }

    playSound(type) {
        if (!this.soundEnabled) return;
        
        const soundMap = {
            drop: 'dropSound',
            win: 'winSound',
            draw: 'drawSound',
            invalid: 'invalidSound',
            undo: 'undoSound'
        };
        
        const audio = document.getElementById(soundMap[type]);
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(err => console.log('Audio play failed:', err));
        }
    }

    showMessage(message, type = 'info') {
        const messageEl = document.createElement('div');
        messageEl.textContent = message;
        messageEl.className = `message ${type}`;
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'error' ? '#e74c3c' : '#2ecc71'};
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 1000;
            animation: slideDown 0.3s ease;
        `;
        
        document.body.appendChild(messageEl);
        
        setTimeout(() => {
            messageEl.remove();
        }, 2000);
    }

    showConfetti() {
        const confettiCount = 150;
        const colors = ['#e74c3c', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6'];
        
        for (let i = 0; i < confettiCount; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.cssText = `
                    position: fixed;
                    width: 8px;
                    height: 8px;
                    background: ${colors[Math.floor(Math.random() * colors.length)]};
                    top: -10px;
                    left: ${Math.random() * 100}vw;
                    animation: confettiFall ${2 + Math.random() * 2}s linear forwards;
                    z-index: 999;
                    border-radius: 2px;
                `;
                
                document.body.appendChild(confetti);
                
                setTimeout(() => confetti.remove(), 4000);
            }, i * 15);
        }
    }

    saveScores() {
        localStorage.setItem('connect4_scores', JSON.stringify(this.scores));
    }

    loadScores() {
        const saved = localStorage.getItem('connect4_scores');
        if (saved) {
            this.scores = JSON.parse(saved);
        }
        this.updateScoresDisplay();
    }

    setGameMode(mode) {
        this.gameMode = mode;
        this.resetGame();
    }

    setTheme(theme) {
        this.theme = theme;
        document.body.className = `theme-${theme}`;
        this.createBoard();
        const discs = document.querySelectorAll('.disc');
        discs.forEach(disc => {
            disc.className = `disc ${theme}-theme`;
            if (disc.classList.contains('red') || disc.classList.contains('yellow')) {
                disc.classList.add(disc.classList.contains('red') ? 'red' : 'yellow');
            }
        });
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        document.getElementById('soundToggle').textContent = this.soundEnabled ? '🔊' : '🔇';
        return this.soundEnabled;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.connect4Game = new Connect4Game();
});

// Add CSS animations
const additionalCSS = `
@keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.15); }
    100% { transform: scale(1); }
}

@keyframes slideDown {
    from { transform: translate(-50%, -100%); opacity: 0; }
    to { transform: translate(-50%, 0); opacity: 1; }
}

@keyframes confettiFall {
    0% { transform: translateY(0) rotate(0deg); }
    100% { transform: translateY(100vh) rotate(720deg); }
}

.confetti {
    border-radius: 2px;
}

.message {
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    font-weight: bold;
}

.winner {
    box-shadow: 0 0 15px #ffd700, 0 0 30px #ffd700;
}
`;

const style = document.createElement('style');
style.textContent = additionalCSS;
document.head.appendChild(style);
