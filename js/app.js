// Variables globales
let decks = {};
let matchups = {};
let additional = {};
let sidedeckCards = [];
let handtraps = [];
let currentDeck = null;
let filteredDecks = [];

// Tiers que se mostrarán en análisis y meta view
const COMPETITIVE_TIERS = ['Tier 1', 'Tier 2', 'Tier 3'];
const ALL_TIERS = ['Tier 1', 'Tier 2', 'Tier 3', 'rogue', 'fun'];

// Cargar datos al inicio
document.addEventListener('DOMContentLoaded', async function() {
    await loadAllData();
    initApp();
});

// Inicializar aplicación
function initApp() {
    loadSidebar();
    setupEventListeners();
    loadMenuDecks();
    loadMetaTable();
    loadMetaAnalysis();
    loadSideDeck();
    loadHandtrapsTierList();
    
    // Cargar preferencias
    loadPreferences();
}

// Configurar eventos
function setupEventListeners() {
    // Navegación
    document.addEventListener('click', function(e) {
        if (e.target.closest('.nav-btn')) {
            const btn = e.target.closest('.nav-btn');
            const viewId = btn.dataset.view;
            switchView(viewId);
        }
    });
    
    // Búsqueda simple
    document.getElementById('simple-search-btn').addEventListener('click', searchSimpleDeck);
    document.getElementById('simple-search-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') searchSimpleDeck();
    });
    
    // Búsqueda completa
    document.getElementById('complete-search-btn').addEventListener('click', searchCompleteDeck);
    document.getElementById('complete-search-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') searchCompleteDeck();
    });
    
    // Filtros del menú
    document.getElementById('apply-filters').addEventListener('click', applyFilters);
    
    // Filtro del meta view
    document.getElementById('meta-tier-filter').addEventListener('change', loadMetaTable);
    document.getElementById('meta-sort-tier').addEventListener('click', () => {
        loadMetaTable(true);
    });
    
    // Comparator
    document.getElementById('deck1-search').addEventListener('input', updateComparator);
    document.getElementById('deck2-search').addEventListener('input', updateComparator);
    
    // Side deck filter
    document.getElementById('side-type-filter').addEventListener('change', loadSideDeck);
    
    // Handtrap format
    document.getElementById('handtrap-format').addEventListener('change', loadHandtrapsTierList);
    
    // Refresh analysis
    document.getElementById('refresh-analysis').addEventListener('click', loadMetaAnalysis);
    
    // Cerrar autocomplete al hacer clic fuera
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-input') && !e.target.closest('.autocomplete-dropdown')) {
            hideAllAutocompletes();
        }
    });
}

// Cambiar vista
function switchView(viewId) {
    // Ocultar todas las vistas
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Mostrar la vista seleccionada
    document.getElementById(viewId).classList.add('active');
    
    // Actualizar botones de navegación
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.view === viewId) {
            btn.classList.add('active');
        }
    });
    
    // Si es la vista de menú, actualizar decks
    if (viewId === 'menu') {
        loadMenuDecks();
    }
}

// Cargar sidebar
function loadSidebar() {
    const sidebar = document.getElementById('sidebar-container');
    sidebar.innerHTML = `
        <nav class="nav-menu">
            <button class="nav-btn active" data-view="menu">
                <i class="fas fa-home"></i> Menú Principal
            </button>
            <button class="nav-btn" data-view="search-simple">
                <i class="fas fa-search"></i> Buscar Deck (Simple)
            </button>
            <button class="nav-btn" data-view="search-complete">
                <i class="fas fa-list-alt"></i> Buscar Deck (Completo)
            </button>
            <button class="nav-btn" data-view="meta">
                <i class="fas fa-chart-line"></i> Meta View
            </button>
            <button class="nav-btn" data-view="compare">
                <i class="fas fa-balance-scale"></i> Comparador
            </button>
            <button class="nav-btn" data-view="meta-analysis">
                <i class="fas fa-chart-pie"></i> Meta Análisis
            </button>
            <button class="nav-btn" data-view="sidedeck">
                <i class="fas fa-layer-group"></i> Side Deck
            </button>
            <button class="nav-btn" data-view="handtraps">
                <i class="fas fa-hand-paper"></i> Handtraps
            </button>
        </nav>
        
        <div class="deck-filters">
            <h3><i class="fas fa-filter"></i> Filtros de Decks</h3>
            
            <div class="filter-group">
                <label for="tier-filter">Filtrar por Tier:</label>
                <select id="tier-filter" class="filter-select">
                    <option value="all">Todos los Tiers</option>
                    <option value="1">Tier 1</option>
                    <option value="2">Tier 2</option>
                    <option value="3">Tier 3</option>
                    <option value="rogue">Rogue</option>
                    <option value="fun">Fun</option>
                </select>
            </div>
            
            <div class="filter-group">
                <label for="type-filter">Filtrar por Tipo:</label>
                <select id="type-filter" class="filter-select">
                    <option value="all">Todos los Tipos</option>
                    <option value="Combo">Combo</option>
                    <option value="Control">Control</option>
                    <option value="Mid-Range">Mid-Range</option>
                    <option value="Aggro">Aggro</option>
                </select>
            </div>
            
            <button id="apply-filters" class="search-btn" style="width: 100%; margin-top: 10px;">
                <i class="fas fa-filter"></i> Aplicar Filtros
            </button>
        </div>
    `;
}

