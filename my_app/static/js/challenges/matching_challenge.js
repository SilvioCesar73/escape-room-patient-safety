// static/js/challenges/matching_challenge.js

class MatchingChallenge extends BaseChallenge {
    constructor(challengeData) {
        super(challengeData);
        this.selectedMatches = {};

        // Contadores para o cálculo centralizado
        this.wrongAnswers = 0;
        this.totalQuestions = (challengeData.matchingData?.matches?.length) || 1;
    }

    async init() {
        console.log("Matching Challenge iniciado para:", this.challengeData.title);

        const started = await this.startChallenge();
        if (!started) return;

        this.updateScoreDisplay();
        this.startChallengeTimer(this.challengeData.timeLimit);

        this.renderMatchingInterface();
    }

    renderMatchingInterface() {
        const container = document.createElement("div");
        container.className = "card shadow-lg p-4";
        container.style.maxWidth = "800px";
        container.style.margin = "2rem auto";
        container.style.background = "rgba(255,255,255,0.9)";
        container.style.borderRadius = "1rem";

        const instructions = document.createElement("p");
        instructions.className = "lead mb-3 fw-bold text-center";
        instructions.textContent = this.challengeData.matchingData.instructions;
        container.appendChild(instructions);

        const row = document.createElement("div");
        row.className = "row";

        const leftCol = document.createElement("div");
        leftCol.className = "col-md-6";
        const rightCol = document.createElement("div");
        rightCol.className = "col-md-6";

        const terms = [...this.challengeData.matchingData.matches];
        const definitions = [...terms].sort(() => Math.random() - 0.5);

        // termos
        terms.forEach(pair => {
            const termBox = document.createElement("div");
            termBox.className = "term-box p-2 mb-2 border bg-light rounded shadow-sm";
            termBox.textContent = pair.term;
            termBox.dataset.term = pair.term;
            termBox.draggable = true;
            termBox.addEventListener("dragstart", e => e.dataTransfer.setData("text/plain", pair.term));
            leftCol.appendChild(termBox);
        });

        // definições
        definitions.forEach(pair => {
            const defBox = document.createElement("div");
            defBox.className = "definition-box p-2 mb-2 border bg-white rounded shadow-sm";
            defBox.dataset.definition = pair.definition;

            const label = document.createElement("div");
            label.textContent = pair.definition;
            label.className = "text-muted mb-1";
            defBox.appendChild(label);

            defBox.addEventListener("dragover", e => e.preventDefault());
            defBox.addEventListener("drop", e => {
                e.preventDefault();
                const term = e.dataTransfer.getData("text/plain");
                this.selectedMatches[term] = pair.definition;

                defBox.querySelectorAll(".term-assigned").forEach(el => el.remove());
                const assigned = document.createElement("div");
                assigned.className = "term-assigned bg-primary text-white p-1 mt-1 rounded";
                assigned.textContent = term;
                defBox.appendChild(assigned);
            });

            rightCol.appendChild(defBox);
        });

        row.appendChild(leftCol);
        row.appendChild(rightCol);
        container.appendChild(row);

        const submitButton = document.createElement("button");
        submitButton.className = "btn btn-success mt-4 w-100";
        submitButton.textContent = "Verificar Respostas";
        submitButton.addEventListener("click", () => this.checkAnswers());
        container.appendChild(submitButton);

        this.gameScenario.appendChild(container);
    }

    checkAnswers() {
        const correctMatches = this.challengeData.matchingData.matches;
        let correctCount = 0;

        correctMatches.forEach(pair => {
            if (this.selectedMatches[pair.term] === pair.definition) {
                correctCount++;
            }
        });

        if (correctCount === correctMatches.length) {
            alert("Parabéns! Todas as correspondências estão corretas.");
            clearInterval(this.timerInterval);
            this.completeChallenge(true); // cálculo centralizado
        } else {
            this.wrongAnswers++; // contabiliza erro
            alert(`Você acertou ${correctCount} de ${correctMatches.length}. Continue tentando!`);
        }
    }
}

// Entrada automática
document.addEventListener("DOMContentLoaded", () => {
    if (typeof window.currentChallengeData !== "undefined" && window.currentChallengeData.type === "matching") {
        const challenge = new MatchingChallenge(window.currentChallengeData);
        challenge.init();
    }
});
