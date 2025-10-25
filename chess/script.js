// Αρχικοποίηση της σκακιέρας
const board = [
    ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
    ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
];

// Αντιστοίχιση συμβόλων με Unicode για τα πιόνια
const pieceSymbols = {
    'P': '♙', 'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔',
    'p': '♟', 'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚'
};

let selectedPiece = null;
let possibleMoves = [];

// Δημιουργία της σκακιέρας
function createBoard() {
    const chessboard = document.getElementById('chessboard');
    chessboard.innerHTML = '';

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
            square.dataset.row = row;
            square.dataset.col = col;

            const piece = board[row][col];
            if (piece) {
                square.innerHTML = pieceSymbols[piece];
                square.classList.add('piece');
            }

            square.addEventListener('click', handleSquareClick);
            chessboard.appendChild(square);
        }
    }
}

// Χειρισμός κλικ σε τετράγωνο
function handleSquareClick(event) {
    const row = parseInt(event.target.dataset.row);
    const col = parseInt(event.target.dataset.col);

    if (selectedPiece) {
        if (possibleMoves.some(move => move.row === row && move.col === col)) {
            // Μετακίνηση πιονιού
            board[row][col] = board[selectedPiece.row][selectedPiece.col];
            board[selectedPiece.row][selectedPiece.col] = '';
            selectedPiece = null;
            possibleMoves = [];
            createBoard();
        } else {
            // Ακύρωση επιλογής αν το τετράγωνο δεν είναι έγκυρη κίνηση
            selectedPiece = null;
            possibleMoves = [];
            createBoard();
        }
    } else if (board[row][col]) {
        // Επιλογή πιονιού
        selectedPiece = { row, col };
        possibleMoves = getPossibleMoves(row, col);
        highlightMoves();
    }
}

// Υπολογισμός πιθανών κινήσεων (απλοποιημένη λογική για πιόνια)
function getPossibleMoves(row, col) {
    const piece = board[row][col];
    const moves = [];

    // Παράδειγμα για λευκά πιόνια (P)
    if (piece === 'P') {
        if (row > 0 && !board[row - 1][col]) {
            moves.push({ row: row - 1, col });
            if (row === 6 && !board[row - 2][col]) {
                moves.push({ row: row - 2, col });
            }
        }
    }
    // Παράδειγμα για μαύρα πιόνια (p)
    else if (piece === 'p') {
        if (row < 7 && !board[row + 1][col]) {
            moves.push({ row: row + 1, col });
            if (row === 1 && !board[row + 2][col]) {
                moves.push({ row: row + 2, col });
            }
        }
    }
    // Εδώ μπορείς να προσθέσεις λογική για άλλα πιόνια (R, N, B, Q, K)

    return moves;
}

// Επισήμανση πιθανών κινήσεων
function highlightMoves() {
    createBoard();
    const squares = document.querySelectorAll('.square');
    squares.forEach(square => {
        const row = parseInt(square.dataset.row);
        const col = parseInt(square.dataset.col);

        if (row === selectedPiece.row && col === selectedPiece.col) {
            square.classList.add('selected');
        }
        if (possibleMoves.some(move => move.row === row && move.col === col)) {
            square.classList.add('possible-move');
        }
    });
}

// Αρχικοποίηση
createBoard();
