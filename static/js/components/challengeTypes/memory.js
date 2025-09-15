// Sistema de Jogo da Memória
// Gerencia desafios do tipo memory card matching

class MemorySystem {
    constructor() {
        this.currentGame = null;
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = new Set();
        this.gameState = 'idle'; // idle, flipping, matching, completed
        this.moveCount = 0;
        this.startTime = null;
        
        this.initializeGameElements();
        this.initializeEventListeners();
    }

    // Inicializar elementos do jogo
    initializeGameElements() {
        // Criar container para o jogo da memória
        if (!document.getElementById('memory-container')) {
            const container = document.createElement('div');
            container.id = 'memory-container';
            container.className = 'memory-container';
            container.style.display = 'none';
            document.body.appendChild(container);
        }
    }

    // Inicializar listeners de eventos
    initializeEventListeners() {
        // Eventos de teclado para acessibilidade
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    // Iniciar jogo da memória
    startGame(memoryData) {
        if (!memoryData || !memoryData.pairs || memoryData.pairs === 0) {
            console.error('Dados do jogo da memória inválidos');
            return false;
        }

        this.currentGame = memoryData;
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = new Set();
        this.gameState = 'idle';
        this.moveCount = 0;
        this.startTime = Date.now();

        // Gerar cartas baseado no tipo de jogo
        if (memoryData.cards && memoryData.cards.length > 0) {
            this.createCardsFromData(memoryData);
        } else {
            this.generateCards(memoryData.pairs, memoryData.theme);
        }

        // Embaralhar cartas
        this.shuffleCards();

        // Mostrar interface do jogo
        this.showGameInterface();

        console.log(`Jogo da memória iniciado: ${memoryData.pairs} pares`);
        return true;
    }

    // Criar cartas a partir de dados pré-definidos
    createCardsFromData(memoryData) {
        this.cards = memoryData.cards.map((card, index) => ({
            id: index,
            type: card.type || 'image',
            content: card.content,
            matchId: card.matchId || Math.floor(index / 2),
            isFlipped: false,
            isMatched: false,
            image: card.image,
            text: card.text,
            color: card.color
        }));
    }

    // Gerar cartas automaticamente
    generateCards(pairs, theme = 'default') {
        this.cards = [];
        
        // Diferentes temas de cartas
        const themes = {
            default: {
                types: ['color', 'number', 'shape'],
                colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7'],
                shapes: ['circle', 'square', 'triangle', 'star', 'heart']
            },
            animals: {
                types: ['image'],
                images: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼']
            },
            numbers: {
                types: ['number'],
                numbers: [1, 2, 3, 4, 5, 6, 7, 8]
            }
        };

        const selectedTheme = themes[theme] || themes.default;

        for (let i = 0; i < pairs; i++) {
            const cardType = selectedTheme.types[Math.floor(Math.random() * selectedTheme.types.length)];
            let cardContent = '';

            switch (cardType) {
                case 'color':
                    cardContent = selectedTheme.colors[i % selectedTheme.colors.length];
                    break;
                case 'image':
                    cardContent = selectedTheme.images[i % selectedTheme.images.length];
                    break;
                case 'number':
                    cardContent = selectedTheme.numbers ? selectedTheme.numbers[i % selectedTheme.numbers.length] : i + 1;
                    break;
                case 'shape':
                    cardContent = selectedTheme.shapes[i % selectedTheme.shapes.length];
                    break;
            }

            // Criar par de cartas
            this.cards.push(
                {
                    id: i * 2,
                    type: cardType,
                    content: cardContent,
                    matchId: i,
                    isFlipped: false,
                    isMatched: false
                },
                {
                    id: i * 2 + 1,
                    type: cardType,
                    content: cardContent,
                    matchId: i,
                    isFlipped: false,
                    isMatched: false
                }
            );
        }
    }

    // Embaralhar cartas
    shuffleCards() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    // Mostrar interface do jogo
    showGameInterface() {
        if (window.modalSystem) {
            const gameHtml = this.generateGameHTML();
            
            modalSystem.show('memoryModal', {
                data: {
                    title: 'Jogo da Memória',
                    content: gameHtml,
                    pairs: this.cards.length / 2
                },
                onHide: () => this.cleanupGame()
            });
        } else {
            this.showGameFallback();
        }

        // Renderizar cartas após o modal estar visível
        setTimeout(() => {
            this.renderCards();
        }, 100);
    }

    // Gerar HTML do jogo
    generateGameHTML() {
        return `
            <div class="memory-game">
                <div class="memory-header">
                    <h5>Encontre os Pares</h5>
                    <div class="memory-stats">
                        <span class="moves">Movimentos: <span id="move-count">0</span></span>
                        <span class="timer">Tempo: <span id="memory-timer">00:00</span></span>
                        <span class="pairs">Pares: <span id="pairs-found">0</span>/<span>${this.cards.length / 2}</span></span>
                    </div>
                </div>
                
                <div class="memory-grid" id="memory-grid">
                    <!-- Cartas serão renderizadas aqui -->
                </div>

                <div class="memory-controls">
                    <button class="btn btn-sm btn-outline-secondary" onclick="memorySystem.showHint()">
                        <i class="bi bi-lightbulb"></i> Dica
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" onclick="memorySystem.autoComplete()">
                        <i class="bi bi-stars"></i> Auto-completar
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="memorySystem.restartGame()">
                        <i class="bi bi-arrow-clockwise"></i> Reiniciar
                    </button>
                </div>

                <div class="memory-instructions">
                    <small>💡 Clique nas cartas para encontrar os pares correspondentes.</small>
                </div>
            </div>
        `;
    }

    // Renderizar cartas
    renderCards() {
        const grid = document.getElementById('memory-grid');
        if (!grid) return;

        grid.innerHTML = '';
        
        // Calcular layout baseado no número de cartas
        const pairs = this.cards.length / 2;
        const columns = pairs <= 8 ? 4 : 6;
        grid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;

        this.cards.forEach(card => {
            const cardElement = this.createCardElement(card);
            grid.appendChild(cardElement);
        });

        // Iniciar temporizador
        this.startGameTimer();
    }

    // Criar elemento de carta
    createCardElement(card) {
        const cardElement = document.createElement('div');
        cardElement.className = 'memory-card';
        cardElement.dataset.cardId = card.id;
        cardElement.dataset.matchId = card.matchId;
        
        if (card.isMatched) {
            cardElement.classList.add('matched');
        }

        // Conteúdo da carta (verso)
        const backContent = this.createCardContent(card);
        
        cardElement.innerHTML = `
            <div class="card-inner">
                <div class="card-front">
                    <div class="card-content">?</div>
                </div>
                <div class="card-back">
                    <div class="card-content">${backContent}</div>
                </div>
            </div>
        `;

        // Eventos
        if (!card.isMatched) {
            cardElement.addEventListener('click', () => this.handleCardClick(card));
            cardElement.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.handleCardClick(card);
            });
        }

