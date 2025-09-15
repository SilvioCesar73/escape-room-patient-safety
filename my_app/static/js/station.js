// Variáveis globais
let currentChallenge = 1;
let challengeTimer = null;
let remainingTime = 0;
let currentHintIndex = 0;
let selectedOption = null;

// Inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    initializeStation();
    loadChallenge(1);
});

// Inicializar a estação
function initializeStation() {
    // Carregar progresso salvo
    progressManager.loadProgress().then(success => {
        if (success) {
            currentChallenge = progressManager.currentChallenge;
            updateProgressUI();
        }
    });
    
    // Configurar event listeners
    document.getElementById('hint-btn').addEventListener('click', showHint);
    document.getElementById('pause-btn').addEventListener('click', togglePause);
    document.getElementById('use-hint').addEventListener('click', useCurrentHint);
    document.getElementById('submit-answer').addEventListener('click', submitAnswer);
    document.getElementById('next-challenge-btn').addEventListener('click', loadNextChallenge);
    document.getElementById('retry-btn').addEventListener('click', retryChallenge);
    
    // Iniciar timer de progresso geral
    setInterval(updateOverallTimer, 1000);
}

// Carregar um desafio específico
function loadChallenge(challengeId) {
    // Verificar se o desafio está disponível
    if (challengeId > 15) {
        showCompletionMessage();
        return;
    }
    
    const challenge = challenges[challengeId];
    if (!challenge) {
        console.error(`Desafio ${challengeId} não encontrado`);
        return;
    }
    
    currentChallenge = challengeId;
    progressManager.startChallenge(challengeId);
    
    // Atualizar UI
    document.getElementById('challenge-title').textContent = challenge.title;
    document.getElementById('challenge-theme').textContent = challenge.theme;
    document.getElementById('scenario-background').src = challenge.background;
    document.getElementById('current-challenge').textContent = challengeId;
    
    // Configurar elementos interativos
    setupInteractiveElements(challenge.items);
    
    // Reiniciar contador de dicas
    currentHintIndex = 0;
    document.getElementById('hints-count').textContent = '0';
    
    // Iniciar timer do desafio
    startChallengeTimer(challenge.timeLimit);
    
    // Atualizar barra de progresso
    updateProgressBar();
}

// Configurar elementos interativos no cenário
function setupInteractiveElements(items) {
    const container = document.getElementById('interactive-elements');
    container.innerHTML = '';
    
    items.forEach(item => {
        const element = document.createElement('div');
        element.className = 'interactive-item';
        element.style.left = `${item.x}%`;
        element.style.top = `${item.y}%`;
        element.dataset.id = item.id;
        element.title = item.title;
        
        const icon = document.createElement('i');
        icon.className = item.icon;
        element.appendChild(icon);
        
        element.addEventListener('click', () => {
            showQuestionForItem(item.id);
        });
        
        container.appendChild(element);
    });
}

// Mostrar pergunta relacionada a um item
function showQuestionForItem(itemId) {
    const challenge = challenges[currentChallenge];
    const questionIndex = challenge.items.findIndex(item => item.id === itemId);
    
    if (questionIndex >= 0 && questionIndex < challenge.questions.length) {
        showQuestion(questionIndex);
    }
}

// Exibir uma pergunta no modal
function showQuestion(questionIndex) {
    const challenge = challenges[currentChallenge];
    const question = challenge.questions[questionIndex];
    
    // Verificar se já foi respondida
    if (progressManager.answeredQuestions[currentChallenge]?.some(a => a.questionId === question.id)) {
        alert('Você já respondeu esta pergunta!');
        return;
    }
    
    // Configurar o modal
    document.getElementById('questionModalTitle').textContent = `Pergunta ${questionIndex + 1} de ${challenge.questions.length}`;
    document.getElementById('question-text').textContent = question.text;
    
    const optionsContainer = document.getElementById('question-options');
    optionsContainer.innerHTML = '';
    
    // Adicionar opções de resposta
    question.options.forEach(option => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'option-btn';
        button.dataset.option = option.id;
        button.textContent = option.text;
        
        button.addEventListener('click', () => {
            // Desselecionar opção anterior
            document.querySelectorAll('.option-btn').forEach(btn => {
                btn.classList.remove('selected');
            });
            
            // Selecionar nova opção
            button.classList.add('selected');
            selectedOption = option.id;
        });
        
        optionsContainer.appendChild(button);
    });
    
    // Resetar seleção
    selectedOption = null;
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('questionModal'));
    modal.show();
}