// Cargar decks en el menú
function loadMenuDecks() {
    const deckGrid = document.getElementById('menu-decks');
    deckGrid.innerHTML = '';
    
    const decksToShow = filteredDecks.length > 0 ? filteredDecks : Object.keys(decks);
    
    decksToShow.forEach(deckName => {
        const deck = decks[deckName];
        const deckCard = createDeckCard(deckName, deck, 'menu');
        deckGrid.appendChild(deckCard);
    });
    
    if (decksToShow.length === 0) {
        deckGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i class="fas fa-filter"></i>
                <h3>No se encontraron decks</h3>
                <p>No hay decks que coincidan con los filtros seleccionados.</p>
            </div>
        `;
    }
}

// Crear tarjeta de deck
function createDeckCard(deckName, deck, context = 'menu') {
    const tierClass = getTierClass(deck.tier);
    const extra = additional[deckName] || {};
    
    const deckCard = document.createElement('div');
    deckCard.className = 'deck-card';
    
    // Ruta de imagen (puedes ajustar esto según tu estructura de archivos)
    const imagePath = deck.image ? `assets/images/decks/${deck.image}` : 'assets/images/decks/default.jpg';
    
    deckCard.innerHTML = `
        <img src="${imagePath}" alt="${deckName}" class="deck-image" onerror="this.src='assets/images/decks/default.jpg'">
        <div class="deck-card-header">
            <div class="deck-name">${deckName}</div>
            <div class="deck-tier ${tierClass}">${deck.tier}</div>
        </div>
        <div class="deck-type">${deck.type}</div>
        <div class="bar">
            <div class="bar-fill bar-green" style="width: ${deck.difficulty * 10}%"></div>
        </div>
        <div style="font-size: 0.85rem; color: var(--text-secondary); margin: 8px 0;">Dificultad: ${deck.difficulty}/10</div>
        <div class="deck-stats-compact">
            <div class="stat-compact">
                <span class="stat-emoji">⚡</span>
                <div class="stat-text-compact">
                    <div class="stat-value-compact"><strong>${extra.going?.first || 3}/5</strong></div>
                    <div class="stat-label-compact">going 1st</div>
                </div>
            </div>
            <div class="stat-compact">
                <span class="stat-emoji">⚔️</span>
                <div class="stat-text-compact">
                    <div class="stat-value-compact"><strong>${extra.going?.second || 3}/5</strong></div>
                    <div class="stat-label-compact">going 2nd</div>
                </div>
            </div>
        </div>
    `;
    
    deckCard.addEventListener('click', () => {
        if (context === 'menu') {
            document.getElementById('complete-search-input').value = deckName;
            switchView('search-complete');
            searchCompleteDeck(deckName);
        }
    });
    
    return deckCard;
}

// Obtener clase CSS para el tier
function getTierClass(tier) {
    switch(tier) {
        case 'Tier 1': return 'tier-1';
        case 'Tier 2': return 'tier-2';
        case 'Tier 3': return 'tier-3';
        case 'rogue': return 'tier-rogue';
        case 'fun': return 'tier-fun';
        default: return 'tier-3';
    }
}

// Obtener color para el tier
function getTierColor(tier) {
    switch(tier) {
        case 'Tier 1': return '#70d870';
        case 'Tier 2': return '#d8d870';
        case 'Tier 3': return '#d87070';
        case 'rogue': return '#808080';
        case 'fun': return '#8a2be2';
        default: return '#d87070';
    }
}

// Obtener descripción del tier
function getTierDescription(tier) {
    const descriptions = {
        'Tier 1': 'Deck top del formato, altamente competitivo',
        'Tier 2': 'Deck competitivo pero con algunas debilidades',
        'Tier 3': 'Deck viable pero no óptimo para torneos grandes',
        'rogue': 'Deck que puede sorprender en torneos locales',
        'fun': 'Deck para jugar casualmente y divertirse'
    };
    return descriptions[tier] || 'Deck casual';
}

// Búsqueda simple - Versión Visual Simplificada
function searchSimpleDeck() {
    const input = document.getElementById('simple-search-input').value.trim();
    if (!input) return;
    
    const deckName = findDeckByName(input);
    if (!deckName) {
        showNotFound('simple-deck-result', input);
        return;
    }
    
    const deck = decks[deckName];
    const extra = additional[deckName] || {};
    const matchup = matchups[deckName] || {side_in: []};
    const going = extra.going || {first: 3, second: 3};
    
    // Calcular score visual
    const avgGoing = (going.first + going.second) / 2;
    const tierScore = getTierScore(deck.tier);
    const difficultyScore = 100 - (deck.difficulty * 7);
    const visualScore = Math.round((avgGoing * 15) + tierScore + difficultyScore) / 3;
    
    // Color del tier
    const tierColor = getTierColor(deck.tier);
    
    // Ruta de imagen
    const imagePath = deck.image ? `assets/images/decks/${deck.image}` : 'assets/images/decks/default.jpg';
    
    // Crear HTML simplificado
    let content = `
        <div class="deck-detail-simple">
            <!-- Header Simple -->
            <div class="simple-header">
                <img src="${imagePath}" alt="${deckName}" class="simple-image" onerror="this.src='assets/images/decks/default.jpg'">
                <div class="simple-info">
                    <h3>${deckName}</h3>
                    <div class="simple-tags">
                        <span class="simple-tag" style="background-color: ${tierColor}; color: white;">
                            ${deck.tier}
                        </span>
                        <span class="simple-tag" style="background-color: var(--bg-secondary);">
                            ${deck.type}
                        </span>
                        <span class="simple-tag" style="background-color: var(--pastel-blue);">
                            ${deck.difficulty}/10
                        </span>
                    </div>
                    <p style="color: var(--text-secondary); font-size: 0.9rem;">
                        ${extra.engine || 'Engine estándar'}
                    </p>
                </div>
            </div>
            
            <!-- Grid de Métricas Visuales -->
            <div class="simple-metrics-grid">
                <!-- Going First -->
                <div class="metric-card">
                    <span class="metric-icon">⚡</span>
                    <div class="metric-title">GOING FIRST</div>
                    <div class="stars-compact">${'★'.repeat(going.first)}${'☆'.repeat(5-going.first)}</div>
                    <div class="metric-value">${going.first}/5</div>
                    <div class="metric-bar">
                        <div class="metric-fill fill-cyan" style="width: ${going.first * 20}%"></div>
                    </div>
                </div>
                
                <!-- Going Second -->
                <div class="metric-card">
                    <span class="metric-icon">⚔️</span>
                    <div class="metric-title">GOING SECOND</div>
                    <div class="stars-compact">${'★'.repeat(going.second)}${'☆'.repeat(5-going.second)}</div>
                    <div class="metric-value">${going.second}/5</div>
                    <div class="metric-bar">
                        <div class="metric-fill fill-magenta" style="width: ${going.second * 20}%"></div>
                    </div>
                </div>
                
                <!-- Dificultad -->
                <div class="metric-card">
                    <span class="metric-icon">📊</span>
                    <div class="metric-title">DIFICULTAD</div>
                    <div class="metric-value">${deck.difficulty}/10</div>
                    <div class="metric-bar">
                        <div class="metric-fill fill-yellow" style="width: ${deck.difficulty * 10}%"></div>
                    </div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 5px;">
                        ${deck.difficulty <= 4 ? 'Fácil' : deck.difficulty <= 7 ? 'Moderado' : 'Difícil'}
                    </div>
                </div>
                
                <!-- Score Visual -->
                <div class="metric-card">
                    <span class="metric-icon">⭐</span>
                    <div class="metric-title">SCORE</div>
                    <div class="metric-value">${Math.round(visualScore)}/100</div>
                    <div class="metric-bar">
                        <div class="metric-fill fill-green" style="width: ${visualScore}%"></div>
                    </div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 5px;">
                        ${visualScore >= 80 ? 'Excelente' : visualScore >= 60 ? 'Bueno' : 'Regular'}
                    </div>
                </div>
            </div>
            
            <!-- Sección de Debilidades -->
            <div class="info-section">
                <h4><i class="fas fa-exclamation-triangle"></i> Debilidades Principales</h4>
                <div class="weakness-grid">
    `;
    
    if (deck.weaknesses && deck.weaknesses.length > 0) {
        deck.weaknesses.slice(0, 4).forEach(weakness => {
            content += `
                <div class="weakness-chip">
                    <i class="fas fa-times-circle"></i> ${weakness}
                </div>
            `;
        });
    } else {
        content += `<div class="weakness-chip"><i class="fas fa-check-circle"></i> Sin debilidades críticas</div>`;
    }
    
    content += `
                </div>
            </div>
            
            <!-- Sección de Side Deck -->
            <div class="info-section">
                <h4><i class="fas fa-exchange-alt"></i> Side Recomendado</h4>
                <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px;">
    `;
    
    if (matchup.side_in && matchup.side_in.length > 0) {
        matchup.side_in.slice(0, 5).forEach(card => {
            content += `<span class="side-chip">${card}</span>`;
        });
    } else {
        content += `<span class="side-chip">No hay recomendaciones específicas</span>`;
    }
    
    content += `
                </div>
            </div>
            
            <!-- Comparación Rápida -->
            <div class="info-section">
                <h4><i class="fas fa-balance-scale"></i> Comparación Rápida</h4>
                <div class="visual-list">
                    <div class="visual-item ${deck.tier === 'Tier 1' ? 'good' : deck.tier === 'Tier 2' ? 'neutral' : deck.tier === 'rogue' || deck.tier === 'fun' ? 'bad' : 'neutral'}">
                        <i class="fas ${deck.tier === 'Tier 1' ? 'fa-chevron-up' : deck.tier === 'Tier 2' ? 'fa-equals' : deck.tier === 'rogue' || deck.tier === 'fun' ? 'fa-chevron-down' : 'fa-equals'}"></i>
                        <div style="flex: 1;">
                            <strong>Posición en el Meta:</strong> ${deck.tier}
                        </div>
                        <span class="simple-tag" style="background-color: ${tierColor}; color: white; font-size: 0.7rem;">
                            ${deck.tier === 'Tier 1' ? 'TOP' : deck.tier === 'Tier 2' ? 'MEDIO' : deck.tier === 'rogue' ? 'ROGUE' : deck.tier === 'fun' ? 'FUN' : 'BAJO'}
                        </span>
                    </div>
                    
                    <div class="visual-item ${deck.difficulty <= 5 ? 'good' : deck.difficulty <= 8 ? 'neutral' : 'bad'}">
                        <i class="fas ${deck.difficulty <= 5 ? 'fa-smile' : deck.difficulty <= 8 ? 'fa-meh' : 'fa-frown'}"></i>
                        <div style="flex: 1;">
                            <strong>Dificultad para aprender:</strong> ${deck.difficulty}/10
                        </div>
                        <div class="metric-bar" style="width: 80px; height: 6px;">
                            <div class="metric-fill ${deck.difficulty <= 5 ? 'fill-green' : deck.difficulty <= 8 ? 'fill-yellow' : 'fill-magenta'}" 
                                 style="width: ${deck.difficulty * 10}%"></div>
                        </div>
                    </div>
                    
                    <div class="visual-item ${avgGoing >= 4 ? 'good' : avgGoing >= 2.5 ? 'neutral' : 'bad'}">
                        <i class="fas ${avgGoing >= 4 ? 'fa-thumbs-up' : avgGoing >= 2.5 ? 'fa-hand-peace' : 'fa-thumbs-down'}"></i>
                        <div style="flex: 1;">
                            <strong>Performance promedio:</strong> ${avgGoing.toFixed(1)}/5
                        </div>
                        <div class="stars-compact" style="font-size: 1rem;">
                            ${'★'.repeat(Math.round(avgGoing))}${'☆'.repeat(5-Math.round(avgGoing))}
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Recomendación Final -->
            <div class="score-card">
                <div class="score-value">${Math.round(visualScore)}</div>
                <div class="score-label">PUNTUACIÓN VISUAL</div>
                <p style="margin-top: 10px; color: var(--text-secondary); font-size: 0.9rem;">
                    ${getSimpleRecommendation(deck.tier, avgGoing, deck.difficulty)}
                </p>
            </div>
        </div>
    `;
    
    document.getElementById('simple-deck-result').innerHTML = content;
    
    // Animar barras de progreso
    setTimeout(() => {
        document.querySelectorAll('.metric-fill').forEach(fill => {
            const width = fill.style.width;
            fill.style.width = '0';
            setTimeout(() => {
                fill.style.width = width;
            }, 100);
        });
    }, 300);
}

// Obtener score del tier
function getTierScore(tier) {
    switch(tier) {
        case 'Tier 1': return 85;
        case 'Tier 2': return 70;
        case 'Tier 3': return 55;
        case 'rogue': return 40;
        case 'fun': return 25;
        default: return 50;
    }
}

// Función auxiliar para recomendación simple
function getSimpleRecommendation(tier, avgGoing, difficulty) {
    const tierValue = getTierScore(tier) / 25;
    const score = tierValue + (avgGoing * 0.6) + ((10 - difficulty) * 0.1);
    
    if (score >= 4) {
        return '🎯 Deck altamente recomendado para jugadores competitivos';
    } else if (score >= 2.5) {
        return '👍 Deck sólido, buena opción para jugadores intermedios';
    } else if (score >= 1.5) {
        return '🤔 Deck viable, recomendado para jugadores que conocen el arquetipo';
    } else {
        return '🎮 Deck casual, perfecto para divertirse y jugar partidas amistosas';
    }
}

// Búsqueda completa
function searchCompleteDeck(deckNameInput = null) {
    let deckName;
    if (deckNameInput) {
        deckName = deckNameInput;
    } else {
        deckName = document.getElementById('complete-search-input').value.trim();
    }
    
    if (!deckName) return;
    
    const foundDeckName = findDeckByName(deckName);
    if (!foundDeckName) {
        showNotFound('complete-deck-result', deckName);
        return;
    }
    
    currentDeck = foundDeckName;
    renderDeckComplete(currentDeck);
}

// Renderizar vista completa (Versión Profesional)
function renderDeckComplete(deckName) {
    const deck = decks[deckName];
    const matchup = matchups[deckName] || {side_in: []};
    const extra = additional[deckName] || {};
    const stats = extra.stats || {};
    const addStats = extra.additional || {};
    const going = extra.going || {first: 3, second: 3};
    
    // Ruta de imagen
    const imagePath = deck.image ? `assets/images/decks/${deck.image}` : 'assets/images/decks/default.jpg';
    
    // Determinar color del tier
    const tierColor = getTierColor(deck.tier);
    
    // Determinar dificultad color
    const difficultyColor = deck.difficulty <= 3 ? '#70d870' :
                          deck.difficulty <= 6 ? '#d8d870' : '#d87070';
    
    // Calcular rating promedio
    const avgRating = ((going.first + going.second) / 2).toFixed(1);
    
    // Crear HTML
    let content = `
        <div class="deck-detail-complete">
            <!-- Header Principal -->
            <div class="detail-header-main">
                <div>
                    <img src="${imagePath}" alt="${deckName}" class="detail-header-image" onerror="this.src='assets/images/decks/default.jpg'">
                </div>
                <div class="detail-header-info">
                    <h3>${deckName}</h3>
                    <div class="detail-tags">
                        <span class="detail-tag" style="background-color: ${tierColor}; color: white;">
                            <i class="fas fa-chess-queen"></i> ${deck.tier}
                        </span>
                        <span class="detail-tag">
                            <i class="fas fa-layer-group"></i> ${deck.type}
                        </span>
                        <span class="detail-tag">
                            <i class="fas fa-cogs"></i> ${extra.engine || 'Engine Variado'}
                        </span>
                    </div>
                    
                    <div style="margin: 20px 0;">
                        <div class="stat-box">
                            <div class="stat-label">DIFICULTAD</div>
                            <div class="stat-value" style="color: ${difficultyColor}">${deck.difficulty}/10</div>
                            <div class="stat-bar">
                                <div class="stat-fill" style="width: ${deck.difficulty * 10}%"></div>
                            </div>
                            <div class="stat-desc">${getDifficultyText(deck.difficulty)}</div>
                        </div>
                    </div>
                    
                    <div class="detail-tags">
                        <span class="detail-tag">
                            <i class="fas fa-star"></i> Rating: ${avgRating}/5
                        </span>
                        <span class="detail-tag">
                            <i class="fas fa-calendar-alt"></i> Actualizado: ${extra.updated || '2024'}
                        </span>
                    </div>
                </div>
            </div>
            
            <!-- Grid de Secciones -->
            <div class="detail-sections">
    `;
    
    // SECCIÓN 1: PERFORMANCE & MATCHUP
    content += `
        <div class="detail-section">
            <h4><i class="fas fa-tachometer-alt"></i> Performance & Matchup</h4>
            <div class="going-container">
                <div class="going-card">
                    <h5><span class="going-emoji">⚡</span> Going First</h5>
                    <div class="going-subtitle">Iniciativa del juego</div>
                    <div class="stars">${'★'.repeat(going.first)}${'☆'.repeat(5-going.first)}</div>
                    <div class="going-rating">${going.first}/5</div>
                    <div class="stat-desc" style="margin-top: 10px;">${getGoingText('first', going.first)}</div>
                </div>
                <div class="going-card">
                    <h5><span class="going-emoji">⚔️</span> Going Second</h5>
                    <div class="going-subtitle">Habilidad de respuesta</div>
                    <div class="stars">${'★'.repeat(going.second)}${'☆'.repeat(5-going.second)}</div>
                    <div class="going-rating">${going.second}/5</div>
                    <div class="stat-desc" style="margin-top: 10px;">${getGoingText('second', going.second)}</div>
                </div>
            </div>
            
            <div class="visual-comparison">
                <div class="comparison-bar">
                    <div class="comparison-label">Performance General:</div>
                    <div class="comparison-visual">
                        <div class="comparison-fill bar-green" style="width: ${(going.first + going.second) * 10}%"></div>
                    </div>
                    <span style="font-weight: bold; color: var(--accent-cyan);">${Math.round((going.first + going.second) * 10)}%</span>
                </div>
                <div class="comparison-bar">
                    <div class="comparison-label">Consistencia:</div>
                    <div class="comparison-visual">
                        <div class="comparison-fill bar-cyan" style="width: ${(stats.consistency || 5) * 10}%"></div>
                    </div>
                    <span style="font-weight: bold; color: var(--accent-cyan);">${stats.consistency || 5}/10</span>
                </div>
            </div>
        </div>
    `;
    
    // SECCIÓN 2: STATS PRINCIPALES
    const mainStats = [
        {key: "attack", label: "Poder de Ataque", icon: "fa-fist-raised"},
        {key: "control", label: "Control del Campo", icon: "fa-shield-alt"},
        {key: "consistency", label: "Consistencia", icon: "fa-chart-line"},
        {key: "board_break", label: "Romper Mesa", icon: "fa-hammer"},
        {key: "versatility", label: "Versatilidad", icon: "fa-random"},
        {key: "resilience", label: "Resiliencia", icon: "fa-heart"},
        {key: "recovery", label: "Recuperación", icon: "fa-redo"}
    ];
    
    content += `
        <div class="detail-section">
            <h4><i class="fas fa-chart-bar"></i> Estadísticas Principales</h4>
            <div class="stats-grid">
    `;
    
    mainStats.forEach(stat => {
        const value = stats[stat.key] || 5;
        const percentage = value * 10;
        const colorClass = value >= 7 ? 'bar-green' : value >= 4 ? 'bar-yellow' : 'bar-red';
        
        content += `
            <div class="stat-box">
                <div class="stat-label"><i class="fas ${stat.icon}"></i> ${stat.label}</div>
                <div class="stat-value">${value}/10</div>
                <div class="stat-bar">
                    <div class="stat-fill ${colorClass}" style="width: ${percentage}%"></div>
                </div>
                <div class="stat-desc">${getStatDescription(stat.key, value)}</div>
            </div>
        `;
    });
    
    content += `</div></div>`;
    
    // SECCIÓN 3: DEBILIDADES & FORTALEZAS
    content += `
        <div class="detail-section">
            <h4><i class="fas fa-balance-scale"></i> Debilidades & Fortalezas</h4>
            <div class="meta-info-grid">
                <div class="info-list">
                    <h5><i class="fas fa-exclamation-triangle"></i> Debilidades Clave</h5>
                    <div class="list-items">
    `;
    
    if (deck.weaknesses && deck.weaknesses.length > 0) {
        deck.weaknesses.forEach(weakness => {
            content += `
                <div class="list-item">
                    <i class="fas fa-times-circle"></i> ${weakness}
                </div>
            `;
        });
    } else {
        content += `<div class="list-item"><i class="fas fa-check-circle"></i> Sin debilidades significativas</div>`;
    }
    
    content += `
                    </div>
                </div>
                <div class="info-list">
                    <h5><i class="fas fa-check-circle"></i> Fortalezas Principales</h5>
                    <div class="list-items">
    `;
    
    const strengths = extra.strengths || [
        "Consistencia en turno 1",
        "Capacidad de recuperación",
        "Versatilidad de juego"
    ];
    
    strengths.forEach(strength => {
        content += `
            <div class="list-item">
                <i class="fas fa-check-circle"></i> ${strength}
            </div>
        `;
    });
    
    content += `
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // SECCIÓN 4: SIDE DECK & RECOMENDACIONES
    content += `
        <div class="detail-section">
            <h4><i class="fas fa-exchange-alt"></i> Side Deck & Recomendaciones</h4>
            <div class="meta-info-grid">
                <div class="info-list">
                    <h5><i class="fas fa-arrow-right"></i> Cartas para Incluir</h5>
                    <div class="list-items">
    `;
    
    if (matchup.side_in && matchup.side_in.length > 0) {
        matchup.side_in.slice(0, 6).forEach(card => {
            content += `
                <div class="list-item">
                    <i class="fas fa-plus-circle" style="color: var(--accent-green);"></i> ${card}
                </div>
            `;
        });
    } else {
        content += `<div class="list-item"><i class="fas fa-info-circle"></i> No hay recomendaciones específicas</div>`;
    }
    
    content += `
                    </div>
                </div>
                <div class="info-list">
                    <h5><i class="fas fa-arrow-left"></i> Cartas para Retirar</h5>
                    <div class="list-items">
    `;
    
    if (matchup.side_out && matchup.side_out.length > 0) {
        matchup.side_out.slice(0, 6).forEach(card => {
            content += `
                <div class="list-item">
                    <i class="fas fa-minus-circle" style="color: var(--accent-red);"></i> ${card}
                </div>
            `;
        });
    } else {
        content += `<div class="list-item"><i class="fas fa-info-circle"></i> Basado en el matchup</div>`;
    }
    
    content += `
                    </div>
                </div>
            </div>
            
            <div style="margin-top: 20px; padding: 15px; background: var(--bg-secondary); border-radius: 10px;">
                <h5 style="margin-bottom: 10px; color: var(--accent-cyan);">
                    <i class="fas fa-lightbulb"></i> Estrategia Recomendada
                </h5>
                <p style="color: var(--text-secondary); line-height: 1.5;">
                    ${extra.strategy || 'Este deck se beneficia de mantener el control del campo y aplicar presión constante al oponente.'}
                </p>
            </div>
        </div>
    `;
    
    // SECCIÓN 5: ESTADÍSTICAS ADICIONALES (solo si existe información)
    const hasAdditionalStats = Object.keys(addStats).length > 0;
    if (hasAdditionalStats) {
        content += `
            <div class="detail-section">
                <h4><i class="fas fa-star"></i> Estadísticas Adicionales</h4>
                <div class="stats-grid">
        `;
        
        const additionalStats = [
            {key: "draw", label: "Potencial de Robo", icon: "fa-hand-paper"},
            {key: "search", label: "Capacidad de Búsqueda", icon: "fa-search"},
            {key: "swarm", label: "Swarm", icon: "fa-users"},
            {key: "stamina", label: "Resistencia", icon: "fa-battery-full"},
            {key: "comeback", label: "Potencial Comeback", icon: "fa-retweet"},
            {key: "burn", label: "Burn Damage", icon: "fa-fire"}
        ];
        
        additionalStats.forEach(stat => {
            const value = addStats[stat.key] || 3;
            if (value > 0) {
                content += `
                    <div class="stat-box">
                        <div class="stat-label"><i class="fas ${stat.icon}"></i> ${stat.label}</div>
                        <div class="stars" style="font-size: 1.4rem;">${'★'.repeat(value)}${'☆'.repeat(5-value)}</div>
                        <div class="stat-desc">${value}/5 estrellas</div>
                    </div>
                `;
            }
        });
        
        content += `</div></div>`;
    }
    
    // SECCIÓN 6: RESUMEN DEL DECK
    content += `
        <div class="detail-section">
            <h4><i class="fas fa-chart-pie"></i> Resumen del Deck</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                <div class="stat-box">
                    <div class="stat-label">Posición</div>
                    <div class="stat-value" style="color: ${tierColor};">${deck.tier}</div>
                    <div class="stat-desc">${getTierDescription(deck.tier)}</div>
                </div>
                
                <div class="stat-box">
                    <div class="stat-label">Matchup Rating</div>
                    <div class="stat-value">${avgRating}/5</div>
                    <div class="stars" style="font-size: 1.4rem; margin: 10px 0;">
                        ${'★'.repeat(Math.round(avgRating))}${'☆'.repeat(5-Math.round(avgRating))}
                    </div>
                </div>
                
                <div class="stat-box">
                    <div class="stat-label">Recomendación</div>
                    <div class="stat-value" style="font-size: 1.5rem;">
                        ${getRecommendation(deck.tier, avgRating)}
                    </div>
                    <div class="stat-desc">Basado en análisis del deck</div>
                </div>
            </div>
            
            <div style="margin-top: 25px; padding: 20px; background: linear-gradient(135deg, var(--pastel-blue), var(--pastel-purple)); border-radius: 15px;">
                <h5 style="color: var(--accent-magenta); margin-bottom: 10px;">
                    <i class="fas fa-info-circle"></i> Análisis del Deck
                </h5>
                <p style="color: var(--text-primary); line-height: 1.6;">
                    ${extra.analysis || 'Este deck presenta características únicas según su categoría.'}
                </p>
            </div>
        </div>
    `;
    
    content += `
            </div> <!-- Cierre detail-sections -->
        </div> <!-- Cierre deck-detail-complete -->
    `;
    
    document.getElementById('complete-deck-result').innerHTML = content;
    
    // Animar barras de progreso
    setTimeout(() => {
        document.querySelectorAll('.stat-fill').forEach(fill => {
            const width = fill.style.width;
            fill.style.width = '0';
            setTimeout(() => {
                fill.style.width = width;
            }, 100);
        });
    }, 300);
}

// Funciones auxiliares para textos descriptivos
function getDifficultyText(difficulty) {
    if (difficulty <= 3) return 'Fácil - Ideal para principiantes';
    if (difficulty <= 6) return 'Moderado - Requiere práctica';
    if (difficulty <= 8) return 'Difícil - Para jugadores experimentados';
    return 'Muy difícil - Solo para expertos';
}

function getGoingText(which, rating) {
    const texts = {
        first: [
            'Juego pasivo esperando el turno del oponente',
            'Setup básico sin mucha presión',
            'Setup decente con algo de interacción',
            'Setup fuerte con interacción significativa',
            'Setup casi imbatible con múltiples interrupciones'
        ],
        second: [
            'Dificultad para romper tableros establecidos',
            'Capacidad limitada de respuesta',
            'Posibilidad de romper setups moderados',
            'Buen potencial para romper tableros',
            'Excelente capacidad de board breaking'
        ]
    };
    
    return texts[which][rating - 1] || 'Performance estándar';
}

function getStatDescription(stat, value) {
    const descriptions = {
        attack: value >= 7 ? 'Alta potencia de OTK' : value >= 4 ? 'Daño moderado' : 'Daño limitado',
        control: value >= 7 ? 'Control total del campo' : value >= 4 ? 'Control moderado' : 'Control limitado',
        consistency: value >= 7 ? 'Muy consistente' : value >= 4 ? 'Consistencia media' : 'Inconsistente',
        board_break: value >= 7 ? 'Rompe fácilmente' : value >= 4 ? 'Rompe moderadamente' : 'Dificultad para romper',
        versatility: value >= 7 ? 'Muy versátil' : value >= 4 ? 'Versatilidad media' : 'Poco versátil',
        resilience: value >= 7 ? 'Muy resiliente' : value >= 4 ? 'Resiliencia media' : 'Poca resiliencia',
        recovery: value >= 7 ? 'Recuperación excelente' : value >= 4 ? 'Recuperación decente' : 'Recuperación pobre'
    };
    
    return descriptions[stat] || 'Performance estándar';
}

function getRecommendation(tier, rating) {
    if (tier === 'Tier 1' && rating >= 4) return '⭐⭐⭐⭐⭐';
    if (tier === 'Tier 1' || (tier === 'Tier 2' && rating >= 3.5)) return '⭐⭐⭐⭐';
    if (tier === 'Tier 2' || tier === 'rogue') return '⭐⭐⭐';
    if (rating >= 3 || tier === 'fun') return '⭐⭐';
    return '⭐';
}

// Cargar tabla del meta (SOLO TIERS COMPETITIVOS)
function loadMetaTable(sortByTier = false) {
    const tbody = document.getElementById('meta-table-body');
    const tierFilter = document.getElementById('meta-tier-filter').value;
    
    // Filtrar decks - SOLO TIERS COMPETITIVOS
    let deckList = Object.entries(decks).filter(([name, data]) => 
        COMPETITIVE_TIERS.includes(data.tier)
    );
    
    if (tierFilter !== 'all') {
        if (tierFilter === 'rogue' || tierFilter === 'fun') {
            deckList = [];
        } else {
            deckList = deckList.filter(([name, data]) => 
                data.tier.includes(`Tier ${tierFilter}`)
            );
        }
    }
    
    // Ordenar
    if (sortByTier) {
        deckList.sort((a, b) => {
            const tierA = a[1].tier;
            const tierB = b[1].tier;
            if (tierA === tierB) return a[0].localeCompare(b[0]);
            return tierA.localeCompare(tierB);
        });
    }
    
    tbody.innerHTML = '';
    
    if (deckList.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <i class="fas fa-info-circle"></i>
                    <p>No hay decks competitivos con este filtro</p>
                </td>
            </tr>
        `;
        return;
    }
    
    deckList.forEach(([name, data]) => {
        const primaryWeakness = data.weaknesses?.[0] || "Ninguna";
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${name}</strong></td>
            <td>
                <span class="deck-tier ${getTierClass(data.tier)}">
                    ${data.tier}
                </span>
            </td>
            <td>${data.type}</td>
            <td>${data.difficulty}/10</td>
            <td><span class="weakness-tag">${primaryWeakness}</span></td>
        `;
        tbody.appendChild(row);
    });
}

