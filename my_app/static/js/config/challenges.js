// /static/js/config/challenges.js

console.log("challenges.js foi carregado e está sendo executado.");

document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM completamente carregado. Iniciando a lógica do jogo.");
    initializeStation();
    const stationsContainer = document.getElementById('stations-container');
    if (stationsContainer) {
        stationsContainer.addEventListener('click', function(event) {
            const startButton = event.target.closest('.start-challenge-btn');
            if (!startButton || startButton.disabled) {
                return;
            }
            event.preventDefault();
            const challengeId = parseInt(startButton.dataset.challengeId, 10);
            if (challengeId) {
                handleStartChallenge(challengeId);
            }
        });
        console.log("Ouvinte de cliques para os botões de desafio foi configurado.");
    } else {
        console.error("ERRO: Container com id 'stations-container' não foi encontrado no HTML.");
    }
});

async function initializeStation() {
    console.log("1. Função initializeStation() chamada.");
    console.log("2. Chamando progressManager.getProgress() para buscar dados do backend...");
    const progress = await progressManager.getProgress();
    if (progress && progress.success) {
        console.log("3. Sucesso! Dados recebidos do backend:", progress);
        updateStationCards(progress.current_challenge_id, progress.earned_keys);
    } else {
        console.error("4. FALHA ao buscar dados do backend. Resposta recebida:", progress);
        alert("Houve um erro ao carregar seu progresso. Por favor, faça o login novamente e, se o erro persistir, contate o suporte.");
    }
}

async function handleStartChallenge(challengeId) {
    console.log(`Botão 'Iniciar' clicado para o desafio ${challengeId}. Pedindo autorização para a API...`);

    // CORREÇÃO APLICADA AQUI: Passando 'challengeId' como argumento.
    const response = await progressManager.startChallenge(challengeId);

    if (response && response.success) {
        console.log(`API autorizou o início do desafio ${challengeId}. Redirecionando...`);
        window.location.href = `/station/${challengeId}`;
    } else {
        console.error(`API negou o início do desafio ${challengeId}. Motivo:`, response ? response.error : 'Sem resposta');
        alert('Você ainda não pode iniciar este desafio! Complete os desafios anteriores para obter a chave necessária.');
    }
}

function updateStationCards(currentChallengeId, earnedKeys) {
    console.log(`Atualizando cards. Desafio atual: ${currentChallengeId}.`);
    const allButtons = document.querySelectorAll('.start-challenge-btn');
    allButtons.forEach(button => {
        const challengeId = parseInt(button.dataset.challengeId, 10);
        const card = button.closest('.station-card');
        if (!card) return;
        const statusBadge = card.querySelector('.status-badge');
        if (challengeId < currentChallengeId) {
            button.disabled = true;
            button.innerHTML = '✅ Concluído';
            button.classList.remove('btn-success', 'btn-secondary');
            button.classList.add('btn-outline-success');
            if (statusBadge) {
                statusBadge.textContent = 'Concluído';
                statusBadge.className = 'status-badge bg-info';
            }
        } else if (challengeId === currentChallengeId) {
            button.disabled = false;
            button.innerHTML = '<i class="bi bi-play-fill me-2"></i>Iniciar Estação';
            button.classList.remove('btn-secondary');
            button.classList.add('btn-success');
            if (statusBadge) {
                statusBadge.textContent = '🔓 Disponível';
                statusBadge.className = 'status-badge bg-success pulse';
            }
        } else {
            button.disabled = true;
            button.innerHTML = `🔒 Requer chave da Estação ${challengeId - 1}`;
            button.classList.remove('btn-success');
            button.classList.add('btn-secondary');
            if (statusBadge) {
                statusBadge.textContent = '🔒 Bloqueado';
                statusBadge.className = 'status-badge bg-secondary';
            }
        }
    });
    console.log("Cards atualizados com sucesso.");
}
