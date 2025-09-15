// Núcleo Principal da Estação de Desafios
// Controla o fluxo principal, carregamento de desafios e orquestração dos componentes

class StationCore {
    constructor() {
        this.currentChallengeId = 1;
        this.currentChallenge = null;
        this.isChallengeActive = false;
        this.isPaused = false;
        this.challengeTimer = null;
        this.remainingTime = 0;
        this.currentHintIndex = 0;
        
        // Elementos DOM
        this.domElements = {
            challengeTitle: document.getElementById('challenge-title'),
            challengeTheme: document.getElementById('challenge-theme'),
            timer: document.getElementById('timer'),
            hintsCount: document.getElementById('hints-count'),
            progressBar: document.getElementById('progress-bar'),
            currentChallenge: document.getElementById('current-challenge'),
            totalScore: document.getElementById('total-score'),
            scenarioArea: document.getElementById('scenario-area'),
            interactiveElements: document.getElementById('interactive-elements')
        };

        // Inicializar sistemas
        this.initializeEventListeners();
        this.loadInitialChallenge();
    }

    // Inicializar listeners de eventos
    initializeEventListeners() {
        // Botões de controle
        document.getElementById('hint-btn').addEventListener('click', () => this.showHint());
        document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('use-hint').addEventListener('click', () => this.useCurrentHint());
        document.getElementById('submit-answer').addEventListener('click', () => this.submitAnswer());
        document.getElementById('next-challenge-btn').addEventListener('click', () => this.loadNextChallenge());
        document.getElementById('retry-btn').addEventListener('click', () => this.retryChallenge());

        // Eventos de teclado
        document.addEventListener('keydown', (e) => this.handleKeyboardEvents(e));
    }

    // Carregar desafio inicial
    loadInitialChallenge() {
        const nextChallenge = progressManager.getNextAvailableChallenge();
        if (nextChallenge) {
            this.loadChallenge(nextChallenge);
        } else {
            this.showCompletionMessage();
        }
    }

    // Carregar um desafio específico
    async loadChallenge(challengeId) {
        try {
            // Verificar se o desafio está desbloqueado
            if (!progressManager.isChallengeUnlocked(challengeId)) {
                this.showLockedMessage(challengeId);
                return;
            }

            // Verificar se já está completo
            if (progressManager.isChallengeComplete(challengeId)) {
                this.showAlreadyCompletedMessage(challengeId);
                return;
            }

            // Carregar dados do desafio
            const challengeData = await this.fetchChallengeData(challengeId);
            if (!challengeData) {
                throw new Error(`Dados do desafio ${challengeId} não encontrados`);
            }

            this.currentChallengeId = challengeId;
            this.currentChallenge = challengeData;
            this.isChallengeActive = true;
            this.currentHintIndex = 0;

            // Atualizar UI
            this.updateChallengeUI();
            this.setupInteractiveElements();
            this.startChallengeTimer(challengeData.timeLimit);

            // Atualizar progresso
            this.updateProgressUI();

            console.log(`Desafio ${challengeId} carregado: ${challengeData.title}`);

        } catch (error) {
            console.error('Erro ao carregar desafio:', error);
            this.showErrorModal('Erro ao carregar o desafio. Tente novamente.');
        }
    }

    // Buscar dados do desafio (pode ser do arquivo local ou API)
    async fetchChallengeData(challengeId) {
        // Primeiro tenta buscar do arquivo challenges.js
        if (window.challengeData && window.challengeData.challenges[challengeId]) {
            return window.challengeData.challenges[challengeId];
        }

        // Se não encontrar, tenta buscar da API
        try {
            const response = await fetch(`/api/challenge/${challengeId}`);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.warn('API não disponível, usando dados locais');
        }

        return null;
    }

    // Configurar elementos interativos no cenário
    setupInteractiveElements() {
        const container = this.domElements.interactiveElements;
        container.innerHTML = '';

        if (!this.currentChallenge || !this.currentChallenge.items) return;

        this.currentChallenge.items.forEach(item => {
            const element = this.createInteractiveElement(item);
            container.appendChild(element);
        });
    }

