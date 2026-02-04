// Funciones de renderizado adicionales
function createStatBar(value, max = 10) {
    const percent = (value / max) * 100;
    return `
        <div class="bar">
            <div class="bar-fill bar-green" style="width: ${percent}%"></div>
        </div>
    `;
}

function createStars(rating, max = 5) {
    const fullStars = Math.floor(rating);
    const emptyStars = max - fullStars;
    return `${'★'.repeat(fullStars)}${'☆'.repeat(emptyStars)}`;
}

function formatPercentage(value, total) {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return `${Math.round(percentage)}%`;
}