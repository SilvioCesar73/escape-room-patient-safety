// Sistema de Quebra-Cabeça Interativo
// Gerencia desafios do tipo puzzle com peças arrastáveis

class PuzzleSystem {
    constructor() {
        this.currentPuzzle = null;
        this.puzzlePieces = [];
        this.placedPieces = new Map();
        this.draggingPiece = null;
        this.dragOffset = { x: 0, y: 0 };
        this.gameState = 'idle'; // idle, dragging, completed
        
        this.initializePuzzleElements();
        this.initializeEventListeners();
        this.initializeDropZones();
    }

    // Inicializar elementos do puzzle
    initializePuzzleElements() {
        // Criar container para o puzzle
        if (!document.getElementById('puzzle-container')) {
            const container = document.createElement('div');
            container.id = 'puzzle-container';
            container.className = 'puzzle-container';
            container.style.display = 'none';
            document.body.appendChild(container);
        }

        // Criar área de drop
        if (!document.getElementById('puzzle-drop-area')) {
            const dropArea = document.createElement('div');
            dropArea.id = 'puzzle-drop-area';
            dropArea.className = 'puzzle-drop-area';
            document.body.appendChild(dropArea);
        }
    }

    // Inicializar listeners de eventos
    initializeEventListeners() {
        // Eventos de drag and drop
        document.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', () => this.handleMouseUp());

        // Eventos touch
        document.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        document.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        document.addEventListener('touchend', () => this.handleTouchEnd());

        // Eventos de teclado para acessibilidade
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    // Inicializar zonas de drop
    initializeDropZones() {
        // Zonas de drop serão criadas dinamicamente baseadas no puzzle
    }

    // Iniciar jogo de puzzle
    startGame(puzzleData) {
        if (!puzzleData || !puzzleData.image) {
            console.error('Dados do puzzle inválidos');
            return false;
        }

        this.currentPuzzle = puzzleData;
        this.puzzlePieces = [];
        this.placedPieces.clear();
        this.draggingPiece = null;
        this.gameState = 'idle';

        // Configurar puzzle baseado no tipo
        if (puzzleData.pieces) {
            this.createPuzzleFromData(puzzleData);
        } else {
            this.generatePuzzle(puzzleData.image, puzzleData.pieceCount || 9);
        }

        // Mostrar interface do jogo
        this.showGameInterface();

        console.log(`Puzzle iniciado: ${puzzleData.pieceCount || 9} peças`);
        return true;
    }

    // Criar puzzle a partir de dados pré-definidos
    createPuzzleFromData(puzzleData) {
        this.puzzlePieces = puzzleData.pieces.map((piece, index) => ({
            id: index,
            image: piece.image || puzzleData.image,
            correctPosition: piece.position,
            currentPosition: null,
            rotation: 0,
            isPlaced: false,
            width: piece.width || 100,
            height: piece.height || 100
        }));
    }

    // Gerar puzzle automaticamente
    generatePuzzle(imageUrl, pieceCount = 9) {
        const rows = Math.sqrt(pieceCount);
        const cols = Math.sqrt(pieceCount);
        
        if (!Number.isInteger(rows)) {
            console.error('Número de peças deve ser um quadrado perfeito');
            return;
        }

        this.puzzlePieces = [];
        const pieceWidth = 100 / cols;
        const pieceHeight = 100 / rows;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                this.puzzlePieces.push({
                    id: row * cols + col,
                    image: imageUrl,
                    correctPosition: { row, col },
                    currentPosition: null,
                    rotation: 0,
                    isPlaced: false,
                    width: pieceWidth,
                    height: pieceHeight,
                    backgroundPosition: {
                        x: -col * pieceWidth + '%',
                        y: -row * pieceHeight + '%'
                    }
                });
            }
        }

