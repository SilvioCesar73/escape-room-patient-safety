// static/js/challenges/quiz_challenge.js

class QuizChallenge extends BaseChallenge {
    constructor(challengeData) {
        super(challengeData);
        this.answeredQuestions = [];
        this.totalQuestions = Array.isArray(challengeData.quizData) ? challengeData.quizData.length : 0;
        this.selectedOptionId = null;
        this.currentQuestion = null;

        // Novos contadores para integração com BaseChallenge
        this.wrongAnswers = 0;
    }

    async init() {
        console.log("Quiz Challenge iniciado para:", this.challengeData.title);

        const started = await this.startChallenge();
        if (!started) return;

        this.updateScoreDisplay();
        this.startChallengeTimer(this.challengeData.timeLimit);

        this.renderInteractiveItems(this.challengeData.items);
        this.setupItemClickListeners();

        const submitBtn = document.getElementById("submit-answer-btn");
        if (submitBtn) {
            submitBtn.addEventListener("click", () => this.submitAnswer());
        }
    }

    renderInteractiveItems(items) {
        if (!items || !this.gameScenario) return;
        this.gameScenario.innerHTML = ''; // Limpa o cenário antes de renderizar
        items.forEach(item => {
            const itemElement = document.createElement("div");
            itemElement.className = "interactive-item";
            itemElement.style.left = `${item.x}%`;
            itemElement.style.top = `${item.y}%`;
            itemElement.innerHTML = `<i class="bi ${item.icon}"></i>`;
            itemElement.dataset.itemId = item.id;
            itemElement.title = item.title;
            this.gameScenario.appendChild(itemElement);
        });
    }

    setupItemClickListeners() {
        document.querySelectorAll(".interactive-item").forEach(item => {
            item.addEventListener("click", (event) => {
                const itemId = event.currentTarget.dataset.itemId;
                this.handleItemClick(itemId);
            });
        });
    }

    handleItemClick(itemId) {
        if (this.answeredQuestions.includes(itemId)) {
            alert("Você já respondeu a esta pergunta!");
            return;
        }
        
        this.currentQuestion = this.challengeData.quizData.find(q => q.id === itemId);
        if (this.currentQuestion) {
            this.showQuestionModal(this.currentQuestion);
        }
    }

    showQuestionModal(question) {
        document.getElementById("questionModalLabel").textContent = question.title || "Pergunta do Desafio";
        document.getElementById("question-text").textContent = question.text;

        const optionsContainer = document.getElementById("question-options");
        optionsContainer.innerHTML = "";
        this.selectedOptionId = null;

        question.options.forEach(option => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "btn btn-outline-primary text-start";
            button.textContent = option.text;
            button.dataset.optionId = option.id;

            button.addEventListener("click", () => {
                document.querySelectorAll("#question-options .btn").forEach(btn => {
                    btn.classList.remove("active", "btn-primary");
                    btn.classList.add("btn-outline-primary");
                });
                button.classList.add("active", "btn-primary");
                button.classList.remove("btn-outline-primary");
                this.selectedOptionId = option.id;
            });

            optionsContainer.appendChild(button);
        });

        const questionModal = new bootstrap.Modal(document.getElementById("questionModal"));
        questionModal.show();
    }

    submitAnswer() {
        if (!this.selectedOptionId) {
            alert("Por favor, selecione uma opção.");
            return;
        }

        const isCorrect = this.selectedOptionId === this.currentQuestion.correctAnswer;
        const questionModalEl = document.getElementById('questionModal');
        const questionModal = bootstrap.Modal.getInstance(questionModalEl);

        if (isCorrect) {
            this.answeredQuestions.push(this.currentQuestion.id);
            alert("Resposta Correta!");

            const itemElement = document.querySelector(`.interactive-item[data-item-id="${this.currentQuestion.id}"]`);
            if (itemElement) {
                itemElement.style.background = "rgba(40, 167, 69, 0.7)";
                itemElement.style.cursor = "default";
                itemElement.innerHTML = '<i class="bi bi-check-lg"></i>';
            }

            if (this.answeredQuestions.length === this.totalQuestions) {
                // Não atribui mais pontos manualmente, deixa o BaseChallenge calcular
                if (questionModal) {
                    questionModal.hide();
                    questionModalEl.addEventListener('hidden.bs.modal', () => {
                        this.completeChallenge(true);
                    }, { once: true });
                } else {
                    this.completeChallenge(true);
                }
            } else {
                if (questionModal) questionModal.hide();
            }
        } else {
            // Contabiliza erro para o cálculo centralizado
            this.wrongAnswers++;
            alert("Resposta Incorreta. Tente novamente!");
            if (questionModal) questionModal.hide();
        }
    }
}

// --- Ponto de Entrada ---
document.addEventListener('DOMContentLoaded', () => {
    if (typeof currentChallengeData !== 'undefined' && currentChallengeData.type === 'quiz') {
        const challenge = new QuizChallenge(currentChallengeData);
        challenge.init();
    }
});
