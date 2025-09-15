// static/js/challenges/memory_challenge.js

class MemoryChallenge extends BaseChallenge {
    constructor(challengeData) {
        super(challengeData);
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.lockBoard = false;
        this.totalPairs = this.challengeData.memoryData.images.length;

        // Contadores para o cálculo centralizado
        this.wrongAnswers = 0;
        this.totalQuestions = this.totalPairs;
    }

    async init() {
        console.log("Memory Challenge iniciado para:", this.challengeData.title);

        const started = await this.startChallenge();
        if (!started) return;

        document.getElementById("total-score").textContent = this.scoreForThisChallenge;
        this.startChallengeTimer(this.challengeData.timeLimit);

        this.renderMemoryGame();
    }

    renderMemoryGame() {
        const wrapper = document.createElement("div");
        wrapper.className = "challenge-card";

        const instructions = document.createElement("p");
        instructions.className = "lead mb-4 fw-bold text-center";
        instructions.textContent = this.challengeData.memoryData.instructions;
        wrapper.appendChild(instructions);

        const memoryContainer = document.createElement("div");
        memoryContainer.id = "memory-game-container";
        memoryContainer.className = "memory-grid";

        // cria pares duplicados a partir das imagens
        const cards = [];
        this.challengeData.memoryData.images.forEach((imgPath, index) => {
            const card1 = this.createCard(`card_${index}_1`, imgPath);
            const card2 = this.createCard(`card_${index}_2`, imgPath);
            cards.push(card1, card2);
        });

        this.shuffleArray(cards);
        cards.forEach(card => memoryContainer.appendChild(card));
        wrapper.appendChild(memoryContainer);

        this.gameScenario.appendChild(wrapper);
    }

    createCard(cardId, imgPath) {
        const card = document.createElement("div");
        card.classList.add("memory-card");
        card.dataset.cardValue = imgPath;

        card.innerHTML = `
            <div class="card-inner">
                <div class="card-front"></div>
                <div class="card-back">
                    <img src="${staticUrl}${imgPath}" alt="Card Image" style="max-width:100%; max-height:100%; object-fit:contain;">
                </div>
            </div>`;

        card.addEventListener("click", () => this.flipCard(card));
        return card;
    }

    flipCard(card) {
        if (this.lockBoard || card.classList.contains("flipped")) return;

        card.classList.add("flipped");
        this.flippedCards.push(card);

        if (this.flippedCards.length === 2) {
            this.checkForMatch();
        }
    }

    checkForMatch() {
        const [card1, card2] = this.flippedCards;
        const isMatch = card1.dataset.cardValue === card2.dataset.cardValue;

        if (isMatch) {
            this.matchedPairs++;

            if (this.matchedPairs === this.totalPairs) {
                clearInterval(this.timerInterval);
                alert("Parabéns! Você encontrou todos os pares.");
                this.completeChallenge(true); // cálculo centralizado
            }
        } else {
            this.wrongAnswers++; // contabiliza erro para o cálculo final
            this.lockBoard = true;
            setTimeout(() => {
                card1.classList.remove("flipped");
                card2.classList.remove("flipped");
                this.lockBoard = false;
            }, 1000);
        }

        this.flippedCards = [];
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}

// 🔑 Ponto de entrada automático
document.addEventListener("DOMContentLoaded", () => {
    if (typeof window.currentChallengeData !== "undefined" && window.currentChallengeData.type === "memory") {
        const challenge = new MemoryChallenge(window.currentChallengeData);
        challenge.init();
    }
});
