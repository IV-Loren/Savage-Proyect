// Variables globales
let decks = {};
let matchups = {};
let additional = {};
let sidedeckCards = [];
let handtraps = [];
let mvsData = {};
let mulcharmyData = {};
let archetypeInfo = {};
let currentDeck = null;
let filteredDecks = [];

// Variables para paginación
let currentPage = 1;
const totalPages = 5;

// Tiers que se mostrarán en análisis y meta view
const COMPETITIVE_TIERS = ['Tier 1', 'Tier 2', 'Tier 3'];
const ALL_TIERS = ['Tier 1', 'Tier 2', 'Tier 3', 'Rogue', 'Fun'];

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
    // Navegación principal
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
    
    // Configurar eventos de paginación
    setupPaginationEvents();
}

// Configurar eventos de paginación
function setupPaginationEvents() {
    // Pestañas de navegación
    document.addEventListener('click', function(e) {
        if (e.target.closest('.pagination-tab')) {
            const tab = e.target.closest('.pagination-tab');
            const page = parseInt(tab.dataset.tab);
            goToPage(page);
        }
    });
    
    // Botones de navegación
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    
    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => goToPage(currentPage - 1));
        nextBtn.addEventListener('click', () => goToPage(currentPage + 1));
    }
}

// Cargar todos los datos
async function loadAllData() {
    try {
        console.log('Cargando datos...');
        
        // URLs de los archivos de datos
        const urls = [
            'data/decks.json',
            'data/matchups.json',
            'data/additional.json',
            'data/sidedeck.json',
            'data/handtraps.json',
            'data/mvs.json',
            'data/mulcharmy.json',
            'data/archetypeinfo.json'
        ];
        
        // Nombres para los datos
        const dataNames = [
            'decks', 'matchups', 'additional', 'sidedeck', 
            'handtraps', 'mvsData', 'mulcharmyData', 'archetypeInfo'
        ];
        
        // Cargar todos los archivos en paralelo
        const responses = await Promise.all(urls.map(url => fetch(url).catch(() => ({ ok: false }))));
        
        // Procesar respuestas
        for (let i = 0; i < responses.length; i++) {
            if (responses[i].ok) {
                const data = await responses[i].json();
                switch(dataNames[i]) {
                    case 'decks': decks = data; break;
                    case 'matchups': matchups = data; break;
                    case 'additional': additional = data; break;
                    case 'sidedeck': sidedeckCards = data; break;
                    case 'handtraps': handtraps = data; break;
                    case 'mvsData': mvsData = data; break;
                    case 'mulcharmyData': mulcharmyData = data; break;
                    case 'archetypeInfo': archetypeInfo = data; break;
                }
                console.log(`✓ ${dataNames[i]} cargado`);
            } else {
                console.warn(`✗ Error cargando ${dataNames[i]}, usando datos por defecto`);
                // Inicializar con objetos vacíos
                switch(dataNames[i]) {
                    case 'decks': decks = {}; break;
                    case 'matchups': matchups = {}; break;
                    case 'additional': additional = {}; break;
                    case 'sidedeck': sidedeckCards = []; break;
                    case 'handtraps': handtraps = []; break;
                    case 'mvsData': mvsData = {}; break;
                    case 'mulcharmyData': mulcharmyData = {}; break;
                    case 'archetypeInfo': archetypeInfo = {}; break;
                }
            }
        }
        
        console.log('Datos cargados exitosamente');
        
    } catch (error) {
        console.error('Error crítico cargando datos:', error);
        // Inicializar todas las variables para evitar errores
        decks = {};
        matchups = {};
        additional = {};
        sidedeckCards = [];
        handtraps = [];
        mvsData = {};
        mulcharmyData = {};
        archetypeInfo = {};
    }
}

// ============================================
// FUNCIONES DE PAGINACIÓN - VISTA COMPLETA
// ============================================

// Búsqueda completa con paginación
function searchCompleteDeck(deckNameInput = null) {
    let deckName;
    if (deckNameInput) {
        deckName = deckNameInput;
        document.getElementById('complete-search-input').value = deckName;
    } else {
        deckName = document.getElementById('complete-search-input').value.trim();
    }
    
    if (!deckName) {
        showEmptyState();
        return;
    }
    
    const foundDeckName = findDeckByName(deckName);
    if (!foundDeckName) {
        showNotFound('complete-deck-result', deckName);
        hidePagination();
        return;
    }
    
    currentDeck = foundDeckName;
    currentPage = 1;
    renderPaginationContent(currentPage, currentDeck);
    showPagination();
}