// Enviar resposta
function submitAnswer() {
    if (!selectedOption) {
        alert('Por favor, selecione uma opção antes de responder.');
        return;
    }
    
    const challenge = challenges[currentChallenge];
    const questionIndex = Array.from(document.getElementById('question-options').children)
        .findIndex(btn => btn.classList.contains('selected'));
    
    if (questionIndex >= 0) {
        const question = challenge.questions[questionIndex];
        const isCorrect = selectedOption === question.correctAnswer;
        
        // Registrar resposta
        progressManager.answerQuestion(
            currentChallenge, 
            question.id, 
            isCorrect, 
            question.points
        );
        
        // Fechar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('questionModal'));
        modal.hide();
        
        // Atualizar UI
        updateProgressUI();
        
        // Verificar se todas as perguntas foram respondidas
        if (progressManager.isChallengeComplete(currentChallenge)) {
            completeChallenge();
        }
    }
}

// Mostrar dica
function showHint() {
    const challenge = challenges[currentChallenge];
    
    if (currentHintIndex >= challenge.hints.length) {
        alert('Não há mais dicas disponíveis para este desafio.');
        return;
    }
    
    const hint = challenge.hints[currentHintIndex];
    document.getElementById('hint-text').textContent = hint.text;
    document.getElementById('hint-penalty').textContent = hint.penalty;
    
    const modal = new bootstrap.Modal(document.getElementById('hintModal'));
    modal.show();
}

// Usar dica atual
function useCurrentHint() {
    const challenge = challenges[currentChallenge];
    const hint = challenge.hints[currentHintIndex];
    const penalty = progressManager.useHint(hint.penalty);
    
    // Atualizar UI
    document.getElementById('hints-count').textContent = progressManager.hintsUsed;
    document.getElementById('total-score').textContent = progressManager.score;
    
    // Fechar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('hintModal'));
    modal.hide();
    
    // Avançar para próxima dica
    currentHintIndex++;
}

// Iniciar timer do desafio
function startChallengeTimer(timeLimit) {
    // Parar timer anterior se existir
    if (challengeTimer) {
        clearInterval(challengeTimer);
    }
    
    remainingTime = timeLimit;
    updateTimerDisplay();
    
    challengeTimer = setInterval(() => {
        remainingTime--;
        updateTimerDisplay();
        
        if (remainingTime <= 0) {
            clearInterval(challengeTimer);
            challengeTimeOut();
        }
    }, 1000);
}

// Atualizar display do timer
function updateTimerDisplay() {
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    document.getElementById('timer').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Mudar cor conforme o tempo diminui
    const timerElement = document.getElementById('timer');
    if (remainingTime <= 60) {
        timerElement.classList.remove('bg-info');
        timerElement.classList.add('bg-danger');
    } else if (remainingTime <= 180) {
        timerElement.classList.remove('bg-info', 'bg-danger');
        timerElement.classList.add('bg-warning');
    } else {
        timerElement.classList.remove('bg-warning', 'bg-danger');
        timerElement.classList.add('bg-info');
    }
}

// Tempo esgotado
function challengeTimeOut() {
    // Mostrar modal de tempo esgotado
    document.getElementById('success-result').style.display = 'none';
    document.getElementById('fail-result').style.display = 'block';
    document.getElementById('retry-btn').style.display = 'block';
    document.getElementById('next-challenge-btn').style.display = 'none';
    
    const modal = new bootstrap.Modal(document.getElementById('resultModal'));
    modal.show();
}

