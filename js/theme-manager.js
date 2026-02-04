// Inicializar gestor de temas
document.addEventListener('DOMContentLoaded', function() {
    initThemeManager();
});

function initThemeManager() {
    // Botones de tema
    document.querySelectorAll('.theme-btn[data-theme]').forEach(btn => {
        btn.addEventListener('click', function() {
            const theme = this.dataset.theme;
            setTheme(theme);
        });
    });
    
    // Botón de modo claro/oscuro
    const modeToggle = document.getElementById('mode-toggle');
    if (modeToggle) {
        modeToggle.addEventListener('click', toggleMode);
    }
}

// Establecer tema
function setTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('yugioh-theme', theme);
    
    // Actualizar botones activos
    document.querySelectorAll('.theme-btn[data-theme]').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.theme === theme) {
            btn.classList.add('active');
        }
    });
}

// Alternar modo claro/oscuro
function toggleMode() {
    const currentMode = document.body.getAttribute('data-mode');
    const newMode = currentMode === 'light' ? 'dark' : 'light';
    
    document.body.setAttribute('data-mode', newMode);
    localStorage.setItem('yugioh-mode', newMode);
    
    // Actualizar texto del botón
    const modeBtn = document.getElementById('mode-toggle');
    if (modeBtn) {
        modeBtn.innerHTML = newMode === 'dark' 
            ? '<i class="fas fa-sun"></i> Modo Claro'
            : '<i class="fas fa-moon"></i> Modo Oscuro';
    }
}