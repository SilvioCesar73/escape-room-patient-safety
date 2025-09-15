// static/js/challenges/puzzle_challenge.js

class PuzzleChallenge extends BaseChallenge {
    constructor(challengeData) {
        super(challengeData);
        this.piecesCount = challengeData.puzzleData.pieces;
        this.rows = Math.sqrt(this.piecesCount);
        this.columns = this.rows;
        this.imageSrc = `${staticUrl}${challengeData.puzzleData.image}`;
        this.selectedPiece = null;

        // matriz do tabuleiro (valores 0..N-1)
        this.board = Array.from({ length: this.rows }, (_, r) =>
            Array.from({ length: this.columns }, (_, c) => r * this.columns + c)
        );

        this.shuffleBoard();

        // Contadores para cálculo centralizado
        this.wrongAnswers = 0;
        this.totalQuestions = 1; // puzzle é considerado um único desafio
    }

    async init() {
        console.log("[Puzzle] iniciado:", this.challengeData.title);

        const started = await this.startChallenge();
        if (!started) return;

        this.updateScoreDisplay();
        this.startChallengeTimer(this.challengeData.timeLimit);

        // wrapper e container (uma vez só)
        this.wrapper = document.createElement("div");
        this.wrapper.className = "card shadow-lg p-4 text-center";
        this.wrapper.style.maxWidth = "700px";
        this.wrapper.style.margin = "2rem auto";

        const instructions = document.createElement("p");
        instructions.textContent = this.challengeData.puzzleData.instructions;
        instructions.className = "lead fw-bold mb-3";
        this.wrapper.appendChild(instructions);

        this.container = document.createElement("div");
        this.container.id = "puzzle-container";
        this.container.style.display = "grid";
        this.container.style.gridTemplateColumns = `repeat(${this.columns}, 1fr)`;
        this.container.style.gap = "0.5rem";
        this.wrapper.appendChild(this.container);

        this.gameScenario.appendChild(this.wrapper);

        this.renderPuzzle();
    }

    shuffleBoard() {
        const flat = this.board.flat();
        for (let i = flat.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [flat[i], flat[j]] = [flat[j], flat[i]];
        }
        this.board = Array.from({ length: this.rows }, (_, r) =>
            flat.slice(r * this.columns, (r + 1) * this.columns)
        );
        console.log("[Puzzle] embaralhado:", this.board.flat());
    }

    renderPuzzle() {
        // limpa e redesenha sem duplicar
        this.container.innerHTML = "";

        this.board.forEach((row, r) => {
            row.forEach((val, c) => {
                const piece = document.createElement("div");
                piece.className = "puzzle-piece border rounded shadow-sm";
                piece.style.aspectRatio = "1 / 1";
                piece.style.backgroundImage = `url(${this.imageSrc})`;
                piece.style.backgroundRepeat = "no-repeat";
                piece.style.backgroundSize = `${this.columns * 100}% ${this.rows * 100}%`;

                const correctRow = Math.floor(val / this.columns);
                const correctCol = val % this.columns;

                const posX = (this.columns > 1) ? (correctCol / (this.columns - 1)) * 100 : 0;
                const posY = (this.rows > 1) ? (correctRow / (this.rows - 1)) * 100 : 0;

                piece.style.backgroundPosition = `${posX}% ${posY}%`;

                piece.dataset.row = r;
                piece.dataset.col = c;

                piece.addEventListener("click", () => this.handlePieceClick(r, c));
                this.container.appendChild(piece);
            });
        });
    }

    handlePieceClick(r, c) {
        if (!this.selectedPiece) {
            this.selectedPiece = { r, c };
            this.highlightPiece(r, c, true);
        } else if (this.selectedPiece.r === r && this.selectedPiece.c === c) {
            this.highlightPiece(r, c, false);
            this.selectedPiece = null;
        } else {
            const { r: r1, c: c1 } = this.selectedPiece;
            [this.board[r1][c1], this.board[r][c]] = [this.board[r][c], this.board[r1][c1]];
            this.highlightPiece(r1, c1, false);
            this.selectedPiece = null;

            this.renderPuzzle();

            if (!this.checkIfSolved()) {
                this.wrongAnswers++; // cada troca sem solução conta como erro
            }
        }
    }

    highlightPiece(r, c, on) {
        const idx = r * this.columns + c;
        const piece = this.container.children[idx];
        if (piece) {
            piece.style.outline = on ? "3px solid orange" : "none";
        }
    }

    checkIfSolved() {
        let solved = true;
        for (let r = 0; r < this.rows && solved; r++) {
            for (let c = 0; c < this.columns; c++) {
                const expected = r * this.columns + c;
                if (this.board[r][c] !== expected) {
                    solved = false;
                    break;
                }
            }
        }

        if (solved) {
            if (this.timerInterval) clearInterval(this.timerInterval);

            alert("Parabéns! Você montou o quebra-cabeça!");
            this.completeChallenge(true); // cálculo centralizado
        }

        return solved;
    }
}

// entrada automática
document.addEventListener("DOMContentLoaded", () => {
    if (typeof window.currentChallengeData !== "undefined" &&
        window.currentChallengeData.type === "puzzle") {
        const challenge = new PuzzleChallenge(window.currentChallengeData);
        challenge.init();
    }
});
