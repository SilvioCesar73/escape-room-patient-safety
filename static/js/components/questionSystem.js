// Sistema de Gerenciamento de Perguntas e Respostas
// Responsável por quizzes, validação de respostas e feedback

class QuestionSystem {
    constructor() {
        this.currentQuestion = null;
        this.selectedOption = null;
        this.questionModals = {};
        
        this.initializeModals();
        this.initializeEventListeners();
    }

    // Inicializar modais
    initializeModals() {
        this.questionModals = {
            quiz: new bootstrap.Modal(document.getElementById('questionModal')),
            hint: new bootstrap.Modal(document.getElementById('hintModal')),
            result: new bootstrap.Modal(document.getElementById('resultModal'))
        };
    }

    // Inicializar listeners de eventos
    initializeEventListeners() {
        // Botão de enviar resposta
        document.getElementById('submit-answer').addEventListener('click', () => {
            this.submitAnswer();
        });

        // Fechar modal com Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.questionModals.quiz._isShown) {
                this.questionModals.quiz.hide();
            }
        });
    }

    // Mostrar pergunta para um item interativo
    showQuestion(challenge, itemId) {
        const questionIndex = challenge.items.findIndex(item => item.id === itemId);
        
        if (questionIndex >= 0 && questionIndex < challenge.questions.length) {
            this.displayQuestion(challenge, questionIndex);
        } else {
            console.warn('Pergunta não encontrada para o item:', itemId);
            this.showErrorMessage('Pergunta não disponível para este elemento.');
        }
    }

    // Exibir pergunta no modal
    displayQuestion(challenge, questionIndex) {
        const question = challenge.questions[questionIndex];
        
        // Verificar se já foi respondida
        if (progressManager.answeredQuestions[challenge.id]?.some(a => a.questionId === question.id)) {
            this.showInfoMessage('Você já respondeu esta pergunta!');
            return;
        }

        this.currentQuestion = {
            challengeId: challenge.id,
            question: question,
            questionIndex: questionIndex,
            totalQuestions: challenge.questions.length
        };

        // Configurar o modal
        document.getElementById('questionModalTitle').textContent = 
            `Pergunta ${questionIndex + 1} de ${challenge.questions.length}`;
        
        document.getElementById('question-text').textContent = question.text;
        
        const optionsContainer = document.getElementById('question-options');
        optionsContainer.innerHTML = '';

        // Adicionar opções de resposta
        question.options.forEach(option => {
            const button = this.createOptionButton(option);
            optionsContainer.appendChild(button);
        });

        // Resetar seleção
        this.selectedOption = null;

        // Mostrar modal
        this.questionModals.quiz.show();
    }

    // Criar botão de opção
    createOptionButton(option) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'option-btn';
        button.dataset.option = option.id;
        button.textContent = option.text;
        
        button.addEventListener('click', () => {
            this.selectOption(button, option.id);
        });

        return button;
    }

    // Selecionar opção
    selectOption(button, optionId) {
        // Desselecionar opção anterior
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.classList.remove('selected');
        });

        // Selecionar nova opção
        button.classList.add('selected');
        this.selectedOption = optionId;
    }

    // Enviar resposta
    submitAnswer() {
        if (!this.selectedOption) {
            this.showWarningMessage('Por favor, selecione uma opção antes de responder.');
            return;
        }

        if (!this.currentQuestion) {
            this.showErrorMessage('Nenhuma pergunta ativa para responder.');
            return;
        }

        const isCorrect = this.selectedOption === this.currentQuestion.question.correctAnswer;
        
        // Registrar resposta
        progressManager.answerQuestion(
            this.currentQuestion.challengeId,
            this.currentQuestion.question.id,
            isCorrect,
            this.currentQuestion.question.points
        );

        // Fechar modal
        this.questionModals.quiz.hide();

        // Mostrar feedback
        this.showAnswerFeedback(isCorrect);

        // Verificar se todas as perguntas foram respondidas
        this.checkChallengeCompletion();
    }

    // Mostrar feedback da resposta
    showAnswerFeedback(isCorrect) {
        const message = isCorrect ? 
            '✅ Resposta correta! +' + this.currentQuestion.question.points + ' pontos' :
            '❌ Resposta incorreta. Tente novamente na próxima oportunidade.';

        this.showToast(message, isCorrect ? 'success' : 'error');

        // Se correto, verificar se completou o desafio
        if (isCorrect) {
            stationCore.updateProgressUI();
        }
    }

    // Verificar conclusão do desafio
    checkChallengeCompletion() {
        const challengeComplete = progressManager.isChallengeComplete(this.currentQuestion.challengeId);
        
        if (challengeComplete) {
            // Calcular tempo restante em porcentagem
            const timePercentage = progressManager.calculateTimePercentage(
                stationCore.remainingTime,
                stationCore.currentChallenge.timeLimit
            );

            // Completar desafio
            const result = progressManager.completeChallenge(this.currentQuestion.challengeId, timePercentage);
            
            // Mostrar resultado
            this.showChallengeResult(result, timePercentage);
        }
    }

    // Mostrar resultado do desafio
    showChallengeResult(result, timePercentage) {
        const successElement = document.getElementById('success-result');
        const failElement = document.getElementById('fail-result');
        
        successElement.style.display = 'block';
        failElement.style.display = 'none';

        document.getElementById('key-earned').textContent = result.keyType;
        document.getElementById('challenge-score').textContent = result.score;

        // Configurar botões baseado no progresso
        const nextChallenge = progressManager.getNextAvailableChallenge();
        const retryBtn = document.getElementById('retry-btn');
        const nextBtn = document.getElementById('next-challenge-btn');

        if (nextChallenge) {
            retryBtn.style.display = 'none';
            nextBtn.style.display = 'block';
        } else {
            retryBtn.style.display = 'none';
            nextBtn.style.display = 'none';
            document.getElementById('result-title').textContent = 'Parabéns!';
            successElement.querySelector('h4').textContent = 'Todos os Desafios Concluídos!';
        }

        // Mostrar modal de resultado
        this.questionModals.result.show();

        // Log de desempenho
        console.log(`Desafio ${this.currentQuestion.challengeId} completado:`, {
            score: result.score,
            keyType: result.keyType,
            timePercentage: Math.round(timePercentage) + '%',
            totalScore: progressManager.score
        });
    }

    // Sistema de mensagens toast
    showToast(message, type = 'info') {
        // Criar elemento toast se não existir
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
            document.body.appendChild(toastContainer);
        }

        const toastId = 'toast-' + Date.now();
        const toastHtml = `
            <div id="${toastId}" class="toast align-items-center text-white bg-${type} border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body">
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;

        toastContainer.insertAdjacentHTML('beforeend', toastHtml);
        
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, {
            delay: 3000,
            autohide: true
        });
        
        toast.show();

        // Remover elemento após esconder
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }

    // Mensagens de alerta
    showWarningMessage(message) {
        this.showToast(message, 'warning');
    }

    showErrorMessage(message) {
        this.showToast(message, 'danger');
    }

    showInfoMessage(message) {
        this.showToast(message, 'info');
    }

    showSuccessMessage(message) {
        this.showToast(message, 'success');
    }

    // Métodos utilitários
    getQuestionStats(challengeId) {
        return progressManager.getChallengeStats(challengeId);
    }

    // Reiniciar perguntas do desafio (para tentar novamente)
    resetChallengeQuestions(challengeId) {
        if (progressManager.answeredQuestions[challengeId]) {
            delete progressManager.answeredQuestions[challengeId];
            return true;
        }
        return false;
    }

    // Exportar dados de perguntas para analytics
    exportQuestionData() {
        const data = {
            totalAnswered: 0,
            totalCorrect: 0,
            accuracy: 0,
            challenges: {}
        };

        for (let challengeId = 1; challengeId <= 15; challengeId++) {
            const stats = this.getQuestionStats(challengeId);
            data.challenges[challengeId] = stats;
            data.totalAnswered += stats.attempts;
            data.totalCorrect += stats.correctAnswers;
        }

        data.accuracy = data.totalAnswered > 0 ? 
            Math.round((data.totalCorrect / data.totalAnswered) * 100) : 0;

        return data;
    }

    // Obter próxima pergunta não respondida
    getNextUnansweredQuestion(challengeId) {
        const challenge = window.challengeData?.challenges[challengeId];
        if (!challenge || !challenge.questions) return null;

        const answeredIds = progressManager.answeredQuestions[challengeId]?.map(a => a.questionId) || [];
        
        return challenge.questions.find(question => !answeredIds.includes(question.id));
    }
}

// Inicializar o sistema de perguntas
document.addEventListener('DOMContentLoaded', function() {
    if (typeof progressManager !== 'undefined' && typeof stationCore !== 'undefined') {
        window.questionSystem = new QuestionSystem();
        console.log('Sistema de perguntas inicializado');
    } else {
        console.error('Dependências não carregadas para QuestionSystem');
    }
});

// Exportar para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { QuestionSystem };
} else {
    window.QuestionSystem = QuestionSystem;
}