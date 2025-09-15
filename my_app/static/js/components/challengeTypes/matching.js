// Sistema de Correspondência de Pares (Matching)
// Gerencia desafios do tipo matching com arrastar e soltar

class MatchingSystem {
    constructor() {
        this.currentGame = null;
        this.items = [];
        this.targets = [];
        this.matchedPairs = new Map();
        this.draggingItem = null;
        this.dragOffset = { x: 0, y: 0 };
        this.gameState = 'idle'; // idle, dragging, completed
        
        this.initializeGameElements();
        this.initializeEventListeners();
    }

    // Inicializar elementos do jogo
    initializeGameElements() {
        // Criar container para o jogo de correspondência
        if (!document.getElementById('matching-container')) {
            const container = document.createElement('div');
            container.id = 'matching-container';
            container.className = 'matching-container';
            container.style.display = 'none';
            document.body.appendChild(container);
        }
    }

    // Inicializar listeners de eventos
    initializeEventListeners() {
        // Eventos de mouse
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', () => this.handleMouseUp());

        // Eventos touch
        document.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        document.addEventListener('touchend', () => this.handleTouchEnd());

        // Eventos de teclado para acessibilidade
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    // Iniciar jogo de correspondência
    startGame(matchingData) {
        if (!matchingData || !matchingData.pairs || matchingData.pairs.length === 0) {
            console.error('Dados do jogo de correspondência inválidos');
            return false;
        }

        this.currentGame = matchingData;
        this.items = [];
        this.targets = [];
        this.matchedPairs = new Map();
        this.draggingItem = null;
        this.gameState = 'idle';

        // Preparar itens e alvos
        this.prepareGameItems(matchingData.pairs);

        // Mostrar interface do jogo
        this.showGameInterface();

        console.log(`Jogo de correspondência iniciado: ${matchingData.pairs.length} pares`);
        return true;
    }

    // Preparar itens do jogo
    prepareGameItems(pairs) {
        pairs.forEach((pair, index) => {
            // Item arrastável
            this.items.push({
                id: `item-${index}`,
                type: pair.itemType || 'text',
                content: pair.itemContent,
                correctTarget: `target-${index}`,
                position: { x: 50 + index * 20, y: 100 },
                isMatched: false,
                draggable: true
            });

            // Alvo
            this.targets.push({
                id: `target-${index}`,
                type: pair.targetType || 'text',
                content: pair.targetContent,
                expectedItem: `item-${index}`,
                position: { x: 150 + index * 100, y: 300 },
                accepts: pair.accepts || [pair.itemContent]
            });
        });

        // Embaralhar itens
        this.shuffleItems();
    }

    // Embaralhar itens
    shuffleItems() {
        for (let i = this.items.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.items[i], this.items[j]] = [this.items[j], this.items[i]];
        }
    }

    // Mostrar interface do jogo
    showGameInterface() {
        if (window.modalSystem) {
            const gameHtml = this.generateGameHTML();
            
            modalSystem.show('matchingModal', {
                data: {
                    title: 'Correspondência de Pares',
                    content: gameHtml,
                    pairs: this.items.length
                },
                onHide: () => this.cleanupGame()
            });
        } else {
            this.showGameFallback();
        }

        // Renderizar itens após o modal estar visível
        setTimeout(() => {
            this.renderGameItems();
        }, 100);
    }

    // Gerar HTML do jogo
    generateGameHTML() {
        return `
            <div class="matching-game">
                <div class="matching-header">
                    <h5>Conecte os Pares Corretos</h5>
                    <div class="matching-progress">
                        <span id="pairs-matched">0</span>/<span>${this.items.length}</span>
                    </div>
                </div>
                
                <div class="matching-areas">
                    <div class="items-area" id="items-area">
                        <h6>Itens:</h6>
                        <div class="items-container" id="items-container"></div>
                    </div>
                    
                    <div class="targets-area" id="targets-area">
                        <h6>Correspondências:</h6>
                        <div class="targets-container" id="targets-container"></div>
                    </div>
                </div>

                <div class="matching-controls">
                    <button class="btn btn-sm btn-outline-secondary" onclick="matchingSystem.showHint()">
                        <i class="bi bi-lightbulb"></i> Dica
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" onclick="matchingSystem.checkAnswers()">
                        <i class="bi bi-check-circle"></i> Verificar
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="matchingSystem.restartGame()">
                        <i class="bi bi-arrow-clockwise"></i> Reiniciar
                    </button>
                </div>

                <div class="matching-instructions">
                    <small>💡 Arraste os itens da esquerda para as correspondências corretas da direita.</small>
                </div>
            </div>
        `;
    }

