# /app/challenges_data.py

challenges = {
    # --- ESTAÇÃO 1: Quiz ---
    1: {
        "id": 1, "title": "Identificação segura do recém-nascido", "type": "quiz",
        "timeLimit": 90, "points": 5, "background": "img/cenario-maternidade.jpg",
        "requiredKey": None, "keyReward": "chave_estacao_1",
        "items": [
            {"id": "q1", "x": 25, "y": 60, "icon": "bi-card-checklist", "title": "Pulseira de Identificação"},
            {"id": "q2", "x": 50, "y": 40, "icon": "bi-clipboard2-plus", "title": "Momento da Colocação"},
            {"id": "q3", "x": 75, "y": 60, "icon": "bi-arrow-repeat", "title": "Procedimento de Troca"},
            {"id": "q4", "x": 50, "y": 80, "icon": "bi-shield-check", "title": "Segurança na Alta"}
        ],
        "quizData": [
            {"id": "q1", "text": "Quais informações devem constar na pulseira do recém-nascido?", "options": [{"id": "a", "text": "Apenas nome da mãe"}, {"id": "b", "text": "Nome da mãe, data/hora de nascimento, sexo e registro"}, {"id": "c", "text": "Apenas o sexo do bebê"}], "correctAnswer": "b"},
            {"id": "q2", "text": "Quando a pulseira deve ser colocada?", "options": [{"id": "a", "text": "Imediatamente após o nascimento"}, {"id": "b", "text": "Após o primeiro banho"}, {"id": "c", "text": "No momento da alta"}], "correctAnswer": "a"},
            {"id": "q3", "text": "Se a pulseira de identificação do bebê cair, qual é o procedimento correto?", "options": [{"id": "a", "text": "Avisar a enfermagem apenas no próximo check-up"}, {"id": "b", "text": "Os pais devem tentar recolocá-la"}, {"id": "c", "text": "Notificar a enfermagem imediatamente para nova emissão e conferência"}], "correctAnswer": "c"},
            {"id": "q4", "text": "No momento da alta, qual ação é fundamental para prevenir a troca de bebês?", "options": [{"id": "a", "text": "Apenas assinar os documentos de saída"}, {"id": "b", "text": "Conferir os dados da pulseira da mãe e do bebê na presença de um profissional"}, {"id": "c", "text": "Verificar se a roupa do bebê é a mesma que os pais trouxeram"}], "correctAnswer": "b"}
        ]
    },
    # --- ESTAÇÃO 2: Ordering ---
    2: {
        "id": 2, "title": "Administração de medicamentos pediátricos", "type": "ordering",
        "timeLimit": 90, "points": 7, "background": "img/cenario-enfermaria.jpg",
        "requiredKey": "chave_estacao_1", "keyReward": "chave_estacao_2",
        "orderingData": {
            "instructions": "Ordene os passos para a administração segura de medicamentos pediátricos.",
            "items": [
                {"id": "p1", "text": "Verificar a prescrição médica e os '5 Certos'"},
                {"id": "p2", "text": "Calcular a dose exata com base no peso da criança"},
                {"id": "p3", "text": "Realizar a dupla checagem da dose com outro profissional"},
                {"id": "p4", "text": "Administrar o medicamento ao paciente correto"},
                {"id": "p5", "text": "Registrar a administração em prontuário imediatamente"}
            ],
            "correctOrder": ["p1", "p2", "p3", "p4", "p5"]
        }
    },
    # --- ESTAÇÃO 3: Memory ---
    3: {
        "id": 3,
        "title": "Higienização das mãos",
        "type": "memory",
        "timeLimit": 120,
        "points": 4,
        "background": "img/cenario-uti.jpg",
        "requiredKey": "chave_estacao_2",
        "keyReward": "chave_estacao_3",
        "memoryData": {
            "instructions": "Encontre os pares corretos para a higienização das mãos.",
            "images": [
                "img/agua.jpg",
                "img/sabonete.jpg",
                "img/esfregar_maos.jpg",
                "img/mao_limpa.jpg",
                "img/enxaguar.jpg",
                "img/mao_suja.jpg",
                "img/papel_toalha.jpg"
            ]
        }
    },


    # --- ESTAÇÃO 4: Matching ---
    4: {
        "id": 4, "title": "Segurança na nutrição enteral", "type": "matching",
        "timeLimit": 90, "points": 6, "background": "img/cenario-farmacia.jpg",
        "requiredKey": "chave_estacao_3", "keyReward": "chave_estacao_4",
        "matchingData": {
            "instructions": "Correlacione os termos às suas definições corretas.",
            "matches": [
                {"term": "Verificação da sonda", "definition": "Deve ser feita antes de cada administração."},
                {"term": "Bomba de infusão", "definition": "Garante controle rigoroso do volume e velocidade."},
                {"term": "Cabeceira elevada", "definition": "Reduz o risco de aspiração durante a dieta."},
                {"term": "Sinais de intolerância", "definition": "Vômitos e distensão abdominal."},
                {"term": "Troca do equipo", "definition": "Deve ser realizada a cada 24 horas para prevenir infecção."},
                {"term": "Registro em prontuário", "definition": "Anotar volume, horário e tipo de dieta administrada."}
            ]
        }
    },

    # --- ESTAÇÃO 5: Quiz ---
    5: {
    "id": 5,
    "title": "Monitorização Clínica em UTI Pediátrica",
    "type": "quiz",
    "timeLimit": 90,
    "points": 8,
    "background": "img/cenario-uti-ped.jpg",
    "requiredKey": "chave_estacao_4",
    "keyReward": "chave_estacao_5",
    "items": [
        {"id": "q1", "x": 30, "y": 55, "icon": "bi-thermometer-half", "title": "Temperatura"},
        {"id": "q2", "x": 50, "y": 75, "icon": "bi-lungs", "title": "Respiração"},
        {"id": "q3", "x": 70, "y": 55, "icon": "bi-heart-pulse", "title": "Frequência Cardíaca"},
        {"id": "q4", "x": 40, "y": 35, "icon": "bi-activity", "title": "Pressão Arterial"},
        {"id": "q5", "x": 60, "y": 35, "icon": "bi-droplet", "title": "Saturação de O₂"}
    ],
    "quizData": [
        {
            "id": "q1",
            "text": "Qual é a forma mais segura para verificar a temperatura de um recém-nascido?",
            "options": [
                {"id": "a", "text": "Termômetro digital axilar"},
                {"id": "b", "text": "Mão na testa do bebê"},
                {"id": "c", "text": "Termômetro de mercúrio"}
            ],
            "correctAnswer": "a"
        },
        {
            "id": "q2",
            "text": "Respiração periódica em um neonato (pausas de até 10s) é considerada:",
            "options": [
                {"id": "a", "text": "Um sinal grave de apneia"},
                {"id": "b", "text": "Uma característica comum que deve ser monitorada"},
                {"id": "c", "text": "Um sinal de frio"}
            ],
            "correctAnswer": "b"
        },
        {
            "id": "q3",
            "text": "Qual sinal de frequência cardíaca indica deterioração clínica em um neonato?",
            "options": [
                {"id": "a", "text": "Aumento durante o choro"},
                {"id": "b", "text": "Bradicardia ou taquicardia súbita e mantida"},
                {"id": "c", "text": "Estabilidade durante o sono"}
            ],
            "correctAnswer": "b"
        },
        {
            "id": "q4",
            "text": "Em UTI pediátrica, a aferição da pressão arterial deve ser:",
            "options": [
                {"id": "a", "text": "Com manguito adequado ao tamanho do braço"},
                {"id": "b", "text": "Sempre no membro inferior"},
                {"id": "c", "text": "Somente se houver suspeita de choque"}
            ],
            "correctAnswer": "a"
        },
        {
            "id": "q5",
            "text": "A saturação de O₂ em neonatos deve ser mantida preferencialmente:",
            "options": [
                {"id": "a", "text": "Entre 90% e 95%"},
                {"id": "b", "text": "Sempre acima de 100%"},
                {"id": "c", "text": "Abaixo de 85% para evitar hiperóxia"}
            ],
            "correctAnswer": "a"
        }
    ]
},


    # --- ESTAÇÃO 6: Puzzle ---
    6: {
        "id": 6, "title": "Prevenção de Quedas em Pediatria", "type": "puzzle",
        "timeLimit": 90, "points": 5, "background": "img/cenario-enfermaria.jpg",
        "requiredKey": "chave_estacao_5", "keyReward": "chave_estacao_6",
        "puzzleData": {
            "instructions": "Monte a imagem para revelar a cena de prevenção de quedas.",
            "image": "img/prevencao_quedas_puzzle.jpg", "pieces": 9
        }
    },
    
    # --- ESTAÇÃO 7: Ordering ---
    7: {
        "id": 7, "title": "Cuidados com Dispositivos Invasivos", "type": "ordering",
        "timeLimit": 120, "points": 8, "background": "img/cenario-uti.jpg",
        "requiredKey": "chave_estacao_6", "keyReward": "chave_estacao_7",
        "orderingData": {
            "instructions": "Ordene os passos para a punção segura de uma veia periférica.",
            "items": [
                {"id": "p1", "text": "Higienizar as mãos"},
                {"id": "p2", "text": "Separar e preparar o material"},
                {"id": "p3", "text": "Calçar luvas de procedimento"},
                {"id": "p4", "text": "Aplicar garrote e selecionar a veia"},
                {"id": "p5", "text": "Realizar antissepsia da pele"},
                {"id": "p6", "text": "Realizar a punção e observar refluxo"},
                {"id": "p7", "text": "Remover garrote, conectar e fixar cateter"},
                {"id": "p8", "text": "Descartar perfurocortantes e higienizar as mãos"}
            ],
            "correctOrder": ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8"]
        }
    },

    # --- ESTAÇÃO 8: Matching ---
    8: {
        "id": 8, "title": "Comunicação Efetiva (SBAR)", "type": "matching",
        "timeLimit": 60, "points": 5, "background": "img/cenario-sala-enfermagem.jpg",
        "requiredKey": "chave_estacao_7", "keyReward": "chave_estacao_8",
        "matchingData": {
            "instructions": "Correlacione cada informação à etapa correta do SBAR.",
            "matches": [
                {"term": "S - Situação", "definition": "João, leito 1, apresentou febre de 38.5°C."},
                {"term": "B - Breve Histórico", "definition": "5 anos, internado por pneumonia, em uso de antibiótico."},
                {"term": "A - Avaliação", "definition": "Acredito que seja resposta inflamatória, mas monitorar."},
                {"term": "R - Recomendação", "definition": "Reavaliar temperatura em 1h e comunicar médico se persistir."}
            ]
        }
    },
    
    # --- ESTAÇÃO 9: WordSearch ---
    9: {
        "id": 9, "title": "Reconhecimento de Sepse", "type": "wordsearch",
        "timeLimit": 120, "points": 6, "background": "img/cenario-uti.jpg",
        "requiredKey": "chave_estacao_8", "keyReward": "chave_estacao_9",
        "wordsearchData": {
            "instructions": "Encontre os sinais de sepse em neonatos.",
            "words": ["FEBRE", "HIPOTERMIA", "TAQUICARDIA", "LETARGIA", "GEMENCIA"],
            "gridSize": 14
        }
    },

    # --- ESTAÇÃO 10: Quiz ---
    10: {
        "id": 10, "title": "Segurança na Ventilação Mecânica", "type": "quiz",
        "timeLimit": 120, "points": 9, "background": "img/cenario-uti-ped.jpg",
        "requiredKey": "chave_estacao_9", "keyReward": "chave_estacao_10",
        "items": [
            {"id": "q1", "x": 30, "y": 70, "icon": "bi-shield-check", "title": "Prevenção de PAV"},
            {"id": "q2", "x": 50, "y": 50, "icon": "bi-lungs-fill", "title": "Ventilação Protetora"},
            {"id": "q3", "x": 70, "y": 70, "icon": "bi-exclamation-triangle", "title": "Alarmes Críticos"}
        ],
        "quizData": [
            {"id": "q1", "text": "Qual medida é fundamental para a prevenção da Pneumonia Associada à Ventilação (PAV)?", "options": [{"id": "a", "text": "Manter a cabeceira do leito elevada (30-45 graus)"}, {"id": "b", "text": "Aspirar o paciente apenas uma vez ao dia"}, {"id": "c", "text": "Manter o paciente sempre deitado (0 graus)"}], "correctAnswer": "a"},
            {"id": "q2", "text": "Para prevenir lesão pulmonar (VILI), qual estratégia é indicada?", "options": [{"id": "a", "text": "Utilizar sempre os maiores volumes correntes"}, {"id": "b", "text": "Utilizar baixos volumes correntes e controlar a pressão de platô"}, {"id": "c", "text": "Desativar os alarmes de pressão"}], "correctAnswer": "b"},
            {"id": "q3", "text": "O alarme de alta pressão dispara. Qual pode ser a causa?", "options": [{"id": "a", "text": "O paciente está mais calmo"}, {"id": "b", "text": "Excesso de secreção no tubo ou tosse"}, {"id": "c", "text": "Circuito desconectado"}], "correctAnswer": "b"}
        ]
    },

    # --- ESTAÇÃO 11: Ordering ---
    11: {
        "id": 11, "title": "Segurança na Transfusão Sanguínea", "type": "ordering",
        "timeLimit": 60, "points": 8, "background": "img/cenario-banco-sangue.jpg",
        "requiredKey": "chave_estacao_10", "keyReward": "chave_estacao_11",
        "orderingData": {
            "instructions": "Ordene os passos para uma transfusão de hemoderivado segura.",
            "items": [
                {"id": "p1", "text": "Checar prescrição e consentimento"},
                {"id": "p2", "text": "Verificar sinais vitais pré-transfusionais"},
                {"id": "p3", "text": "Realizar dupla checagem da bolsa e do paciente"},
                {"id": "p4", "text": "Administrar o hemoderivado"},
                {"id": "p5", "text": "Monitorar o paciente nos primeiros 15 minutos"},
                {"id": "p6", "text": "Registrar todo o procedimento"}
            ],
            "correctOrder": ["p1", "p2", "p3", "p4", "p5","p6"]
        }
    },
    
    # --- ESTAÇÃO 12: Memory ---
    12: {
        "id": 12,
        "title": "Prevenção de Lesão por Pressão",
        "type": "memory",
        "timeLimit": 120,
        "points": 6,
        "background": "img/cenario-enfermaria.jpg",
        "requiredKey": "chave_estacao_11",
        "keyReward": "chave_estacao_12",
        "memoryData": {
            "instructions": "Encontre os pares relacionados à prevenção de lesão por pressão.",
            "images": [
                "img/inspecao.png",
                "img/coxins.png",
                "img/cisalhamento.png",
                "img/hidratacao.png",
                "img/nutricao.png",
                "img/umidade.png"
            ]
        }
    },

    # --- ESTAÇÃO 13: Matching ---
    13: {
        "id": 13,
        "title": "Manejo da Dor em Neonatos",
        "type": "matching",
        "timeLimit": 90,
        "points": 7,
        "background": "img/cenario-maternidade.jpg",
        "requiredKey": "chave_estacao_12",
        "keyReward": "chave_estacao_13",
        "matchingData": {
            "instructions": "Associe cada medida de manejo da dor em neonatos à sua categoria correta.",
            "matches": [
                {"term": "Sucção não nutritiva", "definition": "Medida de conforto sensorial"},
                {"term": "Glicose oral", "definition": "Medida adjuvante não farmacológica"},
                {"term": "Contato pele a pele (método canguru)", "definition": "Medida de vínculo e regulação fisiológica"},
                {"term": "Analgésicos opioides", "definition": "Medida farmacológica para dor intensa"},
                {"term": "Envólucro/Swaddling", "definition": "Medida de contenção e autorregulação"},
                {"term": "Música suave ou voz materna", "definition": "Medida ambiental calmante"}
            ]
        }
    },

    # --- ESTAÇÃO 14: Puzzle ---
    14: {
        "id": 14, "title": "Passagem de Plantão Segura", "type": "puzzle",
        "timeLimit": 120, "points": 5, "background": "img/cenario-sala-enfermagem.jpg",
        "requiredKey": "chave_estacao_13", "keyReward": "chave_estacao_14",
        "puzzleData": {
            "instructions": "Monte a imagem que representa uma passagem de plantão eficaz.",
            "image": "img/passagem_plantao_puzzle.jpg", "pieces": 9
        }
    },
    # --- ESTAÇÃO 15: Ordering ---
    15: {
        "id": 15,
        "title": "Checklist de Cirurgia Segura",
        "type": "ordering",
        "timeLimit": 150,
        "points": 11,
        "background": "img/cenario-cirurgia.jpg",
        "requiredKey": "chave_estacao_14",
        "keyReward": "chave_estacao_15",
        "orderingData": {
            "instructions": "Organize na ordem correta as etapas fundamentais de segurança cirúrgica.",
            "items": [
                {"id": "p1", "text": "Assinatura do termo de consentimento pelos pais/responsáveis"},
                {"id": "p2", "text": "Checagem de paciente, sítio e alergias (antes da indução anestésica)"},
                {"id": "p3", "text": "Pausa cirúrgica com toda a equipe (antes da incisão cirúrgica)"},
                {"id": "p4", "text": "Confirmação da administração da antibioticoterapia profilática (se indicada)"},
                {"id": "p5", "text": "Realização do procedimento cirúrgico"},
                {"id": "p6", "text": "Contagem de compressas e instrumentos"}
                ],
            "correctOrder": ["p1", "p2", "p3", "p4", "p5", "p6"]
        }
    }
}
