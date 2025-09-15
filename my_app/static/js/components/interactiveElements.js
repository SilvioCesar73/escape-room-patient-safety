// Sistema de Gerenciamento de Elementos Interativos
// Responsável pela criação, posicionamento e comportamento dos elementos na cena

class InteractiveElements {
    constructor() {
        this.elements = new Map();
        this.container = null;
        this.scenarioBounds = null;
        this.occupiedPositions = new Set();
        
        this.initializeContainer();
        this.calculateScenarioBounds();
    }

    // Inicializar container de elementos
    initializeContainer() {
        this.container = document.getElementById('interactive-elements');
        if (!this.container) {
            console.error('Container de elementos interativos não encontrado');
            return;
        }

        // Garantir que o container tenha o estilo correto
        this.container.style.position = 'absolute';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.pointerEvents = 'none';
    }

    // Calcular limites do cenário
    calculateScenarioBounds() {
        const scenarioArea = document.getElementById('scenario-area');
        if (scenarioArea) {
            const rect = scenarioArea.getBoundingClientRect();
            this.scenarioBounds = {
                width: rect.width,
                height: rect.height,
                left: rect.left,
                top: rect.top
            };
        }
    }

    // Criar elementos para um desafio
    createElementsForChallenge(challenge) {
        if (!challenge || !challenge.items) return;

        this.clearAllElements();
        this.occupiedPositions.clear();

        challenge.items.forEach(item => {
            this.createElement(item, challenge);
        });

        console.log(`Criados ${challenge.items.length} elementos para o desafio ${challenge.id}`);
    }

    // Criar elemento individual
    createElement(item, challenge) {
        const element = document.createElement('div');
        element.className = this.getElementClassName(item, challenge);
        
        // Posicionamento com prevenção de sobreposição
        const position = this.calculateOptimalPosition(item);
        element.style.left = `${position.x}%`;
        element.style.top = `${position.y}%`;
        
        // Identificação única
        element.dataset.id = item.id;
        element.dataset.challengeId = challenge.id;
        element.dataset.type = challenge.type;
        element.title = item.title;

        // Conteúdo do elemento
        this.createElementContent(element, item, challenge);

        // Eventos interativos
        this.addElementInteractions(element, item, challenge);

        // Adicionar ao container e registrar
        this.container.appendChild(element);
        this.elements.set(item.id, element);
        this.occupiedPositions.add(`${position.x},${position.y}`);

        return element;
    }

    // Calcular posição ótima (evitando sobreposição)
    calculateOptimalPosition(item, maxAttempts = 20) {
        let attempts = 0;
        let position;

        // Se o item tem posição definida, usar ela
        if (item.x !== undefined && item.y !== undefined) {
            position = { x: item.x, y: item.y };
            
            // Verificar se está livre
            if (!this.isPositionOccupied(position.x, position.y)) {
                return position;
            }
        }

        // Gerar posição aleatória que não sobreponha
        do {
            position = {
                x: Math.floor(Math.random() * 70) + 10, // 10% a 80%
                y: Math.floor(Math.random() * 70) + 10  // 10% a 80%
            };
            attempts++;
        } while (this.isPositionOccupied(position.x, position.y) && attempts < maxAttempts);

        // Se não encontrou posição livre, usar a mais próxima disponível
        if (attempts >= maxAttempts) {
            position = this.findNearestAvailablePosition(item.x || 50, item.y || 50);
        }

        return position;
    }

    // Verificar se posição está ocupada
    isPositionOccupied(x, y, radius = 5) {
        const positionKey = `${Math.round(x/radius)*radius},${Math.round(y/radius)*radius}`;
        return this.occupiedPositions.has(positionKey);
    }

    // Encontrar posição disponível mais próxima
    findNearestAvailablePosition(targetX, targetY, maxDistance = 20) {
        let bestPosition = { x: targetX, y: targetY };
        let minDistance = Infinity;

        for (let x = 10; x <= 80; x += 5) {
            for (let y = 10; y <= 80; y += 5) {
                if (!this.isPositionOccupied(x, y)) {
                    const distance = Math.sqrt(Math.pow(x - targetX, 2) + Math.pow(y - targetY, 2));
                    if (distance < minDistance) {
                        minDistance = distance;
                        bestPosition = { x, y };
                    }
                }
            }
        }

        return bestPosition;
    }

    // Obter classe CSS do elemento
    getElementClassName(item, challenge) {
        const classes = ['interactive-item'];
        
        // Estado do elemento
        if (challenge.id > progressManager.currentChallenge) {
            classes.push('locked');
        } else if (progressManager.isChallengeComplete(challenge.id)) {
            classes.push('completed');
        } else if (challenge.id === progressManager.currentChallenge) {
            classes.push('active');
        }

        // Tipo de desafio
        classes.push(`type-${challenge.type}`);

        // Dificuldade (baseada na ordem)
        if (challenge.id <= 5) classes.push('difficulty-easy');
        else if (challenge.id <= 10) classes.push('difficulty-medium');
        else classes.push('difficulty-hard');

        return classes.join(' ');
    }

