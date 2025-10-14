class Connect4Game {
    constructor() {
        this.currentPlayer = 1;
        this.gameBoard = [];
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
        this.initializeBoard();
        this.createBoard();
        this.loadScores();
        this.setupEventListeners();
        this.updateStatus();
        this.setTheme(this.theme);
        this.updatePlayerIndicators();
    }

    initializeBoard() {
        // Create 7 columns x 6 rows board
        this.gameBoard = Array(7).fill().map(() => Array(6).fill(0));
    }

    createBoard() {
        const board = document.getElementById('gameBoard');
        if (!board) {
            console.error('Board element not found!');
            return;
        }
        
        board.innerHTML = '';
        board.style.gridTemplateColumns = 'repeat(7, 1fr)';
        board.style.gridTemplateRows = 'repeat(6, 1fr)';
        
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
        
        const disc = document.createElement('div');
        disc.className = `disc ${this.theme}-theme`;
        disc.id = `disc-${col}-${row}`;
        
        slot.appendChild(disc);
        
        // Add click event to the slot (not the disc)
        slot.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleColumnClick(col);
        });
        
        slot.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleColumnClick(col);
        });

        return slot;
    }

    handleColumnClick(col) {
        const now = Date.now();
        if (now - this.lastMoveTime < 300) return;
        this.lastMoveTime = now;
        
        console.log(`Column ${col} clicked`);
        this.makeMove(col);
    }

    makeMove(col) {
        if (!this.gameActive) {
            console.log('Game not active');
            return;
        }
        
        console.log(`Making move in column ${col}`);
        const row = this.findAvailableRow(col);
        
        if (row === -1) {
            console.log('Column full');
            this.playSound('invalid');
            this.showMessage('Η στήλη είναι γεμάτη!', 'error');
            return;
        }

        console.log(`Placing disc at ${col}, ${row}`);
        this.gameBoard[col][row] = this.currentPlayer;
        this.movesHistory.push({ col, row, player: this.currentPlayer });
        
        const disc = document.getElementById(`disc-${col}-${row}`);
        if (disc) {
            disc.classList.add(this.currentPlayer === 1 ? 'red' : 'yellow');
            disc.style.transform = 'translateY(0)';
            disc.style.opacity = '1';
        }
        
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
        // Find the first available row from bottom (row 5) to top (row 0)
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
        
        if (player1 && player2) {
            if (this.currentPlayer === 1) {
                player1.classList.add('active');
                player2.classList.remove('active');
            } else {
                player2.classList.add('active');
                player1.classList.remove('active');
            }
        }
    }

    checkWin(col, row) {
        const player = this.gameBoard[col][row];
        const directions = [
            [0, 1],   // vertical
            [1, 0],   // horizontal
            [1, 1],   // diagonal ↘
            [1, -1]   // diagonal ↗
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
        
        const status = document.getElementById('status');
        if (status) {
            status.innerHTML = `🎉 Ο Παίκτης ${this.currentPlayer} κέρδισε! 🎉`;
        }
            
        this.showConfetti();
    }

    handleDraw() {
        this.gameActive = false;
        this.playSound('draw');
        const status = document.getElementById('status');
        if (status) {
            status.textContent = 'Ισοπαλία! 🤝';
        }
    }

    highlightWinningCells() {
        this.winningCells.forEach(({ col, row }) => {
            const disc = document.getElementById(`disc-${col}-${row}`);
            if (disc) {
                disc.style.animation = 'pulse 1s infinite';
                disc.classList.add('winner');
            }
        });
    }

    checkDraw() {
        // Check if all columns are full
        for (let col = 0; col < 7; col++) {
            if (this.gameBoard[col][0] === 0) {
                return false; // Found an empty spot
            }
        }
        return true; // All spots are filled
    }

    makeAIMove() {
        if (!this.gameActive) return;
        
        let moveCol = this.findWinningMove(2); // Check if AI can win
        if (moveCol === -1) {
            moveCol = this.findWinningMove(1); // Block player
        }
        if (moveCol === -1) {
            moveCol = this.findStrategicMove(); // Strategic move
        }
        if (moveCol === -1) {
            moveCol = this.getRandomMove(); // Random move
        }
        
        if (moveCol !== -1 && this.gameActive) {
            console.log(`AI moving in column ${moveCol}`);
            this.makeMove(moveCol);
        }
    }

    findWinningMove(player) {
        for (let col = 0; col < 7; col++) {
            const row = this.findAvailableRow(col);
            if (row !== -1) {
                // Simulate move
                this.gameBoard[col][row] = player;
                const isWinning = this.checkWin(col, row);
                // Undo simulation
                this.gameBoard[col][row] = 0;
                
                if (isWinning) {
                    return col;
                }
            }
        }
        return -1;
    }

    findStrategicMove() {
        const centerCols = [3, 2, 4, 1, 5, 0, 6]; // Prefer center columns
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
        this.initializeBoard();
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
        if (disc) {
            disc.className = `disc ${this.theme}-theme`;
            disc.style.transform = 'translateY(-600px)';
            disc.style.opacity = '0';
        }
        
        this.currentPlayer = lastMove.player;
        this.updateStatus();
        this.updatePlayerIndicators();
        this.playSound('undo');
        this.lastMoveTime = 0;
    }

    updateStatus() {
        const status = document.getElementById('status');
        if (status) {
            status.textContent = `Σειρά του Παίκτη ${this.currentPlayer}`;
        }
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
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (!this.gameActive) return;
            
            if (e.key >= '1' && e.key <= '7') {
                const col = parseInt(e.key) - 1;
                this.makeMove(col);
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
        
        // Update all discs with new theme
        const discs = document.querySelectorAll('.disc');
        discs.forEach(disc => {
            disc.className = `disc ${theme}-theme`;
            // Re-apply color if disc was placed
            const col = disc.parentElement.dataset.col;
            const row = disc.parentElement.dataset.row;
            if (col !== undefined && row !== undefined) {
                const player = this.gameBoard[col][row];
                if (player !== 0) {
                    disc.classList.add(player === 1 ? 'red' : 'yellow');
                    disc.style.transform = 'translateY(0)';
                    disc.style.opacity = '1';
                }
            }
        });
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const soundToggle = document.getElementById('soundToggle');
        if (soundToggle) {
            soundToggle.textContent = this.soundEnabled ? '🔊' : '🔇';
        }
        return this.soundEnabled;
    }
}

// Initialize game when DOM is loaded
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

// Inject CSS
if (document.head) {
    const style = document.createElement('style');
    style.textContent = additionalCSS;
    document.head.appendChild(style);
}