// Mostrar estado vacío
function showEmptyState() {
    const container = document.getElementById('complete-deck-result');
    if (!container) return;
    
    container.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-search"></i>
            <p>Escribe el nombre de un deck para ver información detallada.</p>
        </div>
    `;
    hidePagination();
}

// Mostrar paginación
function showPagination() {
    const paginationNav = document.querySelector('.pagination-navigation');
    if (paginationNav) {
        paginationNav.style.display = 'flex';
    }
}

// Ocultar paginación
function hidePagination() {
    const paginationNav = document.querySelector('.pagination-navigation');
    if (paginationNav) {
        paginationNav.style.display = 'none';
    }
}

// Navegar a página específica
function goToPage(page) {
    if (page < 1 || page > totalPages || !currentDeck) return;
    currentPage = page;
    renderPaginationContent(currentPage, currentDeck);
}

// Renderizar contenido de paginación
function renderPaginationContent(page, deckName) {
    const paginationContent = document.querySelector('.pagination-content');
    if (!paginationContent) return;
    
    // Actualizar pestaña activa
    updateActiveTab(page);
    
    // Renderizar página específica
    switch(page) {
        case 1:
            renderOverviewPage(deckName, paginationContent);
            break;
        case 2:
            renderMVSPage(deckName, paginationContent);
            break;
        case 3:
            renderMulcharmyPage(deckName, paginationContent);
            break;
        case 4:
            renderEndboardPage(deckName, paginationContent);
            break;
        case 5:
            renderArchetypePage(deckName, paginationContent);
            break;
        default:
            renderOverviewPage(deckName, paginationContent);
    }
    
    updatePaginationInfo();
}

// Actualizar pestaña activa
function updateActiveTab(page) {
    document.querySelectorAll('.pagination-tab').forEach(tab => {
        tab.classList.remove('active');
        if (parseInt(tab.dataset.tab) === page) {
            tab.classList.add('active');
        }
    });
}

// Actualizar información de paginación
function updatePaginationInfo() {
    const currentPageElement = document.getElementById('current-page');
    const totalPagesElement = document.getElementById('total-pages');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    
    if (currentPageElement) currentPageElement.textContent = currentPage;
    if (totalPagesElement) totalPagesElement.textContent = totalPages;
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages;
}

// ============================================
// PÁGINAS DE PAGINACIÓN
// ============================================

// Página 1: Resumen (Vista Completa)
function renderOverviewPage(deckName, container) {
    const deck = decks[deckName] || {};
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
        <div class="pagination-page active" data-page="overview">
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
                                <i class="fas fa-chess-queen"></i> ${deck.tier || 'Tier Desconocido'}
                            </span>
                            <span class="detail-tag">
                                <i class="fas fa-layer-group"></i> ${deck.type || 'Tipo Desconocido'}
                            </span>
                            <span class="detail-tag">
                                <i class="fas fa-cogs"></i> ${extra.engine || 'Engine Variado'}
                            </span>
                        </div>
                        
                        <div style="margin: 20px 0;">
                            <div class="stat-box">
                                <div class="stat-label">DIFICULTAD</div>
                                <div class="stat-value" style="color: ${difficultyColor}">${deck.difficulty || 5}/10</div>
                                <div class="stat-bar">
                                    <div class="stat-fill" style="width: ${(deck.difficulty || 5) * 10}%"></div>
                                </div>
                                <div class="stat-desc">${getDifficultyText(deck.difficulty || 5)}</div>
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
    
    // Cerrar estructura
    content += `
                </div> <!-- Cierre detail-sections -->
            </div> <!-- Cierre deck-detail-complete -->
        </div> <!-- Cierre pagination-page -->
    `;
    
    container.innerHTML = content;
    
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

// Página 2: Meta Vulnerability Score
function renderMVSPage(deckName, container) {
    const deck = decks[deckName] || {};
    const mvs = mvsData[deckName] || {};
    
    // Mapeo de niveles a colores y descripciones
    const levelConfig = {
        'Counterproductive': { 
            class: 'mvs-level-counterproductive', 
            desc: '🟢 Contraproducente, El deck ignora esta carta',
            emoji: '🟢'
        },
        'Nulo': { 
            class: 'mvs-level-nulo', 
            desc: '🟢 Nulo, El deck ignora esta carta',
            emoji: '🟢'
        },
        'Low': { 
            class: 'mvs-level-low', 
            desc: '🟡 Bajo, Molesta pero no detiene',
            emoji: '🟡'
        },
        'Medium': { 
            class: 'mvs-level-medium', 
            desc: '🟠 Medio, Pierde ventaja',
            emoji: '🟠'
        },
        'High': { 
            class: 'mvs-level-high', 
            desc: '🔴 Alto, Turno casi muerto',
            emoji: '🔴'
        },
        'Lethal': { 
            class: 'mvs-level-lethal', 
            desc: '☠ Letal, Autopierde',
            emoji: '☠'
        }
    };
    
    const cards = [
        'Ash Blossom', 'Droll & Lock Bird', 'Nibiru', 
        'Infinite Impermanence', 'Ghost Belle', 'Bystials',
        'Dark Ruler No More', 'Forbidden Droplet', 
        'Super Polymerization', 'Ghost Ogre'
    ];
    
    // Calcular vulnerabilidad general
    const overallVulnerability = calculateOverallVulnerability(mvs);
    
    let content = `
        <div class="pagination-page active" data-page="mvs">
            <div class="mvs-container">
                <div class="mvs-header">
                    <h3><i class="fas fa-shield-alt"></i> Meta Vulnerability Score</h3>
                    <div class="mvs-summary">
                        <div class="mvs-overall">
                            <div style="font-size: 0.9rem; color: var(--text-secondary);">Vulnerabilidad</div>
                            <div style="font-size: 1.8rem; font-weight: bold; color: ${getVulnerabilityColorByScore(overallVulnerability)};">
                                ${overallVulnerability}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="mvs-table-container">
                    <table class="mvs-table">
                        <thead>
                            <tr>
                                <th style="width: 25%;">Carta</th>
                                <th style="width: 20%;">Nivel</th>
                                <th style="width: 30%;">Impacto</th>
                                <th style="width: 25%;">Descripción</th>
                            </tr>
                        </thead>
                        <tbody>
    `;
    
    cards.forEach(card => {
        const level = mvs[card] || 'Low';
        const config = levelConfig[level] || levelConfig['Low'];
        
        content += `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div class="mvs-card-icon">
                            <i class="fas fa-cards" style="color: var(--accent-cyan);"></i>
                        </div>
                        <strong style="color: var(--text-primary);">${card}</strong>
                    </div>
                </td>
                <td>
                    <span class="mvs-level ${config.class}">
                        ${config.emoji} ${level}
                    </span>
                </td>
                <td>
                    <div class="mvs-bar-container">
                        <div class="mvs-bar" style="width: ${getVulnerabilityWidth(level)}%; 
                            background-color: ${getVulnerabilityColor(level)}"></div>
                    </div>
                </td>
                <td style="color: var(--text-secondary); font-size: 0.9rem;">
                    ${config.desc}
                </td>
            </tr>
        `;
    });
    
    content += `
                        </tbody>
                    </table>
                </div>
                
                <div style="margin-top: 25px; padding: 20px; background: var(--bg-secondary); border-radius: 15px;">
                    <h4 style="color: var(--accent-cyan); margin-bottom: 10px;">
                        <i class="fas fa-lightbulb"></i> Análisis de Vulnerabilidad
                    </h4>
                    <p style="color: var(--text-secondary); line-height: 1.6; margin-top: 10px;">
                        ${generateMVSAnalysis(deckName, mvs)}
                    </p>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = content;
}