    // Renderizar itens do jogo
    renderGameItems() {
        const itemsContainer = document.getElementById('items-container');
        const targetsContainer = document.getElementById('targets-container');

        if (!itemsContainer || !targetsContainer) return;

        // Limpar containers
        itemsContainer.innerHTML = '';
        targetsContainer.innerHTML = '';

        // Renderizar itens arrastáveis
        this.items.forEach(item => {
            if (!item.isMatched) {
                const itemElement = this.createItemElement(item);
                itemsContainer.appendChild(itemElement);
            }
        });

        // Renderizar alvos
        this.targets.forEach(target => {
            const targetElement = this.createTargetElement(target);
            targetsContainer.appendChild(targetElement);
        });
    }

    // Criar elemento de item arrastável
    createItemElement(item) {
        const itemElement = document.createElement('div');
        itemElement.className = 'matching-item';
        itemElement.dataset.itemId = item.id;
        itemElement.dataset.correctTarget = item.correctTarget;
        
        if (item.isMatched) {
            itemElement.classList.add('matched');
        }

        // Conteúdo do item
        itemElement.innerHTML = this.createContentHTML(item);

        // Estilo de posição
        if (item.position) {
            itemElement.style.left = item.position.x + 'px';
            itemElement.style.top = item.position.y + 'px';
        }

        // Eventos de drag
        if (item.draggable && !item.isMatched) {
            itemElement.addEventListener('mousedown', (e) => this.handleItemMouseDown(e, item));
            itemElement.addEventListener('touchstart', (e) => this.handleItemTouchStart(e, item));
            itemElement.style.cursor = 'grab';
        }

        return itemElement;
    }

    // Criar elemento de alvo
    createTargetElement(target) {
        const targetElement = document.createElement('div');
        targetElement.className = 'matching-target';
        targetElement.dataset.targetId = target.id;
        targetElement.dataset.expectedItem = target.expectedItem;

        // Verificar se já tem um item correspondente
        const hasMatch = Array.from(this.matchedPairs.values()).includes(target.id);
        if (hasMatch) {
            targetElement.classList.add('occupied');
        }

        // Conteúdo do alvo
        targetElement.innerHTML = this.createContentHTML(target);

        // Estilo de posição
        if (target.position) {
            targetElement.style.left = target.position.x + 'px';
            targetElement.style.top = target.position.y + 'px';
        }

        // Eventos de drop
        targetElement.addEventListener('mouseup', () => this.handleTargetDrop(target));
        targetElement.addEventListener('touchend', () => this.handleTargetDrop(target));

        return targetElement;
    }

    // Criar HTML de conteúdo baseado no tipo
    createContentHTML(element) {
        switch (element.type) {
            case 'text':
                return `<div class="matching-text">${element.content}</div>`;
            case 'image':
                return `<img src="${element.content}" alt="Item" class="matching-image">`;
            case 'icon':
                return `<i class="${element.content} matching-icon"></i>`;
            case 'color':
                return `<div class="matching-color" style="background: ${element.content}"></div>`;
            default:
                return `<div class="matching-text">${element.content}</div>`;
        }
    }

    // Manipular início do arrasto
    handleItemMouseDown(e, item) {
        e.preventDefault();
        this.startDragging(e.clientX, e.clientY, item);
    }

    handleItemTouchStart(e, item) {
        if (e.touches.length === 1) {
            e.preventDefault();
            this.startDragging(e.touches[0].clientX, e.touches[0].clientY, item);
        }
    }

    // Iniciar arrasto
    startDragging(clientX, clientY, item) {
        this.draggingItem = item;
        this.gameState = 'dragging';

        const itemElement = document.querySelector(`[data-item-id="${item.id}"]`);
        if (itemElement) {
            const rect = itemElement.getBoundingClientRect();
            this.dragOffset = {
                x: clientX - rect.left,
                y: clientY - rect.top
            };

            itemElement.classList.add('dragging');
            itemElement.style.zIndex = '1000';
            itemElement.style.cursor = 'grabbing';
        }
    }

    // Manipular movimento do mouse
    handleMouseMove(e) {
        if (this.gameState === 'dragging' && this.draggingItem) {
            this.updateDraggingPosition(e.clientX, e.clientY);
        }
    }

    // Manipular movimento do touch
    handleTouchMove(e) {
        if (this.gameState === 'dragging' && this.draggingItem && e.touches.length === 1) {
            e.preventDefault();
            this.updateDraggingPosition(e.touches[0].clientX, e.touches[0].clientY);
        }
    }

