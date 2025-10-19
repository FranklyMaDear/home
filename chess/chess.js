// Απλή υλοποίηση chess rules
class SimpleChess {
    constructor() {
        this.reset();
    }

    reset() {
        this.board = this.createInitialBoard();
        this.turn = 'w';
        this.moveHistory = [];
        this.gameOver = false;
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
        return this.board[y][x];
    }

    move(fromX, fromY, toX, toY) {
        const piece = this.getPiece(fromX, fromY);
        if (!piece) return false;
        
        // Έλεγχος αν είναι σειρά του παίκτη
        if ((this.turn === 'w' && piece[0] !== 'w') || 
            (this.turn === 'b' && piece[0] !== 'b')) {
            return false;
        }

        // Απλός έλεγχος κινήσεων
        if (!this.isValidMove(fromX, fromY, toX, toY)) {
            return false;
        }

        // Εκτέλεση κίνησης
        const captured = this.getPiece(toX, toY);
        this.board[toY][toX] = piece;
        this.board[fromY][fromX] = '';
        
        this.moveHistory.push({
            from: {x: fromX, y: fromY},
            to: {x: toX, y: toY},
            piece: piece,
            captured: captured
        });

        // Αλλαγή σειράς
        this.turn = this.turn === 'w' ? 'b' : 'w';
        return true;
    }

    isValidMove(fromX, fromY, toX, toY) {
        const piece = this.getPiece(fromX, fromY);
        if (!piece) return false;

        const target = this.getPiece(toX, toY);
        
        // Μην πιάνεις δικά σου κομμάτια
        if (target && target[0] === piece[0]) return false;

        const type = piece[1];
        const dx = toX - fromX;
        const dy = toY - fromY;

        switch (type) {
            case 'p': // Πιόνι
                return this.isValidPawnMove(fromX, fromY, toX, toY, piece[0]);
            case 'r': // Πύργος
                return this.isValidRookMove(fromX, fromY, toX, toY);
            case 'n': // Ίππος
                return this.isValidKnightMove(dx, dy);
            case 'b': // Αξιωματικός
                return this.isValidBishopMove(fromX, fromY, toX, toY);
            case 'q': // Βασίλισσα
                return this.isValidQueenMove(fromX, fromY, toX, toY);
            case 'k': // Βασιλιάς
                return this.isValidKingMove(dx, dy);
            default:
                return false;
        }
    }

    isValidPawnMove(fromX, fromY, toX, toY, color) {
        const direction = color === 'w' ? -1 : 1;
        const startRow = color === 'w' ? 6 : 1;
        const dx = toX - fromX;
        const dy = toY - fromY;

        // Ευθεία κίνηση
        if (dx === 0) {
            if (dy === direction && !this.getPiece(toX, toY)) return true;
            if (fromY === startRow && dy === 2 * direction && 
                !this.getPiece(toX, toY) && 
                !this.getPiece(fromX, fromY + direction)) return true;
        }
        
        // Πιάσιμο
        if (Math.abs(dx) === 1 && dy === direction && this.getPiece(toX, toY)) {
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

    isValidKingMove(dx, dy) {
        return Math.abs(dx) <= 1 && Math.abs(dy) <= 1;
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

    getMovesForPiece(x, y) {
        const moves = [];
        for (let toY = 0; toY < 8; toY++) {
            for (let toX = 0; toX < 8; toX++) {
                if (this.isValidMove(x, y, toX, toY)) {
                    moves.push({x: toX, y: toY});
                }
            }
        }
        return moves;
    }

    isInCheck(color) {
        // Απλοποιημένος έλεγχος σαχ
        return false;
    }
}