// Página 3: Mulcharmy Analysis
function renderMulcharmyPage(deckName, container) {
    const mulcharmy = mulcharmyData[deckName] || {};
    
    const levelConfig = {
        'None': { class: 'draw-indicator-none', desc: '🟢 Ninguno, 0 draws extra' },
        'Low': { class: 'draw-indicator-low', desc: '🟢 Bajo, 1 draw extra' },
        'Medium': { class: 'draw-indicator-medium', desc: '🟡 Medio, 2 draws extra' },
        'High': { class: 'draw-indicator-high', desc: '🟠 Alto, 3-4 draws extra' },
        'Very High': { class: 'draw-indicator-very-high', desc: '🔴 Demasiados, 5+ draws' },
        'Lethal': { class: 'draw-indicator-lethal', desc: '☠ Letal, Autowin para oponente' }
    };
    
    const mulcharmyCards = [
        { name: 'Mulcharmy Meowls', desc: 'Invocan desde GY y Banish', icon: 'fa-cat' },
        { name: 'Mulcharmy Purulia', desc: 'Invocación desde Mano', icon: 'fa-solid fa-hands-bubbles' },
        { name: 'Mulcharmy Fuwalos', desc: 'Invocación desde Deck y Extra', icon: 'fa-feather-alt' }
    ];
    
    // Calcular riesgo general
    const drawRisk = calculateDrawRisk(mulcharmy);
    
    let content = `
        <div class="pagination-page active" data-page="mulcharmy">
            <div class="mulcharmy-container">
                <div class="mvs-header">
                    <h3><i class="fas fa-cat"></i> Mulcharmy Draw Analysis</h3>
                    <div class="mvs-summary">
                        <div class="mvs-overall">
                            <div style="font-size: 0.9rem; color: var(--text-secondary);">Draw Risk</div>
                            <div style="font-size: 1.8rem; font-weight: bold; color: ${getDrawRiskColor(drawRisk)};">
                                ${drawRisk}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="mulcharmy-grid">
    `;
    
    mulcharmyCards.forEach(card => {
        const level = mulcharmy[card.name] || 'None';
        const config = levelConfig[level] || levelConfig['None'];
        
        content += `
            <div class="mulcharmy-card">
                <div class="mulcharmy-card-header">
                    <div class="mulcharmy-card-icon" style="background: linear-gradient(135deg, var(--pastel-purple), var(--pastel-blue)); width: 50px; height: 50px; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                        <i class="fas ${card.icon}" style="color: white; font-size: 1.5rem;"></i>
                    </div>
                    <div class="mulcharmy-card-title">
                        <h4 style="color: var(--text-primary); margin: 0;">${card.name}</h4>
                        <p style="color: var(--text-secondary); margin: 5px 0 0 0; font-size: 0.9rem;">${card.desc}</p>
                    </div>
                </div>
                
                <div class="mulcharmy-level" style="margin: 15px 0;">
                    <span class="draw-indicator ${config.class}" style="padding: 8px 12px; border-radius: 20px; font-weight: bold;">
                        ${level}
                    </span>
                    <span style="color: var(--text-secondary); font-size: 1.2rem; margin-left: 10px;">
                        ${getDrawEmoji(level)}
                    </span>
                </div>
                
                <div class="draw-description" style="background: var(--bg-card); padding: 12px; border-radius: 10px; margin: 10px 0;">
                    ${config.desc}
                </div>
                
                <div style="margin-top: 15px; padding: 10px; background: var(--bg-card); border-radius: 8px;">
                    <div style="font-size: 0.85rem; color: var(--text-secondary); display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-info-circle" style="color: var(--accent-cyan);"></i>
                        <span>${getMulcharmyTip(deckName, card.name, level)}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    content += `
                </div>
                
                <div style="margin-top: 30px; padding: 20px; background: linear-gradient(135deg, var(--pastel-purple), var(--pastel-blue)); 
                        border-radius: 15px; border: 2px solid var(--border-color);">
                    <h4 style="color: var(--text-primary); margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-tips"></i> Recomendaciones vs Mulcharmy
                    </h4>
                    <ul style="color: var(--text-secondary); padding-left: 20px; line-height: 1.6;">
                        ${generateMulcharmyTips(deckName, mulcharmy).map(tip => 
                            `<li style="margin-bottom: 8px;">${tip}</li>`
                        ).join('')}
                    </ul>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = content;
}

// Página 4: Endboard Visualizer
function renderEndboardPage(deckName, container) {
    const archetype = archetypeInfo[deckName] || {};
    const deck = decks[deckName] || {};
    
    // Ruta de imagen
    const imagePath = archetype.endboard_image ? 
        `assets/images/endboards/${archetype.endboard_image}` : 
        'assets/images/endboards/default.jpg';
    
    let content = `
        <div class="pagination-page active" data-page="endboard">
            <div class="endboard-container">
                <div class="endboard-header">
                    <h3 style="color: var(--text-primary); margin-bottom: 10px;">Endboard Visualizer</h3>
                    <p style="color: var(--text-secondary); max-width: 600px; margin: 0 auto;">Tablero final típico que establece ${deckName}</p>
                </div>
                
                <div class="endboard-display">
                    <img src="${imagePath}" 
                         alt="Endboard de ${deckName}" 
                         class="endboard-image"
                         onerror="this.onerror=null; this.src='assets/images/endboards/default.jpg'"
                         style="border-radius: 15px; width: 100%; height: 100%; object-fit: contain;">
                </div>
                
                <div class="endboard-info" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 25px 0;">
                    <div class="endboard-stat" style="background: var(--bg-secondary); padding: 15px; border-radius: 10px; border: 1px solid var(--border-color); text-align: center;">
                        <div class="endboard-stat-label" style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 5px;">Interrupciones</div>
                        <div class="endboard-stat-value" style="font-size: 1.2rem; font-weight: bold; color: var(--accent-cyan);">${getInterruptionCount(deckName)}</div>
                    </div>
                    <div class="endboard-stat" style="background: var(--bg-secondary); padding: 15px; border-radius: 10px; border: 1px solid var(--border-color); text-align: center;">
                        <div class="endboard-stat-label" style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 5px;">Negaciones</div>
                        <div class="endboard-stat-value" style="font-size: 1.2rem; font-weight: bold; color: ${archetype.has_negations ? '#70d870' : '#d87070'}">
                            ${archetype.has_negations ? 'Sí' : 'No'}
                        </div>
                    </div>
                    <div class="endboard-stat" style="background: var(--bg-secondary); padding: 15px; border-radius: 10px; border: 1px solid var(--border-color); text-align: center;">
                        <div class="endboard-stat-label" style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 5px;">Recuperación</div>
                        <div class="endboard-stat-value" style="font-size: 1.2rem; font-weight: bold; color: ${archetype.has_recovery ? '#70d870' : '#d87070'}">
                            ${archetype.has_recovery ? 'Alta' : 'Baja'}
                        </div>
                    </div>
                    <div class="endboard-stat" style="background: var(--bg-secondary); padding: 15px; border-radius: 10px; border: 1px solid var(--border-color); text-align: center;">
                        <div class="endboard-stat-label" style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 5px;">Protección</div>
                        <div class="endboard-stat-value" style="font-size: 1.2rem; font-weight: bold; color: var(--accent-cyan);">${getProtectionLevel(archetype)}</div>
                    </div>
                </div>
                
                <div style="margin-top: 25px; padding: 20px; background: var(--bg-secondary); border-radius: 15px;">
                    <h4 style="color: var(--accent-cyan); margin-bottom: 10px; display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-chess"></i> Estrategia del Endboard
                    </h4>
                    <p style="color: var(--text-secondary); line-height: 1.6;">
                        ${archetype.playstyle || 'Endboard típico con múltiples interrupciones.'}
                    </p>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = content;
}

// Página 5: Archetype Information
function renderArchetypePage(deckName, container) {
    const archetype = archetypeInfo[deckName] || {};
    const deck = decks[deckName] || {};
    
    // Calcular estabilidad
    const stability = calculateArchetypeStability(archetype);
    
    let content = `
        <div class="pagination-page active" data-page="archetype">
            <div class="archetype-container">
                <div class="mvs-header">
                    <h3><i class="fas fa-info-circle"></i> Información del Arquetipo</h3>
                    <div class="mvs-summary">
                        <div class="mvs-overall">
                            <div style="font-size: 0.9rem; color: var(--text-secondary);">Estabilidad</div>
                            <div style="font-size: 1.8rem; font-weight: bold; color: ${getStabilityColor(stability)};">
                                ${stability}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="archetype-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-top: 20px;">
    `;
    
    // Información básica
    content += `
        <div class="archetype-card" style="background: var(--bg-secondary); border-radius: 15px; padding: 20px; border: 1px solid var(--border-color);">
            <div class="archetype-card-header" style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid var(--border-color);">
                <i class="fas fa-calendar-alt" style="color: var(--accent-cyan); font-size: 1.2rem;"></i>
                <h4 style="color: var(--text-primary); margin: 0; font-size: 1.1rem;">Historial</h4>
            </div>
            <div class="archetype-content" style="display: flex; flex-direction: column; gap: 10px;">
                <div class="archetype-item" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px dashed var(--border-color);">
                    <span class="archetype-label" style="color: var(--text-secondary); font-size: 0.9rem;">Año de Salida</span>
                    <span class="archetype-value number" style="font-weight: bold; color: var(--accent-cyan);">${archetype.year || 'N/A'}</span>
                </div>
                <div class="archetype-item" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px dashed var(--border-color);">
                    <span class="archetype-label" style="color: var(--text-secondary); font-size: 0.9rem;">Último Soporte</span>
                    <span class="archetype-value number" style="font-weight: bold; color: var(--accent-cyan);">${archetype.last_support || 'N/A'}</span>
                </div>
                <div class="archetype-item" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                    <span class="archetype-label" style="color: var(--text-secondary); font-size: 0.9rem;">Tier Actual</span>
                    <span class="archetype-value" style="font-weight: bold; color: ${getTierColor(deck.tier)};">
                        ${deck.tier || 'N/A'}
                    </span>
                </div>
            </div>
        </div>
    `;
    
    // Características del deck
    content += `
        <div class="archetype-card" style="background: var(--bg-secondary); border-radius: 15px; padding: 20px; border: 1px solid var(--border-color);">
            <div class="archetype-card-header" style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid var(--border-color);">
                <i class="fas fa-cogs" style="color: var(--accent-cyan); font-size: 1.2rem;"></i>
                <h4 style="color: var(--text-primary); margin: 0; font-size: 1.1rem;">Características</h4>
            </div>
            <div class="archetype-content" style="display: flex; flex-direction: column; gap: 10px;">
                <div class="archetype-item" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px dashed var(--border-color);">
                    <span class="archetype-label" style="color: var(--text-secondary); font-size: 0.9rem;">Posee Negaciones</span>
                    <span class="archetype-value ${archetype.has_negations ? 'true' : 'false'}" style="font-weight: bold; color: ${archetype.has_negations ? '#70d870' : '#d87070'}">
                        ${archetype.has_negations ? 'Sí' : 'No'}
                    </span>
                </div>
                <div class="archetype-item" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px dashed var(--border-color);">
                    <span class="archetype-label" style="color: var(--text-secondary); font-size: 0.9rem;">Removal Non-Target</span>
                    <span class="archetype-value ${archetype.has_non_targeting_removal ? 'true' : 'false'}" style="font-weight: bold; color: ${archetype.has_non_targeting_removal ? '#70d870' : '#d87070'}">
                        ${archetype.has_non_targeting_removal ? 'Sí' : 'No'}
                    </span>
                </div>
                <div class="archetype-item" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                    <span class="archetype-label" style="color: var(--text-secondary); font-size: 0.9rem;">Recupera Recursos</span>
                    <span class="archetype-value ${archetype.has_recovery ? 'true' : 'false'}" style="font-weight: bold; color: ${archetype.has_recovery ? '#70d870' : '#d87070'}">
                        ${archetype.has_recovery ? 'Sí' : 'No'}
                    </span>
                </div>
            </div>
        </div>
    `;
    
    // Estadísticas de monstruos
    content += `
        <div class="archetype-card" style="background: var(--bg-secondary); border-radius: 15px; padding: 20px; border: 1px solid var(--border-color);">
            <div class="archetype-card-header" style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid var(--border-color);">
                <i class="fas fa-fist-raised" style="color: var(--accent-cyan); font-size: 1.2rem;"></i>
                <h4 style="color: var(--text-primary); margin: 0; font-size: 1.1rem;">Estadísticas</h4>
            </div>
            <div class="archetype-content" style="display: flex; flex-direction: column; gap: 10px;">
                <div class="archetype-item" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px dashed var(--border-color);">
                    <span class="archetype-label" style="color: var(--text-secondary); font-size: 0.9rem;">ATK Más Alto</span>
                    <span class="archetype-value number" style="font-weight: bold; color: var(--accent-cyan);">${archetype.highest_atk || 'N/A'}</span>
                </div>
                <div class="archetype-item" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px dashed var(--border-color);">
                    <span class="archetype-label" style="color: var(--text-secondary); font-size: 0.9rem;">Monstruos Intargetables</span>
                    <span class="archetype-value ${archetype.has_untargetable ? 'true' : 'false'}" style="font-weight: bold; color: ${archetype.has_untargetable ? '#70d870' : '#d87070'}">
                        ${archetype.has_untargetable ? 'Sí' : 'No'}
                    </span>
                </div>
                <div class="archetype-item" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                    <span class="archetype-label" style="color: var(--text-secondary); font-size: 0.9rem;">Inafectado de Arquetipo</span>
                    <span class="archetype-value ${archetype.has_archetype_unaffected ? 'true' : 'false'}" style="font-weight: bold; color: ${archetype.has_archetype_unaffected ? '#70d870' : '#d87070'}">
                        ${archetype.has_archetype_unaffected ? 'Sí' : 'No'}
                    </span>
                </div>
            </div>
        </div>
    `;
    
    // Tipos de cartas
    content += `
        <div class="archetype-card" style="background: var(--bg-secondary); border-radius: 15px; padding: 20px; border: 1px solid var(--border-color);">
            <div class="archetype-card-header" style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid var(--border-color);">
                <i class="fas fa-layer-group" style="color: var(--accent-cyan); font-size: 1.2rem;"></i>
                <h4 style="color: var(--text-primary); margin: 0; font-size: 1.1rem;">Composición</h4>
            </div>
            <div class="archetype-content" style="display: flex; flex-direction: column; gap: 10px;">
                <div class="archetype-item" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px dashed var(--border-color);">
                    <span class="archetype-label" style="color: var(--text-secondary); font-size: 0.9rem;">Posee Trampas</span>
                    <span class="archetype-value ${archetype.has_traps ? 'true' : 'false'}" style="font-weight: bold; color: ${archetype.has_traps ? '#70d870' : '#d87070'}">
                        ${archetype.has_traps ? 'Sí' : 'No'}
                    </span>
                </div>
                <div class="archetype-item" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px dashed var(--border-color);">
                    <span class="archetype-label" style="color: var(--text-secondary); font-size: 0.9rem;">Posee Magias</span>
                    <span class="archetype-value ${archetype.has_spells ? 'true' : 'false'}" style="font-weight: bold; color: ${archetype.has_spells ? '#70d870' : '#d87070'}">
                        ${archetype.has_spells ? 'Sí' : 'No'}
                    </span>
                </div>
                <div class="archetype-item" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                    <span class="archetype-label" style="color: var(--text-secondary); font-size: 0.9rem;">Tipo de Deck</span>
                    <span class="archetype-value" style="font-weight: bold; color: var(--text-primary);">${deck.type || 'N/A'}</span>
                </div>
            </div>
        </div>
    `;
    
    // Cartas clave
    if (archetype.key_cards && archetype.key_cards.length > 0) {
        content += `
            <div class="archetype-card" style="grid-column: 1 / -1; background: var(--bg-secondary); border-radius: 15px; padding: 20px; border: 1px solid var(--border-color);">
                <div class="archetype-card-header" style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid var(--border-color);">
                    <i class="fas fa-star" style="color: var(--accent-cyan); font-size: 1.2rem;"></i>
                    <h4 style="color: var(--text-primary); margin: 0; font-size: 1.1rem;">Cartas Clave</h4>
                </div>
                <div class="archetype-content">
                    <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px;">
                        ${archetype.key_cards.map(card => `
                            <span style="padding: 8px 15px; background: var(--bg-card); 
                                  border-radius: 20px; border: 1px solid var(--border-color);
                                  color: var(--text-primary); font-size: 0.9rem; display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-caret-right" style="color: var(--accent-cyan);"></i>
                                ${card}
                            </span>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }
    
    content += `
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = content;
}

// ============================================
// FUNCIONES AUXILIARES PARA ANÁLISIS
// ============================================

// Funciones para análisis MVS
function calculateOverallVulnerability(mvs) {
    const levels = {
        'Counterproductive': 10,
        'Nulo': 20,
        'Low': 40,
        'Medium': 60,
        'High': 80,
        'Lethal': 100
    };
    
    const values = Object.values(mvs);
    if (values.length === 0) return 'N/A';
    
    const total = values.reduce((sum, level) => sum + (levels[level] || 50), 0);
    const avg = Math.round(total / values.length);
    
    if (avg >= 80) return 'Alta';
    if (avg >= 60) return 'Media-Alta';
    if (avg >= 40) return 'Media';
    if (avg >= 20) return 'Media-Baja';
    return 'Baja';
}

function getVulnerabilityWidth(level) {
    const widths = {
        'Counterproductive': 10,
        'Nulo': 20,
        'Low': 40,
        'Medium': 60,
        'High': 80,
        'Lethal': 100
    };
    return widths[level] || 50;
}

function getVulnerabilityColor(level) {
    const colors = {
        'Counterproductive': '#70d870',
        'Nulo': '#70c1d9',
        'Low': '#d8d870',
        'Medium': '#d8a470',
        'High': '#d87070',
        'Lethal': '#8b0000'
    };
    return colors[level] || '#d8d870';
}

function getVulnerabilityColorByScore(score) {
    const colors = {
        'Alta': '#d87070',
        'Media-Alta': '#d8a470',
        'Media': '#d8d870',
        'Media-Baja': '#70c1d9',
        'Baja': '#70d870',
        'N/A': '#cccccc'
    };
    return colors[score] || '#cccccc';
}

function generateMVSAnalysis(deckName, mvs) {
    const lethal = Object.entries(mvs).filter(([card, level]) => level === 'Lethal');
    const high = Object.entries(mvs).filter(([card, level]) => level === 'High');
    
    if (lethal.length > 0) {
        return `${deckName} es extremadamente vulnerable a: ${lethal.map(([card]) => card).join(', ')}. Estas cartas pueden detener completamente el deck.`;
    } else if (high.length > 0) {
        return `${deckName} tiene vulnerabilidades significativas contra: ${high.map(([card]) => card).join(', ')}. Considera sideckear protección contra estas cartas.`;
    } else {
        return `${deckName} tiene un perfil de vulnerabilidad equilibrado. No tiene debilidades críticas, pero varias cartas pueden molestar su juego.`;
    }
}

// Funciones para análisis Mulcharmy
function calculateDrawRisk(mulcharmy) {
    const levels = {
        'None': 0,
        'Low': 1,
        'Medium': 2,
        'High': 3,
        'Very High': 4,
        'Lethal': 5
    };
    
    const values = Object.values(mulcharmy);
    if (values.length === 0) return 'N/A';
    
    const total = values.reduce((sum, level) => sum + (levels[level] || 0), 0);
    const avg = Math.round(total / values.length);
    
    if (avg >= 4) return 'Crítico';
    if (avg >= 3) return 'Alto';
    if (avg >= 2) return 'Moderado';
    if (avg >= 1) return 'Bajo';
    return 'Mínimo';
}

function getDrawRiskColor(risk) {
    const colors = {
        'Crítico': '#8b0000',
        'Alto': '#d87070',
        'Moderado': '#d8a470',
        'Bajo': '#d8d870',
        'Mínimo': '#70d870',
        'N/A': '#cccccc'
    };
    return colors[risk] || '#cccccc';
}

function getDrawEmoji(level) {
    const emojis = {
        'None': '🟢',
        'Low': '🟢',
        'Medium': '🟡',
        'High': '🟠',
        'Very High': '🔴',
        'Lethal': '☠'
    };
    return emojis[level] || '⚪';
}

function getMulcharmyTip(deckName, cardName, level) {
    const tips = {
        'None': 'No hay riesgo significativo',
        'Low': 'Riesgo mínimo, puede ignorarse',
        'Medium': 'Considera jugar más conservador',
        'High': 'Evita activaciones innecesarias',
        'Very High': 'Cambia tu estrategia por completo',
        'Lethal': 'Considera no jugar contra Mulcharmy'
    };
    return tips[level] || 'Riesgo desconocido';
}

function generateMulcharmyTips(deckName, mulcharmy) {
    const tips = [];
    
    if (mulcharmy['Mulcharmy Fuwalos'] === 'Lethal') {
        tips.push('Evita activar efectos que busquen en el deck');
        tips.push('Considera jugar sin tu combo principal');
    }
    
    if (mulcharmy['Mulcharmy Purulia'] === 'High' || mulcharmy['Mulcharmy Purulia'] === 'Very High') {
        tips.push('Limita las invocaciones especiales');
        tips.push('Prioriza monstruos que no sean de efecto');
    }
    
    if (mulcharmy['Mulcharmy Meowls'] === 'High') {
        tips.push('Activa efectos en cadena para minimizar draws');
        tips.push('Considera usar menos efectos de activación');
    }
    
    if (tips.length === 0) {
        tips.push('Puedes jugar normalmente, riesgo mínimo');
        tips.push('No se requieren ajustes específicos');
    }
    
    return tips;
}

// Funciones para análisis de Endboard
function getInterruptionCount(deckName) {
    const archetype = archetypeInfo[deckName] || {};
    const deck = decks[deckName] || {};
    
    if (archetype.has_negations) {
        if (deck.type === 'Combo') return '4-6';
        if (deck.type === 'Control') return '3-5';
        if (deck.type === 'Mid-Range') return '2-4';
    }
    
    return '1-2';
}

function getProtectionLevel(archetype) {
    let level = 0;
    if (archetype.has_untargetable) level += 1;
    if (archetype.has_archetype_unaffected) level += 2;
    if (archetype.has_recovery) level += 1;
    
    if (level >= 4) return 'Máxima';
    if (level >= 3) return 'Alta';
    if (level >= 2) return 'Media';
    return 'Baja';
}

// Funciones para análisis de Arquetipo
function calculateArchetypeStability(archetype) {
    let score = 0;
    
    // Puntos por características positivas
    if (archetype.has_negations) score += 25;
    if (archetype.has_non_targeting_removal) score += 20;
    if (archetype.has_recovery) score += 20;
    if (archetype.has_untargetable) score += 15;
    if (archetype.has_archetype_unaffected) score += 10;
    
    // Ajustar por antigüedad del soporte
    if (archetype.last_support) {
        const lastSupportYear = parseInt(archetype.last_support);
        const currentYear = new Date().getFullYear();
        const yearsSinceSupport = currentYear - lastSupportYear;
        
        if (yearsSinceSupport <= 1) score += 10;
        else if (yearsSinceSupport <= 2) score += 5;
        else score -= 5;
    }
    
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Buena';
    if (score >= 40) return 'Regular';
    if (score >= 20) return 'Baja';
    return 'Mala';
}

function getStabilityColor(stability) {
    const colors = {
        'Excelente': '#70d870',
        'Buena': '#a5e6a5',
        'Regular': '#d8d870',
        'Baja': '#d8a470',
        'Mala': '#d87070'
    };
    return colors[stability] || '#cccccc';
}

// ============================================
// FUNCIONES EXISTENTES DEL CÓDIGO ORIGINAL
// ============================================

// Cambiar vista
function switchView(viewId) {
    // Ocultar todas las vistas
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Mostrar la vista seleccionada
    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.classList.add('active');
    }
    
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
    if (!sidebar) return;
    
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
                    <option value="Rogue">Rogue</option>
                    <option value="Fun">Fun</option>
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

// Búsqueda simple
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
                    <div class="visual-item ${deck.tier === 'Tier 1' ? 'good' : deck.tier === 'Tier 2' ? 'neutral' : deck.tier === 'Rogue' || deck.tier === 'Fun' ? 'bad' : 'neutral'}">
                        <i class="fas ${deck.tier === 'Tier 1' ? 'fa-chevron-up' : deck.tier === 'Tier 2' ? 'fa-equals' : deck.tier === 'Rogue' || deck.tier === 'Fun' ? 'fa-chevron-down' : 'fa-equals'}"></i>
                        <div style="flex: 1;">
                            <strong>Posición en el Meta:</strong> ${deck.tier}
                        </div>
                        <span class="simple-tag" style="background-color: ${tierColor}; color: white; font-size: 0.7rem;">
                            ${deck.tier === 'Tier 1' ? 'TOP' : deck.tier === 'Tier 2' ? 'MEDIO' : deck.tier === 'Rogue' ? 'ROGUE' : deck.tier === 'Fun' ? 'FUN' : 'BAJO'}
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

// Cargar decks en el menú
function loadMenuDecks() {
    const deckGrid = document.getElementById('menu-decks');
    if (!deckGrid) return;
    
    deckGrid.innerHTML = '';
    
    const decksToShow = filteredDecks.length > 0 ? filteredDecks : Object.keys(decks);
    
    decksToShow.forEach(deckName => {
        const deck = decks[deckName];
        if (deck) {
            const deckCard = createDeckCard(deckName, deck, 'menu');
            deckGrid.appendChild(deckCard);
        }
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
    
    // Ruta de imagen
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

// Aplicar filtros
function applyFilters() {
    const tierFilter = document.getElementById('tier-filter').value;
    const typeFilter = document.getElementById('type-filter').value;
    
    filteredDecks = Object.keys(decks).filter(deckName => {
        const deck = decks[deckName];
        if (!deck) return false;
        
        // Filtrar por tier
        if (tierFilter !== 'all') {
            if (tierFilter === 'Rogue' || tierFilter === 'Fun') {
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

// Cargar tabla del meta
function loadMetaTable(sortByTier = false) {
    const tbody = document.getElementById('meta-table-body');
    if (!tbody) return;
    
    const tierFilter = document.getElementById('meta-tier-filter').value;
    
    // Filtrar decks - SOLO TIERS COMPETITIVOS
    let deckList = Object.entries(decks).filter(([name, data]) => 
        COMPETITIVE_TIERS.includes(data.tier)
    );
    
    if (tierFilter !== 'all') {
        if (tierFilter === 'Rogue' || tierFilter === 'Fun') {
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
    if (!container) return;
    
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
        if (!container) return;
        
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

// Funciones auxiliares generales
function findDeckByName(input) {
    if (!input || typeof input !== 'string') return null;
    
    const normalizedInput = input.toLowerCase().trim();
    
    // Búsqueda exacta primero
    let exactMatch = Object.keys(decks).find(deckName => 
        deckName.toLowerCase() === normalizedInput
    );
    
    if (exactMatch) return exactMatch;
    
    // Búsqueda parcial
    return Object.keys(decks).find(deckName => 
        deckName.toLowerCase().includes(normalizedInput)
    );
}

function showNotFound(containerId, input) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = `
        <div class="empty-state error">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Deck no encontrado</h3>
            <p>No se encontró ningún deck con el nombre "${input}"</p>
            <button class="search-btn" onclick="switchView('menu')" style="margin-top: 20px;">
                <i class="fas fa-list"></i> Ver todos los decks
            </button>
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

// Función para obtener texto de dificultad
function getDifficultyText(difficulty) {
    if (difficulty <= 3) return 'Fácil - Ideal para principiantes';
    if (difficulty <= 6) return 'Moderado - Requiere práctica';
    if (difficulty <= 8) return 'Difícil - Para jugadores experimentados';
    return 'Muy difícil - Solo para expertos';
}

// Función para obtener texto de going
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

// Función para obtener descripción de estadística
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

// Función para obtener recomendación
function getRecommendation(tier, rating) {
    if (tier === 'Tier 1' && rating >= 4) return '⭐⭐⭐⭐⭐';
    if (tier === 'Tier 1' || (tier === 'Tier 2' && rating >= 3.5)) return '⭐⭐⭐⭐';
    if (tier === 'Tier 2' || tier === 'Rogue') return '⭐⭐⭐';
    if (rating >= 3 || tier === 'Fun') return '⭐⭐';
    return '⭐';
}

// Obtener score del tier
function getTierScore(tier) {
    switch(tier) {
        case 'Tier 1': return 85;
        case 'Tier 2': return 70;
        case 'Tier 3': return 55;
        case 'Rogue': return 40;
        case 'Fun': return 25;
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

// Obtener clase CSS para el tier
function getTierClass(tier) {
    switch(tier) {
        case 'Tier 1': return 'tier-1';
        case 'Tier 2': return 'tier-2';
        case 'Tier 3': return 'tier-3';
        case 'Rogue': return 'tier-Rogue';
        case 'Fun': return 'tier-Fun';
        default: return 'tier-3';
    }
}

// Obtener color para el tier
function getTierColor(tier) {
    switch(tier) {
        case 'Tier 1': return '#70d870';
        case 'Tier 2': return '#d8d870';
        case 'Tier 3': return '#d87070';
        case 'Rogue': return '#808080';
        case 'Fun': return '#8a2be2';
        default: return '#d87070';
    }
}

// Obtener descripción del tier
function getTierDescription(tier) {
    const descriptions = {
        'Tier 1': 'Deck top del formato, altamente competitivo',
        'Tier 2': 'Deck competitivo pero con algunas debilidades',
        'Tier 3': 'Deck viable pero no óptimo para torneos grandes',
        'Rogue': 'Deck que puede sorprender en torneos locales',
        'Fun': 'Deck para jugar casualmente y divertirse'
    };
    return descriptions[tier] || 'Deck casual';
}

// Funciones adicionales para compatibilidad
// Estas funciones se llaman desde otros archivos pero no están implementadas en este ejemplo
function loadMetaAnalysis() {
    console.log('loadMetaAnalysis no implementado en esta versión');
}

// ============================================
// COMPARADOR DE DECKS
// ============================================

// Actualizar comparador
function updateComparator() {
    const deck1Name = document.getElementById('deck1-search').value.trim();
    const deck2Name = document.getElementById('deck2-search').value.trim();
    
    if (!deck1Name || !deck2Name) {
        const comparisonResult = document.getElementById('comparison-result');
        if (comparisonResult) {
            comparisonResult.style.display = 'none';
        }
        
        const deck1Info = document.getElementById('deck1-info');
        const deck2Info = document.getElementById('deck2-info');
        
        if (deck1Info) {
            deck1Info.innerHTML = `
                <div class="comparator-empty-state">
                    <i class="fas fa-search"></i>
                    <p>Escribe el nombre de un deck para ver información</p>
                </div>
            `;
        }
        
        if (deck2Info) {
            deck2Info.innerHTML = `
                <div class="comparator-empty-state">
                    <i class="fas fa-search"></i>
                    <p>Escribe el nombre de un deck para ver información</p>
                </div>
            `;
        }
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
    const comparisonResult = document.getElementById('comparison-result');
    if (deck1 && deck2 && comparisonResult) {
        comparisonResult.style.display = 'block';
        comparisonResult.innerHTML = createProfessionalComparisonResult(deck1Name, deck2Name, deck1, deck2);
    } else if (comparisonResult) {
        comparisonResult.style.display = 'none';
    }
}

// Renderizar información del deck para comparador
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

// Crear resultado de comparación profesional
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
                            <h5>Sidedeck para ${deck1Name} vs ${deck2Name}</h5>
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
                            <h5>Sidedeck para ${deck2Name} vs ${deck1Name}</h5>
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

// Calcular score del deck
function calculateDeckScore(deck, going) {
    const tierScore = getTierScore(deck.tier);
    const difficultyScore = 100 - (deck.difficulty * 7);
    const goingScore = ((going.first + going.second) / 2) * 15;
    return Math.round((tierScore + difficultyScore + goingScore) / 3);
}

// Obtener tácticas para matchup
function getTacticsForMatchup(type1, type2, tier1, tier2) {
    const tactics = {
        deck1: 'Aplica presión constante',
        deck1Defense: 'Mantén recursos para el largo juego',
        deck2: 'Busca la ventaja temprana',
        deck2Defense: 'Protege tus piezas clave'
    };
    
    // Si un deck es Rogue o Fun, ajustar tácticas
    if (tier1 === 'Rogue' || tier1 === 'Fun') {
        tactics.deck1 = 'Usa el factor sorpresa';
        tactics.deck1Defense = 'Juega alrededor del meta conocido';
    }
    
    if (tier2 === 'Rogue' || tier2 === 'Fun') {
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
        if (tier2 === 'Rogue' || tier2 === 'Fun') {
            tips.push(`Prepárate para estrategias inusuales de ${deck2Name}`);
        }
    } else {
        tips.push(`Como ${deck2Name}, busca romper su setup inicial`);
        tips.push(`Juega conservador hasta tener ventaja de cartas`);
        tips.push(`Identifica y ataca sus puntos débiles`);
        if (tier1 === 'Rogue' || tier1 === 'Fun') {
            tips.push(`No subestimes el factor sorpresa de ${deck1Name}`);
        }
    }
    
    return tips;
}

// Exportar funciones para uso global (si es necesario)
window.searchCompleteDeck = searchCompleteDeck;
window.switchView = switchView;