    // Criar elemento interativo individual
    createInteractiveElement(item) {
        const element = document.createElement('div');
        element.className = 'interactive-item';
        element.style.left = `${item.x}%`;
        element.style.top = `${item.y}%`;
        element.dataset.id = item.id;
        element.title = item.title;

        // Adicionar número e ícone
        const number = document.createElement('div');
        number.className = 'challenge-number';
        number.textContent = item.number;

        const icon = document.createElement('i');
        icon.className = `${item.icon} challenge-icon`;

        element.appendChild(number);
        element.appendChild(icon);

        // Adicionar evento de clique
        element.addEventListener('click', () => {
            this.handleItemInteraction(item.id);
        });

        return element;
    }

    // Manipular interação com elemento
    handleItemInteraction(itemId) {
        if (!this.isChallengeActive || this.isPaused) return;

        switch (this.currentChallenge.type) {
            case 'quiz':
                this.showQuizQuestion(itemId);
                break;
            case 'wordsearch':
                this.startWordSearch();
                break;
            case 'puzzle':
                this.startPuzzle();
                break;
            case 'memory':
                this.startMemoryGame();
                break;
            default:
                console.warn('Tipo de desafio não suportado:', this.currentChallenge.type);
        }
    }

    // Iniciar timer do desafio
    startChallengeTimer(timeLimit) {
        // Parar timer anterior se existir
        if (this.challengeTimer) {
            clearInterval(this.challengeTimer);
        }

        this.remainingTime = timeLimit;
        this.updateTimerDisplay();

        progressManager.startChallengeTimer();

        this.challengeTimer = setInterval(() => {
            if (!this.isPaused) {
                this.remainingTime--;
                this.updateTimerDisplay();

                if (this.remainingTime <= 0) {
                    clearInterval(this.challengeTimer);
                    this.challengeTimeOut();
                }
            }
        }, 1000);
    }

    // Atualizar display do timer
    updateTimerDisplay() {
        const minutes = Math.floor(this.remainingTime / 60);
        const seconds = this.remainingTime % 60;
        
        this.domElements.timer.textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // Mudar cor conforme o tempo diminui
        const timerElement = this.domElements.timer;
        timerElement.classList.remove('bg-info', 'bg-warning', 'bg-danger');
        
        if (this.remainingTime <= 60) {
            timerElement.classList.add('bg-danger');
        } else if (this.remainingTime <= 180) {
            timerElement.classList.add('bg-warning');
        } else {
            timerElement.classList.add('bg-info');
        }
    }

    // Tempo esgotado
    challengeTimeOut() {
        this.isChallengeActive = false;
        
        document.getElementById('success-result').style.display = 'none';
        document.getElementById('fail-result').style.display = 'block';
        document.getElementById('retry-btn').style.display = 'block';
        document.getElementById('next-challenge-btn').style.display = 'none';
        
        const modal = new bootstrap.Modal(document.getElementById('resultModal'));
        modal.show();
    }

    // Alternar pausa
    togglePause() {
        this.isPaused = !this.isPaused;
        const pauseBtn = document.getElementById('pause-btn');
        
        if (this.isPaused) {
            clearInterval(this.challengeTimer);
            pauseBtn.innerHTML = '<i class="bi bi-play-fill"></i> Continuar';
            pauseBtn.classList.remove('btn-outline-secondary');
            pauseBtn.classList.add('btn-success');
        } else {
            this.startChallengeTimer(this.remainingTime);
            pauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i> Pausar';
            pauseBtn.classList.remove('btn-success');
            pauseBtn.classList.add('btn-outline-secondary');
        }
    }

    // Mostrar dica
    showHint() {
        if (!this.currentChallenge || this.currentHintIndex >= this.currentChallenge.hints.length) {
            this.showMessage('Não há mais dicas disponíveis para este desafio.');
            return;
        }

        const hint = this.currentChallenge.hints[this.currentHintIndex];
        document.getElementById('hint-text').textContent = hint.text;
        document.getElementById('hint-penalty').textContent = hint.penalty;

        const modal = new bootstrap.Modal(document.getElementById('hintModal'));
        modal.show();
    }

    // Usar dica atual
    useCurrentHint() {
        const hint = this.currentChallenge.hints[this.currentHintIndex];
        const penalty = progressManager.useHint(hint.penalty);

        // Atualizar UI
        this.domElements.hintsCount.textContent = progressManager.hintsUsed;
        this.domElements.totalScore.textContent = progressManager.score;

        // Fechar modal e avançar para próxima dica
        const modal = bootstrap.Modal.getInstance(document.getElementById('hintModal'));
        modal.hide();
        
        this.currentHintIndex++;
    }

