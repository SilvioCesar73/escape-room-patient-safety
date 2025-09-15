// Sistema de Caça-Palavras Interativo
// Gerencia desafios do tipo wordsearch com grid dinâmico

class WordSearchSystem {
    constructor() {
        this.currentGame = null;
        this.gameGrid = [];
        this.foundWords = new Set();
        this.selectedCells = [];
        this.gameState = 'idle'; // idle, selecting, completed
        
        this.initializeGameElements();
        this.initializeEventListeners();
    }

    // Inicializar elementos do jogo
    initializeGameElements() {
        // Criar container para o caça-palavras
        if (!document.getElementById('wordsearch-container')) {
            const container = document.createElement('div');
            container.id = 'wordsearch-container';
            container.className = 'wordsearch-container';
            container.style.display = 'none';
            document.body.appendChild(container);
        }
    }

    // Inicializar listeners de eventos
    initializeEventListeners() {
        // Eventos de mouse para seleção
        document.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', () => this.handleMouseUp());

        // Eventos touch para mobile
        document.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        document.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        document.addEventListener('touchend', () => this.handleTouchEnd());

        // Eventos de teclado
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    // Iniciar jogo de caça-palavras
    startGame(wordsearchData) {
        if (!wordsearchData || !wordsearchData.words || wordsearchData.words.length === 0) {
            console.error('Dados do caça-palavras inválidos');
            return false;
        }

        this.currentGame = wordsearchData;
        this.foundWords.clear();
        this.selectedCells = [];
        this.gameState = 'idle';

        // Gerar grid se não fornecido
        if (!wordsearchData.grid || wordsearchData.grid.length === 0) {
            this.generateGrid(wordsearchData.words);
        } else {
            this.gameGrid = wordsearchData.grid;
        }

        // Mostrar interface do jogo
        this.showGameInterface();

        console.log(`Caça-palavras iniciado: ${wordsearchData.words.length} palavras`);
        return true;
    }

    // Gerar grid automaticamente
    generateGrid(words, gridSize = 15) {
        // Inicializar grid vazio
        this.gameGrid = Array(gridSize).fill().map(() => Array(gridSize).fill(''));

        // Colocar palavras no grid
        words.forEach(word => {
            this.placeWordInGrid(word.toUpperCase());
        });

        // Preencher espaços vazios com letras aleatórias
        this.fillEmptyCells();
    }

    // Colocar palavra no grid
    placeWordInGrid(word, maxAttempts = 100) {
        const directions = [
            { dx: 1, dy: 0 },   // Horizontal →
            { dx: 0, dy: 1 },   // Vertical ↓
            { dx: 1, dy: 1 },   // Diagonal ↘
            { dx: 1, dy: -1 },  // Diagonal ↗
            { dx: -1, dy: 0 },  // Horizontal ←
            { dx: 0, dy: -1 },  // Vertical ↑
            { dx: -1, dy: -1 }, // Diagonal ↖
            { dx: -1, dy: 1 }   // Diagonal ↙
        ];

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const direction = directions[Math.floor(Math.random() * directions.length)];
            const startX = Math.floor(Math.random() * this.gameGrid.length);
            const startY = Math.floor(Math.random() * this.gameGrid[0].length);

            if (this.canPlaceWord(word, startX, startY, direction)) {
                this.insertWord(word, startX, startY, direction);
                return true;
            }
        }

        console.warn(`Não foi possível colocar a palavra: ${word}`);
        return false;
    }

    // Verificar se pode colocar palavra
    canPlaceWord(word, startX, startY, direction) {
        let x = startX;
        let y = startY;

        for (let i = 0; i < word.length; i++) {
            // Verificar limites do grid
            if (x < 0 || x >= this.gameGrid.length || y < 0 || y >= this.gameGrid[0].length) {
                return false;
            }

            // Verificar se célula está vazia ou tem a mesma letra
            if (this.gameGrid[x][y] !== '' && this.gameGrid[x][y] !== word[i]) {
                return false;
            }

            x += direction.dx;
            y += direction.dy;
        }

        return true;
    }

    // Inserir palavra no grid
    insertWord(word, startX, startY, direction) {
        let x = startX;
        let y = startY;

        for (let i = 0; i < word.length; i++) {
            this.gameGrid[x][y] = word[i];
            x += direction.dx;
            y += direction.dy;
        }
    }

    // Preencher células vazias com letras aleatórias
    fillEmptyCells() {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        
        for (let i = 0; i < this.gameGrid.length; i++) {
            for (let j = 0; j < this.gameGrid[i].length; j++) {
                if (this.gameGrid[i][j] === '') {
                    this.gameGrid[i][j] = letters[Math.floor(Math.random() * letters.length)];
                }
            }
        }
    }

    // Mostrar interface do jogo
    showGameInterface() {
        if (window.modalSystem) {
            const gameHtml = this.generateGameHTML();
            
            modalSystem.show('wordsearchModal', {
                data: {
                    title: 'Caça-Palavras',
                    content: gameHtml,
                    words: this.currentGame.words
                },
                onHide: () => this.cleanupGame()
            });
        } else {
            this.showGameFallback();
        }
    }

