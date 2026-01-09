// js/latest-articles.js
console.log("📰 Latest Articles Script Starting...");

// Configuration
const ARTICLES_JSON = '../data/articles.json'; // Path to your JSON
const PAPERS_FOLDER = 'paper/'; // Folder where PDFs are stored
const MAX_ARTICLES = 3; // Show only 3 latest articles

document.addEventListener('DOMContentLoaded', function() {
    console.log("✅ DOM Content Loaded");
    loadLatestArticles();
});

async function loadLatestArticles() {
    console.log("🚀 Loading latest articles...");
    
    const container = document.getElementById('latest-articles-container');
    
    if (!container) {
        console.error("❌ Container not found!");
        return;
    }
    
    // Show loading
    container.innerHTML = `
        <div style="text-align:center; padding: 40px;">
            <div style="border: 3px solid #f3f3f3; border-top: 3px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 15px;"></div>
            <p>Loading latest articles...</p>
        </div>
    `;
    
    try {
        // Fetch the JSON data
        const response = await fetch(ARTICLES_JSON);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const articles = await response.json();
        console.log(`✅ Loaded ${articles.length} articles`);
        
        // Sort by published date (newest first)
        const sortedArticles = articles.sort((a, b) => {
            return new Date(b.published) - new Date(a.published);
        });
        
        // Take only the 3 most recent
        const latestArticles = sortedArticles.slice(0, MAX_ARTICLES);
        
        // Display the articles
        displayArticles(latestArticles, container);
        
    } catch (error) {
        console.error("❌ Error loading articles:", error);
        showError(container);
    }
}

function displayArticles(articles, container) {
    console.log(`📊 Displaying ${articles.length} latest articles`);
    
    // Clear container
    container.innerHTML = '';
    
    // Add each article
    articles.forEach(article => {
        const articleHTML = createArticleHTML(article);
        container.innerHTML += articleHTML;
    });
}

function createArticleHTML(article) {
    // Format date: "01 Dec 2025"
    const date = formatDate(article.published);
    
    // PDF path: paper/IJACM_01_01_001.pdf
    const pdfPath = `${PAPERS_FOLDER}${article.article_id}.pdf`;
    
    return `
        <div class="article-card">
            <h3>${escapeHtml(article.title)}</h3>
            <p><em>${escapeHtml(article.authors)}</em></p>
            <p style="color: #666; font-size: 14px; margin-top: 5px;">
                <i class="far fa-calendar-alt"></i> ${date}
            </p>
            <div style="margin-top: 15px; display: flex; gap: 10px;">
                <a href="${pdfPath}" 
                   target="_blank" 
                   class="pdf-button"
                   onclick="event.preventDefault(); openPDF('${pdfPath}', '${escapeHtml(article.title).replace(/'/g, "\\'")}')">
                    <i class="fas fa-file-pdf"></i> PDF
                </a>
                <a href="pages/current-issue.html" 
                   class="view-more-button">
                    <i class="fas fa-external-link-alt"></i> View More
                </a>
            </div>
        </div>
    `;
}

function openPDF(pdfPath, title) {
    console.log(`Opening PDF: ${pdfPath}`);
    window.open(pdfPath, '_blank');
    return false;
}

function formatDate(dateString) {
    if (!dateString) return 'Date N/A';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        
        const day = date.getDate().toString().padStart(2, '0');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();
        
        return `${day} ${month} ${year}`;
    } catch (error) {
        return dateString;
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showError(container) {
    container.innerHTML = `
        <div style="text-align:center; padding: 20px; color: #666;">
            <p>Unable to load latest articles.</p>
            <p>Please try again later.</p>
        </div>
    `;
}

// Add minimal CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .article-card {
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 20px;
        background: white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    
    .article-card h3 {
        margin: 0 0 10px 0;
        color: #333;
        font-size: 18px;
    }
    
    .article-card p {
        margin: 0 0 5px 0;
        color: #666;
        font-size: 14px;
    }
    
    .pdf-button {
        background: #0b5ed7;
        color: white;
        padding: 8px 16px;
        border-radius: 4px;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        cursor: pointer;
    }
    
    .pdf-button:hover {
        background: #0a58ca;
    }
    
    .view-more-button {
        background: #6c757d;
        color: white;
        padding: 8px 16px;
        border-radius: 4px;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        cursor: pointer;
    }
    
    .view-more-button:hover {
        background: #5c636a;
    }
`;
document.head.appendChild(style);

console.log("✅ Latest Articles Script Ready!");
