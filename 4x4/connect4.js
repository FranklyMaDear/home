// Connect 4 Game Logic
class Connect4Game {
    constructor() {
        this.currentPlayer = 1;
        this.gameBoard = Array(6).fill().map(() => Array(6).fill(0));
        this.gameActive = true;
        this.movesHistory = [];
        this.scores = { player1: 0, player2: 0 };
        this.soundEnabled = true;
        
        this.init();
    }

    init() {
        this.createBoard();
        this.loadScores();
        this.setupEventListeners();
        this.updateStatus();
    }

    createBoard() {
        const board = document.getElementById('gameBoard');
        board.innerHTML = '';
        
        const containerWidth = board.clientWidth;
        const slotSize = Math.min((containerWidth - 40) / 6, 70);
        board.style.gap = `${slotSize * 0.1}px`;
        
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 6; col++) {
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
        disc.className = 'disc';
        disc.id = `disc-${col}-${row}`;
        
        slot.appendChild(disc);
        
        // Event listeners
        slot.addEventListener('click', () => this.makeMove(col));
        slot.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.makeMove(col);
        });

        return slot;
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
        
        // AI move if against computer
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
    }

    checkWin(col, row) {
        const player = this.gameBoard[col][row];
        const directions = [
            [0, 1], [1, 0], [1, 1], [1, -1]
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
        return col >= 0 && col < 6 && row >= 0 && row < 6;
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
        
        // Update scores
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
        document.getElementById('status').textContent = 'Ισοπαλία!';
    }

    highlightWinningCells() {
        this.winningCells.forEach(({ col, row }) => {
            const disc = document.getElementById(`disc-${col}-${row}`);
            disc.style.animation = 'pulse 1s infinite';
        });
    }

    checkDraw() {
        return this.gameBoard.every(column => column.every(cell => cell !== 0));
    }

    makeAIMove() {
        if (!this.gameActive) return;
        
        // Simple AI - prioritize winning, then blocking, then random
        let moveCol = this.findWinningMove(2); // AI is player 2
        
        if (moveCol === -1) {
            moveCol = this.findWinningMove(1); // Block player 1
        }
        
        if (moveCol === -1) {
            moveCol = this.findStrategicMove();
        }
        
        if (moveCol === -1) {
            moveCol = this.getRandomMove();
        }
        
        if (moveCol !== -1) {
            this.makeMove(moveCol);
        }
    }

    findWinningMove(player) {
        for (let col = 0; col < 6; col++) {
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
        // Prefer center columns
        const centerCols = [2, 3, 1, 4, 0, 5];
        for (let col of centerCols) {
            if (this.findAvailableRow(col) !== -1) {
                return col;
            }
        }
        return -1;
    }

    getRandomMove() {
        const availableCols = [];
        for (let col = 0; col < 6; col++) {
            if (this.findAvailableRow(col) !== -1) {
                availableCols.push(col);
            }
        }
        return availableCols.length > 0 ? 
            availableCols[Math.floor(Math.random() * availableCols.length)] : -1;
    }

    resetGame() {
        this.gameBoard = Array(6).fill().map(() => Array(6).fill(0));
        this.currentPlayer = 1;
        this.gameActive = true;
        this.movesHistory = [];
        this.createBoard();
        this.updateStatus();
    }

    undoMove() {
        if (this.movesHistory.length === 0 || !this.gameActive) return;
        
        const lastMove = this.movesHistory.pop();
        this.gameBoard[lastMove.col][lastMove.row] = 0;
        
        const disc = document.getElementById(`disc-${lastMove.col}-${lastMove.row}`);
        disc.className = 'disc';
        
        this.currentPlayer = lastMove.player;
        this.updateStatus();
        this.playSound('undo');
    }

    updateStatus() {
        const status = document.getElementById('status');
        const playerText = this.currentPlayer === 1 ? 'Κόκκινο' : 'Κίτρινο';
        status.textContent = `Σειρά του Παίκτη ${this.currentPlayer} (${playerText})`;
    }

    updateScoresDisplay() {
        const scoresElement = document.getElementById('scores');
        if (scoresElement) {
            scoresElement.innerHTML = `
                <div>Παίκτης 1: ${this.scores.player1}</div>
                <div>Παίκτης 2: ${this.scores.player2}</div>
            `;
        }
    }

    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (!this.gameActive) return;
            
            if (e.key >= '1' && e.key <= '6') {
                const col = parseInt(e.key) - 1;
                this.makeMove(col);
            } else if (e.key === 'r' || e.key === 'R') {
                this.resetGame();
            } else if (e.key === 'z' && e.ctrlKey) {
                e.preventDefault();
                this.undoMove();
            }
        });

        // Prevent zoom on double tap
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, { passive: false });
    }

    playSound(type) {
        if (!this.soundEnabled) return;
        
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        switch(type) {
            case 'drop':
                oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                break;
            case 'win':
                oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
                gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
                break;
            case 'draw':
                oscillator.frequency.setValueAtTime(392, audioContext.currentTime); // G4
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                break;
            case 'invalid':
                oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                break;
            case 'undo':
                oscillator.frequency.setValueAtTime(250, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                break;
        }
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + (type === 'win' ? 1 : 0.3));
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
        const confettiCount = 100;
        const colors = ['#e74c3c', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6'];
        
        for (let i = 0; i < confettiCount; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.cssText = `
                    position: fixed;
                    width: 10px;
                    height: 10px;
                    background: ${colors[Math.floor(Math.random() * colors.length)]};
                    top: -10px;
                    left: ${Math.random() * 100}vw;
                    animation: confettiFall ${2 + Math.random() * 3}s linear forwards;
                    z-index: 999;
                `;
                
                document.body.appendChild(confetti);
                
                setTimeout(() => confetti.remove(), 5000);
            }, i * 20);
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

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        return this.soundEnabled;
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.connect4Game = new Connect4Game();
});

// CSS Animations (add to your CSS file)
const additionalCSS = `
@keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
}

@keyframes slideDown {
    from { transform: translate(-50%, -100%); opacity: 0; }
    to { transform: translate(-50%, 0); opacity: 1; }
}

@keyframes confettiFall {
    0% { transform: translateY(0) rotate(0deg); }
    100% { transform: translateY(100vh) rotate(360deg); }
}

.confetti {
    border-radius: 2px;
}

.message {
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    font-weight: bold;
}
`;

// Add the additional CSS to the document
const style = document.createElement('style');
style.textContent = additionalCSS;
document.head.appendChild(style);