    // Atualizar posição do arrasto
    updateDraggingPosition(clientX, clientY) {
        const itemElement = document.querySelector(`[data-item-id="${this.draggingItem.id}"]`);
        if (itemElement) {
            const x = clientX - this.dragOffset.x;
            const y = clientY - this.dragOffset.y;

            itemElement.style.left = x + 'px';
            itemElement.style.top = y + 'px';
        }
    }

    // Manipular soltura do item
    handleMouseUp() {
        this.finishDragging();
    }

    handleTouchEnd() {
        this.finishDragging();
    }

    // Finalizar arrasto
    finishDragging() {
        if (this.gameState === 'dragging' && this.draggingItem) {
            const itemElement = document.querySelector(`[data-item-id="${this.draggingItem.id}"]`);
            if (itemElement) {
                itemElement.classList.remove('dragging');
                itemElement.style.zIndex = '';
                itemElement.style.cursor = 'grab';
            }

            this.gameState = 'idle';
            this.draggingItem = null;
        }
    }

    // Manipular soltura no alvo
    handleTargetDrop(target) {
        if (this.gameState === 'dragging' && this.draggingItem) {
            const isCorrect = this.checkMatch(this.draggingItem, target);

            if (isCorrect) {
                this.completeMatch(this.draggingItem, target);
            } else {
                this.handleMismatch(this.draggingItem, target);
            }

            this.finishDragging();
        }
    }

    // Verificar se a correspondência está correta
    checkMatch(item, target) {
        return item.correctTarget === target.id;
    }

    // Completar correspondência correta
    completeMatch(item, target) {
        item.isMatched = true;
        this.matchedPairs.set(item.id, target.id);

        // Mover item para o alvo
        const itemElement = document.querySelector(`[data-item-id="${item.id}"]`);
        const targetElement = document.querySelector(`[data-target-id="${target.id}"]`);

        if (itemElement && targetElement) {
            const targetRect = targetElement.getBoundingClientRect();
            const containerRect = targetElement.parentElement.getBoundingClientRect();

            itemElement.style.position = 'absolute';
            itemElement.style.left = (targetRect.left - containerRect.left) + 'px';
            itemElement.style.top = (targetRect.top - containerRect.top) + 'px';
            itemElement.classList.add('matched');
            itemElement.style.cursor = 'default';

            targetElement.classList.add('occupied', 'correct');

            // Feedback visual
            this.showMatchFeedback(true, item, target);

            // Verificar se completou o jogo
            if (this.matchedPairs.size === this.items.length) {
                setTimeout(() => {
                    this.completeGame();
                }, 1000);
            }
        }
    }

    // Manipular correspondência incorreta
    handleMismatch(item, target) {
        const targetElement = document.querySelector(`[data-target-id="${target.id}"]`);
        if (targetElement) {
            targetElement.classList.add('incorrect');
            setTimeout(() => {
                targetElement.classList.remove('incorrect');
            }, 1000);
        }

        // Feedback visual
        this.showMatchFeedback(false, item, target);

        // Retornar item à posição original
        this.returnItemToOriginalPosition(item);
    }

    // Retornar item à posição original
    returnItemToOriginalPosition(item) {
        const itemElement = document.querySelector(`[data-item-id="${item.id}"]`);
        if (itemElement && item.position) {
            itemElement.style.left = item.position.x + 'px';
            itemElement.style.top = item.position.y + 'px';
        }
    }

    // Mostrar feedback de correspondência
    showMatchFeedback(isCorrect, item, target) {
        if (isCorrect) {
            this.showToast('✅ Correspondência correta!', 'success');
            
            // Animação de sucesso
            const itemElement = document.querySelector(`[data-item-id="${item.id}"]`);
            const targetElement = document.querySelector(`[data-target-id="${target.id}"]`);

            if (itemElement && targetElement) {
                itemElement.classList.add('celebrating');
                targetElement.classList.add('celebrating');
                
                setTimeout(() => {
                    itemElement.classList.remove('celebrating');
                    targetElement.classList.remove('celebrating');
                }, 1000);
            }
        } else {
            this.showToast('❌ Correspondência incorreta. Tente novamente.', 'error');
            
            // Efeito de vibração
            if ('vibrate' in navigator) {
                navigator.vibrate(200);
            }
        }
    }

