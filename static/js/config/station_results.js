// static/js/config/station_results.js

console.log("station_results.js carregado.");

// Buscar resultados do backend
function fetchStationResults() {
    fetch("/api/get_station_results")
        .then(response => response.json())
        .then(data => {
            console.log("Dados recebidos da API de resultados:", data);
            updateStationUI(data);
        })
        .catch(error => console.error("Falha ao carregar resultados:", error));
}

// Atualizar interface com os resultados do usuário
function updateStationUI(data) {
    if (!data.success || !data.stations) {
        console.error("Resposta inválida ou sem dados:", data);
        return;
    }

    // Percorrer objeto "stations" retornado pelo backend
    Object.entries(data.stations).forEach(([stationId, result]) => {
        const pointsEl = document.getElementById(`earned-points-${stationId}`);
        const timeEl = document.getElementById(`earned-time-${stationId}`);

        if (pointsEl) {
            pointsEl.textContent = result.score ?? "--";
        }
        if (timeEl) {
            // Converter segundos em formato mm:ss
            if (result.time_spent !== null && result.time_spent !== undefined) {
                const minutes = Math.floor(result.time_spent / 60);
                const seconds = result.time_spent % 60;
                timeEl.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;
            } else {
                timeEl.textContent = "--";
            }
        }
    });

    // Se quiser exibir a pontuação total em algum lugar:
    console.log("Pontuação total do usuário:", data.total_score);
}

// Executar assim que a página carregar
document.addEventListener("DOMContentLoaded", () => {
    console.log("Iniciando fetch dos resultados das estações...");
    fetchStationResults();
});