    // Atualizar UI do desafio
    updateChallengeUI() {
        this.domElements.challengeTitle.textContent = this.currentChallenge.title;
        this.domElements.challengeTheme.textContent = this.currentChallenge.theme;
        this.domElements.currentChallenge.textContent = this.currentChallengeId;
        this.domElements.hintsCount.textContent = progressManager.hintsUsed;
    }

    // Atualizar UI de progresso
    updateProgressUI() {
        this.domElements.totalScore.textContent = progressManager.score;
        this.updateProgressBar();
        this.updateKeysDisplay();
    }

    // Atualizar barra de progresso
    updateProgressBar() {
        const progress = progressManager.getOverallProgress();
        const percentage = progress.percentage;
        
        this.domElements.progressBar.style.width = `${percentage}%`;
        this.domElements.progressBar.textContent = `${percentage}%`;
    }

    // Atualizar display de chaves
    updateKeysDisplay() {
        const keysContainer = document.getElementById('keys-container');
        keysContainer.innerHTML = '';
        
        const keys = progressManager.earnedKeys;
        
        if (keys.length === 0) {
            keysContainer.innerHTML = '<span class="badge bg-secondary">Nenhuma chave ainda</span>';
            return;
        }
        
        keys.forEach(key => {
            const badge = document.createElement('span');
            badge.className = 'badge bg-success key-badge';
            badge.textContent = `Chave ${keys.indexOf(key) + 1}`;
            badge.title = key;
            keysContainer.appendChild(badge);
        });
    }

    // Carregar próximo desafio
    loadNextChallenge() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('resultModal'));
        modal.hide();
        
        const nextChallenge = progressManager.getNextAvailableChallenge();
        if (nextChallenge) {
            this.loadChallenge(nextChallenge);
        } else {
            this.showCompletionMessage();
        }
    }

    // Tentar novamente o desafio
    retryChallenge() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('resultModal'));
        modal.hide();
        
        this.loadChallenge(this.currentChallengeId);
    }

    // Mensagens e modais
    showLockedMessage(challengeId) {
        this.showMessage(`Desafio ${challengeId} está bloqueado. Complete os desafios anteriores primeiro.`);
    }

    showAlreadyCompletedMessage(challengeId) {
        this.showMessage(`Desafio ${challengeId} já foi completado. Avançando para o próximo...`);
        this.loadNextChallenge();
    }

    showCompletionMessage() {
        this.showMessage('🎉 Parabéns! Você completou todos os desafios!', 'success');
    }

    showErrorModal(message) {
        this.showMessage(message, 'error');
    }

    showMessage(message, type = 'info') {
        // Implementar sistema de toast ou modal de mensagem
        console.log(`${type.toUpperCase()}: ${message}`);
        alert(message); // Temporário - substituir por sistema de toast
    }

    // Manipular eventos de teclado
    handleKeyboardEvents(event) {
        if (!this.isChallengeActive) return;

        switch (event.key) {
            case 'Escape':
                event.preventDefault();
                this.togglePause();
                break;
            case 'h':
            case 'H':
                event.preventDefault();
                this.showHint();
                break;
            case ' ':
                event.preventDefault();
                this.togglePause();
                break;
        }
    }

    // Métodos para tipos específicos de desafio (serão implementados nos componentes)
    showQuizQuestion(itemId) {
        // Implementado no questionSystem.js
        if (window.questionSystem) {
            window.questionSystem.showQuestion(this.currentChallenge, itemId);
        }
    }

    startWordSearch() {
        console.log('Iniciando caça-palavras...');
        // Implementar no wordsearch.js
    }

    startPuzzle() {
        console.log('Iniciando quebra-cabeça...');
        // Implementar no puzzle.js
    }

    startMemoryGame() {
        console.log('Iniciando jogo da memória...');
        // Implementar no memory.js
    }
}

// Inicializar a estação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se as dependências estão carregadas
    if (typeof progressManager === 'undefined') {
        console.error('ProgressManager não carregado!');
        return;
    }

    if (typeof challengeData === 'undefined') {
        console.error('Dados dos desafios não carregados!');
        return;
    }

    // Inicializar estação
    window.stationCore = new StationCore();
    console.log('Estação inicializada com sucesso!');
});

// Exportar para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StationCore };
} else {
    window.StationCore = StationCore;
}