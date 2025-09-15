// static/js/challenges/wordsearch_challenge.js

class WordSearchChallenge extends BaseChallenge {
    constructor(challengeData) {
        super(challengeData);

        this.gridSize = (challengeData.wordsearchData?.gridSize) || 14;
        this.words = (challengeData.wordsearchData?.words || []).map(w => w.toUpperCase());

        // Estado do jogo
        this.board = this._createEmptyBoard(this.gridSize);
        this.cellRefs = [];
        this.placedWords = [];            // [{word, positions:[{r,c}]}]
        this.foundWords = new Set();

        // Contadores para fórmula centralizada
        this.wrongAnswers = 0;
        this.totalQuestions = this.words.length;

        // Seleção
        this.isSelecting = false;
        this.selectionPath = [];          // [td, td, ...]
        this.selectionDir = null;         // "H" | "V" | null

        // DOM base
        this.gameScenario = document.getElementById("game-scenario");
    }

    async init() {
        console.log("[WordSearch] iniciado:", this.challengeData.title);

        const ok = await this.startChallenge();
        if (!ok) return;

        this.updateScoreDisplay();
        this.startChallengeTimer(this.challengeData.timeLimit || 90);

        this.renderUI();
        this.generateBoard();
        this.renderGrid();
        this.renderWordList();

        console.log("[WordSearch] pronto – grade renderizada");
    }

    // ---------- Board generation ----------
    _createEmptyBoard(n) {
        return Array.from({ length: n }, () => Array.from({ length: n }, () => ""));
    }