        // Embaralhar peças
        this.shufflePieces();
    }

    // Embaralhar peças
    shufflePieces() {
        // Posições aleatórias na área de peças
        const areaWidth = 300;
        const areaHeight = 200;

        this.puzzlePieces.forEach(piece => {
            piece.currentPosition = {
                x: Math.random() * (areaWidth - piece.width),
                y: Math.random() * (areaHeight - piece.height)
            };
        });
    }

    // Mostrar interface do jogo
    showGameInterface() {
        if (window.modalSystem) {
            const gameHtml = this.generateGameHTML();
            
            modalSystem.show('puzzleModal', {
                data: {
                    title: 'Montagem do Puzzle',
                    content: gameHtml,
                    pieceCount: this.puzzlePieces.length
                },
                onHide: () => this.cleanupGame()
            });
        } else {
            this.showGameFallback();
        }

        // Renderizar peças após o modal estar visível
        setTimeout(() => {
            this.renderPuzzlePieces();
        }, 100);
    }

    // Gerar HTML do jogo
    generateGameHTML() {
        return `
            <div class="puzzle-game">
                <div class="puzzle-header">
                    <h5>Monte o Puzzle</h5>
                    <div class="puzzle-progress">
                        <span id="pieces-placed">0</span>/<span>${this.puzzlePieces.length}</span>
                    </div>
                </div>
                
                <div class="puzzle-areas">
                    <div class="puzzle-drop-zone" id="puzzle-drop-zone">
                        <div class="puzzle-grid" id="puzzle-grid">
                            ${this.generateGridHTML()}
                        </div>
                    </div>
                    
                    <div class="puzzle-pieces-area" id="puzzle-pieces-area">
                        <h6>Peças para montar:</h6>
                        <div class="pieces-container" id="pieces-container"></div>
                    </div>
                </div>

                <div class="puzzle-controls">
                    <button class="btn btn-sm btn-outline-secondary" onclick="puzzleSystem.showHint()">
                        <i class="bi bi-lightbulb"></i> Dica
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" onclick="puzzleSystem.rotatePiece()">
                        <i class="bi bi-arrow-clockwise"></i> Girar
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="puzzleSystem.restartGame()">
                        <i class="bi bi-arrow-clockwise"></i> Reiniciar
                    </button>
                </div>

                <div class="puzzle-instructions">
                    <small>💡 Arraste as peças para a área de montagem. Clique para girar.</small>
                </div>
            </div>
        `;
    }

    // Gerar HTML do grid
    generateGridHTML() {
        const rows = Math.sqrt(this.puzzlePieces.length);
        const cols = Math.sqrt(this.puzzlePieces.length);
        
        let html = '';
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                html += `<div class="grid-cell" data-row="${i}" data-col="${j}"></div>`;
            }
        }
        return html;
    }

    // Renderizar peças do puzzle
    renderPuzzlePieces() {
        const container = document.getElementById('pieces-container');
        if (!container) return;

        container.innerHTML = '';

        this.puzzlePieces.forEach(piece => {
            if (!piece.isPlaced) {
                const pieceElement = this.createPieceElement(piece);
                container.appendChild(pieceElement);
            }
        });

        // Adicionar peças já colocadas ao grid
        this.renderPlacedPieces();
    }

    // Criar elemento de peça
    createPieceElement(piece) {
        const pieceElement = document.createElement('div');
        pieceElement.className = 'puzzle-piece';
        pieceElement.dataset.pieceId = piece.id;
        pieceElement.style.width = piece.width + 'px';
        pieceElement.style.height = piece.height + 'px';
        
        // Estilo de fundo para a imagem
        pieceElement.style.backgroundImage = `url('${piece.image}')`;
        pieceElement.style.backgroundSize = `${100 * Math.sqrt(this.puzzlePieces.length)}%`;
        pieceElement.style.backgroundPosition = piece.backgroundPosition?.x + ' ' + piece.backgroundPosition?.y;
        
        // Posicionamento inicial
        if (piece.currentPosition) {
            pieceElement.style.left = piece.currentPosition.x + 'px';
            pieceElement.style.top = piece.currentPosition.y + 'px';
        }

        // Eventos
        pieceElement.addEventListener('mousedown', (e) => this.handlePieceMouseDown(e, piece));
        pieceElement.addEventListener('touchstart', (e) => this.handlePieceTouchStart(e, piece));

        return pieceElement;
    }

    // Renderizar peças colocadas
    renderPlacedPieces() {
        const grid = document.getElementById('puzzle-grid');
        if (!grid) return;

        this.placedPieces.forEach((piece, cellId) => {
            const cell = grid.querySelector(`[data-cell="${cellId}"]`);
            if (cell) {
                cell.innerHTML = '';
                const pieceElement = this.createPieceElement(piece);
                cell.appendChild(pieceElement);
            }
        });
    }

    // Manipular clique inicial na peça
    handlePieceMouseDown(e, piece) {
        e.preventDefault();
        this.startDragging(e.clientX, e.clientY, piece);
    }

    // Manipular touch inicial na peça
    handlePieceTouchStart(e, piece) {
        if (e.touches.length === 1) {
            e.preventDefault();
            this.startDragging(e.touches[0].clientX, e.touches[0].clientY, piece);
        }
    }

    // Iniciar arrasto
    startDragging(clientX, clientY, piece) {
        this.draggingPiece = piece;
        this.gameState = 'dragging';

        const pieceElement = document.querySelector(`[data-piece-id="${piece.id}"]`);
        if (pieceElement) {
            const rect = pieceElement.getBoundingClientRect();
            this.dragOffset = {
                x: clientX - rect.left,
                y: clientY - rect.top
            };

            pieceElement.classList.add('dragging');
            pieceElement.style.zIndex = '1000';
        }
    }

    // Manipular movimento do mouse
    handleMouseMove(e) {
        if (this.gameState === 'dragging' && this.draggingPiece) {
            this.updateDraggingPosition(e.clientX, e.clientY);
        }
    }

    // Manipular movimento do touch
    handleTouchMove(e) {
        if (this.gameState === 'dragging' && this.draggingPiece && e.touches.length === 1) {
            e.preventDefault();
            this.updateDraggingPosition(e.touches[0].clientX, e.touches[0].clientY);
        }
    }

    // Atualizar posição do arrasto
    updateDraggingPosition(clientX, clientY) {
        const pieceElement = document.querySelector(`[data-piece-id="${this.draggingPiece.id}"]`);
        if (pieceElement) {
            const x = clientX - this.dragOffset.x;
            const y = clientY - this.dragOffset.y;

            pieceElement.style.left = x + 'px';
            pieceElement.style.top = y + 'px';
        }
    }

    // Manipular final do arrasto
    handleMouseUp() {
        this.finishDragging();
    }

    // Manipular final do touch
    handleTouchEnd() {
        this.finishDragging();
    }

    // Finalizar arrasto
    finishDragging() {
        if (this.gameState === 'dragging' && this.draggingPiece) {
            const pieceElement = document.querySelector(`[data-piece-id="${this.draggingPiece.id}"]`);
            if (pieceElement) {
                pieceElement.classList.remove('dragging');
                pieceElement.style.zIndex = '';

                // Verificar se está sobre uma célula válida
                this.checkDropLocation(pieceElement);
            }

            this.gameState = 'idle';
            this.draggingPiece = null;
        }
    }

    // Verificar localização do drop
    checkDropLocation(pieceElement) {
        const rect = pieceElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Verificar todas as células do grid
        const gridCells = document.querySelectorAll('.grid-cell');
        let droppedOnCell = null;

        gridCells.forEach(cell => {
            const cellRect = cell.getBoundingClientRect();
            if (
                centerX >= cellRect.left &&
                centerX <= cellRect.right &&
                centerY >= cellRect.top &&
                centerY <= cellRect.bottom
            ) {
                droppedOnCell = cell;
            }
        });

        if (droppedOnCell) {
            this.placePieceOnCell(this.draggingPiece, droppedOnCell);
        }
    }

    // Colocar peça na célula
    placePieceOnCell(piece, cell) {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const cellId = `${row}-${col}`;

        // Verificar se a célula está correta
        const isCorrect = piece.correctPosition.row === row && piece.correctPosition.col === col;

        if (isCorrect) {
            // Colocar peça corretamente
            piece.isPlaced = true;
            this.placedPieces.set(cellId, piece);

            // Atualizar UI
            this.updateProgress();

            // Feedback visual
            this.showPlacementFeedback(true);

            // Verificar se completou o puzzle
            if (this.placedPieces.size === this.puzzlePieces.length) {
                this.completeGame();
            }
        } else {
            // Feedback de erro
            this.showPlacementFeedback(false);
            
            // Retornar peça à área original
            this.returnPieceToArea(piece);
        }
    }

    // Retornar peça à área de peças
    returnPieceToArea(piece) {
        const pieceElement = document.querySelector(`[data-piece-id="${piece.id}"]`);
        if (pieceElement) {
            pieceElement.style.left = piece.currentPosition.x + 'px';
            pieceElement.style.top = piece.currentPosition.y + 'px';
        }
    }

    // Girar peça
    rotatePiece() {
        if (this.draggingPiece) {
            this.draggingPiece.rotation = (this.draggingPiece.rotation + 90) % 360;
            
            const pieceElement = document.querySelector(`[data-piece-id="${this.draggingPiece.id}"]`);
            if (pieceElement) {
                pieceElement.style.transform = `rotate(${this.draggingPiece.rotation}deg)`;
            }

            this.showToast('🔄 Peça girada', 'info');
        }
    }

    // Mostrar dica
    showHint() {
        // Encontrar peça não colocada
        const unplacedPieces = this.puzzlePieces.filter(piece => !piece.isPlaced);
        if (unplacedPieces.length === 0) return;

        const randomPiece = unplacedPieces[Math.floor(Math.random() * unplacedPieces.length)];
        
        // Destacar peça
        const pieceElement = document.querySelector(`[data-piece-id="${randomPiece.id}"]`);
        if (pieceElement) {
            pieceElement.classList.add('hint');
            setTimeout(() => {
                pieceElement.classList.remove('hint');
            }, 3000);
        }

        this.showToast(`💡 Dica: Encontre o lugar da peça destacada`, 'info');
    }

    // Atualizar progresso
    updateProgress() {
        const progressElement = document.getElementById('pieces-placed');
        if (progressElement) {
            progressElement.textContent = this.placedPieces.size;
        }
    }

    // Completar jogo
    completeGame() {
        this.gameState = 'completed';
        
        // Mostrar mensagem de conclusão
        this.showCompletionMessage();

        // Atualizar progresso
        if (window.progressManager) {
            progressManager.completeChallenge(this.currentPuzzle.id, 100);
        }

        console.log('Puzzle completado!');
    }

    // Mostrar mensagem de conclusão
    showCompletionMessage() {
        if (window.modalSystem) {
            modalSystem.show('resultModal', {
                data: {
                    title: 'Parabéns!',
                    content: `
                        <div class="text-center">
                            <i class="bi bi-puzzle-fill display-4 text-success"></i>
                            <h4>Puzzle Completado!</h4>
                            <p>Você montou todas as ${this.placedPieces.size} peças!</p>
                        </div>
                    `
                },
                onConfirm: () => this.cleanupGame()
            });
        }
    }

    // Mostrar feedback de colocação
    showPlacementFeedback(isCorrect) {
        if (isCorrect) {
            this.showToast('✅ Peça colocada corretamente!', 'success');
            
            // Efeito visual
            if (window.questionSystem) {
                questionSystem.showToast('🎯 Peça encaixada perfeitamente!', 'success');
            }
        } else {
            this.showToast('❌ Posição incorreta. Tente novamente.', 'error');
            
            // Efeito de vibração
            if ('vibrate' in navigator) {
                navigator.vibrate(200);
            }
        }
    }

    // Mostrar toast
    showToast(message, type = 'info') {
        if (window.questionSystem) {
            questionSystem.showToast(message, type);
        }
    }

    // Reiniciar jogo
    restartGame() {
        if (this.currentPuzzle) {
            this.cleanupGame();
            this.startGame(this.currentPuzzle);
        }
    }

    // Limpar jogo
    cleanupGame() {
        this.currentPuzzle = null;
        this.puzzlePieces = [];
        this.placedPieces.clear();
        this.draggingPiece = null;
        this.gameState = 'idle';
    }

    // Manipuladores de teclado para acessibilidade
    handleKeyDown(e) {
        if (this.draggingPiece) {
            switch (e.key) {
                case 'r':
                case 'R':
                    e.preventDefault();
                    this.rotatePiece();
                    break;
                case 'Escape':
                    e.preventDefault();
                    this.cancelDragging();
                    break;
            }
        }
    }

    // Cancelar arrasto
    cancelDragging() {
        if (this.draggingPiece) {
            this.returnPieceToArea(this.draggingPiece);
            this.finishDragging();
        }
    }

    // Fallback para mostrar jogo
    showGameFallback() {
        const container = document.getElementById('puzzle-container');
        if (!container) return;

        container.innerHTML = this.generateGameHTML();
        container.style.display = 'block';

        // Renderizar peças após o DOM estar pronto
        setTimeout(() => {
            this.renderPuzzlePieces();
        }, 100);
    }

    // Obter estatísticas do jogo
    getGameStats() {
        if (!this.currentPuzzle) return null;

        return {
            totalPieces: this.puzzlePieces.length,
            placedPieces: this.placedPieces.size,
            progress: Math.round((this.placedPieces.size / this.puzzlePieces.length) * 100),
            gameState: this.gameState
        };
    }
}

// Inicializar o sistema de puzzle
document.addEventListener('DOMContentLoaded', function() {
    window.puzzleSystem = new PuzzleSystem();
    console.log('Sistema de puzzle inicializado');

    // Integrar com o stationCore
    if (window.stationCore) {
        stationCore.puzzleSystem = puzzleSystem;
    }
});

// Exportar para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PuzzleSystem };
} else {
    window.PuzzleSystem = PuzzleSystem;
}