class ChessGame {
    constructor() {
        this.chess = new ChessEngine();
        this.selectedPiece = null;
        this.possibleMoves = [];
        this.pendingPromotion = null;
        
        this.pieceSymbols = {
            'wp': '♙', 'wr': '♖', 'wn': '♘', 'wb': '♗', 'wq': '♕', 'wk': '♔',
            'bp': '♟', 'br': '♜', 'bn': '♞', 'bb': '♝', 'bq': '♛', 'bk': '♚'
        };

        this.files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        this.ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

        this.init();
    }

    init() {
        this.createBoard();
        this.bindEvents();
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
                
                // Προσθήκη coordinates
                if (y === 7) {
                    const fileCoord = document.createElement('div');
                    fileCoord.className = 'coordinates coord-file';
                    fileCoord.textContent = this.files[x];
                    square.appendChild(fileCoord);
                }
                
                if (x === 0) {
                    const rankCoord = document.createElement('div');
                    rankCoord.className = 'coordinates coord-rank';
                    rankCoord.textContent = this.ranks[y];
                    square.appendChild(rankCoord);
                }

                const piece = this.chess.getPiece(x, y);
                if (piece) {
                    square.textContent = this.pieceSymbols[piece];
                    
                    // Highlight βασιλιά σε σαχ
                    if (piece[1] === 'k' && this.chess.check && piece[0] === this.chess.turn) {
                        square.classList.add('check');
                    }
                }
                
                square.addEventListener('click', () => this.handleSquareClick(x, y));
                board.appendChild(square);
            }
        }
    }

    handleSquareClick(x, y) {
        if (this.chess.gameOver || this.pendingPromotion) return;
        
        const piece = this.chess.getPiece(x, y);
        
        // Επιλογή κομματιού
        if (piece && piece[0] === 'w') {
            this.selectedPiece = {x, y};
            this.possibleMoves = this.chess.getValidMovesForPiece(x, y);
            this.highlightMoves();
            return;
        }
        
        // Κίνηση κομματιού
        if (this.selectedPiece) {
            const moveX = this.selectedPiece.x;
            const moveY = this.selectedPiece.y;
            
            // Έλεγχος αν είναι έγκυρη κίνηση
            const isValidMove = this.possibleMoves.some(move => 
                move.x === x && move.y === y
            );

            if (isValidMove) {
                // Έλεγχος για προαγωγή
                if (this.chess.needsPromotion(moveX, moveY, x, y)) {
                    this.pendingPromotion = {fromX: moveX, fromY: moveY, toX: x, toY: y};
                    this.showPromotionModal();
                    return;
                }
                
                // Κανονική κίνηση
                this.makeMove(moveX, moveY, x, y);
            }
            
            this.clearHighlights();
            this.selectedPiece = null;
        }
    }

    makeMove(fromX, fromY, toX, toY, promotion = 'q') {
        const success = this.chess.move(fromX, fromY, toX, toY, promotion);
        
        if (success) {
            this.createBoard();
            this.updateStatus();
            this.updateMoveHistory();
            
            // AI κίνηση αν δεν τελείωσε το παιχνίδι
            if (!this.chess.gameOver && this.chess.turn === 'b') {
                setTimeout(() => this.makeAIMove(), 500);
            }
        }
    }

    makeAIMove() {
        const difficulty = parseInt(document.getElementById('difficulty').value);
        const aiMove = this.chess.getAIMove(difficulty);
        
        if (aiMove) {
            this.makeMove(aiMove.from.x, aiMove.from.y, aiMove.to.x, aiMove.to.y);
        }
    }

    highlightMoves() {
        this.clearHighlights();
        
        this.possibleMoves.forEach(move => {
            const square = this.getSquareElement(move.x, move.y);
            if (square) {
                square.classList.add('possible-move');
            }
        });
        
        if (this.selectedPiece) {
            const selectedSquare = this.getSquareElement(this.selectedPiece.x, this.selectedPiece.y);
            selectedSquare.classList.add('selected');
        }
    }

    clearHighlights() {
        document.querySelectorAll('.possible-move').forEach(el => 
            el.classList.remove('possible-move')
        );
        document.querySelectorAll('.selected').forEach(el => 
            el.classList.remove('selected')
        );
        document.querySelectorAll('.check').forEach(el => 
            el.classList.remove('check')
        );
    }

    getSquareElement(x, y) {
        return document.querySelector(`.square[data-x="${x}"][data-y="${y}"]`);
    }

    showPromotionModal() {
        document.getElementById('promotionModal').style.display = 'block';
    }

    hidePromotionModal() {
        document.getElementById('promotionModal').style.display = 'none';
        this.pendingPromotion = null;
    }

    updateStatus() {
        let status = '';
        
        if (this.chess.gameOver) {
            if (this.chess.winner === 'w') {
                status = '🎉 Νίκησες! Ματ στους Μαύρους!';
            } else if (this.chess.winner === 'b') {
                status = '😞 Ηττήθηκες! Ματ στα Λευκά!';
            } else {
                status = '🤝 Ισοπαλία!';
            }
        } else {
            status = this.chess.turn === 'w' ? 
                '⚪ Σειρά σου - Λευκά' : '⚫ Σειρά AI - Μαύρα';
            
            if (this.chess.check) {
                status += ' - ΣΑΧ! ⚡';
            }
        }
        
        document.getElementById('status').textContent = status;
    }

    updateMoveHistory() {
        const movesList = document.getElementById('movesList');
        movesList.innerHTML = '';
        
        for (let i = 0; i < this.chess.moveHistory.length; i += 2) {
            const moveNumber = Math.floor(i / 2) + 1;
            const whiteMove = this.chess.moveHistory[i];
            const blackMove = this.chess.moveHistory[i + 1];
            
            const moveElement = document.createElement('div');
            moveElement.className = 'move-pair';
            
            let moveText = `${moveNumber}. ${this.moveToNotation(whiteMove)}`;
            if (blackMove) {
                moveText += ` ${this.moveToNotation(blackMove)}`;
            }
            
            moveElement.textContent = moveText;
            movesList.appendChild(moveElement);
        }
        
        movesList.scrollTop = movesList.scrollHeight;
    }

    moveToNotation(move) {
        const file = this.files[move.to.x];
        const rank = this.ranks[move.to.y];
        let notation = file + rank;
        
        if (move.captured) {
            notation = 'x' + notation;
        }
        
        return notation;
    }

    bindEvents() {
        document.getElementById('newGame').addEventListener('click', () => {
            this.chess.reset();
            this.selectedPiece = null;
            this.possibleMoves = [];
            this.pendingPromotion = null;
            this.createBoard();
            this.updateStatus();
            this.updateMoveHistory();
        });

        document.getElementById('undoMove').addEventListener('click', () => {
            if (this.chess.undoMove()) {
                this.selectedPiece = null;
                this.possibleMoves = [];
                this.createBoard();
                this.updateStatus();
                this.updateMoveHistory();
            }
        });

        // Promotion events
        document.querySelectorAll('.promotion-piece').forEach(piece => {
            piece.addEventListener('click', () => {
                const promotionPiece = piece.dataset.piece;
                if (this.pendingPromotion) {
                    this.makeMove(
                        this.pendingPromotion.fromX,
                        this.pendingPromotion.fromY,
                        this.pendingPromotion.toX,
                        this.pendingPromotion.toY,
                        promotionPiece
                    );
                    this.hidePromotionModal();
                }
            });
        });

        // Κλείσιμο modal
        document.getElementById('promotionModal').addEventListener('click', (e) => {
            if (e.target.id === 'promotionModal') {
                this.hidePromotionModal();
            }
        });
    }
}

// Εκκίνηση παιχνιδιού
document.addEventListener('DOMContentLoaded', () => {
    new ChessGame();
});
