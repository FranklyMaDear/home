class ChessAI {
    constructor() {
        this.game = new Chess();
        this.board = null;
        this.playerColor = 'w';
        this.aiColor = 'b';
        this.difficulty = 2;
        this.moveHistory = [];
        this.whiteTime = 600; // 10 λεπτά σε δευτερόλεπτα
        this.blackTime = 600;
        this.timerInterval = null;
        this.currentPlayer = 'w';
        this.gameActive = false;
        
        this.init();
    }

    init() {
        this.initBoard();
        this.bindEvents();
        this.updateStatus();
        this.updateTimers();
        this.updateMoveHistory();
    }

    initBoard() {
        const config = {
            position: 'start',
            draggable: true,
            onDragStart: this.onDragStart.bind(this),
            onDrop: this.onDrop.bind(this),
            onSnapEnd: this.onSnapEnd.bind(this),
            orientation: 'white',
            pieceTheme: 'https://cdnjs.cloudflare.com/ajax/libs/chessboard-js/1.0.0/img/chesspieces/wikipedia/{piece}.png',
            showNotation: true
        };
        
        this.board = Chessboard('board', config);
    }

    bindEvents() {
        document.getElementById('newGame').addEventListener('click', () => this.newGame());
        document.getElementById('undoMove').addEventListener('click', () => this.undoMove());
        document.getElementById('flipBoard').addEventListener('click', () => this.flipBoard());
        document.getElementById('difficulty').addEventListener('change', (e) => {
            this.difficulty = parseInt(e.target.value);
        });
        document.getElementById('timeControl').addEventListener('change', (e) => {
            const time = parseInt(e.target.value);
            this.whiteTime = time;
            this.blackTime = time;
            this.updateTimers();
        });
    }

    startTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.timerInterval = setInterval(() => {
            if (this.currentPlayer === 'w') {
                this.whiteTime--;
                if (this.whiteTime <= 0) {
                    this.gameOver('Χρόνος! Νίκησαν τα Μαύρα!');
                    return;
                }
            } else {
                this.blackTime--;
                if (this.blackTime <= 0) {
                    this.gameOver('Χρόνος! Νίκησαν τα Λευκά!');
                    return;
                }
            }
            this.updateTimers();
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimers() {
        const formatTime = (seconds) => {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        };

        const whiteTimer = document.getElementById('whiteTimer');
        const blackTimer = document.getElementById('blackTimer');

        whiteTimer.textContent = formatTime(this.whiteTime);
        blackTimer.textContent = formatTime(this.blackTime);

        // Επισημάνσεις για λίγο χρόνο
        whiteTimer.classList.toggle('low-time', this.whiteTime < 30 && this.currentPlayer === 'w');
        blackTimer.classList.toggle('low-time', this.blackTime < 30 && this.currentPlayer === 'b');
    }

    onDragStart(source, piece, position, orientation) {
        if (!this.gameActive) return false;
        if (this.game.game_over()) return false;
        
        if ((this.game.turn() === 'w' && piece.search(/^b/) !== -1) ||
            (this.game.turn() === 'b' && piece.search(/^w/) !== -1)) {
            return false;
        }
        
        return true;
    }

    onDrop(source, target) {
        if (!this.gameActive) return 'snapback';

        const move = this.game.move({
            from: source,
            to: target,
            promotion: 'q'
        });

        if (move === null) return 'snapback';
        
        this.moveHistory.push({
            move: move,
            player: 'human'
        });
        
        this.updateStatus();
        this.updateMoveHistory();
        
        // Αλλαγή χρονόμετρου
        this.currentPlayer = 'b';
        this.stopTimer();
        
        if (!this.game.game_over()) {
            setTimeout(() => this.makeAIMove(), 500);
        } else {
            this.stopTimer();
        }
        
        return true;
    }

    onSnapEnd() {
        this.board.position(this.game.fen());
    }

    makeAIMove() {
        if (this.game.game_over() || this.game.turn() !== this.aiColor) return;
        
        this.currentPlayer = 'b';
        this.startTimer();
        
        setTimeout(() => {
            const moves = this.game.moves({ verbose: true });
            if (moves.length === 0) return;
            
            let bestMove;
            
            switch (this.difficulty) {
                case 1:
                    bestMove = moves[Math.floor(Math.random() * moves.length)];
                    break;
                case 2:
                    bestMove = this.getBasicBestMove(moves);
                    break;
                case 3:
                    bestMove = this.getImprovedBestMove(moves);
                    break;
                case 4:
                    bestMove = this.getMinimaxMove(2);
                    break;
                default:
                    bestMove = moves[Math.floor(Math.random() * moves.length)];
            }
            
            this.game.move(bestMove);
            this.moveHistory.push({
                move: bestMove,
                player: 'ai'
            });
            
            this.board.position(this.game.fen());
            this.updateStatus();
            this.updateMoveHistory();
            
            // Επιστροφή στον παίκτη
            this.currentPlayer = 'w';
            this.stopTimer();
            this.startTimer();
            
        }, 1000);
    }

    getBasicBestMove(moves) {
        let bestScore = -9999;
        let bestMoves = [moves[0]];
        
        for (const move of moves) {
            let score = 0;
            
            if (move.captured) {
                score += this.getPieceValue(move.captured) * 10;
            }
            
            if (move.promotion) {
                score += 8;
            }
            
            this.game.move(move);
            if (this.game.in_check()) {
                score += 5;
            }
            if (this.game.in_checkmate()) {
                score += 1000;
            }
            this.game.undo();
            
            if (score > bestScore) {
                bestScore = score;
                bestMoves = [move];
            } else if (score === bestScore) {
                bestMoves.push(move);
            }
        }
        
        return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    }

    getImprovedBestMove(moves) {
        let bestScore = -9999;
        let bestMoves = [moves[0]];
        
        for (const move of moves) {
            let score = this.evaluateMove(move);
            
            if (score > bestScore) {
                bestScore = score;
                bestMoves = [move];
            } else if (score === bestScore) {
                bestMoves.push(move);
            }
        }
        
        return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    }

    evaluateMove(move) {
        let score = 0;
        
        if (move.captured) {
            score += this.getPieceValue(move.captured) * 10;
        }
        
        if (move.promotion) {
            score += this.getPieceValue(move.promotion) - 1;
        }
        
        this.game.move(move);
        if (this.game.in_checkmate()) {
            score += 1000;
        } else if (this.game.in_check()) {
            score += 5;
        }
        
        score += this.evaluatePosition();
        
        this.game.undo();
        
        return score;
    }

    getPieceValue(piece) {
        const values = {
            'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 100
        };
        return values[piece] || 0;
    }

    evaluatePosition() {
        let score = 0;
        const board = this.game.board();
        
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const piece = board[i][j];
                if (piece) {
                    const value = this.getPieceValue(piece.type);
                    const sign = piece.color === this.aiColor ? 1 : -1;
                    score += value * sign;
                }
            }
        }
        
        return score;
    }

    getMinimaxMove(depth) {
        const moves = this.game.moves({ verbose: true });
        let bestMove = moves[0];
        let bestValue = -9999;
        
        for (const move of moves) {
            this.game.move(move);
            const value = this.minimax(depth - 1, -10000, 10000, false);
            this.game.undo();
            
            if (value > bestValue) {
                bestValue = value;
                bestMove = move;
            }
        }
        
        return bestMove;
    }

    minimax(depth, alpha, beta, maximizingPlayer) {
        if (depth === 0 || this.game.game_over()) {
            return this.evaluatePosition();
        }
        
        const moves = this.game.moves({ verbose: true });
        
        if (maximizingPlayer) {
            let maxEval = -9999;
            for (const move of moves) {
                this.game.move(move);
                const eval = this.minimax(depth - 1, alpha, beta, false);
                this.game.undo();
                maxEval = Math.max(maxEval, eval);
                alpha = Math.max(alpha, eval);
                if (beta <= alpha) break;
            }
            return maxEval;
        } else {
            let minEval = 9999;
            for (const move of moves) {
                this.game.move(move);
                const eval = this.minimax(depth - 1, alpha, beta, true);
                this.game.undo();
                minEval = Math.min(minEval, eval);
                beta = Math.min(beta, eval);
                if (beta <= alpha) break;
            }
            return minEval;
        }
    }

    updateStatus() {
        let status = '';
        let evaluation = this.evaluatePosition();

        if (this.game.in_checkmate()) {
            status = this.game.turn() === 'w' ? 
                'Ματ! Νίκησαν τα Μαύρα! 🎉' : 'Ματ! Νίκησαν τα Λευκά! 🎉';
            this.gameActive = false;
            this.stopTimer();
        } else if (this.game.in_draw()) {
            status = 'Ισοπαλία! 🤝';
            this.gameActive = false;
            this.stopTimer();
        } else {
            status = this.game.turn() === 'w' ? 
                'Σειρά των Λευκών ⚪' : 'Σειρά των Μαύρ�ν ⚫';
            if (this.game.in_check()) {
                status += ' - Σαχ! ⚡';
            }
            this.gameActive = true;
        }

        document.getElementById('status').textContent = status;
        document.getElementById('eval').textContent = `Αξιολόγηση: ${evaluation > 0 ? '+' : ''}${evaluation.toFixed(1)}`;
    }

    updateMoveHistory() {
        const movesList = document.getElementById('movesList');
        movesList.innerHTML = '';
        
        for (let i = 0; i < this.moveHistory.length; i += 2) {
            const moveNumber = Math.floor(i / 2) + 1;
            const whiteMove = this.moveHistory[i];
            const blackMove = this.moveHistory[i + 1];
            
            const moveElement = document.createElement('div');
            moveElement.className = 'move-pair';
            
            let moveText = `${moveNumber}. ${whiteMove.move.san}`;
            if (blackMove) {
                moveText += ` ${blackMove.move.san}`;
            }
            
            moveElement.textContent = moveText;
            movesList.appendChild(moveElement);
        }
        
        movesList.scrollTop = movesList.scrollHeight;
    }

    gameOver(message) {
        document.getElementById('status').textContent = message;
        this.gameActive = false;
        this.stopTimer();
    }

    newGame() {
        this.stopTimer();
        this.game = new Chess();
        this.moveHistory = [];
        this.whiteTime = parseInt(document.getElementById('timeControl').value);
        this.blackTime = this.whiteTime;
        this.currentPlayer = 'w';
        this.gameActive = true;
        
        this.board.start();
        this.updateStatus();
        this.updateTimers();
        this.updateMoveHistory();
        
        this.startTimer();
    }

    undoMove() {
        if (this.moveHistory.length >= 2 && this.gameActive) {
            this.stopTimer();
            this.game.undo();
            this.game.undo();
            this.moveHistory.pop();
            this.moveHistory.pop();
            this.board.position(this.game.fen());
            this.updateStatus();
            this.updateMoveHistory();
            this.currentPlayer = 'w';
            this.startTimer();
        }
    }

    flipBoard() {
        this.board.flip();
    }
}

// Εκκίνηση του παιχνιδιού
document.addEventListener('DOMContentLoaded', () => {
    const chessGame = new ChessAI();
    chessGame.newGame(); // Αυτόματη εκκίνηση νέου παιχνιδιού
});