    // Verificar todas as respostas
    checkAnswers() {
        let allCorrect = true;
        const incorrectMatches = [];

        // Verificar todas as correspondências
        this.matchedPairs.forEach((targetId, itemId) => {
            const item = this.items.find(i => i.id === itemId);
            const target = this.targets.find(t => t.id === targetId);

            if (item && target && item.correctTarget !== target.id) {
                allCorrect = false;
                incorrectMatches.push({ item, target });
            }
        });

        if (allCorrect && this.matchedPairs.size === this.items.length) {
            this.completeGame();
        } else if (incorrectMatches.length > 0) {
            this.showIncorrectMatches(incorrectMatches);
        } else {
            this.showToast('🔍 Verifique todas as correspondências.', 'info');
        }
    }

    // Mostrar correspondências incorretas
    showIncorrectMatches(incorrectMatches) {
        incorrectMatches.forEach(match => {
            const itemElement = document.querySelector(`[data-item-id="${match.item.id}"]`);
            const targetElement = document.querySelector(`[data-target-id="${match.target.id}"]`);

            if (itemElement && targetElement) {
                itemElement.classList.add('incorrect');
                targetElement.classList.add('incorrect');

                setTimeout(() => {
                    itemElement.classList.remove('incorrect');
                    targetElement.classList.remove('incorrect');
                }, 3000);
            }
        });

        this.showToast(`❌ ${incorrectMatches.length} correspondência(s) incorreta(s).`, 'error');
    }

    // Mostrar dica
    showHint() {
        // Encontrar item não correspondido
        const unmatchedItems = this.items.filter(item => !item.isMatched);
        if (unmatchedItems.length === 0) return;

        const randomItem = unmatchedItems[Math.floor(Math.random() * unmatchedItems.length)];
        const correctTarget = this.targets.find(target => target.id === randomItem.correctTarget);

        if (correctTarget) {
            // Destacar item e alvo correto
            const itemElement = document.querySelector(`[data-item-id="${randomItem.id}"]`);
            const targetElement = document.querySelector(`[data-target-id="${correctTarget.id}"]`);

            if (itemElement && targetElement) {
                itemElement.classList.add('hint');
                targetElement.classList.add('hint');

                setTimeout(() => {
                    itemElement.classList.remove('hint');
                    targetElement.classList.remove('hint');
                }, 3000);
            }

            this.showToast('💡 Dica: Este par está destacado!', 'info');
        }
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

        console.log('Jogo de correspondência completado!');
    }

    // Mostrar mensagem de conclusão
    showCompletionMessage() {
        if (window.modalSystem) {
            modalSystem.show('resultModal', {
                data: {
                    title: 'Parabéns!',
                    content: `
                        <div class="text-center">
                            <i class="bi bi-patch-check-fill display-4 text-success"></i>
                            <h4>Correspondências Completas!</h4>
                            <p>Você conectou todos os ${this.matchedPairs.size} pares corretamente!</p>
                        </div>
                    `
                },
                onConfirm: () => this.cleanupGame()
            });
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
        if (this.currentGame) {
            this.cleanupGame();
            this.startGame(this.currentGame);
        }
    }

    // Limpar jogo
    cleanupGame() {
        this.currentGame = null;
        this.items = [];
        this.targets = [];
        this.matchedPairs = new Map();
        this.draggingItem = null;
        this.gameState = 'idle';
    }

    // Manipuladores de teclado para acessibilidade
    handleKeyDown(e) {
        if (e.key === 'Escape' && this.gameState === 'dragging') {
            this.cancelDragging();
        }
    }

    // Cancelar arrasto
    cancelDragging() {
        if (this.draggingItem) {
            this.returnItemToOriginalPosition(this.draggingItem);
            this.finishDragging();
        }
    }

    // Fallback para mostrar jogo
    showGameFallback() {
        const container = document.getElementById('matching-container');
        if (!container) return;

        container.innerHTML = this.generateGameHTML();
        container.style.display = 'block';

        // Renderizar itens após o DOM estar pronto
        setTimeout(() => {
            this.renderGameItems();
        }, 100);
    }

    // Obter estatísticas do jogo
    getGameStats() {
        if (!this.currentGame) return null;

        return {
            totalPairs: this.items.length,
            matchedPairs: this.matchedPairs.size,
            gameState: this.gameState,
            progress: Math.round((this.matchedPairs.size / this.items.length) * 100)
        };
    }
}

// Inicializar o sistema de correspondência
document.addEventListener('DOMContentLoaded', function() {
    window.matchingSystem = new MatchingSystem();
    console.log('Sistema de correspondência inicializado');

    // Integrar com o stationCore
    if (window.stationCore) {
        stationCore.matchingSystem = matchingSystem;
    }
});

// Exportar para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MatchingSystem };
} else {
    window.MatchingSystem = MatchingSystem;
}