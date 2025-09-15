// Sistema de Ordenação de Sequências
// Gerencia desafios do tipo ordering com arrastar e soltar

class OrderingSystem {
    constructor() {
        this.currentGame = null;
        this.items = [];
        this.sequence = [];
        this.userSequence = [];
        this.draggingItem = null;
        this.dragOffset = { x: 0, y: 0 };
        this.gameState = 'idle'; // idle, dragging, checking, completed
        
        this.initializeGameElements();
        this.initializeEventListeners();
    }

    // Inicializar elementos do jogo
    initializeGameElements() {
        // Criar container para o jogo de ordenação
        if (!document.getElementById('ordering-container')) {
            const container = document.createElement('div');
            container.id = 'ordering-container';
            container.className = 'ordering-container';
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

    // Iniciar jogo de ordenação
    startGame(orderingData) {
        if (!orderingData || !orderingData.items || orderingData.items.length === 0) {
            console.error('Dados do jogo de ordenação inválidos');
            return false;
        }

        this.currentGame = orderingData;
        this.items = [];
        this.sequence = [];
        this.userSequence = [];
        this.draggingItem = null;
        this.gameState = 'idle';

        // Preparar itens e sequência
        this.prepareGameItems(orderingData.items, orderingData.sequenceType);

        // Embaralhar itens
        this.shuffleItems();

        // Mostrar interface do jogo
        this.showGameInterface();

        console.log(`Jogo de ordenação iniciado: ${orderingData.items.length} itens`);
        return true;
    }

    // Preparar itens do jogo
    prepareGameItems(items, sequenceType = 'numeric') {
        this.items = items.map((item, index) => ({
            id: `item-${index}`,
            type: item.type || 'text',
            content: item.content,
            correctPosition: index,
            currentPosition: index,
            value: item.value || index + 1,
            draggable: true,
            metadata: item.metadata || {}
        }));

        // Criar sequência correta baseada no tipo
        this.sequence = this.createCorrectSequence(sequenceType);
    }

    // Criar sequência correta
    createCorrectSequence(sequenceType) {
        switch (sequenceType) {
            case 'numeric':
                return [...this.items].sort((a, b) => a.value - b.value);
            case 'alphabetical':
                return [...this.items].sort((a, b) => a.content.localeCompare(b.content));
            case 'chronological':
                return [...this.items].sort((a, b) => {
                    const dateA = new Date(a.metadata.date || 0);
                    const dateB = new Date(b.metadata.date || 0);
                    return dateA - dateB;
                });
            case 'custom':
                return [...this.items].sort((a, b) => a.correctPosition - b.correctPosition);
            default:
                return [...this.items];
        }
    }

    // Embaralhar itens
    shuffleItems() {
        for (let i = this.items.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.items[i], this.items[j]] = [this.items[j], this.items[i]];
            this.items[i].currentPosition = i;
            this.items[j].currentPosition = j;
        }
    }

    // Mostrar interface do jogo
    showGameInterface() {
        if (window.modalSystem) {
            const gameHtml = this.generateGameHTML();
            
            modalSystem.show('orderingModal', {
                data: {
                    title: 'Ordenação de Sequência',
                    content: gameHtml,
                    itemsCount: this.items.length,
                    sequenceType: this.currentGame.sequenceType
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
        const sequenceTypeNames = {
            'numeric': 'Numérica',
            'alphabetical': 'Alfabética',
            'chronological': 'Cronológica',
            'custom': 'Personalizada'
        };

        return `
            <div class="ordering-game">
                <div class="ordering-header">
                    <h5>Ordene a Sequência</h5>
                    <div class="ordering-info">
                        <span class="sequence-type">Tipo: ${sequenceTypeNames[this.currentGame.sequenceType] || 'Personalizada'}</span>
                        <span class="items-count">Itens: ${this.items.length}</span>
                    </div>
                </div>
                
                <div class="ordering-instructions">
                    <p>${this.getInstructionsText()}</p>
                </div>

                <div class="ordering-areas">
                    <div class="items-area" id="items-area">
                        <h6>Itens para ordenar:</h6>
                        <div class="items-container" id="items-container"></div>
                    </div>
                    
                    <div class="sequence-area" id="sequence-area">
                        <h6>Sequência:</h6>
                        <div class="sequence-slots" id="sequence-slots"></div>
                    </div>
                </div>

                <div class="ordering-controls">
                    <button class="btn btn-sm btn-outline-secondary" onclick="orderingSystem.showHint()">
                        <i class="bi bi-lightbulb"></i> Dica
                    </button>
                    <button class="btn btn-sm btn-outline-primary" onclick="orderingSystem.checkSequence()">
                        <i class="bi bi-check-circle"></i> Verificar
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="orderingSystem.restartGame()">
                        <i class="bi bi-arrow-clockwise"></i> Reiniciar
                    </button>
                </div>

                <div class="ordering-progress">
                    <div class="progress">
                        <div class="progress-bar" id="ordering-progress" role="progressbar" style="width: 0%"></div>
                    </div>
                </div>
            </div>
        `;
    }

    // Obter texto de instruções
    getInstructionsText() {
        switch (this.currentGame.sequenceType) {
            case 'numeric':
                return 'Ordene os itens em sequência numérica crescente.';
            case 'alphabetical':
                return 'Ordene os itens em ordem alfabética.';
            case 'chronological':
                return 'Ordene os itens em ordem cronológica.';
            case 'custom':
                return this.currentGame.instructions || 'Ordene os itens na sequência correta.';
            default:
                return 'Arraste os itens para ordená-los na sequência correta.';
        }
    }

    // Renderizar itens do jogo
    renderGameItems() {
        const itemsContainer = document.getElementById('items-container');
        const sequenceSlots = document.getElementById('sequence-slots');

        if (!itemsContainer || !sequenceSlots) return;

        // Limpar containers
        itemsContainer.innerHTML = '';
        sequenceSlots.innerHTML = '';

        // Renderizar slots de sequência
        this.renderSequenceSlots(sequenceSlots);

        // Renderizar itens
        this.items.forEach(item => {
            const itemElement = this.createItemElement(item);
            itemsContainer.appendChild(itemElement);
        });

        // Atualizar progresso
        this.updateProgress();
    }

    // Renderizar slots de sequência
    renderSequenceSlots(container) {
        for (let i = 0; i < this.items.length; i++) {
            const slotElement = document.createElement('div');
            slotElement.className = 'sequence-slot';
            slotElement.dataset.slotIndex = i;
            slotElement.innerHTML = `
                <span class="slot-number">${i + 1}</span>
                <div class="slot-content"></div>
            `;

            // Eventos de drop
            slotElement.addEventListener('mouseup', () => this.handleSlotDrop(i));
            slotElement.addEventListener('touchend', () => this.handleSlotDrop(i));

            container.appendChild(slotElement);
        }
    }

    // Criar elemento de item
    createItemElement(item) {
        const itemElement = document.createElement('div');
        itemElement.className = 'ordering-item';
        itemElement.dataset.itemId = item.id;
        itemElement.dataset.correctPosition = item.correctPosition;

        // Conteúdo do item
        itemElement.innerHTML = this.createContentHTML(item);

        // Eventos de drag
        if (item.draggable) {
            itemElement.addEventListener('mousedown', (e) => this.handleItemMouseDown(e, item));
            itemElement.addEventListener('touchstart', (e) => this.handleItemTouchStart(e, item));
            itemElement.style.cursor = 'grab';
        }

        return itemElement;
    }

    // Criar HTML de conteúdo
    createContentHTML(item) {
        switch (item.type) {
            case 'text':
                return `<div class="ordering-text">${item.content}</div>`;
            case 'image':
                return `<img src="${item.content}" alt="Item" class="ordering-image">`;
            case 'icon':
                return `<i class="${item.content} ordering-icon"></i>`;
            case 'number':
                return `<div class="ordering-number">${item.content}</div>`;
            case 'date':
                return `<div class="ordering-date">${this.formatDate(item.content)}</div>`;
            default:
                return `<div class="ordering-text">${item.content}</div>`;
        }
    }

    // Formatar data
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
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

    // Manipular soltura no slot
    handleSlotDrop(slotIndex) {
        if (this.gameState === 'dragging' && this.draggingItem) {
            this.placeItemInSlot(this.draggingItem, slotIndex);
            this.finishDragging();
        }
    }

    // Colocar item no slot
    placeItemInSlot(item, slotIndex) {
        const slotElement = document.querySelector(`[data-slot-index="${slotIndex}"]`);
        const slotContent = slotElement.querySelector('.slot-content');
        const itemElement = document.querySelector(`[data-item-id="${item.id}"]`);

        if (slotContent && itemElement) {
            // Limpar slot se já tiver item
            if (slotContent.children.length > 0) {
                this.removeItemFromSlot(slotIndex);
            }

            // Mover item para o slot
            slotContent.appendChild(itemElement);
            itemElement.style.position = 'static';
            itemElement.style.left = '';
            itemElement.style.top = '';

            // Atualizar sequência do usuário
            this.userSequence[slotIndex] = item;

            // Feedback visual
            this.showPlacementFeedback(item, slotIndex);

            // Verificar se todos os slots estão preenchidos
            if (this.isSequenceComplete()) {
                this.checkSequence();
            }
        }
    }

    // Remover item do slot
    removeItemFromSlot(slotIndex) {
        const slotElement = document.querySelector(`[data-slot-index="${slotIndex}"]`);
        const slotContent = slotElement.querySelector('.slot-content');
        const currentItem = this.userSequence[slotIndex];

        if (slotContent.children.length > 0 && currentItem) {
            const itemElement = slotContent.firstChild;
            const itemsContainer = document.getElementById('items-container');

            // Retornar item ao container
            itemsContainer.appendChild(itemElement);
            this.userSequence[slotIndex] = null;
        }
    }

    // Verificar se a sequência está completa
    isSequenceComplete() {
        return this.userSequence.every(item => item !== null && item !== undefined);
    }

    // Mostrar feedback de colocação
    showPlacementFeedback(item, slotIndex) {
        const isCorrect = this.checkItemPosition(item, slotIndex);
        const slotElement = document.querySelector(`[data-slot-index="${slotIndex}"]`);

        if (slotElement) {
            if (isCorrect) {
                slotElement.classList.add('correct');
                setTimeout(() => {
                    slotElement.classList.remove('correct');
                }, 1000);
            } else {
                slotElement.classList.add('incorrect');
                setTimeout(() => {
                    slotElement.classList.remove('incorrect');
                }, 1000);
            }
        }
    }

    // Verificar posição do item
    checkItemPosition(item, slotIndex) {
        return item.correctPosition === slotIndex;
    }

    // Verificar sequência completa
    checkSequence() {
        if (!this.isSequenceComplete()) {
            this.showToast('⚠️ Complete toda a sequência antes de verificar.', 'warning');
            return;
        }

        this.gameState = 'checking';
        let allCorrect = true;
        let correctCount = 0;

        // Verificar cada posição
        this.userSequence.forEach((item, index) => {
            const isCorrect = this.checkItemPosition(item, index);
            
            if (isCorrect) {
                correctCount++;
            } else {
                allCorrect = false;
            }

            // Destacar posições incorretas
            const slotElement = document.querySelector(`[data-slot-index="${index}"]`);
            if (slotElement) {
                if (isCorrect) {
                    slotElement.classList.add('correct-final');
                } else {
                    slotElement.classList.add('incorrect-final');
                }
            }
        });

        // Atualizar progresso
        this.updateProgress();

        if (allCorrect) {
            setTimeout(() => {
                this.completeGame();
            }, 1500);
        } else {
            this.showToast(`❌ ${correctCount}/${this.items.length} corretos. Tente novamente.`, 'error');
            
            setTimeout(() => {
                this.resetSlotHighlights();
                this.gameState = 'idle';
            }, 3000);
        }
    }

    // Resetar destaque dos slots
    resetSlotHighlights() {
        document.querySelectorAll('.sequence-slot').forEach(slot => {
            slot.classList.remove('correct-final', 'incorrect-final');
        });
    }

    // Mostrar dica
    showHint() {
        // Encontrar item que precisa de ajuda
        const incorrectItems = this.userSequence.map((item, index) => {
            if (item && !this.checkItemPosition(item, index)) {
                return { item, index };
            }
            return null;
        }).filter(Boolean);

        if (incorrectItems.length > 0) {
            const randomIncorrect = incorrectItems[Math.floor(Math.random() * incorrectItems.length)];
            this.highlightCorrectPosition(randomIncorrect.item);
        } else {
            // Encontrar item não colocado
            const unplacedItems = this.items.filter(item => 
                !this.userSequence.includes(item)
            );

            if (unplacedItems.length > 0) {
                const randomUnplaced = unplacedItems[Math.floor(Math.random() * unplacedItems.length)];
                this.highlightCorrectPosition(randomUnplaced);
            } else {
                this.showToast('🎯 Você já colocou todos os itens! Verifique a sequência.', 'info');
            }
        }
    }

    // Destacar posição correta
    highlightCorrectPosition(item) {
        const correctSlot = document.querySelector(`[data-slot-index="${item.correctPosition}"]`);
        const itemElement = document.querySelector(`[data-item-id="${item.id}"]`);

        if (correctSlot && itemElement) {
            correctSlot.classList.add('hint');
            itemElement.classList.add('hint');

            setTimeout(() => {
                correctSlot.classList.remove('hint');
                itemElement.classList.remove('hint');
            }, 3000);

            this.showToast(`💡 Dica: Este item vai na posição ${item.correctPosition + 1}`, 'info');
        }
    }

    // Atualizar progresso
    updateProgress() {
        const correctCount = this.userSequence.filter((item, index) => 
            item && this.checkItemPosition(item, index)
        ).length;

        const progress = (correctCount / this.items.length) * 100;
        const progressBar = document.getElementById('ordering-progress');

        if (progressBar) {
            progressBar.style.width = `${progress}%`;
            progressBar.textContent = `${Math.round(progress)}%`;
            
            // Mudar cor baseado no progresso
            progressBar.className = 'progress-bar';
            if (progress === 100) {
                progressBar.classList.add('bg-success');
            } else if (progress >= 50) {
                progressBar.classList.add('bg-warning');
            } else {
                progressBar.classList.add('bg-danger');
            }
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

        console.log('Jogo de ordenação completado!');
    }

    // Mostrar mensagem de conclusão
    showCompletionMessage() {
        if (window.modalSystem) {
            modalSystem.show('resultModal', {
                data: {
                    title: 'Parabéns!',
                    content: `
                        <div class="text-center">
                            <i class="bi bi-bar-chart-fill display-4 text-success"></i>
                            <h4>Sequência Correta!</h4>
                            <p>Você ordenou todos os ${this.items.length} itens perfeitamente!</p>
                            <p class="sequence-type">Tipo: ${this.currentGame.sequenceType}</p>
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
        this.sequence = [];
        this.userSequence = [];
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
            const itemElement = document.querySelector(`[data-item-id="${this.draggingItem.id}"]`);
            if (itemElement) {
                itemElement.style.left = '';
                itemElement.style.top = '';
            }
            this.finishDragging();
        }
    }

    // Fallback para mostrar jogo
    showGameFallback() {
        const container = document.getElementById('ordering-container');
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

        const correctCount = this.userSequence.filter((item, index) => 
            item && this.checkItemPosition(item, index)
        ).length;

        return {
            totalItems: this.items.length,
            correctItems: correctCount,
            gameState: this.gameState,
            progress: Math.round((correctCount / this.items.length) * 100),
            sequenceType: this.currentGame.sequenceType
        };
    }
}

// Inicializar o sistema de ordenação
document.addEventListener('DOMContentLoaded', function() {
    window.orderingSystem = new OrderingSystem();
    console.log('Sistema de ordenação inicializado');

    // Integrar com o stationCore
    if (window.stationCore) {
        stationCore.orderingSystem = orderingSystem;
    }
});

// Exportar para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { OrderingSystem };
} else {
    window.OrderingSystem = OrderingSystem;
}