    // Gerar HTML do jogo
    generateGameHTML() {
        return `
            <div class="wordsearch-game">
                <div class="wordsearch-header">
                    <h5>Encontre as palavras!</h5>
                    <div class="wordsearch-progress">
                        <span id="words-found">0</span>/<span>${this.currentGame.words.length}</span>
                    </div>
                </div>
                
                <div class="wordsearch-grid-container">
                    <div class="wordsearch-grid" id="wordsearch-grid">
                        ${this.generateGridHTML()}
                    </div>
                </div>

                <div class="wordsearch-words">
                    <h6>Palavras para encontrar:</h6>
                    <div class="words-list" id="words-list">
                        ${this.generateWordsListHTML()}
                    </div>
                </div>

                <div class="wordsearch-controls">
                    <button class="btn btn-sm btn-outline-secondary" onclick="wordSearchSystem.showHint()">
                        <i class="bi bi-lightbulb"></i> Dica
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="wordSearchSystem.restartGame()">
                        <i class="bi bi-arrow-clockwise"></i> Reiniciar
                    </button>
                </div>
            </div>
        `;
    }

    // Gerar HTML do grid
    generateGridHTML() {
        let html = '';
        for (let i = 0; i < this.gameGrid.length; i++) {
            html += '<div class="wordsearch-row">';
            for (let j = 0; j < this.gameGrid[i].length; j++) {
                html += `
                    <div class="wordsearch-cell" 
                         data-row="${i}" 
                         data-col="${j}"
                         onmousedown="wordSearchSystem.handleCellMouseDown(${i}, ${j})"
                         onmouseenter="wordSearchSystem.handleCellMouseEnter(${i}, ${j})">
                        ${this.gameGrid[i][j]}
                    </div>
                `;
            }
            html += '</div>';
        }
        return html;
    }

    // Gerar HTML da lista de palavras
    generateWordsListHTML() {
        return this.currentGame.words.map(word => `
            <span class="word-tag" data-word="${word.toUpperCase()}" id="word-${word.toUpperCase()}">
                ${word}
            </span>
        `).join('');
    }

    // Manipular clique inicial na célula
    handleCellMouseDown(row, col) {
        this.gameState = 'selecting';
        this.selectedCells = [{ row, col }];
        this.updateCellSelection();
    }

    // Manipular movimento do mouse sobre células
    handleCellMouseEnter(row, col) {
        if (this.gameState === 'selecting') {
            this.selectedCells.push({ row, col });
            this.updateCellSelection();
        }
    }

    // Manipular final de seleção
    handleMouseUp() {
        if (this.gameState === 'selecting') {
            this.checkSelectedWord();
            this.clearSelection();
            this.gameState = 'idle';
        }
    }

    // Atualizar visualização da seleção
    updateCellSelection() {
        // Remover seleção anterior
        document.querySelectorAll('.wordsearch-cell.selected').forEach(cell => {
            cell.classList.remove('selected');
        });

        // Aplicar nova seleção
        this.selectedCells.forEach(cell => {
            const cellElement = document.querySelector(`[data-row="${cell.row}"][data-col="${cell.col}"]`);
            if (cellElement) {
                cellElement.classList.add('selected');
            }
        });
    }

    // Verificar palavra selecionada
    checkSelectedWord() {
        if (this.selectedCells.length < 2) return;

        // Obter palavra das células selecionadas
        const selectedWord = this.selectedCells.map(cell => 
            this.gameGrid[cell.row][cell.col]
        ).join('');

        // Verificar em ambas as direções
        const reversedWord = selectedWord.split('').reverse().join('');

        // Verificar se é uma palavra válida
        const foundWord = this.currentGame.words.find(word => 
            word.toUpperCase() === selectedWord || word.toUpperCase() === reversedWord
        );

        if (foundWord) {
            this.markWordFound(foundWord.toUpperCase());
        }
    }

    // Marcar palavra como encontrada
    markWordFound(word) {
        if (this.foundWords.has(word)) return;

        this.foundWords.add(word);
        
        // Atualizar UI
        this.updateFoundWordsDisplay();
        
        // Marcar células como encontradas
        this.markFoundCells(word);
        
        // Verificar se completou o jogo
        if (this.foundWords.size === this.currentGame.words.length) {
            this.completeGame();
        }

        // Feedback visual
        this.showWordFoundFeedback(word);
    }

    // Atualizar display de palavras encontradas
    updateFoundWordsDisplay() {
        const foundElement = document.getElementById('words-found');
        if (foundElement) {
            foundElement.textContent = this.foundWords.size;
        }

        // Marcar palavras na lista
        this.foundWords.forEach(word => {
            const wordElement = document.getElementById(`word-${word}`);
            if (wordElement) {
                wordElement.classList.add('found');
            }
        });
    }

    // Marcar células da palavra como encontradas
    markFoundCells(word) {
        // Esta é uma implementação simplificada
        // Em um sistema real, precisaríamos rastrear a localização exata de cada palavra
        document.querySelectorAll('.wordsearch-cell').forEach(cell => {
            if (this.gameGrid[cell.dataset.row][cell.dataset.col] !== '') {
                cell.classList.add('found');
            }
        });
    }

