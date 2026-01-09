// js/latest-articles.js
console.log("📰 Latest Articles Script Starting...");

// Configuration - Try different paths if needed
const ARTICLES_JSON_PATHS = [
    'data/articles.json',          // Same folder as js/latest-articles.js
    '../data/articles.json',       // One level up
    './data/articles.json',        // Current folder
    '/data/articles.json',         // Root folder
    'js/../data/articles.json'     // From js folder up to data folder
];
const PAPERS_FOLDER = 'paper/';
const MAX_ARTICLES = 3;

let currentJsonPath = ARTICLES_JSON_PATHS[0];

document.addEventListener('DOMContentLoaded', function() {
    console.log("✅ DOM Content Loaded");
    console.log("📍 Current URL:", window.location.href);
    loadLatestArticles();
});

async function loadLatestArticles() {
    console.log("🚀 Loading latest articles...");
    
    const container = document.getElementById('latest-articles-container');
    
    if (!container) {
        console.error("❌ Container not found! Looking for 'latest-articles-container'");
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
        let articles = null;
        let lastError = null;
        
        // Try multiple paths
        for (const path of ARTICLES_JSON_PATHS) {
            console.log(`🔍 Trying path: ${path}`);
            currentJsonPath = path;
            
            try {
                const response = await fetch(path);
                console.log(`📡 Response for ${path}: ${response.status} ${response.statusText}`);
                
                if (response.ok) {
                    articles = await response.json();
                    console.log(`✅ Successfully loaded JSON from: ${path}`);
                    console.log(`📊 Found ${articles.length} articles`);
                    break; // Stop trying other paths
                } else {
                    console.warn(`⚠️ Failed to load from ${path}: ${response.status}`);
                }
            } catch (error) {
                lastError = error;
                console.warn(`⚠️ Error loading from ${path}:`, error.message);
            }
        }
        
        if (!articles) {
            throw new Error(`Could not load JSON from any path. Last error: ${lastError?.message}`);
        }
        
        // Sort by published date (newest first)
        const sortedArticles = articles.sort((a, b) => {
            return new Date(b.published) - new Date(a.published);
        });
        
        console.log("📅 Articles sorted by date:");
        sortedArticles.forEach((article, index) => {
            console.log(`${index + 1}. ${article.title} - ${article.published}`);
        });
        
        // Take only the 3 most recent
        const latestArticles = sortedArticles.slice(0, MAX_ARTICLES);
        
        console.log("🎯 Top 3 latest articles:");
        latestArticles.forEach((article, index) => {
            console.log(`${index + 1}. ${article.title} (${article.published})`);
        });
        
        // Display the articles
        displayArticles(latestArticles, container);
        
    } catch (error) {
        console.error("❌ Error loading articles:", error);
        console.log("🔄 Showing fallback articles...");
        showFallbackArticles(container);
    }
}

function displayArticles(articles, container) {
    container.innerHTML = '';
    
    articles.forEach(article => {
        const articleHTML = createArticleHTML(article);
        container.innerHTML += articleHTML;
    });
}

function createArticleHTML(article) {
    const date = formatDate(article.published);
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

function showFallbackArticles(container) {
    console.log("🔄 Loading fallback data...");
    
    // Hardcoded fallback data from your JSON
    const fallbackArticles = [
        <!--{
            title: "Trail6",
            authors: "Karan, Vishnu",
            published: "2026-12-24",
            article_id: "IJACM_01_01_001"
        },
        {
            title: "Trail4",
            authors: "Ram, Ravi, Hari",
            published: "2026-06-19",
            article_id: "IJACM_16_06_022"
        },
        {
            title: "Trail7",
            authors: "VVVV",
            published: "2026-03-11",
            article_id: "IJACM_16_06_025"
        }-->
    ];
    
    displayArticles(fallbackArticles, container);
}

function openPDF(pdfPath, title) {
    console.log(`Opening PDF: ${pdfPath}`);
    window.open(pdfPath, '_blank');
    return false;
}

function formatDate(dateString) {
    try {
        const date = new Date(dateString);
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

// Add CSS
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
    
    .pdf-button, .view-more-button {
        padding: 8px 16px;
        border-radius: 4px;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        cursor: pointer;
        font-size: 14px;
    }
    
    .pdf-button {
        background: #0b5ed7;
        color: white;
    }
    
    .pdf-button:hover {
        background: #0a58ca;
    }
    
    .view-more-button {
        background: #6c757d;
        color: white;
    }
    
    .view-more-button:hover {
        background: #5c636a;
    }
`;
document.head.appendChild(style);

// Debug function
window.debugArticles = {
    testPaths: async function() {
        console.log("🧪 Testing all JSON paths:");
        for (const path of ARTICLES_JSON_PATHS) {
            try {
                const response = await fetch(path);
                console.log(`${path}: ${response.status} ${response.statusText}`);
                if (response.ok) {
                    const data = await response.json();
                    console.log(`  ✅ Works! ${data.length} articles`);
                }
            } catch (error) {
                console.log(`  ❌ Failed: ${error.message}`);
            }
        }
    },
    reload: function() {
        console.clear();
        console.log("🔄 Reloading articles...");
        loadLatestArticles();
    }
};

console.log("✅ Latest Articles Script Ready!");
