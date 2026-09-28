// brand.js
document.addEventListener("DOMContentLoaded", function() {
    const brandHTML = `
    <div class="brand-credit-container">
        <div class="brand-monogram-logo">
            <span class="c-letter">C</span><span class="g-letter">G</span>
        </div>
        <div class="brand-text">
            <span class="brand-title">Cull Gamer</span>
            <span class="brand-subtitle">Developed with ❤️ & Code</span>
        </div>
    </div>
    `;
    

    document.body.insertAdjacentHTML('beforeend', brandHTML);
});