    // Completar jogo
    completeGame() {
        this.gameState = 'completed';
        
        // Mostrar mensagem de conclusão
        this.showCompletionMessage();

        // Atualizar progresso
        if (window.progressManager) {
            progressManager.completeChallenge(this.currentGame.id, 100);
        }

        console.log('Caça-palavras completado!');
    }

    // Mostrar mensagem de conclusão
    showCompletionMessage() {
        if (window.modalSystem) {
            modalSystem.show('resultModal', {
                data: {
                    title: 'Parabéns!',
                    content: `
                        <div class="text-center">
                            <i class="bi bi-trophy-fill display-4 text-warning"></i>
                            <h4>Caça-Palavras Completado!</h4>
                            <p>Você encontrou todas as ${this.foundWords.size} palavras!</p>
                        </div>
                    `
                },
                onConfirm: () => this.cleanupGame()
            });
        }
    }

    // Mostrar feedback de palavra encontrada
    showWordFoundFeedback(word) {
        if (window.questionSystem) {
            questionSystem.showToast(`🎯 Palavra encontrada: ${word}`, 'success');
        }

        // Efeito visual
        const wordElement = document.getElementById(`word-${word}`);
        if (wordElement) {
            wordElement.classList.add('celebrating');
            setTimeout(() => {
                wordElement.classList.remove('celebrating');
            }, 2000);
        }
    }

    // Mostrar dica
    showHint() {
        if (!this.currentGame) return;

        // Encontrar palavra não encontrada
        const remainingWords = this.currentGame.words.filter(word => 
            !this.foundWords.has(word.toUpperCase())
        );

        if (remainingWords.length === 0) return;

        const randomWord = remainingWords[Math.floor(Math.random() * remainingWords.length)];
        
        if (window.questionSystem) {
            questionSystem.showToast(`💡 Dica: A palavra "${randomWord}" está no grid!`, 'info');
        }

        // Piscar a palavra na lista
        const wordElement = document.getElementById(`word-${randomWord.toUpperCase()}`);
        if (wordElement) {
            wordElement.classList.add('hint');
            setTimeout(() => {
                wordElement.classList.remove('hint');
            }, 3000);
        }
    }

    // Reiniciar jogo
    restartGame() {
        if (this.currentGame) {
            this.cleanupGame();
            this.startGame(this.currentGame);
        }
    }

    // Limpar jogo
    cleanupGame() {
        this.currentGame = null;
        this.gameGrid = [];
        this.foundWords.clear();
        this.selectedCells = [];
        this.gameState = 'idle';
    }

    // Manipuladores de touch para mobile
    handleTouchStart(e) {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const cell = this.getCellFromPoint(touch.clientX, touch.clientY);
            if (cell) {
                this.handleCellMouseDown(cell.row, cell.col);
                e.preventDefault();
            }
        }
    }

    handleTouchMove(e) {
        if (this.gameState === 'selecting' && e.touches.length === 1) {
            const touch = e.touches[0];
            const cell = this.getCellFromPoint(touch.clientX, touch.clientY);
            if (cell) {
                this.handleCellMouseEnter(cell.row, cell.col);
                e.preventDefault();
            }
        }
    }

    handleTouchEnd() {
        this.handleMouseUp();
    }

    // Obter célula a partir de coordenadas
    getCellFromPoint(x, y) {
        const elements = document.elementsFromPoint(x, y);
        const cellElement = elements.find(el => el.classList.contains('wordsearch-cell'));
        
        if (cellElement) {
            return {
                row: parseInt(cellElement.dataset.row),
                col: parseInt(cellElement.dataset.col)
            };
        }
        return null;
    }

    // Manipuladores de teclado
    handleKeyDown(e) {
        if (e.key === 'Escape') {
            this.clearSelection();
            this.gameState = 'idle';
        }
    }

    // Limpar seleção
    clearSelection() {
        this.selectedCells = [];
        document.querySelectorAll('.wordsearch-cell.selected').forEach(cell => {
            cell.classList.remove('selected');
        });
    }

    // Fallback para mostrar jogo (sem modalSystem)
    showGameFallback() {
        const container = document.getElementById('wordsearch-container');
        if (!container) return;

        container.innerHTML = this.generateGameHTML();
        container.style.display = 'block';
    }

    // Obter estatísticas do jogo
    getGameStats() {
        if (!this.currentGame) return null;

        return {
            totalWords: this.currentGame.words.length,
            foundWords: this.foundWords.size,
            progress: Math.round((this.foundWords.size / this.currentGame.words.length) * 100),
            gameState: this.gameState
        };
    }
}

// Inicializar o sistema de caça-palavras
document.addEventListener('DOMContentLoaded', function() {
    window.wordSearchSystem = new WordSearchSystem();
    console.log('Sistema de caça-palavras inicializado');

    // Integrar com o stationCore
    if (window.stationCore) {
        stationCore.wordSearchSystem = wordSearchSystem;
    }
});

// Exportar para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WordSearchSystem };
} else {
    window.WordSearchSystem = WordSearchSystem;
}