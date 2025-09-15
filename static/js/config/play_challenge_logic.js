// /static/js/config/play_challenge_logic.js

console.log("DEBUG: Versão nova do play_challenge_logic.js carregada!");


// --- Variáveis para controlar o estado do desafio atual ---
let currentChallenge;       // O objeto completo do desafio, vindo do backend.
let scoreForThisChallenge = 0; // Pontuação acumulada apenas neste desafio.
let answeredQuestions = [];    // Lista de IDs das perguntas já respondidas corretamente.
let totalQuestions = 0;        // Número total de perguntas no desafio.
let timerInterval = null;      // Referência para o nosso cronômetro para que possamos pará-lo.
let remainingTime = 0;         // Tempo restante em segundos.
let wrongAnswers = 0; // Contador de respostas erradas

// --- Variáveis para o Modal de Perguntas ---
let selectedOptionId = null; // Guarda a opção de resposta que o usuário clicou.
let currentQuestion = null;  // Guarda o objeto da pergunta que está atualmente no modal.

/**
 * Ponto de entrada: executado quando o HTML da página está pronto.
 */
document.addEventListener('DOMContentLoaded', function() {
    // A variável 'currentChallengeData' é criada e preenchida no template 'play_challenge.html'.
    if (typeof currentChallengeData === 'undefined') {
        console.error("ERRO: Dados do desafio (currentChallengeData) não foram encontrados.");
        return;
    }
    // Armazena os dados do desafio em nossas variáveis de estado.
    currentChallenge = currentChallengeData;
    totalQuestions = currentChallenge.questions.length;

    console.log("Lógica do desafio iniciada para:", currentChallenge.title);
    initializeChallengeScreen(currentChallenge);
});

/**
 * Prepara e inicia todos os componentes da tela do desafio.
 */
function initializeChallengeScreen(challenge) {
    document.getElementById('total-score').textContent = scoreForThisChallenge;
    startChallengeTimer(challenge.timeLimit);
    renderInteractiveItems(challenge.items);
    setupItemClickListeners(challenge);
    document.getElementById('submit-answer-btn').addEventListener('click', submitAnswer);
}

/**
 * Inicia o cronômetro regressivo.
 */
let alreadyWarned = false; // variável de controle global

function startChallengeTimer(timeLimitInSeconds) {
    const timerElement = document.getElementById('challenge-timer');
    if (!timerElement) return;
    remainingTime = timeLimitInSeconds;
    updateTimerDisplay(remainingTime, timerElement);

    timerInterval = setInterval(() => {
        remainingTime--;
        updateTimerDisplay(remainingTime, timerElement);

        // Quando chegar a zero, apenas mostra o aviso uma vez
        if (remainingTime === 0 && !alreadyWarned) {
            alreadyWarned = true;
            handleTimeOut();
        }
    }, 1000);
}


/**
 * Atualiza o texto do cronômetro na tela.
 */
