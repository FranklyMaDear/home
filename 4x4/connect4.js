class Connect4Game {
    constructor() {
        this.rows = 6;
        this.cols = 7;
        this.currentPlayer = 1;
        this.gameBoard = [];
        this.gameActive = true;
        this.movesHistory = [];
        this.scores = { player1: 0, player2: 0 };
        this.gameMode = 'multiplayer';
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
        if (!this.gameActive) return;
        
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
        
        const disc = document.getElementById(`disc-${col}-${row}`);
        if (disc) {
            disc.classList.add(this.currentPlayer === 1 ? 'red' : 'yellow');
        }
        
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
            setTimeout(() => this.makeAIMove(), 600);
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
        const player1 = document.getElementById('player1');
        const player2 = document.getElementById('player2');
        
        if (player1 && player2) {
            player1.classList.toggle('active', this.currentPlayer === 1);
            player2.classList.toggle('active', this.currentPlayer === 2);
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
            this.scores.player1++;
        } else {
            this.scores.player2++;
        }
        
        this.saveScores();
        this.updateScoresDisplay();
        this.highlightWinningCells();
        
        const status = document.getElementById('status');
        if (status) {
            status.innerHTML = `🎉 Παίκτης ${this.currentPlayer} κέρδισε! 🎉`;
        }
            
        this.showConfetti();
    }

    handleDraw() {
        this.gameActive = false;
        const status = document.getElementById('status');
        if (status) {
            status.textContent = 'Ισοπαλία! 🤝';
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
        if (!this.gameActive) return;
        
        // Check for winning move
        let moveCol = this.findWinningMove(2);
        if (moveCol === -1) {
            // Block opponent's winning move
            moveCol = this.findWinningMove(1);
        }
        if (moveCol === -1) {
            // Try to create a double threat
            moveCol = this.findDoubleThreatMove();
        }
        if (moveCol === -1) {
            // Strategic center preference
            moveCol = this.findStrategicMove();
        }
        if (moveCol === -1) {
            // Random move as last resort
            moveCol = this.getRandomMove();
        }
        
        if (moveCol !== -1) {
            this.makeMove(moveCol);
        }
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
        // Look for moves that create multiple winning opportunities
        for (let col =