        return cardElement;
    }

    // Criar conteúdo da carta baseado no tipo
    createCardContent(card) {
        switch (card.type) {
            case 'color':
                return `<div class="color-swatch" style="background: ${card.content}"></div>`;
            case 'image':
                return `<div class="card-image">${card.content}</div>`;
            case 'number':
                return `<div class="card-number">${card.content}</div>`;
            case 'shape':
                return `<div class="card-shape ${card.content}"></div>`;
            default:
                return card.content;
        }
    }

    // Manipular clique na carta
    handleCardClick(card) {
        if (this.gameState !== 'idle' || card.isFlipped || card.isMatched) {
            return;
        }

        // Virar carta
        this.flipCard(card);

        // Adicionar à lista de cartas viradas
        this.flippedCards.push(card);

        // Verificar se temos duas cartas viradas
        if (this.flippedCards.length === 2) {
            this.checkForMatch();
        }
    }

    // Virar carta
    flipCard(card) {
        card.isFlipped = true;
        this.gameState = 'flipping';

        const cardElement = document.querySelector(`[data-card-id="${card.id}"]`);
        if (cardElement) {
            cardElement.classList.add('flipped');
            
            // Animação de flip
            cardElement.style.transform = 'rotateY(180deg)';
        }
    }

    // Verificar se há combinação
    checkForMatch() {
        this.gameState = 'matching';
        this.moveCount++;

        const [card1, card2] = this.flippedCards;

        if (card1.matchId === card2.matchId) {
            // Combinação correta
            this.handleMatch(card1, card2);
        } else {
            // Combinação incorreta
            this.handleMismatch(card1, card2);
        }

        // Atualizar estatísticas
        this.updateStats();
    }

    // Manipular combinação correta
    handleMatch(card1, card2) {
        card1.isMatched = true;
        card2.isMatched = true;

        this.matchedPairs.add(card1.matchId);

        // Feedback visual
        this.showMatchFeedback(true);

        // Verificar se completou o jogo
        if (this.matchedPairs.size === this.cards.length / 2) {
            setTimeout(() => {
                this.completeGame();
            }, 1000);
        } else {
            setTimeout(() => {
                this.gameState = 'idle';
                this.flippedCards = [];
            }, 500);
        }
    }

    // Manipular combinação incorreta
    handleMismatch(card1, card2) {
        // Feedback visual
        this.showMatchFeedback(false);

        // Virar cartas de volta após delay
        setTimeout(() => {
            this.unflipCards(card1, card2);
            this.gameState = 'idle';
            this.flippedCards = [];
        }, 1000);
    }

    // Desvirar cartas
    unflipCards(card1, card2) {
        card1.isFlipped = false;
        card2.isFlipped = false;

        const card1Element = document.querySelector(`[data-card-id="${card1.id}"]`);
        const card2Element = document.querySelector(`[data-card-id="${card2.id}"]`);

        if (card1Element && card2Element) {
            card1Element.classList.remove('flipped');
            card2Element.classList.remove('flipped');
            card1Element.style.transform = 'rotateY(0deg)';
            card2Element.style.transform = 'rotateY(0deg)';
        }
    }

    // Mostrar feedback de combinação
    showMatchFeedback(isMatch) {
        if (isMatch) {
            this.showToast('🎯 Par encontrado!', 'success');
            
            // Animar cartas combinadas
            this.flippedCards.forEach(card => {
                const cardElement = document.querySelector(`[data-card-id="${card.id}"]`);
                if (cardElement) {
                    cardElement.classList.add('matched');
                    cardElement.style.transform = 'scale(1.1)';
                    setTimeout(() => {
                        cardElement.style.transform = 'scale(1)';
                    }, 300);
                }
            });
        } else {
            this.showToast('❌ Não é um par. Tente novamente.', 'error');
            
            // Efeito de vibração
            if ('vibrate' in navigator) {
                navigator.vibrate(200);
            }
        }
    }

    // Mostrar dica
    showHint() {
        // Encontrar pares não encontrados
        const unmatchedCards = this.cards.filter(card => !card.isMatched);
        if (unmatchedCards.length < 2) return;

        // Encontrar um par para dar dica
        const unmatchedPairs = new Map();
        let hintPair = null;

        unmatchedCards.forEach(card => {
            if (!unmatchedPairs.has(card.matchId)) {
                unmatchedPairs.set(card.matchId, [card]);
            } else {
                unmatchedPairs.get(card.matchId).push(card);
                hintPair = unmatchedPairs.get(card.matchId);
            }
        });

        if (hintPair && hintPair.length === 2) {
            // Piscar as cartas da dica
            hintPair.forEach(card => {
                const cardElement = document.querySelector(`[data-card-id="${card.id}"]`);
                if (cardElement) {
                    cardElement.classList.add('hint');
                    setTimeout(() => {
                        cardElement.classList.remove('hint');
                    }, 2000);
                }
            });

            this.showToast('💡 Dica: Este par está destacado!', 'info');
        }
    }

    // Auto-completar jogo
    autoComplete() {
        if (this.gameState !== 'idle') return;

        this.cards.forEach(card => {
            if (!card.isMatched) {
                card.isMatched = true;
                card.isFlipped = true;

                const cardElement = document.querySelector(`[data-card-id="${card.id}"]`);
                if (cardElement) {
                    cardElement.classList.add('matched', 'flipped');
                    cardElement.style.transform = 'rotateY(180deg)';
                }
            }
        });

        this.matchedPairs = new Set(Array.from({ length: this.cards.length / 2 }, (_, i) => i));
        this.updateStats();
        this.completeGame();
    }

    // Iniciar temporizador do jogo
    startGameTimer() {
        this.updateTimer(); // Atualização inicial
        
        this.timerInterval = setInterval(() => {
            this.updateTimer();
        }, 1000);
    }

    // Atualizar temporizador
    updateTimer() {
        if (!this.startTime) return;

        const elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(elapsedSeconds / 60);
        const seconds = elapsedSeconds % 60;

        const timerElement = document.getElementById('memory-timer');
        if (timerElement) {
            timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    // Atualizar estatísticas
    updateStats() {
        const moveElement = document.getElementById('move-count');
        const pairsElement = document.getElementById('pairs-found');

        if (moveElement) {
            moveElement.textContent = this.moveCount;
        }

        if (pairsElement) {
            pairsElement.textContent = this.matchedPairs.size;
        }
    }

    // Completar jogo
    completeGame() {
        this.gameState = 'completed';
        clearInterval(this.timerInterval);

        // Calcular pontuação
        const elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
        const score = this.calculateScore(elapsedSeconds, this.moveCount);

        // Mostrar mensagem de conclusão
        this.showCompletionMessage(score, elapsedSeconds, this.moveCount);

        // Atualizar progresso
        if (window.progressManager) {
            progressManager.completeChallenge(this.currentGame.id, score);
        }

        console.log('Jogo da memória completado!');
    }

    // Calcular pontuação
    calculateScore(time, moves) {
        const baseScore = 100;
        const timeBonus = Math.max(0, 300 - time) * 0.5; // Bônus por tempo
        const movesBonus = Math.max(0, 50 - moves) * 2; // Bônus por movimentos
        
        return Math.min(100, baseScore + timeBonus + movesBonus);
    }

    // Mostrar mensagem de conclusão
    showCompletionMessage(score, time, moves) {
        if (window.modalSystem) {
            const timeFormatted = `${Math.floor(time / 60)}:${(time % 60).toString().padStart(2, '0')}`;
            
            modalSystem.show('resultModal', {
                data: {
                    title: 'Parabéns!',
                    content: `
                        <div class="text-center">
                            <i class="bi bi-award-fill display-4 text-warning"></i>
                            <h4>Jogo da Memória Completado!</h4>
                            <div class="memory-results">
                                <p>Tempo: ${timeFormatted}</p>
                                <p>Movimentos: ${moves}</p>
                                <p>Pontuação: ${Math.round(score)}/100</p>
                                <p class="score-grade">${this.getScoreGrade(score)}</p>
                            </div>
                        </div>
                    `
                },
                onConfirm: () => this.cleanupGame()
            });
        }
    }

    // Obter classificação da pontuação
    getScoreGrade(score) {
        if (score >= 90) return '⭐ Desempenho Excelente!';
        if (score >= 70) return '👍 Bom trabalho!';
        if (score >= 50) return '😊 Você conseguiu!';
        return '💪 Continue praticando!';
    }

    // Mostrar toast
    showToast(message, type = 'info') {
        if (window.questionSystem) {
            questionSystem.showToast(message, type);
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
        clearInterval(this.timerInterval);
        this.currentGame = null;
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = new Set();
        this.gameState = 'idle';
        this.moveCount = 0;
        this.startTime = null;
    }

    // Manipuladores de teclado para acessibilidade
    handleKeyDown(e) {
        if (this.gameState === 'idle' && e.key === ' ') {
            // Espaço para virar carta (acessibilidade)
            const unmatchedCards = this.cards.filter(card => !card.isMatched && !card.isFlipped);
            if (unmatchedCards.length > 0) {
                this.handleCardClick(unmatchedCards[0]);
            }
        }
    }

    // Fallback para mostrar jogo
    showGameFallback() {
        const container = document.getElementById('memory-container');
        if (!container) return;

        container.innerHTML = this.generateGameHTML();
        container.style.display = 'block';

        // Renderizar cartas após o DOM estar pronto
        setTimeout(() => {
            this.renderCards();
        }, 100);
    }

    // Obter estatísticas do jogo
    getGameStats() {
        if (!this.currentGame) return null;

        const elapsedSeconds = this.startTime ? Math.floor((Date.now() - this.startTime) / 1000) : 0;

        return {
            totalPairs: this.cards.length / 2,
            matchedPairs: this.matchedPairs.size,
            moveCount: this.moveCount,
            timeElapsed: elapsedSeconds,
            gameState: this.gameState,
            progress: Math.round((this.matchedPairs.size / (this.cards.length / 2)) * 100)
        };
    }
}

// Inicializar o sistema de memória
document.addEventListener('DOMContentLoaded', function() {
    window.memorySystem = new MemorySystem();
    console.log('Sistema de jogo da memória inicializado');

    // Integrar com o stationCore
    if (window.stationCore) {
        stationCore.memorySystem = memorySystem;
    }
});

// Exportar para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MemorySystem };
} else {
    window.MemorySystem = MemorySystem;
}