class ChessEngine {
    constructor() {
        this.reset();
    }

    reset() {
        this.board = this.createInitialBoard();
        this.turn = 'w';
        this.moveHistory = [];
        this.gameOver = false;
        this.winner = null;
        this.check = false;
    }

    createInitialBoard() {
        return [
            ['br', 'bn', 'bb', 'bq', 'bk', 'bb', 'bn', 'br'],
            ['bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp'],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp'],
            ['wr', 'wn', 'wb', 'wq', 'wk', 'wb', 'wn', 'wr']
        ];
    }

    getPiece(x, y) {
        if (x < 0 || x > 7 || y < 0 || y > 7) return null;
        return this.board[y][x];
    }

    setPiece(x, y, piece) {
        if (x >= 0 && x < 8 && y >= 0 && y < 8) {
            this.board[y][x] = piece;
        }
    }

    move(fromX, fromY, toX, toY, promotion = 'q') {
        if (this.gameOver) return false;

        const piece = this.getPiece(fromX, fromY);
        if (!piece) return false;
        
        // Έλεγχος σειράς
        if ((this.turn === 'w' && piece[0] !== 'w') || 
            (this.turn === 'b' && piece[0] !== 'b')) {
            return false;
        }

        // Έλεγχος κίνησης
        if (!this.isValidMove(fromX, fromY, toX, toY)) {
            return false;
        }

        // Προσωρινή κίνηση για έλεγχο
        const captured = this.getPiece(toX, toY);
        const originalFrom = this.getPiece(fromX, fromY);
        
        this.setPiece(toX, toY, originalFrom);
        this.setPiece(fromX, fromY, '');

        // Έλεγχος αν ο βασιλιάς μπήκε σε σαχ
        if (this.isKingInCheck(this.turn)) {
            // Undo move
            this.setPiece(fromX, fromY, originalFrom);
            this.setPiece(toX, toY, captured);
            return false;
        }

        // Προαγωγή πιονιού
        if (piece[1] === 'p' && (toY === 0 || toY === 7)) {
            this.setPiece(toX, toY, piece[0] + promotion);
        }

        // Καταγραφή κίνησης
        this.moveHistory.push({
            from: {x: fromX, y: fromY},
            to: {x: toX, y: toY},
            piece: piece,
            captured: captured,
            promotion: promotion
        });

        // Αλλαγή σειράς και έλεγχος τερματισμού
        this.turn = this.turn === 'w' ? 'b' : 'w';
        this.check = this.isKingInCheck(this.turn);
        
        if (this.isCheckmate()) {
            this.gameOver = true;
            this.winner = this.turn === 'w' ? 'b' : 'w';
        } else if (this.isStalemate()) {
            this.gameOver = true;
            this.winner = 'draw';
        }

        return true;
    }

    isValidMove(fromX, fromY, toX, toY) {
        const piece = this.getPiece(fromX, fromY);
        if (!piece) return false;

        const target = this.getPiece(toX, toY);
        if (target && target[0] === piece[0]) return false;

        const type = piece[1];
        const dx = toX - fromX;
        const dy = toY - fromY;
        const color = piece[0];

        switch (type) {
            case 'p': return this.isValidPawnMove(fromX, fromY, toX, toY, color);
            case 'r': return this.isValidRookMove(fromX, fromY, toX, toY);
            case 'n': return this.isValidKnightMove(dx, dy);
            case 'b': return this.isValidBishopMove(fromX, fromY, toX, toY);
            case 'q': return this.isValidQueenMove(fromX, fromY, toX, toY);
            case 'k': return this.isValidKingMove(fromX, fromY, toX, toY, color);
            default: return false;
        }
    }