    // Criar conteúdo do elemento
    createElementContent(element, item, challenge) {
        // Número do desafio
        const number = document.createElement('div');
        number.className = 'challenge-number';
        number.textContent = item.number || challenge.id;
        element.appendChild(number);

        // Ícone
        const icon = document.createElement('i');
        icon.className = `${item.icon} challenge-icon`;
        element.appendChild(icon);

        // Badge de estado
        const stateBadge = document.createElement('div');
        stateBadge.className = 'element-state-badge';
        
        if (element.classList.contains('locked')) {
            stateBadge.innerHTML = '<i class="bi bi-lock-fill"></i>';
        } else if (element.classList.contains('completed')) {
            stateBadge.innerHTML = '<i class="bi bi-check-circle-fill"></i>';
        }
        
        element.appendChild(stateBadge);

        // Efeito de pulso para elementos ativos
        if (element.classList.contains('active')) {
            this.addPulseAnimation(element);
        }
    }

    // Adicionar animação de pulso
    addPulseAnimation(element) {
        element.style.animation = 'pulse 2s infinite';
        
        // Adicionar evento para pausar animação ao interagir
        element.addEventListener('mouseenter', () => {
            element.style.animationPlayState = 'paused';
        });

        element.addEventListener('mouseleave', () => {
            element.style.animationPlayState = 'running';
        });
    }

