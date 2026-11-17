# Projeto P2 — Inteligência Artificial e Machine Learning
**Previsão de Resultados de Partidas Internacionais de Futebol**  
**Professor:** Lucas Nascimento  
**Integrantes:**
- Maicon Fonseca Dutra
- Gabriel Caniza da Silva
- Gabriel Vidal de Souza

---

## 📁 Estrutura do Projeto

```text
IAP2_TRABALHO/
├── app_web.py             # Interface web (Flask) — recomendada
├── app_p2.py              # Interface desktop (Tkinter)
├── aula_02.py             # Aula 02: auditoria, manifesto e treino do baseline
├── aula_03.py             # Aula 03: validação cruzada, comparação e casos de teste
├── gerar_features_v2.py   # Gera as features Elo/forma e treina o modelo v2
├── contrato.py            # Schema de entrada, validação do payload e casos de teste
├── motor_tabular.py       # Pré-processamento, treino e avaliação
├── etapas.py              # Orquestrador e CLI das aulas
├── config.projeto.json    # Configuração central do experimento
├── casos_do_grupo.json    # Casos de teste funcionais e de recusa
├── requirements.txt       # Dependências Python
├── templates/
│   └── index.html         # Página da interface web
├── static/
│   ├── css/app.css        # Estilos da interface web
│   └── js/app.js          # Lógica da interface web
├── data/                  # Bases de partidas (original e v2 com features)
├── artefatos_v1/          # Baseline: modelo, métricas, manifesto e previsões
├── artefatos_v2/          # Modelo v2 (RandomForest), ranking Elo e métricas
└── docs/
    ├── entregas/          # Relatórios e apresentações oficiais
    ├── guias/             # Guias das Aulas 02 e 03
    └── historico/         # Notebook e entregas anteriores
```

---

## 🚀 Como Executar o Projeto

Na pasta do projeto, crie o ambiente virtual e instale as dependências (só na primeira vez):

```powershell
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
```

Depois, execute o que precisar:

```powershell
# 1. Interface web (recomendada). Abra http://127.0.0.1:5000 no navegador
.venv\Scripts\python app_web.py

# 2. Interface desktop em Tkinter
.venv\Scripts\python app_p2.py

# 3. Aula 02 (auditoria, manifesto e treino do baseline inicial)
.venv\Scripts\python aula_02.py --config config.projeto.json

# 4. Aula 03 (validação cruzada em 5 folds, comparação com baseline e testes)
.venv\Scripts\python aula_03.py --config config.projeto.json
```

No Linux ou macOS, troque `.venv\Scripts\` por `.venv/bin/`.

> As Aulas 02 e 03 regravam os arquivos de `artefatos_v1/`. Os números podem variar
> nas últimas casas decimais entre sistemas operacionais.

### Interface web

* Busca de seleções e competições por digitação, com posição no ranking Elo, confederação e forma recente.
* Validação imediata: seleção fora da base, seleções repetidas e torneios continentais incompatíveis.
* Resultado com veredito, probabilidades, placar mais provável, risco de zebra, comparativo de força, retrospecto e parecer.
* Atalhos de clássicos e histórico das últimas análises (guardado no navegador).
* A página usa Tailwind, Google Fonts e bandeiras carregados da internet; sem conexão ela funciona, mas sem o visual completo.

---

## 📄 Documentos de Entrega

* [Relatório da Oficina de Interfaces](docs/entregas/ENTREGA_OFICINA_INTERFACES.md): Registro das decisões de interface, os 6 estados, matriz de testes e limitações metodológicas.
* [Relatório Completo — Proposta de Melhoria de IA](docs/entregas/PROPOSTA_MELHORIA_IA_P2.md): Análise detalhada, comparação técnica de modelos, parâmetros, governança de dados e recomendação justificada para a P2.
* [Apresentação em Slides — Como Melhorar Nossa IA?](docs/entregas/SLIDES_MELHORIA_IA_P2.md): Roteiro de slides estruturado para apresentação oral ou exportação para PDF.
* [Relatório das Aulas 02 e 03](docs/entregas/ENTREGA_PROJETO_IA_P2.md): Registro da entrega inicial e dos resultados quantitativos de validação cruzada.