    isValidPawnMove(fromX, fromY, toX, toY, color) {
        const direction = color === 'w' ? -1 : 1;
        const startRow = color === 'w' ? 6 : 1;
        const dx = toX - fromX;
        const dy = toY - fromY;
        const target = this.getPiece(toX, toY);

        // Ευθεία κίνηση
        if (dx === 0) {
            if (dy === direction && !target) return true;
            if (fromY === startRow && dy === 2 * direction && 
                !target && !this.getPiece(fromX, fromY + direction)) return true;
        }
        
        // Πιάσιμο διαγώνια
        if (Math.abs(dx) === 1 && dy === direction && target) {
            return true;
        }

        return false;
    }

    isValidKnightMove(dx, dy) {
        return (Math.abs(dx) === 2 && Math.abs(dy) === 1) || 
               (Math.abs(dx) === 1 && Math.abs(dy) === 2);
    }

    isValidRookMove(fromX, fromY, toX, toY) {
        if (fromX !== toX && fromY !== toY) return false;
        return this.isPathClear(fromX, fromY, toX, toY);
    }

    isValidBishopMove(fromX, fromY, toX, toY) {
        if (Math.abs(toX - fromX) !== Math.abs(toY - fromY)) return false;
        return this.isPathClear(fromX, fromY, toX, toY);
    }

    isValidQueenMove(fromX, fromY, toX, toY) {
        return this.isValidRookMove(fromX, fromY, toX, toY) || 
               this.isValidBishopMove(fromX, fromY, toX, toY);
    }

    isValidKingMove(fromX, fromY, toX, toY, color) {
        const dx = Math.abs(toX - fromX);
        const dy = Math.abs(toY - fromY);
        
        // Κανονική κίνηση
        if (dx <= 1 && dy <= 1) return true;
        
        // Ροκέ
        if (dy === 0 && dx === 2) {
            return this.canCastle(fromX, fromY, toX, toY, color);
        }
        
        return false;
    }

    canCastle(fromX, fromY, toX, toY, color) {
        // Απλοποιημένο ροκέ - στην πράξη χρειάζεται περισσότερη λογική
        return false;
    }

    isPathClear(fromX, fromY, toX, toY) {
        const dx = Math.sign(toX - fromX);
        const dy = Math.sign(toY - fromY);
        let x = fromX + dx;
        let y = fromY + dy;

        while (x !== toX || y !== toY) {
            if (this.getPiece(x, y)) return false;
            x += dx;
            y += dy;
        }
        return true;
    }