function updateTimerDisplay(timeInSeconds, element) {
    const isNegative = timeInSeconds < 0;
    const absTime = Math.abs(timeInSeconds);

    const minutes = Math.floor(absTime / 60);
    const seconds = absTime % 60;

    // Adiciona o sinal "-" se for tempo negativo
    const prefix = isNegative ? "-" : "";

    element.textContent = `${prefix}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}


/**
 * Desenha os ícones clicáveis no cenário.
 */
function renderInteractiveItems(items) {
    const scenario = document.getElementById('game-scenario');
    if (!scenario || !items) return;
    scenario.innerHTML = '';
    items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'interactive-item';
        itemElement.style.left = `${item.x}%`;
        itemElement.style.top = `${item.y}%`;
        itemElement.dataset.itemId = item.id;
        itemElement.title = item.title;
        itemElement.innerHTML = `<i class="${item.icon}"></i>`;
        scenario.appendChild(itemElement);
    });
}

/**
 * Adiciona os "ouvintes" de clique para cada item interativo.
 */
function setupItemClickListeners(challenge) {
    const scenario = document.getElementById('game-scenario');
    if (!scenario) return;
    scenario.addEventListener('click', function(event) {
        const clickedItem = event.target.closest('.interactive-item');
        if (!clickedItem || answeredQuestions.includes(clickedItem.dataset.itemId)) {
            return; // Ignora o clique se não for em um item ou se o item já foi respondido.
        }
        const itemId = clickedItem.dataset.itemId;
        const question = challenge.questions.find(q => q.id === itemId);
        if (question) {
            showQuestionModal(question);
        }
    });
}

/**
 * Preenche e exibe o modal com a pergunta e as opções.
 */
function showQuestionModal(question) {
    currentQuestion = question;
    selectedOptionId = null;
    document.getElementById('question-text').textContent = question.text;
    const optionsContainer = document.getElementById('question-options');
    optionsContainer.innerHTML = '';
    question.options.forEach(option => {
        const optionButton = document.createElement('button');
        optionButton.type = 'button';
        optionButton.className = 'btn btn-outline-primary option-btn';
        optionButton.textContent = option.text;
        optionButton.dataset.optionId = option.id;
        optionButton.addEventListener('click', () => {
            document.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('active'));
            optionButton.classList.add('active');
            selectedOptionId = option.id;
        });
        optionsContainer.appendChild(optionButton);
    });
    const questionModal = new bootstrap.Modal(document.getElementById('questionModal'));
    questionModal.show();
}

/**
 * Função executada quando o botão "Responder" do modal é clicado.
 */
function submitAnswer() {
    if (!selectedOptionId) {
        alert("Por favor, selecione uma resposta.");
        return;
    }
    if (!currentQuestion) return;

    const isCorrect = selectedOptionId === currentQuestion.correctAnswer;
    
    if (isCorrect) {
        alert(`Correto! Você ganhou ${currentQuestion.points} pontos.`);
        
        // 1. Atualiza a pontuação na tela
        scoreForThisChallenge += currentQuestion.points;
        document.getElementById('total-score').textContent = scoreForThisChallenge;

        // 2. Marca a pergunta como respondida para evitar repetição
        answeredQuestions.push(currentQuestion.id);

        // 3. Desabilita visualmente o item no cenário
        const answeredItem = document.querySelector(`.interactive-item[data-item-id="${currentQuestion.id}"]`);
        if (answeredItem) {
            answeredItem.style.opacity = '0.5';
            answeredItem.style.cursor = 'default';
        }

        // 4. Verifica se todas as perguntas foram respondidas para finalizar o desafio
        if (answeredQuestions.length === totalQuestions) {
            handleChallengeComplete();
        }
    } else {
        wrongAnswers++; // Conta o erro
        console.log("Número de erros até agora:", wrongAnswers);
        alert("Resposta incorreta. Tente novamente ou procure outra pista.");
    }

    const questionModal = bootstrap.Modal.getInstance(document.getElementById('questionModal'));
    questionModal.hide();
    }

/**
 * Função chamada quando todas as perguntas são respondidas.
 * Ela envia os resultados para o backend.
 */
async function handleChallengeComplete() {
    clearInterval(timerInterval); // Para o cronômetro

    alert(`Parabéns! Você completou o desafio "${currentChallenge.title}" com ${scoreForThisChallenge} pontos.`);
    console.log("Desafio Concluído! Enviando resultados para o backend...");

    // Cálculo do tempo gasto, considerando se entrou em negativo
    let timeSpent;
    if (remainingTime >= 0) {
        // Terminou dentro do tempo limite
        timeSpent = currentChallenge.timeLimit - remainingTime;
    } else {
        // Terminou depois do tempo (tempo negativo)
        timeSpent = currentChallenge.timeLimit + Math.abs(remainingTime);
    }

    // Envia os dados de conclusão
    const response = await progressManager.completeChallenge(
        currentChallenge.id,
        scoreForThisChallenge,
        timeSpent,
        currentChallenge.keyReward,
        wrongAnswers
    );

    if (response && response.success) {
        console.log("Backend confirmou o progresso. Nova chave ganha:", response.new_key_earned);
        alert("Seu progresso foi salvo! Retornando para a tela de estações...");
        setTimeout(() => {
            window.location.href = '/station';
        }, 1500); // Redireciona após 1.5 segundos
    } else {
        alert(
            `Parabéns! Você completou o desafio "${currentChallenge.title}"\n` +
            `Pontuação: ${scoreForThisChallenge}\n` +
            `Erros cometidos: ${wrongAnswers}`
            );
    }
}
/**
 * Função chamada quando o tempo do desafio se esgota.
 */
function handleTimeOut() {
    console.log("O tempo acabou!");
    alert("⏰ Tempo esgotado! Você pode continuar, mas cada segundo a mais será penalizado.");
    // Nenhum redirecionamento aqui
    // O cronômetro segue rodando em valores negativos
}