class ConnectFour {
    // ... υπάρχων κώδικας ...

    getEasyAIMove() {
        const availableCols = this.getAvailableColumns();
        
        // 40% πιθανότητα να κάνει κακή κίνηση (όπως θα έκανε αρχάριος)
        if (Math.random() < 0.4) {
            // Επιλέγει στήλη που δεν είναι βέλτιστη
            const badMoves = this.getBadMoves(availableCols);
            if (badMoves.length > 0) {
                return badMoves[Math.floor(Math.random() * badMoves.length)];
            }
        }
        
        // 30% πιθανότητα να μπλοκάρει τον παίχτη (βασική στρατηγική)
        if (Math.random() < 0.3) {
            const blockingMove = this.findBlockingMove();
            if (blockingMove !== -1) return blockingMove;
        }
        
        // 20% πιθανότητα να δημιουργήσει δική της απειλή
        if (Math.random() < 0.2) {
            const threatMove = this.findThreatMove(2);
            if (threatMove !== -1) return threatMove;
        }

        // Προτίμηση για κεντρικές στήλες (αλλά όχι πάντα)
        const centerCols = [3, 2, 4, 1, 5, 0, 6];
        for (let col of centerCols) {
            if (availableCols.includes(col) && Math.random() < 0.7) {
                return col;
            }
        }

        // Τυχαία επιλογή από τις διαθέσιμες
        return availableCols[Math.floor(Math.random() * availableCols.length)];
    }

    getHardAIMove() {
        const availableCols = this.getAvailableColumns();
        
        // 1. Check for winning move (95% πιθανότητα να το πάρει)
        const winningMove = this.findWinningMove();
        if (winningMove !== -1 && Math.random() < 0.95) {
            return winningMove;
        }

        // 2. Block player's immediate winning moves (90% πιθανότητα)
        const blockingMove = this.findBlockingMove();
        if (blockingMove !== -1 && Math.random() < 0.9) {
            return blockingMove;
        }

        // 3. Δημιουργία διπλής απειλής (πολύ προχωρημένη στρατηγική)
        const doubleThreat = this.findDoubleThreat();
        if (doubleThreat !== -1) {
            return doubleThreat;
        }

        // 4. Αποφυγή παγίδας - ελέγχει αν η κίνηση θα δώσει ευκαιρία στον αντίπαλο
        const safeMoves = this.getSafeMoves(availableCols);
        if (safeMoves.length > 0) {
            // 5. Προτίμηση για κεντρικές και στρατηγικές θέσεις
            const strategicMoves = this.getStrategicMoves(safeMoves);
            if (strategicMoves.length > 0) {
                // Μερικές φορές κάνει μη βέλτιστη κίνηση για να μοιάζει πιο ανθρώπινη
                if (Math.random() < 0.1) {
                    const suboptimal = this.getSuboptimalMove(strategicMoves);
                    if (suboptimal !== -1) return suboptimal;
                }
                return strategicMoves[0];
            }
        }

        // 6. Επιστροφή στην ασφαλή επιλογή
        return safeMoves.length > 0 ? safeMoves[0] : availableCols[0];
    }

    // Βοηθητικές μέθοδοι για πιο ανθρώπινη AI
    getBadMoves(availableCols) {
        const badMoves = [];
        
        for (let col of availableCols) {
            const row = this.getAvailableRow(col);
            if (row !== -1) {
                // Στήλες που δίνουν ευκαιρία στον αντίπαλο
                this.board[row][col] = 2;
                if (this.givesOpponentOpportunity(row, col)) {
                    badMoves.push(col);
                }
                this.board[row][col] = 0;
                
                // Ακραίες στήλες (0, 6) είναι συνήθως κακές εκτός από συγκεκριμένες περιπτώσεις
                if ((col === 0 || col === 6) && row > 2) {
                    badMoves.push(col);
                }
            }
        }
        
        return badMoves.length > 0 ? badMoves : availableCols;
    }

    findWinningMove() {
        const availableCols = this.getAvailableColumns();
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
        return -1;
    }

    findBlockingMove() {
        const availableCols = this.getAvailableColumns();
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
        return -1;
    }

    findThreatMove(player) {
        const availableCols = this.getAvailableColumns();
        for (let col of availableCols) {
            const row = this.getAvailableRow(col);
            if (row !== -1) {
                this.board[row][col] = player;
                // Έλεγχος για 3 σε σειρά
                if (this.countConsecutive(row, col, player) >= 3) {
                    this.board[row][col] = 0;
                    return col;
                }
                this.board[row][col] = 0;
            }
        }
        return -1;
    }

    findDoubleThreat() {
        const availableCols = this.getAvailableColumns();
        
        for (let col of availableCols) {
            const row = this.getAvailableRow(col);
            if (row !== -1) {
                this.board[row][col] = 2;
                let threatCount = 0;
                
                // Έλεγχος για πολλαπλές απειλές
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
        return -1;
    }

    getSafeMoves(availableCols) {
        const safeMoves = [];
        
        for (let col of availableCols) {
            const row = this.getAvailableRow(col);
            if (row !== -1) {
                this.board[row][col] = 2;
                const isSafe = !this.givesOpponentOpportunity(row, col);
                this.board[row][col] = 0;
                
                if (isSafe) {
                    safeMoves.push(col);
                }
            }
        }
        
        return safeMoves.length > 0 ? safeMoves : availableCols;
    }

    givesOpponentOpportunity(row, col) {
        // Έλεγχος αν αυτή η κίνηση δίνει στον αντίπαλο ευκαιρία για νίκη
        this.board[row][col] = 2;
        
        for (let nextCol = 0; nextCol < this.cols; nextCol++) {
            const nextRow = this.getAvailableRow(nextCol);
            if (nextRow !== -1) {
                this.board[nextRow][nextCol] = 1;
                if (this.checkWinner(nextRow, nextCol)) {
                    this.board[nextRow][nextCol] = 0;
                    this.board[row][col] = 0;
                    return true;
                }
                this.board[nextRow][nextCol] = 0;
            }
        }
        
        this.board[row][col] = 0;
        return false;
    }

    getStrategicMoves(availableCols) {
        // Προτίμηση για κεντρικές και στρατηγικές θέσεις
        const strategicOrder = [3, 2, 4, 1, 5, 0, 6];
        const strategicMoves = [];
        
        for (let col of strategicOrder) {
            if (availableCols.includes(col)) {
                strategicMoves.push(col);
            }
        }
        
        return strategicMoves;
    }

    getSuboptimalMove(availableCols) {
        // Μερικές φορές επιλέγει μη βέλτιστη κίνηση για να μοιάζει πιο ανθρώπινη
        if (availableCols.length <= 1) return availableCols[0];
        
        // 30% πιθανότητα να επιλέξει τη δεύτερη ή τρίτη καλύτερη κίνηση
        if (Math.random() < 0.3 && availableCols.length > 2) {
            return availableCols[1 + Math.floor(Math.random() * 2)];
        }
        
        return -1;
    }

    countConsecutive(row, col, player) {
        let maxCount = 0;
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

            maxCount = Math.max(maxCount, count);
        }

        return maxCount;
    }
}