    // Adicionar interações ao elemento
    addElementInteractions(element, item, challenge) {
        // Só adicionar interações se o elemento não estiver bloqueado
        if (!element.classList.contains('locked')) {
            element.style.pointerEvents = 'auto';
            element.style.cursor = 'pointer';

            // Hover effects
            element.addEventListener('mouseenter', (e) => {
                this.handleElementHover(e.target, true);
            });

            element.addEventListener('mouseleave', (e) => {
                this.handleElementHover(e.target, false);
            });

            // Click/touch
            element.addEventListener('click', (e) => {
                this.handleElementClick(e, item, challenge);
            });

            // Touch para dispositivos móveis
            element.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.handleElementClick(e, item, challenge);
            }, { passive: false });
        }
    }

    // Manipular hover do elemento
    handleElementHover(element, isHovering) {
        if (isHovering) {
            element.classList.add('hover');
            this.showElementTooltip(element);
        } else {
            element.classList.remove('hover');
            this.hideElementTooltip();
        }
    }

    // Mostrar tooltip do elemento
    showElementTooltip(element) {
        // Remover tooltip existente
        this.hideElementTooltip();

        const tooltip = document.createElement('div');
        tooltip.className = 'element-tooltip';
        tooltip.textContent = element.title;
        
        const rect = element.getBoundingClientRect();
        tooltip.style.position = 'fixed';
        tooltip.style.left = `${rect.left + rect.width / 2}px`;
        tooltip.style.top = `${rect.top - 40}px`;
        tooltip.style.transform = 'translateX(-50%)';

        document.body.appendChild(tooltip);
        element.dataset.tooltipId = 'tooltip-' + Date.now();
    }

    // Esconder tooltip
    hideElementTooltip() {
        const tooltips = document.querySelectorAll('.element-tooltip');
        tooltips.forEach(tooltip => tooltip.remove());
    }

    // Manipular clique no elemento
    handleElementClick(event, item, challenge) {
        event.stopPropagation();
        
        if (!this.isElementInteractable(challenge.id)) {
            this.showLockedMessage(challenge.id);
            return;
        }

        console.log(`Elemento clicado: ${item.id} do desafio ${challenge.id}`);

        // Vibrar se for dispositivo móvel
        if ('vibrate' in navigator) {
            navigator.vibrate(50);
        }

        // Feedback visual
        this.addClickFeedback(event.target);

        // Disparar ação baseada no tipo de desafio
        this.triggerElementAction(item, challenge);
    }

    // Verificar se elemento é interagível
    isElementInteractable(challengeId) {
        return progressManager.isChallengeUnlocked(challengeId) && 
               challengeId === progressManager.currentChallenge;
    }

    // Mostrar mensagem de bloqueado
    showLockedMessage(challengeId) {
        const message = challengeId > progressManager.currentChallenge ?
            `Complete o desafio ${progressManager.currentChallenge} primeiro!` :
            'Este desafio já foi completado!';

        if (window.questionSystem) {
            questionSystem.showInfoMessage(message);
        }
    }

    // Adicionar feedback de clique
    addClickFeedback(element) {
        element.classList.add('clicked');
        setTimeout(() => {
            element.classList.remove('clicked');
        }, 300);
    }

    // Disparar ação do elemento
    triggerElementAction(item, challenge) {
        switch (challenge.type) {
            case 'quiz':
                if (window.questionSystem) {
                    questionSystem.showQuestion(challenge, item.id);
                }
                break;

            case 'wordsearch':
                if (window.wordSearchSystem) {
                    wordSearchSystem.startGame(challenge);
                }
                break;

            case 'puzzle':
                if (window.puzzleSystem) {
                    puzzleSystem.startGame(challenge);
                }
                break;

            case 'memory':
                if (window.memorySystem) {
                    memorySystem.startGame(challenge);
                }
                break;

            default:
                console.warn('Tipo de desafio não suportado:', challenge.type);
                if (window.questionSystem) {
                    questionSystem.showErrorMessage('Tipo de desafio não disponível');
                }
        }
    }

    // Atualizar estado dos elementos
    updateElementsState() {
        this.elements.forEach((element, id) => {
            const challengeId = parseInt(element.dataset.challengeId);
            
            element.className = this.getElementClassName(
                { id: id, number: element.querySelector('.challenge-number').textContent },
                { id: challengeId, type: element.dataset.type }
            );

            // Atualizar interatividade
            if (element.classList.contains('locked')) {
                element.style.pointerEvents = 'none';
                element.style.cursor = 'default';
            } else {
                element.style.pointerEvents = 'auto';
                element.style.cursor = 'pointer';
            }
        });
    }

    // Obter elemento por ID
    getElementById(elementId) {
        return this.elements.get(elementId);
    }

    // Obter elementos por desafio
    getElementsByChallenge(challengeId) {
        const elements = [];
        this.elements.forEach(element => {
            if (parseInt(element.dataset.challengeId) === challengeId) {
                elements.push(element);
            }
        });
        return elements;
    }

    // Limpar todos os elementos
    clearAllElements() {
        this.elements.clear();
        this.occupiedPositions.clear();
        
        if (this.container) {
            this.container.innerHTML = '';
        }
    }

    // Destacar elementos de um desafio
    highlightChallengeElements(challengeId) {
        this.elements.forEach(element => {
            const elementChallengeId = parseInt(element.dataset.challengeId);
            
            if (elementChallengeId === challengeId) {
                element.classList.add('highlighted');
            } else {
                element.classList.remove('highlighted');
                element.style.opacity = '0.3';
            }
        });
    }

    // Remover destaque
    removeHighlight() {
        this.elements.forEach(element => {
            element.classList.remove('highlighted');
            element.style.opacity = '1';
        });
    }

    // Animação de conquista
    animateElementCompletion(elementId) {
        const element = this.getElementById(elementId);
        if (!element) return;

        element.classList.add('completed', 'celebrating');
        
        // Adicionar confetti ou efeito visual
        this.createCompletionEffect(element);
    }

    // Criar efeito de conclusão
    createCompletionEffect(element) {
        const effect = document.createElement('div');
        effect.className = 'completion-effect';
        effect.innerHTML = '🎉';
        
        const rect = element.getBoundingClientRect();
        effect.style.position = 'fixed';
        effect.style.left = `${rect.left + rect.width / 2}px`;
        effect.style.top = `${rect.top + rect.height / 2}px`;
        effect.style.transform = 'translate(-50%, -50%)';
        effect.style.fontSize = '2rem';
        effect.style.zIndex = '1000';
        effect.style.pointerEvents = 'none';

        document.body.appendChild(effect);

        // Animação
        effect.animate([
            { transform: 'translate(-50%, -50%) scale(0)', opacity: 0 },
            { transform: 'translate(-50%, -50%) scale(1.5)', opacity: 1 },
            { transform: 'translate(-50%, -50%) scale(1)', opacity: 0.8 }
        ], {
            duration: 1000,
            easing: 'ease-out'
        });

        // Remover após animação
        setTimeout(() => {
            effect.remove();
        }, 1000);
    }

    // Atualizar para redimensionamento de tela
    handleResize() {
        this.calculateScenarioBounds();
        this.repositionElements();
    }

    // Reposicionar elementos no redimensionamento
    repositionElements() {
        this.elements.forEach(element => {
            const currentX = parseFloat(element.style.left);
            const currentY = parseFloat(element.style.top);
            
            // Manter posição percentual relativa
            element.style.left = `${currentX}%`;
            element.style.top = `${currentY}%`;
        });
    }
}

// Inicializar o sistema de elementos interativos
document.addEventListener('DOMContentLoaded', function() {
    window.interactiveElements = new InteractiveElements();
    console.log('Sistema de elementos interativos inicializado');

    // Configurar redimensionamento
    window.addEventListener('resize', () => {
        interactiveElements.handleResize();
    });

    // Configurar evento de conclusão de desafio
    if (typeof progressManager !== 'undefined') {
        // Observar mudanças no progresso para atualizar elementos
        const originalCompleteChallenge = progressManager.completeChallenge;
        progressManager.completeChallenge = function(...args) {
            const result = originalCompleteChallenge.apply(this, args);
            
            // Animar elemento completado
            if (interactiveElements) {
                const elements = interactiveElements.getElementsByChallenge(args[0]);
                elements.forEach(element => {
                    interactiveElements.animateElementCompletion(element.dataset.id);
                });
            }
            
            return result;
        };
    }
});

// Exportar para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { InteractiveElements };
} else {
    window.InteractiveElements = InteractiveElements;
}