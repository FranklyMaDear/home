class ConnectFour {
    constructor() {
        this.rows = 6;
        this.cols = 7;
        this.board = this.createEmptyBoard();
        this.currentPlayer = 1;
        this.gameOver = false;
        this.scores = {1: 0, 2: 0};
        this.gameMode = 'ai';
        this.difficulty = 'easy';
        
        this.initializeBoard();
        this.setupEventListeners();
        this.updateGameMode();
        this.updateStatus();
    }

    createEmptyBoard() {
        return Array(this.rows).fill().map(() => Array(this.cols).fill(0));
    }

    initializeBoard() {
        const board = document.getElementById('board');
        board.innerHTML = '';
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const slot = document.createElement('div');
                slot.className = 'slot';
                slot.dataset.row = row;
                slot.dataset.col = col;
                slot.addEventListener('click', () => this.handleMove(col));
                board.appendChild(slot);
            }
        }
    }

    setupEventListeners() {
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('newGameBtn').addEventListener('click', () => this.newGame());
        document.getElementById('gameMode').addEventListener('change', (e) => {
            this.gameMode = e.target.value;
            this.updateGameMode();
            this.restartGame();
        });
        document.getElementById('difficulty').addEventListener('change', (e) => {
            this.difficulty = e.target.value;
        });
    }

    updateGameMode() {
        const player2Name = document.getElementById('player2Name');
        const difficultySelect = document.getElementById('difficulty');
        const difficultyLabel = document.querySelector('label[for="difficulty"]');
        
        if (this.gameMode === 'player') {
            player2Name.textContent = 'Παίκτης 2';
            difficultySelect.style.display = 'none';
            difficultyLabel.style.display = 'none';
        } else {
            player2Name.textContent = 'AI';
            difficultySelect.style.display = 'block';
            difficultyLabel.style.display = 'block';
        }
    }

    handleMove(col) {
        if (this.gameOver) return;
        
        // Αν είναι AI's σειρά και παίζουμε vs AI, μην επιτρέψεις κίνηση
        if (this.gameMode === 'ai' && this.currentPlayer === 2) return;

        const row = this.getAvailableRow(col);
        if (row === -1) return;

        this.makeMove(row, col, this.currentPlayer);
        
        if (this.checkWinner(row, col)) {
            this.handleWin();
            return;
        }

        if (this.isBoardFull()) {
            this.handleDraw();
            return;
        }

        this.switchPlayer();
        this.updateStatus();

        // AI move after a short delay
        if (this.gameMode === 'ai' && this.currentPlayer === 2 && !this.gameOver) {
            setTimeout(() => this.aiMove(), 500);
        }
    }

    aiMove() {
        const col = this.getAIMove();
        const row = this.getAvailableRow(col);
        
        if (row !== -1) {
            this.makeMove(row, col, 2);
            
            if (this.checkWinner(row, col)) {
                this.handleWin();
                return;
            }

            if (this.isBoardFull()) {
                this.handleDraw();
                return;
            }

            this.switchPlayer();
            this.updateStatus();
        }
    }

    getAIMove() {
        if (this.difficulty === 'easy') {
            return this.getEasyAIMove();
        } else {
            return this.getHardAIMove();
        }
    }

    getEasyAIMove() {
        // Random moves with some basic logic
        const availableCols = this.getAvailableColumns();
        
        // 30% πιθανότητα να μπλοκάρει τον παίχτη
        if (Math.random() < 0.3) {
            for (let col of availableCols) {
                const row = this.getAvailableRow(col);
                if (row !== -1) {
                    this.board[row][col] = 1;
                    if (this.checkWinner(row, col)) {
                        this.board[row][col] = 0;
                        return col;
                    }
                    this.board[row][col] = 0;
                }
            }
        }

        return availableCols[Math.floor(Math.random() * availableCols.length)];
    }

    getHardAIMove() {
        const availableCols = this.getAvailableColumns();
        
        // 1. Check for winning move
        for (let col of availableCols) {
            const row = this.getAvailableRow(col);
            if (row !== -1) {
                this.board[row][col] = 2;
                if (this.checkWinner(row, col)) {
                    this.board[row][col] = 0;
                    return col;
                }
                this.board[row][col] = 0;
            }
        }

        // 2. Block player's winning moves
        for (let col of availableCols) {
            const row = this.getAvailableRow(col);
            if (row !== -1) {
                this.board[row][col] = 1;
                if (this.checkWinner(row, col)) {
                    this.board[row][col] = 0;
                    return col;
                }
                this.board[row][col] = 0;
            }
        }

        // 3. Create multiple threats
        for (let col of availableCols) {
            const row = this.getAvailableRow(col);
            if (row !== -1) {
                this.board[row][col] = 2;
                let threatCount = 0;
                
                // Check how many winning opportunities this creates
                for (let nextCol of this.getAvailableColumns()) {
                    const nextRow = this.getAvailableRow(nextCol);
                    if (nextRow !== -1) {
                        this.board[nextRow][nextCol] = 2;
                        if (this.checkWinner(nextRow, nextCol)) {
                            threatCount++;
                        }
                        this.board[nextRow][nextCol] = 0;
                    }
                }
                
                this.board[row][col] = 0;
                
                if (threatCount >= 2) {
                    return col;
                }
            }
        }

        // 4. Strategic center preference
        const strategicCols = [3, 2, 4, 1, 5, 0, 6];
        for (let col of strategicCols) {
            if (availableCols.includes(col)) {
                return col;
            }
        }

        return availableCols[Math.floor(Math.random() * availableCols.length)];
    }

    getAvailableColumns() {
        const available = [];
        for (let col = 0; col < this.cols; col++) {
            if (this.getAvailableRow(col) !== -1) {
                available.push(col);
            }
        }
        return available;
    }

    getAvailableRow(col) {
        for (let row = this.rows - 1; row >= 0; row--) {
            if (this.board[row][col] === 0) {
                return row;
            }
        }
        return -1;
    }

    makeMove(row, col, player) {
        this.board[row][col] = player;
        this.animateDisc(row, col, player);
        this.updatePlayerIndicators();
    }

    animateDisc(row, col, player) {
        const slots = document.querySelectorAll('.slot');
        const slot = Array.from(slots).find(s => 
            parseInt(s.dataset.row) === row && parseInt(s.dataset.col) === col
        );

        const disc = document.createElement('div');
        disc.className = `disc ${player === 1 ? 'red' : 'yellow'}`;
        disc.style.animation = `discDrop 0.6s ease-out forwards`;
        
        slot.appendChild(disc);
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

    checkWinner(row, col) {
        const player = this.board[row][col];
        const directions = [
            [0, 1], [1, 0], [1, 1], [1, -1]
        ];

        for (let [dx, dy] of directions) {
            let count = 1;

            for (let i = 1; i < 4; i++) {
                const newRow = row + i * dx;
                const newCol = col + i * dy;
                if (this.isValidPosition(newRow, newCol) && this.board[newRow][newCol] === player) {
                    count++;
                } else {
                    break;
                }
            }

            for (let i = 1; i < 4; i++) {
                const newRow = row - i * dx;
                const newCol = col - i * dy;
                if (this.isValidPosition(newRow, newCol) && this.board[newRow][newCol] === player) {
                    count++;
                } else {
                    break;
                }
            }

            if (count >= 4) {
                this.highlightWinningCells(row, col, dx, dy);
                return true;
            }
        }

        return false;
    }

    highlightWinningCells(row, col, dx, dy) {
        const player = this.board[row][col];
        const winningCells = [];

        for (let i = -3; i <= 3; i++) {
            const newRow = row + i * dx;
            const newCol = col + i * dy;
            if (this.isValidPosition(newRow, newCol) && this.board[newRow][newCol] === player) {
                winningCells.push({row: newRow, col: newCol});
            }
        }

        winningCells.forEach(cell => {
            const slots = document.querySelectorAll('.slot');
            const slot = Array.from(slots).find(s => 
                parseInt(s.dataset.row) === cell.row && parseInt(s.dataset.col) === cell.col
            );
            const disc = slot.querySelector('.disc');
            if (disc) {
                disc.classList.add('winner');
            }
        });
    }

    isValidPosition(row, col) {
        return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
    }

    isBoardFull() {
        return this.board[0].every(cell => cell !== 0);
    }

    handleWin() {
        this.gameOver = true;
        this.scores[this.currentPlayer]++;
        this.updateScores();
        
        let winner = '';
        if (this.gameMode === 'player') {
            winner = this.currentPlayer === 1 ? 'Παίκτης 1' : 'Παίκτης 2';
        } else {
            winner = this.currentPlayer === 1 ? 'Παίκτης 1' : 'AI';
        }
        
        document.getElementById('status').textContent = `${winner} κέρδισε!`;
        this.createConfetti();
    }

    handleDraw() {
        this.gameOver = true;
        document.getElementById('status').textContent = 'Ισοπαλία!';
    }

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
    }

    updateStatus() {
        const status = document.getElementById('status');
        if (this.gameMode === 'player') {
            status.textContent = `Παίζει ο Παίκτης ${this.currentPlayer}`;
        } else {
            if (this.currentPlayer === 1) {
                status.textContent = 'Παίζει ο Παίκτης 1';
            } else {
                status.textContent = 'Σκέφτεται η AI...';
            }
        }
    }

    updateScores() {
        const scoreElement = document.getElementById('scoreDisplay');
        scoreElement.textContent = `${this.scores[1]} - ${this.scores[2]}`;
    }

    restartGame() {
        this.board = this.createEmptyBoard();
        this.currentPlayer = 1;
        this.gameOver = false;
        this.initializeBoard();
        this.updatePlayerIndicators();
        this.updateStatus();
    }

    newGame() {
        this.scores = {1: 0, 2: 0};
        this.restartGame();
        this.updateScores();
    }

    createConfetti() {
        const colors = ['#e74c3c', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6'];
        for (let i = 0; i < 100; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 2 + 's';
            document.body.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 5000);
        }
    }
}

// Initialize the game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new ConnectFour();
});