    generateBoard() {
        const directions = [
            { dr: 0, dc: 1 },  // →
            { dr: 1, dc: 0 },  // ↓
        ];

        this.words.forEach(word => {
            const placed = this._tryPlaceWord(word, directions);
            if (!placed) {
                console.warn(`[WordSearch] Falha ao posicionar: ${word}`);
            }
        });

        const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                if (!this.board[r][c]) this.board[r][c] = A[Math.floor(Math.random() * A.length)];
            }
        }
    }

    _tryPlaceWord(word, directions) {
        for (let t = 0; t < 300; t++) {
            const dir = directions[Math.floor(Math.random() * directions.length)];
            const r0 = Math.floor(Math.random() * this.gridSize);
            const c0 = Math.floor(Math.random() * this.gridSize);
            if (this._canPlace(word, r0, c0, dir)) {
                this._place(word, r0, c0, dir);
                return true;
            }
        }
        return false;
    }

    _canPlace(word, r, c, { dr, dc }) {
        for (let i = 0; i < word.length; i++) {
            if (r < 0 || r >= this.gridSize || c < 0 || c >= this.gridSize) return false;
            const cell = this.board[r][c];
            if (cell && cell !== word[i]) return false;
            r += dr; c += dc;
        }
        return true;
    }

    _place(word, r, c, { dr, dc }) {
        const positions = [];
        for (let i = 0; i < word.length; i++) {
            this.board[r][c] = word[i];
            positions.push({ r, c });
            r += dr; c += dc;
        }
        this.placedWords.push({ word, positions });
    }

    // ---------- UI ----------
    renderUI() {
        this.gameScenario.innerHTML = "";

        const card = document.createElement("div");
        card.className = "card p-4 shadow-lg text-center";
        card.style.maxWidth = "960px";
        card.style.margin = "2rem auto";
        card.style.background = "rgba(255,255,255,0.95)";
        card.style.borderRadius = "16px";

        const instructions = document.createElement("p");
        instructions.className = "lead fw-bold mb-3";
        instructions.textContent = this.challengeData.wordsearchData?.instructions || "Encontre todas as palavras.";
        card.appendChild(instructions);

        const layout = document.createElement("div");
        layout.style.display = "grid";
        layout.style.gridTemplateColumns = "1fr 240px";
        layout.style.gap = "20px";
        card.appendChild(layout);

        const table = document.createElement("table");
        table.id = "wordsearch-grid";
        table.style.borderCollapse = "collapse";
        table.style.margin = "0 auto";
        layout.appendChild(table);

        const side = document.createElement("div");
        const title = document.createElement("h6");
        title.textContent = "Palavras";
        side.appendChild(title);

        const ul = document.createElement("ul");
        ul.id = "word-list";
        ul.style.listStyle = "none";
        ul.style.paddingLeft = "0";
        side.appendChild(ul);

        layout.appendChild(side);
        this.gameScenario.appendChild(card);
    }

    renderGrid() {
        const table = document.getElementById("wordsearch-grid");
        table.innerHTML = "";
        this.cellRefs = [];

        for (let r = 0; r < this.gridSize; r++) {
            const tr = document.createElement("tr");
            const rowRefs = [];
            for (let c = 0; c < this.gridSize; c++) {
                const td = document.createElement("td");
                td.textContent = this.board[r][c];
                td.dataset.r = r;
                td.dataset.c = c;
                td.style.width = "34px";
                td.style.height = "34px";
                td.style.textAlign = "center";
                td.style.fontWeight = "700";
                td.style.border = "1px solid #dee2e6";
                td.style.cursor = "pointer";
                td.style.userSelect = "none";
                td.className = "ws-cell";

                td.addEventListener("mousedown", () => this._startSelection(td));
                td.addEventListener("mouseenter", () => this._extendSelection(td));
                td.addEventListener("mouseup", () => this._endSelection());

                tr.appendChild(td);
                rowRefs.push(td);
            }
            table.appendChild(tr);
            this.cellRefs.push(rowRefs);
        }

        document.addEventListener("mouseup", () => this._endSelection());
    }

    renderWordList() {
        const ul = document.getElementById("word-list");
        ul.innerHTML = "";
        this.words.forEach(w => {
            const li = document.createElement("li");
            li.dataset.word = w;
            li.textContent = w;
            li.style.padding = "6px 8px";
            li.style.border = "1px solid #e9ecef";
            li.style.borderRadius = "8px";
            li.style.marginBottom = "6px";
            li.style.background = "#fff";
            li.style.fontWeight = "600";
            ul.appendChild(li);
        });
    }

    // ---------- Seleção ----------
    _startSelection(td) {
        this.isSelecting = true;
        this.selectionPath = [td];
        this.selectionDir = null;
        this._paint(td, "select");
    }

    _extendSelection(td) {
        if (!this.isSelecting) return;
        if (this.selectionPath.includes(td)) return;

        const last = this.selectionPath[this.selectionPath.length - 1];
        const r = parseInt(td.dataset.r, 10), c = parseInt(td.dataset.c, 10);
        const lr = parseInt(last.dataset.r, 10), lc = parseInt(last.dataset.c, 10);

        if (!this.selectionDir) {
            if (r === lr && c !== lc) this.selectionDir = "H";
            else if (c === lc && r !== lr) this.selectionDir = "V";
            else return;
        }

        if (this.selectionDir === "H" && r === lr && Math.abs(c - lc) === 1) {
            this.selectionPath.push(td);
            this._paint(td, "select");
        } else if (this.selectionDir === "V" && c === lc && Math.abs(r - lr) === 1) {
            this.selectionPath.push(td);
            this._paint(td, "select");
        }
    }

    _endSelection() {
        if (!this.isSelecting) return;
        this.isSelecting = false;

        if (this.selectionPath.length < 2) {
            this._clearNonFoundSelection();
            this.selectionPath = [];
            this.selectionDir = null;
            return;
        }

        const selected = this.selectionPath.map(td => td.textContent).join("");
        const reversed = selected.split("").reverse().join("");

        const match = this.words.find(w => w === selected || w === reversed);

        if (match && !this.foundWords.has(match)) {
            this._markWordFound(match, this.selectionPath);

            if (this.foundWords.size === this.words.length) {
                clearInterval(this.timerInterval);
                alert("Parabéns! Você encontrou todas as palavras!");
                this.completeChallenge(true);
            }
        } else {
            this.wrongAnswers++; // cada seleção inválida conta como erro
            this.selectionPath.forEach(td => this._paint(td, "error"));
            setTimeout(() => this._clearNonFoundSelection(), 180);
        }

        this.selectionPath = [];
        this.selectionDir = null;
    }

    _paint(td, mode) {
        if (mode === "select") {
            td.style.background = "rgba(255, 235, 134, 0.8)";
            td.style.borderColor = "#ffda6a";
        } else if (mode === "found") {
            td.style.background = "#28a745";
            td.style.color = "#fff";
            td.classList.add("ws-found");
        } else if (mode === "error") {
            td.style.background = "rgba(231,74,59,0.35)";
            td.style.borderColor = "#e74a3b";
        } else {
            if (!td.classList.contains("ws-found")) {
                td.style.background = "";
                td.style.borderColor = "#dee2e6";
                td.style.color = "";
            }
        }
    }

    _clearNonFoundSelection() {
        this.selectionPath.forEach(td => this._paint(td, "clear"));
    }

    _markWordFound(word, path) {
        this.foundWords.add(word);
        path.forEach(td => this._paint(td, "found"));

        const li = document.querySelector(`#word-list li[data-word="${word}"]`);
        if (li) {
            li.style.textDecoration = "line-through";
            li.style.opacity = "0.7";
        }
    }
}

// Entrada automática
document.addEventListener("DOMContentLoaded", () => {
    if (typeof window.currentChallengeData !== "undefined" &&
        window.currentChallengeData.type === "wordsearch") {
        const challenge = new WordSearchChallenge(window.currentChallengeData);
        challenge.init();
    }
});