// Completar desafio
function completeChallenge() {
    // Parar timer
    clearInterval(challengeTimer);
    
    // Calcular pontuação e chave
    const challenge = challenges[currentChallenge];
    const timePercentage = (remainingTime / challenge.timeLimit) * 100;
    let keyType = 'bronze';
    
    if (timePercentage >= 50) keyType = 'gold';
    else if (timePercentage >= 25) keyType = 'silver';
    
    const result = progressManager.completeChallenge(currentChallenge, keyType);
    
    // Mostrar resultados
    document.getElementById('success-result').style.display = 'block';
    document.getElementById('fail-result').style.display = 'none';
    document.getElementById('key-earned').textContent = keyType;
    document.getElementById('challenge-score').textContent = result.score;
    document.getElementById('retry-btn').style.display = 'none';
    document.getElementById('next-challenge-btn').style.display = 'block';
    
    const modal = new bootstrap.Modal(document.getElementById('resultModal'));
    modal.show();
    
    // Salvar progresso
    progressManager.saveProgress();
}

// Carregar próximo desafio
function loadNextChallenge() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('resultModal'));
    modal.hide();
    
    loadChallenge(currentChallenge + 1);
}

// Tentar novamente o desafio
function retryChallenge() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('resultModal'));
    modal.hide();
    
    loadChallenge(currentChallenge);
}

// Alternar pausa
function togglePause() {
    const pauseBtn = document.getElementById('pause-btn');
    
    if (challengeTimer) {
        clearInterval(challengeTimer);
        challengeTimer = null;
        pauseBtn.innerHTML = '<i class="bi bi-play-fill"></i> Continuar';
        pauseBtn.classList.remove('btn-outline-secondary');
        pauseBtn.classList.add('btn-success');
    } else {
        startChallengeTimer(remainingTime);
        pauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i> Pausar';
        pauseBtn.classList.remove('btn-success');
        pauseBtn.classList.add('btn-outline-secondary');
    }
}

// Atualizar timer geral
function updateOverallTimer() {
    progressManager.elapsedTime++;
    
    const hours = Math.floor(progressManager.elapsedTime / 3600);
    const minutes = Math.floor((progressManager.elapsedTime % 3600) / 60);
    const seconds = progressManager.elapsedTime % 60;
    
    document.getElementById('total-time').textContent = 
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Atualizar barra de progresso
function updateProgressBar() {
    const progress = ((currentChallenge - 1) / 15) * 100;
    document.getElementById('progress-bar').style.width = `${progress}%`;
}

// Atualizar UI de progresso
function updateProgressUI() {
    document.getElementById('total-score').textContent = progressManager.score;
    updateKeysDisplay();
    updateProgressBar();
}

// Atualizar display de chaves
function updateKeysDisplay() {
    const keysContainer = document.getElementById('keys-container');
    keysContainer.innerHTML = '';
    
    if (progressManager.earnedKeys.length === 0) {
        keysContainer.innerHTML = '<span class="badge bg-secondary">Nenhuma chave ainda</span>';
        return;
    }
    
    progressManager.earnedKeys.forEach(key => {
        const badge = document.createElement('span');
        badge.className = `badge key-badge ${getKeyBadgeClass(key.keyType)}`;
        badge.textContent = `${key.keyType.toUpperCase()} - ${challengeKeys[key.challengeId].name}`;
        keysContainer.appendChild(badge);
    });
}

// Obter classe CSS para o badge da chave
function getKeyBadgeClass(keyType) {
    switch (keyType) {
        case 'gold': return 'bg-warning text-dark';
        case 'silver': return 'bg-secondary';
        case 'bronze': return 'bg-danger';
        default: return 'bg-secondary';
    }
}

// Mostrar mensagem de conclusão
function showCompletionMessage() {
    // Implementar tela de conclusão de todos os desafios
    alert('Parabéns! Você completou todos os 15 desafios!');
    // Redirecionar para dashboard ou tela de resultados
    window.location.href = '/dashboard';
}

// Exportar para uso em outros arquivos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        initializeStation, 
        loadChallenge, 
        completeChallenge 
    };
}