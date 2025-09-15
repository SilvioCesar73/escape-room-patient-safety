// static/js/challenges/ordering_challenge.js

class OrderingChallenge extends BaseChallenge {
    constructor(challengeData) {
        super(challengeData);
        this.currentOrder = [];

        // Contadores para cálculo centralizado
        this.wrongAnswers = 0;
        this.totalQuestions = (challengeData.orderingData?.items?.length) || 1;
    }

    async init() {
        console.log("Ordering Challenge iniciado para:", this.challengeData.title);

        const started = await this.startChallenge();
        if (!started) return;

        document.getElementById("total-score").textContent = this.scoreForThisChallenge;
        this.startChallengeTimer(this.challengeData.timeLimit);

        this.renderOrderingItems();
        this.setupDragAndDrop();
        this.setupSubmitButton();
    }

    renderOrderingItems() {
        const orderingContainer = document.createElement("div");
        orderingContainer.id = "ordering-container";

        // estilos de card centralizado
        orderingContainer.className = "card shadow-lg p-4";
        orderingContainer.style.maxWidth = "650px";
        orderingContainer.style.margin = "2rem auto";
        orderingContainer.style.background = "rgba(255, 255, 255, 0.9)";
        orderingContainer.style.borderRadius = "1rem";

        const instructions = document.createElement("p");
        instructions.className = "lead mb-4 fw-bold text-center";
        instructions.textContent = this.challengeData.orderingData.instructions;
        orderingContainer.appendChild(instructions);

        const sortableList = document.createElement("ul");
        sortableList.id = "sortable-list";
        sortableList.className = "list-group";

        this.currentOrder = [...this.challengeData.orderingData.items];
        this.shuffleArray(this.currentOrder);

        this.currentOrder.forEach(item => {
            const listItem = document.createElement("li");
            listItem.className = "list-group-item mb-2 p-3 bg-light border rounded";
            listItem.textContent = item.text;
            listItem.dataset.itemId = item.id;
            listItem.draggable = true;
            listItem.style.cursor = "grab";
            sortableList.appendChild(listItem);
        });

        orderingContainer.appendChild(sortableList);

        const submitButton = document.createElement("button");
        submitButton.id = "submit-ordering-btn";
        submitButton.className = "btn btn-success mt-4 w-100";
        submitButton.textContent = "Verificar Ordem";
        orderingContainer.appendChild(submitButton);

        this.gameScenario.appendChild(orderingContainer);
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    setupDragAndDrop() {
        const sortableList = document.getElementById("sortable-list");
        let draggedItem = null;

        sortableList.addEventListener("dragstart", (e) => {
            draggedItem = e.target;
            e.dataTransfer.effectAllowed = "move";
            setTimeout(() => { draggedItem.style.display = "none"; }, 0);
        });

        sortableList.addEventListener("dragover", (e) => {
            e.preventDefault();
            const afterElement = this.getDragAfterElement(sortableList, e.clientY);
            if (afterElement == null) {
                sortableList.appendChild(draggedItem);
            } else {
                sortableList.insertBefore(draggedItem, afterElement);
            }
        });

        sortableList.addEventListener("dragend", () => {
            draggedItem.style.display = "block";
            draggedItem = null;
            this.updateCurrentOrder();
        });
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll("li:not(.dragging)")];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    updateCurrentOrder() {
        this.currentOrder = Array.from(document.querySelectorAll("#sortable-list li"))
            .map(li => ({ id: li.dataset.itemId, text: li.textContent }));
    }

    setupSubmitButton() {
        const submitButton = document.getElementById("submit-ordering-btn");
        if (submitButton) {
            submitButton.addEventListener("click", () => this.checkOrder());
        }
    }

    checkOrder() {
        const correctOrder = this.challengeData.orderingData.correctOrder;
        const userOrder = this.currentOrder.map(item => item.id);
        const isCorrect = JSON.stringify(userOrder) === JSON.stringify(correctOrder);

        if (isCorrect) {
            alert("Ordem correta! Desafio concluído.");
            clearInterval(this.timerInterval);
            this.completeChallenge(true); // agora o BaseChallenge calcula o score final
        } else {
            this.wrongAnswers++; // contabiliza erro
            alert("Ordem incorreta. Tente novamente!");
        }
    }
}

// 🔑 Ponto de entrada automático
document.addEventListener("DOMContentLoaded", () => {
    if (typeof window.currentChallengeData !== "undefined" && window.currentChallengeData.type === "ordering") {
        const challenge = new OrderingChallenge(window.currentChallengeData);
        challenge.init();
    }
});
