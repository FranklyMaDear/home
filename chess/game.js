class ChessGame {
    constructor() {
        this.chess = new SimpleChess();
        this.selectedPiece = null;
        this.possibleMoves = [];
        this.playerColor = 'w';
        this.aiColor = 'b';
        this.whiteTime = 600;
        this.blackTime = 600;
        this.currentPlayer = 'w';
        this.gameActive = true;
        this.timerInterval = null;
        
        this.pieceSymbols = {
            'wp': '♙', 'wr': '♖', 'wn': '♘', 'wb': '♗', 'wq': '♕', 'wk': '♔',
            'bp': '♟', 'br': '♜', 'bn': '♞', 'bb': '♝', 'bq': '♛', 'bk': '♚'
        };

        this.init();
    }

    init() {
        this.createBoard();
        this.bindEvents();
        this.startTimer();
        this.updateStatus();
    }

    createBoard() {
        const board = document.getElementById('chessBoard');
        board.innerHTML = '';
        
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const square = document.createElement('div');
                square.className = `square ${(x + y) % 2 === 0 ? 'white' : 'black'}`;
                square.dataset.x = x;
                square.dataset.y = y;
                
                const piece = this.chess.getPiece(x, y);
                if (piece) {
                    square.textContent = this.pieceSymbols[piece];
                }
                
                square.addEventListener('click', () => this.handleSquareClick(x, y));
                board.appendChild(square);
            }
        }
    }

    handleSquareClick(x, y) {
        if (!this.gameActive || this.currentPlayer !== this.playerColor) return;
        
        const piece = this.chess.getPiece(x, y);
        
        // Επιλογή κομματιού
        if (piece && piece[0] === this.playerColor) {
            this.selectedPiece = {x, y};
            this.possibleMoves = this.chess.getMovesForPiece(x, y);
            this.highlightMoves();
            return;
        }
        
        // Κίνηση κομματιού
        if (this.selectedPiece) {
            const moveMade = this.chess.move(
                this.selectedPiece.x, 
                this.selectedPiece.y, 
                x, y
            );
            
            if (moveMade) {
                this.clearHighlights();
                this.selectedPiece = null;
                this.possibleMoves = [];
                this.createBoard();
                this.currentPlayer = this.aiColor;
                this.updateStatus();
                
                // AI κίνηση
                setTimeout(() => this.makeAIMove(), 500);
            }
        }
    }

    highlightMoves() {
        this.clearHighlights();
        
        this.possibleMoves.forEach(move => {
            const square = this.getSquareElement(move.x, move.y);
            if (square) {
                const highlight = document.createElement('div');
                highlight.className = 'possible-move';
                square.appendChild(highlight);
            }
        });
        
        // Highlight selected piece
        if (this.selectedPiece) {
            const selectedSquare = this.getSquareElement(this.selectedPiece.x, this.selectedPiece.y);
            selectedSquare.classList.add('selected');
        }
    }

    clearHighlights() {
        document.querySelectorAll('.possible-move').forEach(el => el.remove());
        document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
    }

    getSquareElement(x, y) {
        return document.querySelector(`.square[data-x="${x}"][data-y="${y}"]`);
    }

    makeAIMove() {
        if (!this.gameActive || this.currentPlayer !== this.aiColor) return;
        
        const moves = [];
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const piece = this.chess.getPiece(x, y);
                if (piece && piece[0] === this.aiColor) {
                    const pieceMoves = this.chess.getMovesForPiece(x, y);
                    pieceMoves.forEach(move => {
                        moves.push({from: {x, y}, to: move});
                    });
                }
            }
        }
        
        if (moves.length > 0) {
            const randomMove = moves[Math.floor(Math.random() * moves.length)];
            this.chess.move(
                randomMove.from.x, 
                randomMove.from.y, 
                randomMove.to.x, 
                randomMove.to.y
            );
            
            this.createBoard();
            this.currentPlayer = this.playerColor;
            this.updateStatus();
        }
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            if (this.currentPlayer === 'w') {
                this.whiteTime--;
            } else {
                this.blackTime--;
            }
            
            if (this.whiteTime <= 0 || this.blackTime <= 0) {
                this.gameOver('Χρόνος!');
                return;
            }
            
            this.updateTimers();
        }, 1000);
    }

    updateTimers() {
        document.getElementById('whiteTimer').textContent = this.formatTime(this.whiteTime);
        document.getElementById('blackTimer').textContent = this.formatTime(this.blackTime);
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    updateStatus() {
        const status = this.currentPlayer === 'w' ? 
            'Σειρά των Λευκών ⚪' : 'Σειρά των Μαύρων ⚫';
        document.getElementById('status').textContent = status;
    }

    gameOver(message) {
        this.gameActive = false;
        clearInterval(this.timerInterval);
        document.getElementById('status').textContent = message;
    }

    bindEvents() {
        document.getElementById('newGame').addEventListener('click', () => {
            this.chess.reset();
            this.whiteTime = parseInt(document.getElementById('timeControl').value);
            this.blackTime = this.whiteTime;
            this.currentPlayer = 'w';
            this.gameActive = true;
            this.createBoard();
            this.updateStatus();
            this.updateTimers();
            clearInterval(this.timerInterval);
            this.startTimer();
        });

        document.getElementById('undoMove').addEventListener('click', () => {
            // Απλή αναίρεση - reset game
            this.chess.reset();
            this.createBoard();
            this.updateStatus();
        });
    }
}

// Εκκίνηση παιχνιδιού
document.addEventListener('DOMContentLoaded', () => {
    new ChessGame();
});
