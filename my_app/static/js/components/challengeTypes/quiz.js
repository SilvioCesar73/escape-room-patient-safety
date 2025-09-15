// Sistema Específico para Desafios do Tipo Quiz
// Gerencia quizzes com múltiplas perguntas e validação

class QuizSystem {
    constructor() {
        this.currentQuiz = null;
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.quizTimer = null;
        this.timePerQuestion = 30; // segundos por pergunta padrão
        
        this.initializeQuizElements();
        this.initializeEventListeners();
    }

    // Inicializar elementos do quiz
    initializeQuizElements() {
        // Criar container específico para quiz se não existir
        if (!document.getElementById('quiz-container')) {
            const quizContainer = document.createElement('div');
            quizContainer.id = 'quiz-container';
            quizContainer.className = 'quiz-container';
            quizContainer.style.display = 'none';
            document.body.appendChild(quizContainer);
        }
    }

    // Inicializar listeners de eventos
    initializeEventListeners() {
        // Eventos de teclado para navegação no quiz
        document.addEventListener('keydown', (e) => {
            if (!this.currentQuiz) return;

            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.previousQuestion();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.nextQuestion();
                    break;
                case '1':
                case '2':
                case '3':
                case '4':
                    e.preventDefault();
                    this.selectOptionByNumber(parseInt(e.key));
                    break;
            }
        });
    }

    // Iniciar quiz
    startQuiz(quizData) {
        if (!quizData || !quizData.questions || quizData.questions.length === 0) {
            console.error('Dados do quiz inválidos');
            return false;
        }

        this.currentQuiz = quizData;
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.timePerQuestion = quizData.timePerQuestion || 30;

        // Iniciar temporizador do quiz
        this.startQuizTimer();

        // Mostrar primeira pergunta
        this.showCurrentQuestion();

        console.log(`Quiz iniciado: ${quizData.title} com ${quizData.questions.length} perguntas`);
        return true;
    }

    // Mostrar pergunta atual
    showCurrentQuestion() {
        if (!this.currentQuiz) return;

        const question = this.currentQuiz.questions[this.currentQuestionIndex];
        if (!question) return;

        // Usar o modal system para mostrar a pergunta
        if (window.modalSystem) {
            modalSystem.show('questionModal', {
                data: {
                    questionNumber: this.currentQuestionIndex + 1,
                    totalQuestions: this.currentQuiz.questions.length,
                    questionText: question.text,
                    options: question.options,
                    timeLimit: this.timePerQuestion
                },
                onConfirm: (data) => this.handleAnswer(data),
                onCancel: () => this.skipQuestion()
            });
        } else {
            // Fallback se modalSystem não estiver disponível
            this.showQuestionFallback(question);
        }

        // Atualizar progresso
        this.updateQuizProgress();
    }

    // Manipular resposta do usuário
    handleAnswer(answerData) {
        if (!this.currentQuiz) return;

        const question = this.currentQuiz.questions[this.currentQuestionIndex];
        const isCorrect = answerData.selectedOption === question.correctAnswer;

        // Registrar resposta
        this.userAnswers.push({
            questionId: question.id,
            selectedOption: answerData.selectedOption,
            isCorrect: isCorrect,
            timeSpent: answerData.timeSpent || 0,
            timestamp: new Date().toISOString()
        });

        // Dar feedback visual
        this.showAnswerFeedback(isCorrect, question.points);

        // Atualizar progresso no progressManager
        if (window.progressManager) {
            progressManager.answerQuestion(
                this.currentQuiz.id,
                question.id,
                isCorrect,
                question.points
            );
        }

        // Avançar para próxima pergunta ou finalizar
        setTimeout(() => {
            if (this.currentQuestionIndex < this.currentQuiz.questions.length - 1) {
                this.nextQuestion();
            } else {
                this.finishQuiz();
            }
        }, 1500);
    }

    // Pular pergunta
    skipQuestion() {
        this.userAnswers.push({
            questionId: this.currentQuiz.questions[this.currentQuestionIndex].id,
            selectedOption: null,
            isCorrect: false,
            skipped: true,
            timestamp: new Date().toISOString()
        });

        if (this.currentQuestionIndex < this.currentQuiz.questions.length - 1) {
            this.nextQuestion();
        } else {
            this.finishQuiz();
        }
    }

    // Próxima pergunta
    nextQuestion() {
        if (this.currentQuestionIndex < this.currentQuiz.questions.length - 1) {
            this.currentQuestionIndex++;
            this.showCurrentQuestion();
        }
    }

    // Pergunta anterior
    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.showCurrentQuestion();
        }
    }

    // Finalizar quiz
    finishQuiz() {
        // Parar temporizador
        this.stopQuizTimer();

        // Calcular resultados
        const results = this.calculateResults();

        // Mostrar resultados
        this.showQuizResults(results);

        // Atualizar progresso geral
        if (window.progressManager) {
            const allCorrect = this.userAnswers.every(answer => answer.isCorrect);
            if (allCorrect) {
                progressManager.completeChallenge(this.currentQuiz.id, 100);
            }
        }

        console.log('Quiz finalizado:', results);
    }

    // Calcular resultados do quiz
    calculateResults() {
        const totalQuestions = this.currentQuiz.questions.length;
        const correctAnswers = this.userAnswers.filter(answer => answer.isCorrect).length;
        const skippedQuestions = this.userAnswers.filter(answer => answer.skipped).length;
        const totalPoints = this.userAnswers.reduce((sum, answer) => {
            return sum + (answer.isCorrect ? this.getQuestionPoints(answer.questionId) : 0);
        }, 0);

        const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
        const averageTime = this.userAnswers.reduce((sum, answer) => sum + (answer.timeSpent || 0), 0) / totalQuestions;

        return {
            totalQuestions,
            correctAnswers,
            skippedQuestions,
            totalPoints,
            accuracy: Math.round(accuracy),
            averageTime: Math.round(averageTime),
            perfectScore: correctAnswers === totalQuestions
        };
    }

    // Obter pontos de uma pergunta
    getQuestionPoints(questionId) {
        const question = this.currentQuiz.questions.find(q => q.id === questionId);
        return question ? question.points : 0;
    }

    // Mostrar resultados do quiz
    showQuizResults(results) {
        if (window.modalSystem) {
            const resultsHtml = `
                <div class="quiz-results">
                    <h4>Resultado do Quiz</h4>
                    <div class="results-grid">
                        <div class="result-item">
                            <span class="result-label">Pontuação:</span>
                            <span class="result-value">${results.totalPoints} pontos</span>
                        </div>
                        <div class="result-item">
                            <span class="result-label">Acertos:</span>
                            <span class="result-value">${results.correctAnswers}/${results.totalQuestions}</span>
                        </div>
                        <div class="result-item">
                            <span class="result-label">Precisão:</span>
                            <span class="result-value">${results.accuracy}%</span>
                        </div>
                        <div class="result-item">
                            <span class="result-label">Tempo médio:</span>
                            <span class="result-value">${results.averageTime}s por pergunta</span>
                        </div>
                    </div>
                    ${results.perfectScore ? `
                        <div class="perfect-score">
                            <i class="bi bi-trophy-fill"></i>
                            Pontuação Perfeita!
                        </div>
                    ` : ''}
                </div>
            `;

            modalSystem.show('resultModal', {
                data: {
                    title: 'Quiz Concluído!',
                    content: resultsHtml
                },
                onConfirm: () => this.cleanupQuiz()
            });
        }
    }

    // Limpar quiz
    cleanupQuiz() {
        this.currentQuiz = null;
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.stopQuizTimer();
    }

    // Iniciar temporizador do quiz
    startQuizTimer() {
        this.stopQuizTimer();
        
        this.quizTimer = setInterval(() => {
            // Atualizar timer da pergunta atual se necessário
            this.updateQuestionTimer();
        }, 1000);
    }

    // Parar temporizador do quiz
    stopQuizTimer() {
        if (this.quizTimer) {
            clearInterval(this.quizTimer);
            this.quizTimer = null;
        }
    }

    // Atualizar timer da pergunta
    updateQuestionTimer() {
        // Implementar se necessário para perguntas com tempo individual
    }

    // Mostrar feedback da resposta
    showAnswerFeedback(isCorrect, points) {
        if (window.questionSystem) {
            const message = isCorrect ?
                `✅ Correto! +${points} pontos` :
                '❌ Incorreto. Tente novamente.';
            
            questionSystem.showToast(message, isCorrect ? 'success' : 'error');
        }
    }

    // Atualizar progresso do quiz
    updateQuizProgress() {
        const progress = Math.round(((this.currentQuestionIndex + 1) / this.currentQuiz.questions.length) * 100);
        
        // Atualizar UI de progresso se disponível
        if (window.stationCore) {
            stationCore.updateProgressUI();
        }
    }

    // Selecionar opção por número (1-4)
    selectOptionByNumber(optionNumber) {
        if (optionNumber >= 1 && optionNumber <= 4) {
            const optionLetters = ['a', 'b', 'c', 'd'];
            const selectedOption = optionLetters[optionNumber - 1];
            
            // Simular clique na opção
            const optionElement = document.querySelector(`[data-option="${selectedOption}"]`);
            if (optionElement) {
                optionElement.click();
            }
        }
    }

    // Fallback para mostrar pergunta (sem modalSystem)
    showQuestionFallback(question) {
        const quizContainer = document.getElementById('quiz-container');
        if (!quizContainer) return;

        const questionHtml = `
            <div class="quiz-question">
                <div class="quiz-header">
                    <h5>Pergunta ${this.currentQuestionIndex + 1}/${this.currentQuiz.questions.length}</h5>
                    <div class="quiz-timer" id="quiz-timer">${this.timePerQuestion}s</div>
                </div>
                <div class="quiz-text">${question.text}</div>
                <div class="quiz-options">
                    ${question.options.map((option, index) => `
                        <button class="quiz-option" data-option="${option.id}" 
                                onclick="quizSystem.selectOption('${option.id}')">
                            <span class="option-number">${index + 1}</span>
                            <span class="option-text">${option.text}</span>
                        </button>
                    `).join('')}
                </div>
                <div class="quiz-navigation">
                    <button onclick="quizSystem.previousQuestion()" 
                            ${this.currentQuestionIndex === 0 ? 'disabled' : ''}>
                        ← Anterior
                    </button>
                    <button onclick="quizSystem.skipQuestion()">
                        Pular
                    </button>
                    <button onclick="quizSystem.nextQuestion()" 
                            ${this.currentQuestionIndex === this.currentQuiz.questions.length - 1 ? 'disabled' : ''}>
                        Próxima →
                    </button>
                </div>
            </div>
        `;

        quizContainer.innerHTML = questionHtml;
        quizContainer.style.display = 'block';
    }

    // Selecionar opção (para fallback)
    selectOption(optionId) {
        if (!this.currentQuiz) return;

        const question = this.currentQuiz.questions[this.currentQuestionIndex];
        const isCorrect = optionId === question.correctAnswer;

        this.handleAnswer({
            selectedOption: optionId,
            timeSpent: 0 // Tempo não controlado no fallback
        });
    }

    // Obter estatísticas do quiz
    getQuizStats() {
        if (!this.currentQuiz) return null;

        return {
            quizId: this.currentQuiz.id,
            totalQuestions: this.currentQuiz.questions.length,
            questionsAnswered: this.userAnswers.length,
            correctAnswers: this.userAnswers.filter(a => a.isCorrect).length,
            currentQuestion: this.currentQuestionIndex + 1,
            userAnswers: this.userAnswers
        };
    }

    // Reiniciar quiz
    restartQuiz() {
        if (this.currentQuiz) {
            this.cleanupQuiz();
            this.startQuiz(this.currentQuiz);
        }
    }

    // Pausar quiz
    pauseQuiz() {
        this.stopQuizTimer();
        // Salvar estado atual se necessário
    }

    // Continuar quiz pausado
    resumeQuiz() {
        this.startQuizTimer();
        this.showCurrentQuestion();
    }
}

// Inicializar o sistema de quiz
document.addEventListener('DOMContentLoaded', function() {
    window.quizSystem = new QuizSystem();
    console.log('Sistema de quiz inicializado');

    // Integrar com o stationCore
    if (window.stationCore) {
        // Override para lidar com quizzes
        const originalHandleItemInteraction = stationCore.handleItemInteraction;
        stationCore.handleItemInteraction = function(itemId, challenge) {
            if (challenge.type === 'quiz') {
                quizSystem.startQuiz(challenge);
            } else {
                originalHandleItemInteraction.call(this, itemId, challenge);
            }
        };
    }
});

// Exportar para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { QuizSystem };
} else {
    window.QuizSystem = QuizSystem;
}