// Cargar side deck
function loadSideDeck() {
    const container = document.getElementById('sidedeck-cards');
    const typeFilter = document.getElementById('side-type-filter').value;
    
    let cardsToShow = sidedeckCards;
    
    if (typeFilter !== 'all') {
        cardsToShow = sidedeckCards.filter(card => card.type === typeFilter);
    }
    
    if (cardsToShow.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i class="fas fa-filter"></i>
                <p>No hay cartas que coincidan con el filtro seleccionado.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = cardsToShow.map(card => `
        <div class="card-item">
            <img src="assets/images/sidedeck/${card.image || 'default.jpg'}" 
                 alt="${card.name}" 
                 class="card-image"
                 onerror="this.src='assets/images/sidedeck/default.jpg'">
            <div class="card-name">${card.name}</div>
            <div class="card-type type-${card.type}">${getTypeName(card.type)}</div>
            <div class="card-desc">${card.description || ''}</div>
            <div class="card-usage">Usada en: ${card.usage || 'N/A'}</div>
        </div>
    `).join('');
}

// Cargar handtraps tier list
function loadHandtrapsTierList() {
    const format = document.getElementById('handtrap-format').value;
    
    // Filtrar por formato si es necesario
    let filteredHandtraps = handtraps;
    if (format !== 'all') {
        filteredHandtraps = handtraps.filter(h => 
            !h.formats || h.formats.includes(format)
        );
    }
    
    // Organizar por tier
    const tiers = {
        's': filteredHandtraps.filter(h => h.tier === 'S'),
        'a': filteredHandtraps.filter(h => h.tier === 'A'),
        'b': filteredHandtraps.filter(h => h.tier === 'B'),
        'c': filteredHandtraps.filter(h => h.tier === 'C')
    };
    
    // Renderizar cada tier
    Object.entries(tiers).forEach(([tier, cards]) => {
        const container = document.getElementById(`tier-${tier}`);
        if (cards.length === 0) {
            container.innerHTML = '<div class="no-cards">No hay cartas en este tier</div>';
            return;
        }
        
        container.innerHTML = cards.map(card => `
            <div class="tier-card">
                <img src="assets/images/handtraps/${card.image || 'default.jpg'}" 
                     alt="${card.name}" 
                     class="tier-card-image"
                     onerror="this.src='assets/images/handtraps/default.jpg'">
                <div class="tier-card-name">${card.name}</div>
            </div>
        `).join('');
    });
}

// Cargar meta análisis profesional (SOLO TIERS COMPETITIVOS)
function loadMetaAnalysis() {
    // Filtrar solo decks competitivos
    const competitiveDecks = Object.entries(decks).filter(([name, deck]) => 
        COMPETITIVE_TIERS.includes(deck.tier)
    );
    
    const totalDecks = competitiveDecks.length;
    
    // Actualizar contadores del header
    document.getElementById('total-decks-count').textContent = totalDecks;
    
    if (totalDecks === 0) {
        document.getElementById('meta-diversity').textContent = '0%';
        document.getElementById('avg-difficulty').textContent = '0/10';
        document.getElementById('dominant-tier').textContent = '-';
        
        // Mostrar mensaje de no hay datos
        document.getElementById('tier-distribution-pro').innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                <i class="fas fa-chart-pie"></i>
                <p>No hay datos de decks competitivos para análisis</p>
            </div>
        `;
        
        document.getElementById('top-decks-meta').querySelector('.analysis-list').innerHTML = `
            <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
                <i class="fas fa-info-circle"></i>
                <p>No hay decks competitivos para mostrar</p>
            </div>
        `;
        
        return;
    }
    
    // Calcular diversidad del meta
    const deckTypes = {};
    competitiveDecks.forEach(([name, deck]) => {
        deckTypes[deck.type] = (deckTypes[deck.type] || 0) + 1;
    });
    const typeDiversity = Math.min(Object.keys(deckTypes).length * 25, 100);
    document.getElementById('meta-diversity').textContent = `${typeDiversity}%`;
    
    // Calcular dificultad promedio
    const totalDifficulty = competitiveDecks.reduce((sum, [name, deck]) => sum + deck.difficulty, 0);
    const avgDifficulty = (totalDifficulty / totalDecks).toFixed(1);
    document.getElementById('avg-difficulty').textContent = `${avgDifficulty}/10`;
    
    // Calcular tier dominante
    const tierCounts = calculateTierDistribution(competitiveDecks);
    const dominantTier = Object.entries(tierCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0];
    document.getElementById('dominant-tier').textContent = dominantTier.replace('Tier ', 'T');
    
    // Distribución de Tier (versión profesional)
    const tierDistributionHTML = generateTierDistributionHTML(tierCounts, totalDecks);
    document.getElementById('tier-distribution-pro').innerHTML = tierDistributionHTML;
    
    // Top 5 Decks del Meta
    const topDecks = calculateTopDecks(competitiveDecks);
    renderTopDecks(topDecks);
    
    // Matchups Clave
    const keyMatchups = generateKeyMatchups(competitiveDecks);
    renderKeyMatchups(keyMatchups);
    
    // Distribución por Tipo
    renderTypeDistribution(deckTypes);
    
    // Análisis de Debilidades
    const weaknesses = analyzeCommonWeaknesses(competitiveDecks);
    renderWeaknessAnalysis(weaknesses);
    
    // Performance por Tipo
    const performanceStats = calculatePerformanceByType(competitiveDecks);
    renderPerformanceStats(performanceStats);
    
    // Side Deck del Meta
    renderMetaSideDeck();
    
    // Estadísticas Generales
    renderGeneralStats(competitiveDecks);
    
    // Animar elementos
    animateElements();
}

// Funciones auxiliares específicas para cada sección (SOLO COMPETITIVO)
function calculateTierDistribution(competitiveDecks) {
    const tierCounts = {
        'Tier 1': 0,
        'Tier 2': 0,
        'Tier 3': 0
    };
    
    competitiveDecks.forEach(([name, deck]) => {
        if (tierCounts[deck.tier] !== undefined) {
            tierCounts[deck.tier]++;
        }
    });
    
    return tierCounts;
}

function generateTierDistributionHTML(tierCounts, totalDecks) {
    const tierColors = {
        'Tier 1': '#70d870',
        'Tier 2': '#d8d870',
        'Tier 3': '#d87070'
    };
    
    const tierIcons = {
        'Tier 1': 'crown',
        'Tier 2': 'medal',
        'Tier 3': 'shield'
    };
    
    return `
        <div class="tier-distribution-pro">
            ${Object.entries(tierCounts).map(([tier, count]) => {
                const percentage = totalDecks > 0 ? Math.round((count / totalDecks) * 100) : 0;
                const color = tierColors[tier];
                
                return `
                    <div class="tier-dist-item-pro">
                        <div class="tier-dist-header-pro">
                            <span class="tier-dist-name">
                                <i class="fas fa-${tierIcons[tier]}"></i>
                                ${tier}
                            </span>
                            <span class="tier-dist-count">${count} decks</span>
                        </div>
                        <div class="tier-dist-bar">
                            <div class="tier-dist-fill" style="width: ${percentage}%; background-color: ${color}"></div>
                        </div>
                        <div class="tier-dist-info">
                            <span>${percentage}% del meta</span>
                            <span>Representación: ${count}/${totalDecks}</span>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function calculateTopDecks(competitiveDecks) {
    const deckScores = competitiveDecks.map(([deckName, deck]) => {
        const extra = additional[deckName] || {};
        const going = extra.going || {first: 3, second: 3};
        const score = calculateDeckScore(deck, going);
        return {deckName, deck, score};
    });
    
    return deckScores.sort((a, b) => b.score - a.score).slice(0, 5);
}

function renderTopDecks(topDecks) {
    const topTierCount = topDecks.filter(d => d.deck.tier === 'Tier 1').length;
    const avgScore = topDecks.length > 0 ? Math.round(topDecks.reduce((sum, d) => sum + d.score, 0) / topDecks.length) : 0;
    
    document.getElementById('top-tier-count').textContent = topTierCount;
    document.getElementById('avg-win-rate').textContent = `${avgScore}%`;
    
    const topDecksList = document.getElementById('top-decks-meta').querySelector('.analysis-list');
    if (topDecks.length === 0) {
        topDecksList.innerHTML = `
            <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
                <i class="fas fa-info-circle"></i>
                <p>No hay decks competitivos para mostrar</p>
            </div>
        `;
        return;
    }
    
    topDecksList.innerHTML = `
        ${topDecks.map((item, index) => {
            const tierClass = getTierClass(item.deck.tier);
            const tierColor = getTierColor(item.deck.tier);
            
            return `
                <li>
                    <div class="list-rank">${index + 1}</div>
                    <div class="list-content">
                        <div class="deck-name">${item.deckName}</div>
                        <div class="deck-meta">
                            <span style="color: ${tierColor}; font-weight: bold;">${item.deck.tier}</span>
                            <span>${item.deck.type}</span>
                            <span>Score: ${item.score}</span>
                        </div>
                    </div>
                </li>
            `;
        }).join('')}
    `;
}

function generateKeyMatchups(competitiveDecks) {
    if (competitiveDecks.length < 3) return [];
    
    // Seleccionar los mejores decks para matchups interesantes
    const topDeckNames = competitiveDecks.slice(0, 3).map(([name]) => name);
    
    return [
        {
            deck1: topDeckNames[0],
            deck2: topDeckNames[1],
            result: 'Matchup clave del formato',
            advantage: decks[topDeckNames[0]].tier === 'Tier 1' ? 'favorable' : 'even',
            advantageText: decks[topDeckNames[0]].tier === 'Tier 1' ? 'Favorable' : 'Equilibrado'
        },
        {
            deck1: topDeckNames[1],
            deck2: topDeckNames[2],
            result: 'Matchup estratégico',
            advantage: decks[topDeckNames[1]].type === 'Control' ? 'favorable' : 'even',
            advantageText: 'Importante para side deck'
        },
        {
            deck1: topDeckNames[0],
            deck2: topDeckNames[2],
            result: 'Matchup de control vs combo',
            advantage: 'even',
            advantageText: 'Muy equilibrado'
        }
    ];
}

function renderKeyMatchups(matchups) {
    if (matchups.length === 0) {
        document.getElementById('key-matchups').querySelector('.matchup-matrix').innerHTML = `
            <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
                <i class="fas fa-info-circle"></i>
                <p>Se necesitan más decks competitivos para generar matchups</p>
            </div>
        `;
        return;
    }
    
    document.getElementById('key-matchups').querySelector('.matchup-matrix').innerHTML = `
        ${matchups.map(matchup => `
            <div class="matchup-item">
                <div class="matchup-decks">
                    <span style="color: var(--accent-cyan);">${matchup.deck1}</span>
                    <i class="fas fa-vs"></i>
                    <span style="color: var(--accent-magenta);">${matchup.deck2}</span>
                </div>
                <div class="matchup-result">${matchup.result}</div>
                <div class="matchup-advantage ${matchup.advantage}">${matchup.advantageText}</div>
            </div>
        `).join('')}
    `;
}

function renderTypeDistribution(deckTypes) {
    const typeColors = {
        'Combo': '#70d870',
        'Control': '#70c1d9',
        'Aggro': '#d87070',
        'Mid-Range': '#d8d870'
    };
    
    const total = Object.values(deckTypes).reduce((a, b) => a + b, 0);
    if (total === 0) {
        document.getElementById('type-distribution').innerHTML = `
            <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
                <i class="fas fa-chart-pie"></i>
                <p>No hay datos para mostrar</p>
            </div>
        `;
        return;
    }
    
    let cumulative = 0;
    
    // Generar gráfico de torta
    const svgHTML = Object.entries(deckTypes).map(([type, count], index) => {
        const percentage = (count / total) * 100;
        const offset = cumulative;
        cumulative += percentage;
        
        const strokeDasharray = `${percentage} 100`;
        const strokeDashoffset = 100 - offset;
        
        return `
            <circle class="pie-segment" 
                    r="16" 
                    cx="16" 
                    cy="16" 
                    stroke="${typeColors[type] || '#cccccc'}" 
                    stroke-dasharray="${strokeDasharray}" 
                    stroke-dashoffset="${strokeDashoffset}">
            </circle>
        `;
    }).join('');
    
    // Generar leyenda
    const legendHTML = Object.entries(deckTypes).map(([type, count]) => {
        const percentage = Math.round((count / total) * 100);
        return `
            <div class="pie-legend-item">
                <div class="pie-color" style="background-color: ${typeColors[type] || '#cccccc'}"></div>
                <span>${type}</span>
                <span style="margin-left: auto; font-weight: bold;">${percentage}%</span>
            </div>
        `;
    }).join('');
    
    document.getElementById('type-distribution').innerHTML = `
        <div class="pie-chart-container">
            <svg class="pie-chart-svg" viewBox="0 0 32 32">
                ${svgHTML}
            </svg>
        </div>
        <div class="pie-legend">
            ${legendHTML}
        </div>
    `;
}

function analyzeCommonWeaknesses(competitiveDecks) {
    const weaknesses = {};
    competitiveDecks.forEach(([name, deck]) => {
        deck.weaknesses?.forEach(weakness => {
            weaknesses[weakness] = (weaknesses[weakness] || 0) + 1;
        });
    });
    
    return Object.entries(weaknesses)
        .map(([name, count]) => ({name, count}))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
}

function renderWeaknessAnalysis(weaknesses) {
    if (weaknesses.length === 0) {
        document.getElementById('weakness-analysis').querySelector('.weakness-analysis').innerHTML = `
            <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
                <i class="fas fa-check-circle"></i>
                <p>No se encontraron debilidades comunes significativas</p>
            </div>
        `;
        return;
    }
    
    document.getElementById('weakness-analysis').querySelector('.weakness-analysis').innerHTML = `
        ${weaknesses.map(weakness => `
            <div class="weakness-item">
                <i class="fas fa-exclamation-circle" style="color: var(--accent-red);"></i>
                <div class="weakness-name">${weakness.name}</div>
                <div class="weakness-impact">${weakness.count} decks</div>
            </div>
        `).join('')}
    `;
}

function calculatePerformanceByType(competitiveDecks) {
    const typeScores = {
        'Combo': [],
        'Control': [],
        'Aggro': [],
        'Mid-Range': []
    };
    
    competitiveDecks.forEach(([deckName, deck]) => {
        const extra = additional[deckName] || {};
        const going = extra.going || {first: 3, second: 3};
        const score = calculateDeckScore(deck, going);
        
        if (typeScores[deck.type]) {
            typeScores[deck.type].push(score);
        }
    });
    
    const result = {};
    Object.keys(typeScores).forEach(type => {
        if (typeScores[type].length > 0) {
            result[type.toLowerCase()] = Math.round(
                typeScores[type].reduce((a, b) => a + b, 0) / typeScores[type].length
            );
        } else {
            result[type.toLowerCase()] = 50;
        }
    });
    
    return result;
}

function renderPerformanceStats(performanceStats) {
    document.getElementById('combo-performance').textContent = `${performanceStats.combo || 0}%`;
    document.getElementById('control-performance').textContent = `${performanceStats.control || 0}%`;
    document.getElementById('aggro-performance').textContent = `${performanceStats.aggro || 0}%`;
    
    // Crear gráfico de barras simple
    const maxValue = Math.max(...Object.values(performanceStats).filter(v => v > 0));
    if (maxValue <= 0) {
        document.getElementById('performance-chart').innerHTML = `
            <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
                <i class="fas fa-chart-bar"></i>
                <p>No hay datos de performance</p>
            </div>
        `;
        return;
    }
    
    const chartHTML = Object.entries(performanceStats).map(([type, value]) => {
        const height = (value / maxValue) * 100;
        const colors = {
            'combo': '#70d870',
            'control': '#70c1d9',
            'aggro': '#d87070',
            'mid-range': '#d8d870'
        };
        
        return `
            <div class="chart-bar" style="
                width: 20%;
                height: ${height}%;
                background-color: ${colors[type] || '#cccccc'};
                left: ${Object.keys(performanceStats).indexOf(type) * 25}%;
            "></div>
        `;
    }).join('');
    
    document.getElementById('performance-chart').innerHTML = chartHTML;
}

function renderMetaSideDeck() {
    // Cartas más usadas en el meta actual
    const metaCards = [
        { name: 'Ash Blossom & Joyous Spring', usage: 94, type: 'handtrap' },
        { name: 'Infinite Impermanence', usage: 82, type: 'handtrap' },
        { name: 'Nibiru, the Primal Being', usage: 76, type: 'board-breaker' },
        { name: 'Dark Ruler No More', usage: 68, type: 'removal' }
    ];
    
    const typeIcons = {
        'handtrap': 'fa-hand-paper',
        'board-breaker': 'fa-hammer',
        'floodgate': 'fa-shield-alt',
        'removal': 'fa-ban'
    };
    
    const typeColors = {
        'handtrap': 'var(--accent-green)',
        'board-breaker': 'var(--accent-red)',
        'floodgate': 'var(--accent-cyan)',
        'removal': 'var(--accent-yellow)'
    };
    
    document.getElementById('meta-side-deck').innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 12px;">
            ${metaCards.map(card => `
                <div style="display: flex; align-items: center; gap: 12px; padding: 15px; background: var(--bg-secondary); border-radius: 12px;">
                    <i class="fas ${typeIcons[card.type]}" style="color: ${typeColors[card.type]}; font-size: 1.2rem;"></i>
                    <div style="flex: 1;">
                        <div style="font-weight: bold; color: var(--text-primary);">${card.name}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">${card.type.replace('-', ' ').toUpperCase()}</div>
                    </div>
                    <div style="font-weight: bold; color: var(--accent-cyan);">${card.usage}%</div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderGeneralStats(competitiveDecks) {
    if (competitiveDecks.length === 0) {
        document.getElementById('avg-going-first').textContent = '0/5';
        document.getElementById('avg-going-second').textContent = '0/5';
        document.getElementById('most-common-type').textContent = '-';
        return;
    }
    
    // Calcular estadísticas generales
    let totalGoingFirst = 0;
    let totalGoingSecond = 0;
    let goingCount = 0;
    
    competitiveDecks.forEach(([deckName, deck]) => {
        const extra = additional[deckName] || {};
        const going = extra.going;
        if (going) {
            totalGoingFirst += going.first || 0;
            totalGoingSecond += going.second || 0;
            goingCount++;
        }
    });
    
    const avgGoingFirst = goingCount > 0 ? (totalGoingFirst / goingCount).toFixed(1) : 0;
    const avgGoingSecond = goingCount > 0 ? (totalGoingSecond / goingCount).toFixed(1) : 0;
    
    // Tipo más común
    const typeCounts = {};
    competitiveDecks.forEach(([name, deck]) => {
        typeCounts[deck.type] = (typeCounts[deck.type] || 0) + 1;
    });
    
    const mostCommonType = Object.entries(typeCounts).reduce((a, b) => a[1] > b[1] ? a : b, ['-', 0])[0];
    
    document.getElementById('avg-going-first').textContent = `${avgGoingFirst}/5`;
    document.getElementById('avg-going-second').textContent = `${avgGoingSecond}/5`;
    document.getElementById('most-common-type').textContent = mostCommonType;
}

function calculateDeckScore(deck, going) {
    const tierScore = getTierScore(deck.tier);
    const difficultyScore = 100 - (deck.difficulty * 7);
    const goingScore = ((going.first + going.second) / 2) * 15;
    return Math.round((tierScore + difficultyScore + goingScore) / 3);
}

function animateElements() {
    setTimeout(() => {
        document.querySelectorAll('.tier-dist-fill, .chart-bar').forEach(fill => {
            const width = fill.style.width;
            fill.style.width = '0';
            setTimeout(() => {
                fill.style.width = width;
            }, 100);
        });
        
        // Animar círculos del gráfico de torta
        document.querySelectorAll('.pie-segment').forEach((segment, index) => {
            segment.style.opacity = '0';
            setTimeout(() => {
                segment.style.opacity = '1';
                segment.style.transition = 'opacity 0.5s ease';
            }, index * 100);
        });
    }, 300);
}

// Aplicar filtros (INCLUYE ROGUE Y FUN)
function applyFilters() {
    const tierFilter = document.getElementById('tier-filter').value;
    const typeFilter = document.getElementById('type-filter').value;
    
    filteredDecks = Object.keys(decks).filter(deckName => {
        const deck = decks[deckName];
        
        // Filtrar por tier
        if (tierFilter !== 'all') {
            if (tierFilter === 'rogue' || tierFilter === 'fun') {
                if (deck.tier !== tierFilter) return false;
            } else if (!deck.tier.includes(`Tier ${tierFilter}`)) {
                return false;
            }
        }
        
        // Filtrar por tipo
        if (typeFilter !== 'all' && deck.type !== typeFilter) {
            return false;
        }
        
        return true;
    });
    
    loadMenuDecks();
}

// Actualizar comparador (INCLUYE ROGUE Y FUN)
function updateComparator() {
    const deck1Name = document.getElementById('deck1-search').value.trim();
    const deck2Name = document.getElementById('deck2-search').value.trim();
    
    if (!deck1Name || !deck2Name) {
        document.getElementById('comparison-result').style.display = 'none';
        document.getElementById('deck1-info').innerHTML = `
            <div class="comparator-empty-state">
                <i class="fas fa-search"></i>
                <p>Escribe el nombre de un deck para ver información</p>
            </div>
        `;
        document.getElementById('deck2-info').innerHTML = `
            <div class="comparator-empty-state">
                <i class="fas fa-search"></i>
                <p>Escribe el nombre de un deck para ver información</p>
            </div>
        `;
        return;
    }
    
    const deck1 = decks[deck1Name];
    const deck2 = decks[deck2Name];
    
    if (!deck1) {
        document.getElementById('deck1-info').innerHTML = `
            <div class="comparator-empty-state error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Deck "${deck1Name}" no encontrado</p>
            </div>
        `;
    } else {
        const extra1 = additional[deck1Name] || {};
        document.getElementById('deck1-info').innerHTML = renderDeckComparatorInfo(deck1Name, deck1, extra1);
    }
    
    if (!deck2) {
        document.getElementById('deck2-info').innerHTML = `
            <div class="comparator-empty-state error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Deck "${deck2Name}" no encontrado</p>
            </div>
        `;
    } else {
        const extra2 = additional[deck2Name] || {};
        document.getElementById('deck2-info').innerHTML = renderDeckComparatorInfo(deck2Name, deck2, extra2);
    }
    
    // Mostrar comparación solo si ambos decks existen
    if (deck1 && deck2) {
        document.getElementById('comparison-result').style.display = 'block';
        document.getElementById('comparison-result').innerHTML = createProfessionalComparisonResult(deck1Name, deck2Name, deck1, deck2);
    } else {
        document.getElementById('comparison-result').style.display = 'none';
    }
}

// Renderizar información del deck para comparador - Versión Profesional
function renderDeckComparatorInfo(deckName, deck, extra) {
    const going = extra.going || {first: 3, second: 3};
    const stats = extra.stats || {};
    const imagePath = deck.image ? `assets/images/decks/${deck.image}` : 'assets/images/decks/default.jpg';
    const avgGoing = (going.first + going.second) / 2;
    
    // Calcular score visual
    const tierScore = getTierScore(deck.tier);
    const difficultyScore = 100 - (deck.difficulty * 7);
    const goingScore = avgGoing * 15;
    const visualScore = Math.round((goingScore + tierScore + difficultyScore) / 3);
    
    // Color del tier
    const tierColor = getTierColor(deck.tier);
    
    return `
        <div class="comparator-deck-info">
            <div class="comparator-header">
                <img src="${imagePath}" alt="${deckName}" class="comparator-deck-image" onerror="this.src='assets/images/decks/default.jpg'">
                <div class="comparator-title">
                    <h4>${deckName}</h4>
                    <div class="comparator-tags">
                        <span class="comparator-tag" style="background-color: ${tierColor}; color: white;">
                            ${deck.tier}
                        </span>
                        <span class="comparator-tag">
                            ${deck.type}
                        </span>
                    </div>
                </div>
            </div>
            
            <div class="comparator-stats">
                <!-- Score Visual -->
                <div class="comparator-stat">
                    <div class="comparator-stat-label">
                        <i class="fas fa-chart-line"></i> Score
                    </div>
                    <div class="comparator-stat-value">${visualScore}/100</div>
                    <div class="comparator-stat-bar">
                        <div class="comparator-stat-fill" style="width: ${visualScore}%; background-color: ${visualScore >= 70 ? '#70d870' : visualScore >= 50 ? '#d8d870' : '#d87070'}"></div>
                    </div>
                </div>
                
                <!-- Dificultad -->
                <div class="comparator-stat">
                    <div class="comparator-stat-label">
                        <i class="fas fa-brain"></i> Dificultad
                    </div>
                    <div class="comparator-stat-value">${deck.difficulty}/10</div>
                    <div class="comparator-stat-bar">
                        <div class="comparator-stat-fill" style="width: ${deck.difficulty * 10}%; background-color: ${deck.difficulty <= 4 ? '#70d870' : deck.difficulty <= 7 ? '#d8d870' : '#d87070'}"></div>
                    </div>
                </div>
                
                <!-- Going First -->
                <div class="comparator-stat">
                    <div class="comparator-stat-label">
                        <span style="font-size: 1.2rem;">⚡</span> Going 1st
                    </div>
                    <div class="comparator-stat-value">${going.first}/5</div>
                    <div class="comparator-stat-bar">
                        <div class="comparator-stat-fill" style="width: ${going.first * 20}%; background-color: var(--accent-cyan);"></div>
                    </div>
                </div>
                
                <!-- Going Second -->
                <div class="comparator-stat">
                    <div class="comparator-stat-label">
                        <span style="font-size: 1.2rem;">⚔️</span> Going 2nd
                    </div>
                    <div class="comparator-stat-value">${going.second}/5</div>
                    <div class="comparator-stat-bar">
                        <div class="comparator-stat-fill" style="width: ${going.second * 20}%; background-color: var(--accent-magenta);"></div>
                    </div>
                </div>
            </div>
            
            <!-- Estadísticas adicionales -->
            <div class="comparator-extra">
                <div class="comparator-extra-item">
                    <i class="fas fa-cogs"></i>
                    <span>${extra.engine || 'Engine estándar'}</span>
                </div>
                <div class="comparator-extra-item">
                    <i class="fas fa-chart-bar"></i>
                    <span>Consistencia: ${stats.consistency || 5}/10</span>
                </div>
            </div>
        </div>
    `;
}

// Crear resultado de comparación profesional (INCLUYE ROGUE Y FUN)
function createProfessionalComparisonResult(deck1Name, deck2Name, deck1, deck2) {
    const matchup1 = matchups[deck1Name] || {side_in: []};
    const matchup2 = matchups[deck2Name] || {side_in: []};
    const extra1 = additional[deck1Name] || {};
    const extra2 = additional[deck2Name] || {};
    
    const going1 = extra1.going || {first: 3, second: 3};
    const going2 = extra2.going || {first: 3, second: 3};
    
    const advantage = getProfessionalDeckAdvantage(deck1Name, deck2Name, deck1, deck2, going1, going2);
    
    return `
        <div class="comparison-result-wrapper">
            <!-- Header de comparación -->
            <div class="comparison-header">
                <h3><i class="fas fa-balance-scale"></i> Análisis de Matchup</h3>
                <div class="comparison-summary">
                    <div class="summary-tag ${advantage.vsClass}">
                        <i class="fas ${advantage.vsIcon}"></i>
                        ${advantage.vsText}
                    </div>
                    <div class="summary-score">
                        <span class="score-deck">${advantage.deck1Score || '0'}</span>
                        <span class="score-vs">vs</span>
                        <span class="score-deck">${advantage.deck2Score || '0'}</span>
                    </div>
                </div>
            </div>
            
            <!-- Grid de comparación -->
            <div class="comparison-grid">
                <!-- VENTAJA -->
                <div class="comparison-section">
                    <h4><i class="fas fa-trophy"></i> Ventaja del Matchup</h4>
                    <div class="advantage-card ${advantage.advantage === deck1Name ? 'advantage-deck1' : advantage.advantage === deck2Name ? 'advantage-deck2' : 'advantage-even'}">
                        <div class="advantage-icon">
                            <i class="fas ${advantage.advantage === deck1Name ? 'fa-arrow-up' : advantage.advantage === deck2Name ? 'fa-arrow-down' : 'fa-equals'}"></i>
                        </div>
                        <div class="advantage-content">
                            <div class="advantage-text">${advantage.advantageText}</div>
                            <div class="advantage-reason">${advantage.reason}</div>
                        </div>
                    </div>
                </div>
                
                <!-- TACTICAS -->
                <div class="comparison-section">
                    <h4><i class="fas fa-chess"></i> Tácticas Recomendadas</h4>
                    <div class="tactics-grid">
                        <div class="tactics-column">
                            <h5>${deck1Name}</h5>
                            <ul class="tactics-list">
                                <li><i class="fas fa-lightbulb"></i> ${advantage.tactics.deck1 || 'Juega según tu estilo'}</li>
                                <li><i class="fas fa-shield-alt"></i> ${advantage.tactics.deck1Defense || 'Aprovecha tus fortalezas'}</li>
                            </ul>
                        </div>
                        <div class="tactics-column">
                            <h5>${deck2Name}</h5>
                            <ul class="tactics-list">
                                <li><i class="fas fa-lightbulb"></i> ${advantage.tactics.deck2 || 'Adapta tu estrategia'}</li>
                                <li><i class="fas fa-shield-alt"></i> ${advantage.tactics.deck2Defense || 'Explota sus debilidades'}</li>
                            </ul>
                        </div>
                    </div>
                </div>
                
                <!-- SIDE DECK -->
                <div class="comparison-section full-width">
                    <h4><i class="fas fa-exchange-alt"></i> Side Deck Recomendado</h4>
                    <div class="side-deck-grid">
                        <div class="side-deck-column">
                            <h5>Sidedeck para ${deck1Name} con ${deck2Name}</h5>
                            <div class="side-deck-cards">
                                ${matchup1.side_in && matchup1.side_in.length > 0 
                                    ? matchup1.side_in.slice(0, 4).map(card => `
                                        <span class="side-deck-card">
                                            <i class="fas fa-plus-circle"></i> ${card}
                                        </span>
                                    `).join('')
                                    : '<span class="no-side-info">No hay información específica</span>'
                                }
                            </div>
                        </div>
                        <div class="side-deck-column">
                            <h5>Sidedeck para ${deck2Name} con ${deck1Name}</h5>
                            <div class="side-deck-cards">
                                ${matchup2.side_in && matchup2.side_in.length > 0 
                                    ? matchup2.side_in.slice(0, 4).map(card => `
                                        <span class="side-deck-card">
                                            <i class="fas fa-plus-circle"></i> ${card}
                                        </span>
                                    `).join('')
                                    : '<span class="no-side-info">No hay información específica</span>'
                                }
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- COMPARACIÓN POR CATEGORÍAS -->
                <div class="comparison-section full-width">
                    <h4><i class="fas fa-chart-bar"></i> Comparación por Categorías</h4>
                    <div class="category-comparison">
                        ${renderCategoryComparison(deck1Name, deck2Name, deck1, deck2, extra1, extra2)}
                    </div>
                </div>
                
                <!-- RESUMEN FINAL -->
                <div class="comparison-section full-width">
                    <h4><i class="fas fa-clipboard-check"></i> Resumen del Matchup</h4>
                    <div class="summary-card">
                        <div class="summary-content">
                            <div class="summary-icon">
                                <i class="fas ${advantage.summaryIcon}"></i>
                            </div>
                            <div class="summary-text">
                                <h5>${advantage.summaryTitle}</h5>
                                <p>${advantage.summaryDescription}</p>
                            </div>
                        </div>
                        <div class="summary-tips">
                            <h6><i class="fas fa-tips"></i> Tips Clave:</h6>
                            <ul>
                                ${advantage.tips.map(tip => `<li>${tip}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Renderizar comparación por categorías
function renderCategoryComparison(deck1Name, deck2Name, deck1, deck2, extra1, extra2) {
    const stats1 = extra1.stats || {};
    const stats2 = extra2.stats || {};
    const going1 = extra1.going || {first: 3, second: 3};
    const going2 = extra2.going || {first: 3, second: 3};
    
    const categories = [
        {key: 'tier', label: 'Posición', icon: 'fa-trophy', 
         value1: deck1.tier, value2: deck2.tier, isBetter: (a, b) => getTierScore(a) > getTierScore(b)},
        {key: 'difficulty', label: 'Dificultad', icon: 'fa-brain', 
         value1: deck1.difficulty, value2: deck2.difficulty, isBetter: (a, b) => a < b, reverse: true},
        {key: 'consistency', label: 'Consistencia', icon: 'fa-chart-line',
         value1: stats1.consistency || 5, value2: stats2.consistency || 5, isBetter: (a, b) => a > b},
        {key: 'going_first', label: 'Going First', icon: 'fa-bolt',
         value1: going1.first, value2: going2.first, isBetter: (a, b) => a > b},
        {key: 'going_second', label: 'Going Second', icon: 'fa-sword',
         value1: going1.second, value2: going2.second, isBetter: (a, b) => a > b},
        {key: 'versatility', label: 'Versatilidad', icon: 'fa-random',
         value1: stats1.versatility || 5, value2: stats2.versatility || 5, isBetter: (a, b) => a > b}
    ];
    
    return categories.map(cat => {
        const isBetter1 = cat.isBetter(cat.value1, cat.value2);
        const isBetter2 = cat.isBetter(cat.value2, cat.value1);
        
        // Calcular valores para la barra
        let width1, width2;
        if (cat.key === 'tier') {
            width1 = (getTierScore(cat.value1) / 100) * 100;
            width2 = (getTierScore(cat.value2) / 100) * 100;
        } else if (cat.key.includes('going')) {
            width1 = (cat.value1 / 5) * 100;
            width2 = (cat.value2 / 5) * 100;
        } else {
            width1 = (cat.value1 / 10) * 100;
            width2 = (cat.value2 / 10) * 100;
        }
        
        return `
            <div class="category-item">
                <div class="category-header">
                    <i class="fas ${cat.icon}"></i>
                    <span>${cat.label}</span>
                </div>
                <div class="category-values">
                    <div class="category-value ${isBetter1 ? 'better' : ''}">
                        <span class="value-text">${cat.value1}${cat.key === 'tier' ? '' : ''}</span>
                        <div class="value-bar">
                            <div class="value-fill deck1" style="width: ${width1}%"></div>
                        </div>
                    </div>
                    <div class="category-value ${isBetter2 ? 'better' : ''}">
                        <span class="value-text">${cat.value2}${cat.key === 'tier' ? '' : ''}</span>
                        <div class="value-bar">
                            <div class="value-fill deck2" style="width: ${width2}%"></div>
                        </div>
                    </div>
                </div>
                <div class="category-winner">
                    ${isBetter1 ? `<i class="fas fa-arrow-left"></i> ${deck1Name}` : 
                      isBetter2 ? `<i class="fas fa-arrow-right"></i> ${deck2Name}` : 
                      '<i class="fas fa-equals"></i> Empate'}
                </div>
            </div>
        `;
    }).join('');
}

// Obtener ventaja profesional del matchup
function getProfessionalDeckAdvantage(deck1Name, deck2Name, deck1, deck2, going1, going2) {
    // Calcular scores
    const score1 = calculateDeckScore(deck1, going1);
    const score2 = calculateDeckScore(deck2, going2);
    
    // Determinar ventaja
    const diff = Math.abs(score1 - score2);
    let advantage = 'even';
    let advantageText = 'Matchup Equilibrado';
    let reason = 'Ambos decks tienen características similares';
    let vsText = 'EMPATE';
    let vsClass = 'summary-even';
    let vsIcon = 'fa-equals';
    let summaryIcon = 'fa-balance-scale';
    let summaryTitle = 'Matchup Equilibrado';
    let summaryDescription = 'Este matchup está bastante igualado. La victoria dependerá más de la habilidad del jugador y las manos iniciales.';
    
    if (score1 > score2 + 10) {
        advantage = deck1Name;
        advantageText = `${deck1Name} tiene ventaja`;
        reason = 'Superioridad en características generales';
        vsText = `${deck1Name} FAVORITO`;
        vsClass = 'summary-deck1';
        vsIcon = 'fa-arrow-up';
        summaryIcon = 'fa-trophy';
        summaryTitle = `${deck1Name} es favorito`;
        summaryDescription = `${deck1Name} tiene una ventaja teórica sobre ${deck2Name}. Sin embargo, un buen side deck y jugadas inteligentes pueden equilibrar el matchup.`;
    } else if (score2 > score1 + 10) {
        advantage = deck2Name;
        advantageText = `${deck2Name} tiene ventaja`;
        reason = 'Mejor adaptación al matchup';
        vsText = `${deck2Name} FAVORITO`;
        vsClass = 'summary-deck2';
        vsIcon = 'fa-arrow-down';
        summaryIcon = 'fa-trophy';
        summaryTitle = `${deck2Name} es favorito`;
        summaryDescription = `${deck2Name} tiene mejores herramientas para enfrentar a ${deck1Name}. Se recomienda un side deck específico para nivelar el campo de juego.`;
    }
    
    // Determinar tácticas basadas en tipos de decks
    const tactics = getTacticsForMatchup(deck1.type, deck2.type, deck1.tier, deck2.tier);
    
    // Tips basados en el matchup
    const tips = getMatchupTips(deck1Name, deck2Name, advantage, deck1.tier, deck2.tier);
    
    return {
        advantage,
        advantageText,
        reason,
        deck1Score: score1,
        deck2Score: score2,
        vsText,
        vsClass,
        vsIcon,
        summaryIcon,
        summaryTitle,
        summaryDescription,
        tactics,
        tips
    };
}

// Obtener tácticas para matchup
function getTacticsForMatchup(type1, type2, tier1, tier2) {
    const tactics = {
        deck1: 'Aplica presión constante',
        deck1Defense: 'Mantén recursos para el largo juego',
        deck2: 'Busca la ventaja temprana',
        deck2Defense: 'Protege tus piezas clave'
    };
    
    // Si un deck es rogue o fun, ajustar tácticas
    if (tier1 === 'rogue' || tier1 === 'fun') {
        tactics.deck1 = 'Usa el factor sorpresa';
        tactics.deck1Defense = 'Juega alrededor del meta conocido';
    }
    
    if (tier2 === 'rogue' || tier2 === 'fun') {
        tactics.deck2 = 'No subestimes al oponente';
        tactics.deck2Defense = 'Prepárate para estrategias inusuales';
    }
    
    return tactics;
}

// Obtener tips del matchup
function getMatchupTips(deck1Name, deck2Name, advantage, tier1, tier2) {
    const tips = [];
    
    if (advantage === 'even') {
        tips.push('El side deck será determinante en este matchup');
        tips.push('Prioriza consistencia sobre potencia');
        tips.push('Analiza el estilo de juego de tu oponente');
        tips.push('No subestimes las cartas de tech');
    } else if (advantage === deck1Name) {
        tips.push(`Como ${deck1Name}, mantén la presión constante`);
        tips.push(`Evita overextending contra posibles board breakers`);
        tips.push(`Sideckea específicamente contra ${deck2Name}`);
        if (tier2 === 'rogue' || tier2 === 'fun') {
            tips.push(`Prepárate para estrategias inusuales de ${deck2Name}`);
        }
    } else {
        tips.push(`Como ${deck2Name}, busca romper su setup inicial`);
        tips.push(`Juega conservador hasta tener ventaja de cartas`);
        tips.push(`Identifica y ataca sus puntos débiles`);
        if (tier1 === 'rogue' || tier1 === 'fun') {
            tips.push(`No subestimes el factor sorpresa de ${deck1Name}`);
        }
    }
    
    return tips;
}

// Funciones auxiliares
function findDeckByName(input) {
    const normalizedInput = input.toLowerCase();
    return Object.keys(decks).find(deckName => 
        deckName.toLowerCase().includes(normalizedInput)
    );
}

function showNotFound(containerId, input) {
    document.getElementById(containerId).innerHTML = `
        <div class="empty-state error">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Deck no encontrado</h3>
            <p>No se encontró ningún deck con el nombre "${input}"</p>
        </div>
    `;
}

function hideAllAutocompletes() {
    document.querySelectorAll('.autocomplete-dropdown').forEach(dropdown => {
        dropdown.style.display = 'none';
    });
}

function getTypeName(type) {
    const typeNames = {
        'handtrap': 'Handtrap',
        'board-breaker': 'Board Breaker',
        'floodgate': 'Floodgate',
        'removal': 'Remoción'
    };
    return typeNames[type] || type;
}

// Cargar preferencias
function loadPreferences() {
    const savedTheme = localStorage.getItem('yugioh-theme') || 'default';
    const savedMode = localStorage.getItem('yugioh-mode') || 'light';
    
    document.body.setAttribute('data-theme', savedTheme);
    document.body.setAttribute('data-mode', savedMode);
    
    // Actualizar botones activos
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.theme === savedTheme) {
            btn.classList.add('active');
        }
    });
    
    // Actualizar texto del botón de modo
    const modeBtn = document.getElementById('mode-toggle');
    if (modeBtn) {
        modeBtn.innerHTML = savedMode === 'dark' 
            ? '<i class="fas fa-sun"></i> Modo Claro'
            : '<i class="fas fa-moon"></i> Modo Oscuro';
    }
}