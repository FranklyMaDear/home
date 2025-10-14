class Connect4Game {
    constructor() {
        this.rows = 6;
        this.cols = 7;
        this.currentPlayer = 1; // 1 = human, 2 = AI
        this.gameBoard = [];
        this.gameActive = true;
        this.movesHistory = [];
        this.scores = { human: 0, ai: 0 };
        this.difficulty = 'medium';
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
        this.updatePlayerIndicators();
    }

    initializeBoard() {
        this.gameBoard = Array(this.cols).fill().map(() => Array(this.rows).fill(0));
    }

    createBoard() {
        const board = document.getElementById('gameBoard');
        if (!board) return;
        
        board.innerHTML = '';
        board.style.gridTemplateColumns = `repeat(${this.cols}, 1fr)`;
        board.style.gridTemplateRows = `repeat(${this.rows}, 1fr)`;
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
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
        
        slot.addEventListener('click', () => {
            if (this.currentPlayer === 1 && this.gameActive) {
                this.handleColumnClick(col);
            }
        });
        
        slot.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (this.currentPlayer === 1 && this.gameActive) {
                this.handleColumnClick(col);
            }
        });

        return slot;
    }

    handleColumnClick(col) {
        if (!this.gameActive || this.currentPlayer !== 1) return;
        
        const now = Date.now();
        if (now - this.lastMoveTime < 300) return;
        this.lastMoveTime = now;
        
        this.makeMove(col);
    }

    makeMove(col) {
        if (!this.gameActive) return;
        
        const row = this.findAvailableRow(col);
        if (row === -1) return;

        this.gameBoard[col][row] = this.currentPlayer;
        this.movesHistory.push({ col, row, player: this.currentPlayer });
        
        this.animateDiscDrop(col, row);
        
        setTimeout(() => {
            if (this.checkWin(col, row)) {
                this.handleWin();
                return;
            }
            
            if (this.checkDraw()) {
                this.handleDraw();
                return;
            }
            
            this.switchPlayer();
            
            // AI's turn
            if (this.currentPlayer === 2 && this.gameActive) {
                setTimeout(() => this.makeAIMove(), 800);
            }
        }, 600);
    }

    animateDiscDrop(col, row) {
        const disc = document.getElementById(`disc-${col}-${row}`);
        if (disc) {
            disc.classList.add(this.currentPlayer === 1 ? 'red' : 'yellow');
            disc.style.animation = 'discDrop 0.6s ease-out forwards';
        }
    }

    findAvailableRow(col) {
        for (let row = this.rows - 1; row >= 0; row--) {
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
        const humanPlayer = document.querySelector('.human-player');
        const aiPlayer = document.querySelector('.ai-player');
        
        if (humanPlayer && aiPlayer) {
            humanPlayer.classList.toggle('active', this.currentPlayer === 1);
            aiPlayer.classList.toggle('active', this.currentPlayer === 2);
            
            // Show thinking indicator for AI
            if (this.currentPlayer === 2 && this.gameActive) {
                aiPlayer.classList.add('ai-thinking');
            } else {
                aiPlayer.classList.remove('ai-thinking');
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
        return col >= 0 && col < this.cols && row >= 0 && row < this.rows;
    }

    getWinningCells(col, row, dx, dy) {
        const player = this.gameBoard[col][row];
        const winningCells = [{ col, row }];
        
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
        
        if (this.currentPlayer === 1) {
            this.scores.human++;
        } else {
            this.scores.ai++;
        }
        
        this.saveScores();
        this.updateScoresDisplay();
        this.highlightWinningCells();
        
        const status = document.getElementById('status');
        if (status) {
            if (this.currentPlayer === 1) {
                status.innerHTML = '🎉 Κέρδισες! Μπράβο! 🎉';
            } else {
                status.innerHTML = '🤖 Ο AI κέρδισε! Δοκίμασε ξανά!';
            }
        }
            
        this.showConfetti();
    }

    handleDraw() {
        this.gameActive = false;
        const status = document.getElementById('status');
        if (status) {
            status.textContent = 'Ισοπαλία! 🤝 Καλό παιχνίδι!';
        }
    }

    highlightWinningCells() {
        this.winningCells.forEach(({ col, row }) => {
            const disc = document.getElementById(`disc-${col}-${row}`);
            if (disc) {
                disc.classList.add('winner');
            }
        });
    }

    checkDraw() {
        for (let col = 0; col < this.cols; col++) {
            if (this.gameBoard[col][0] === 0) {
                return false;
            }
        }
        return true;
    }

    makeAIMove() {
        if (!this.gameActive || this.currentPlayer !== 2) return;
        
        let moveCol;
        
        switch (this.difficulty) {
            case 'easy':
                moveCol = this.getEasyAIMove();
                break;
            case 'medium':
                moveCol = this.getMediumAIMove();
                break;
            case 'hard':
                moveCol = this.getHardAIMove();
                break;
            default:
                moveCol = this.getMediumAIMove();
        }
        
        if (moveCol !== -1) {
            this.makeMove(moveCol);
        }
    }

    getEasyAIMove() {
        // Random moves with some basic logic
        if (Math.random() < 0.7) {
            const winningMove = this.findWinningMove(2);
            if (winningMove !== -1) return winningMove;
        }
        
        if (Math.random() < 0.5) {
            const blockingMove = this.findWinningMove(1);
            if (blockingMove !== -1) return blockingMove;
        }
        
        return this.getRandomMove();
    }

    getMediumAIMove() {
        // Look for winning move
        const winningMove = this.findWinningMove(2);
        if (winningMove !== -1) return winningMove;
        
        // Block opponent's winning move
        const blockingMove = this.findWinningMove(1);
        if (blockingMove !== -1) return blockingMove;
        
        // Create opportunities
        const strategicMove = this.findStrategicMove();
        if (strategicMove !== -1) return strategicMove;
        
        return this.getRandomMove();
    }

    getHardAIMove() {
        // Winning move
        const winningMove = this.findWinningMove(2);
        if (winningMove !== -1) return winningMove;
        
        // Block opponent
        const blockingMove = this.findWinningMove(1);
        if (blockingMove !== -1) return blockingMove;
        
        // Create double threats
        const doubleThreat = this.findDoubleThreatMove();
        if (doubleThreat !== -1) return doubleThreat;
        
        // Strategic center preference
        const strategicMove = this.findStrategicMove();
        if (strategicMove !== -1) return strategicMove;
        
        return this.getRandomMove();
    }

    findWinningMove(player) {
        for (let col = 0; col < this.cols; col++) {
            const row = this.findAvailableRow(col);
            if (row !== -1) {
                this.gameBoard[col][row] = player;
                const isWinning = this.checkWin(col, row);
                this.gameBoard[col][row] = 0;
                
                if (isWinning) {
                    return col;
                }
            }
        }
        return -1;
    }

    findDoubleThreatMove() {
        for (let col = 0; col < this.cols; col++) {
            const row = this.findAvailableRow(col);
            if (row !== -1) {
                this.gameBoard[col][row] = 2;
                
                let threatCount = 0;
                for (let nextCol = 0; nextCol < this.cols; nextCol++) {
                    const nextRow = this.findAvailableRow(nextCol);
                    if (nextRow !== -1) {
                        this.gameBoard[nextCol][nextRow] = 2;
                        if (this.checkWin(nextCol, nextRow)) {
                            threatCount++;
                        }
                        this.gameBoard[nextCol][nextRow] = 0;
                    }
                }
                
                this.gameBoard[col][row] = 0;
                
                if (threatCount >= 2) {
                    return col;
                }
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
        for (let col = 0; col < this.cols; col++) {
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

    restartGame() {
        this.scores = { human: 0, ai: 0 };
        this.saveScores();
        this.updateScoresDisplay();
        this.resetGame();
    }

    updateStatus() {
        const status = document.getElementById('status');
        if (status) {
            if (this.currentPlayer === 1) {
                status.textContent = 'Σειρά σου! Παίξε σε οποιαδήποτε στήλη';
            } else {
                status.textContent = 'Σειρά του AI... Σκέφτεται...';
            }
        }
    }

    updateScoresDisplay() {
        const scoresElement = document.getElementById('scores');
        if (scoresElement) {
            scoresElement.innerHTML = `
                <div class="score">${this.scores.human} - ${this.scores.ai}</div>
            `;
        }
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (!this.gameActive || this.currentPlayer !== 1) return;
            
            if (e.key >= '1' && e.key <= '7') {
                const col = parseInt(e.key) - 1;
                this.makeMove(col);
            } else if (e.key === 'r' || e.key === 'R') {
                this.resetGame();
            }
        });
    }

    showConfetti() {
        const confettiCount = 100;
        const colors = ['#e74c3c', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6'];
        
        for (let i = 0; i < confettiCount; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.cssText = `
                    background: ${colors[Math.floor(Math.random() * colors.length)]};
                    left: ${Math.random() * 100}vw;
                    animation-duration: ${2 + Math.random() * 2}s;
                `;
                
                document.body.appendChild(confetti);
                
                setTimeout(() => confetti.remove(), 4000);
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

    setDifficulty(level) {
        this.difficulty = level;
        this.resetGame();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.connect4Game = new Connect4Game();
});