    isKingInCheck(color) {
        // Βρες τον βασιλιά
        let kingX, kingY;
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const piece = this.getPiece(x, y);
                if (piece === color + 'k') {
                    kingX = x;
                    kingY = y;
                    break;
                }
            }
        }

        // Έλεγχος αν κάποιο αντίπαλο κομμάτι μπορεί να πιάσει τον βασιλιά
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const piece = this.getPiece(x, y);
                if (piece && piece[0] !== color) {
                    if (this.isValidMove(x, y, kingX, kingY)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    isCheckmate() {
        if (!this.check) return false;
        
        // Έλεγχος αν υπάρχει νόμιμη κίνηση που να βγάζει από σαχ
        for (let fromY = 0; fromY < 8; fromY++) {
            for (let fromX = 0; fromX < 8; fromX++) {
                const piece = this.getPiece(fromX, fromY);
                if (piece && piece[0] === this.turn) {
                    const moves = this.getValidMovesForPiece(fromX, fromY);
                    if (moves.length > 0) return false;
                }
            }
        }
        return true;
    }

    isStalemate() {
        if (this.check) return false;
        
        // Έλεγχος αν υπάρχει νόμιμη κίνηση
        for (let fromY = 0; fromY < 8; fromY++) {
            for (let fromX = 0; fromX < 8; fromX++) {
                const piece = this.getPiece(fromX, fromY);
                if (piece && piece[0] === this.turn) {
                    const moves = this.getValidMovesForPiece(fromX, fromY);
                    if (moves.length > 0) return false;
                }
            }
        }
        return true;
    }

    getValidMovesForPiece(x, y) {
        const moves = [];
        for (let toY = 0; toY < 8; toY++) {
            for (let toX = 0; toX < 8; toX++) {
                if (this.isValidMove(x, y, toX, toY)) {
                    // Έλεγχος αν η κίνηση αφήνει τον βασιλιά σε σαχ
                    const captured = this.getPiece(toX, toY);
                    const original = this.getPiece(x, y);
                    
                    this.setPiece(toX, toY, original);
                    this.setPiece(x, y, '');
                    
                    const leavesInCheck = this.isKingInCheck(this.turn);
                    
                    // Undo move
                    this.setPiece(x, y, original);
                    this.setPiece(toX, toY, captured);
                    
                    if (!leavesInCheck) {
                        moves.push({x: toX, y: toY});
                    }
                }
            }
        }
        return moves;
    }

    getAIMove(difficulty) {
        const moves = [];
        
        // Βρες όλες τις πιθανές κινήσεις
        for (let fromY = 0; fromY < 8; fromY++) {
            for (let fromX = 0; fromX < 8; fromX++) {
                const piece = this.getPiece(fromX, fromY);
                if (piece && piece[0] === this.turn) {
                    const validMoves = this.getValidMovesForPiece(fromX, fromY);
                    validMoves.forEach(move => {
                        moves.push({
                            from: {x: fromX, y: fromY},
                            to: move,
                            piece: piece
                        });
                    });
                }
            }
        }

        if (moves.length === 0) return null;

        // Βαθμολόγηση κινήσεων βάσει δυσκολίας
        const scoredMoves = moves.map(move => {
            let score = 0;
            
            // Πιάσιμο κομματιού
            const target = this.getPiece(move.to.x, move.to.y);
            if (target) {
                score += this.getPieceValue(target[1]) * 10;
            }
            
            // Προαγωγή
            if (move.piece[1] === 'p' && (move.to.y === 0 || move.to.y === 7)) {
                score += 8;
            }
            
            // Σαχ
            this.move(move.from.x, move.from.y, move.to.x, move.to.y);
            if (this.check) score += 5;
            if (this.gameOver) score += 1000;
            this.undoMove();
            
            // Τακτική θέσης
            score += this.evaluatePosition();
            
            return { move, score };
        });

        // Επέλεξε κίνηση βάσει δυσκολίας
        scoredMoves.sort((a, b) => b.score - a.score);
        
        if (difficulty === 1) {
            // Εύκολο: τυχαία κίνηση
            return moves[Math.floor(Math.random() * moves.length)];
        } else if (difficulty === 2) {
            // Μέτριο: από τις 3 καλύτερες
            const topMoves = scoredMoves.slice(0, 3);
            return topMoves[Math.floor(Math.random() * topMoves.length)].move;
        } else {
            // Δύσκολο/Expert: καλύτερη κίνηση
            return scoredMoves[0].move;
        }
    }

    getPieceValue(type) {
        const values = { 'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 100 };
        return values[type] || 0;
    }

    evaluatePosition() {
        let score = 0;
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const piece = this.getPiece(x, y);
                if (piece) {
                    const value = this.getPieceValue(piece[1]);
                    score += piece[0] === 'w' ? value : -value;
                }
            }
        }
        return score;
    }

    undoMove() {
        if (this.moveHistory.length === 0) return false;
        
        const lastMove = this.moveHistory.pop();
        this.setPiece(lastMove.from.x, lastMove.from.y, lastMove.piece);
        this.setPiece(lastMove.to.x, lastMove.to.y, lastMove.captured || '');
        
        this.turn = this.turn === 'w' ? 'b' : 'w';
        this.gameOver = false;
        this.winner = null;
        this.check = this.isKingInCheck(this.turn);
        
        return true;
    }

    needsPromotion(fromX, fromY, toX, toY) {
        const piece = this.getPiece(fromX, fromY);
        return piece && piece[1] === 'p' && (toY === 0 || toY === 7);
    }
}
