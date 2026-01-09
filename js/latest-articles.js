// js/latest-articles.js
console.log("📰 Latest Articles Script Starting...");

// Configuration
const ARTICLES_JSON = '../data/articles.json'; // Double-check this path
const MAX_RETRIES = 3;
const MAX_ARTICLES_TO_SHOW = 3;
const PAPERS_FOLDER = 'papers/';

let isLoading = false;
let retryCount = 0;

document.addEventListener('DOMContentLoaded', function() {
    console.log("✅ DOM Content Loaded");
    loadLatestArticles();
});

async function loadLatestArticles() {
    if (isLoading) {
        console.log("⏳ Already loading, skipping...");
        return;
    }
    
    isLoading = true;
    console.log("🚀 Loading latest articles from JSON...");
    
    const container = document.getElementById('latest-articles-container');
    
    if (!container) {
        console.error("❌ Container not found!");
        isLoading = false;
        return;
    }
    
    // Show loading state
    container.innerHTML = getLoadingHTML();
    
    try {
        // Fetch articles from JSON
        console.log(`Fetching from: ${ARTICLES_JSON}`);
        const articles = await fetchArticlesWithRetry();
        
        if (articles && articles.length > 0) {
            console.log(`✅ Successfully loaded ${articles.length} articles from JSON`);
            displayArticles(articles);
        } else {
            console.warn("⚠️ No articles found or empty array - showing fallback");
            showFallbackArticles();
        }
        
        retryCount = 0;
        
    } catch (error) {
        console.error("❌ Error loading articles:", error);
        
        // Try fallback after error
        if (retryCount < MAX_RETRIES) {
            retryCount++;
            console.log(`🔄 Retrying (${retryCount}/${MAX_RETRIES})...`);
            setTimeout(loadLatestArticles, 1000);
        } else {
            console.error("❌ Max retries reached, showing fallback");
            showFallbackArticles();
        }
    } finally {
        isLoading = false;
    }
}

async function fetchArticlesWithRetry() {
    try {
        // Add timestamp to prevent caching issues
        const timestamp = Date.now();
        const url = `${ARTICLES_JSON}?t=${timestamp}`;
        console.log(`📡 Fetching from URL: ${url}`);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
        
        console.log(`📡 Fetch response: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("✅ Data fetched successfully");
        console.log("First article sample:", data[0]); // Debug: Show first article
        
        if (!Array.isArray(data)) {
            console.warn("⚠️ Data is not an array:", typeof data);
            
            // Try to handle if data is an object with articles inside
            if (typeof data === 'object' && data !== null) {
                // Check common property names
                const possibleArrayProperties = ['articles', 'items', 'papers', 'data'];
                for (const prop of possibleArrayProperties) {
                    if (Array.isArray(data[prop])) {
                        console.log(`Found articles in property: ${prop}`);
                        return data[prop];
                    }
                }
            }
            
            throw new Error("Invalid data format: expected array");
        }
        
        return data;
        
    } catch (error) {
        console.error("❌ Fetch error:", error.message);
        throw error;
    }
}

function displayArticles(articles) {
    console.log(`🔄 Processing ${articles.length} articles for display`);
    
    const container = document.getElementById('latest-articles-container');
    
    // Filter out articles without required fields
    const validArticles = articles.filter(article => 
        article && 
        (article.title || article.Title) && 
        (article.published || article.Published)
    );
    
    console.log(`📊 Found ${validArticles.length} valid articles`);
    
    if (validArticles.length === 0) {
        console.warn("⚠️ No valid articles to display");
        showFallbackArticles();
        return;
    }
    
    // Sort articles by published date (newest first)
    const sortedArticles = [...validArticles].sort((a, b) => {
        const dateA = new Date(a.published || a.Published || '1970-01-01');
        const dateB = new Date(b.published || b.Published || '1970-01-01');
        return dateB - dateA; // Newest first
    });
    
    console.log("📅 Articles sorted by date (newest first):");
    sortedArticles.forEach((article, index) => {
        console.log(`${index + 1}. ${article.title || article.Title} - ${article.published || article.Published}`);
    });
    
    // Take top N articles
    const topArticles = sortedArticles.slice(0, MAX_ARTICLES_TO_SHOW);
    
    console.log(`🎯 Displaying top ${topArticles.length} most recent articles`);
    
    container.innerHTML = '';
    
    topArticles.forEach((article, index) => {
        const articleHTML = createArticleHTML(article);
        container.innerHTML += articleHTML;
        console.log(`✅ Displayed article ${index + 1}: ${article.title || article.Title}`);
    });
    
    console.log("✅ All articles displayed successfully from JSON data");
}

function getPdfPath(article) {
    // Use the article_id or create from title
    let articleId = article.article_id || article.articleId || '';
    
    if (!articleId) {
        // Try to extract from title
        const title = article.title || article.Title || '';
        if (title) {
            articleId = title.toLowerCase()
                .replace(/[^a-z0-9]/g, '_')
                .replace(/_+/g, '_')
                .replace(/^_|_$/g, '');
        }
    }
    
    if (!articleId) {
        console.error("❌ No article_id found for article:", article.title || article.Title);
        return '#';
    }
    
    // Add .pdf extension if not present
    if (!articleId.toLowerCase().endsWith('.pdf')) {
        articleId += '.pdf';
    }
    
    // Create path: papers/IJACM_01_01_001.pdf
    const pdfPath = `${PAPERS_FOLDER}${articleId}`;
    return pdfPath;
}

function createArticleHTML(article) {
    // Extract data from article object
    const title = article.title || article.Title || 'Untitled Article';
    const authors = article.authors || article.Authors || article.author || article.Author || 'Unknown Author';
    const publishedDate = article.published || article.Published || '';
    const date = formatDisplayDate(publishedDate);
    const pdfUrl = getPdfPath(article);
    const viewMoreUrl = 'pages/current-issue.html';
    
    // Escape HTML for safety
    const safeTitle = escapeHtml(title);
    const safeAuthors = escapeHtml(authors);
    const safePdfUrl = escapeHtml(pdfUrl);
    
    return `
        <div class="article-card">
            <h3 class="article-title">${safeTitle}</h3>
            <p class="article-authors"><em>${safeAuthors}</em></p>
            <p class="article-date">
                <i class="far fa-calendar-alt"></i> ${date}
            </p>
            <div class="article-actions">
                <a href="${safePdfUrl}" 
                   target="_blank" 
                   class="pdf-button"
                   onclick="event.preventDefault(); checkAndOpenPdf('${safePdfUrl}', '${safeTitle.replace(/'/g, "\\'")}')">
                    <i class="fas fa-file-pdf"></i> PDF
                </a>
                <a href="${viewMoreUrl}" 
                   class="view-more-button">
                    <i class="fas fa-external-link-alt"></i> View More
                </a>
            </div>
        </div>
    `;
}

function checkAndOpenPdf(url, title) {
    console.log(`📄 Attempting to open PDF: ${url}`);
    
    if (url === '#') {
        alert(`PDF not available for: ${title}`);
        return false;
    }
    
    // Open PDF in new tab
    window.open(url, '_blank');
    return false;
}

function showFallbackArticles() {
    console.log("🔄 Showing fallback articles (JSON not loaded)");
    
    const container = document.getElementById('latest-articles-container');
    
    // Only show fallback if we're not already showing articles
    if (container.innerHTML.includes('article-card')) {
        console.log("⚠️ Already showing articles, skipping fallback");
        return;
    }
    
    container.innerHTML = '';
    
    // Show a message first
    container.innerHTML = `
        <div class="error-message">
            <p>⚠️ Could not load latest articles from server.</p>
            <p>Showing sample articles instead.</p>
        </div>
    `;
    
    // Then add fallback articles
    const fallbackArticles = [
        { 
            title: "Trail1", 
            authors: "Sandeep", 
            published: "2025-12-01",
            article_id: "IJACM_01_01_001"
        },
        { 
            title: "Trail2", 
            authors: "Author2", 
            published: "2025-11-01",
            article_id: "IJACM_01_01_002"
        },
        { 
            title: "Trail3", 
            authors: "Author3", 
            published: "2025-10-01",
            article_id: "IJACM_01_01_003"
        }
    ];
    
    // Small delay for better UX
    setTimeout(() => {
        fallbackArticles.forEach(article => {
            container.innerHTML += createArticleHTML(article);
        });
        console.log("✅ Fallback articles displayed");
    }, 500);
}

function getLoadingHTML() {
    return `
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <p class="loading-text">Loading latest articles...</p>
        </div>
    `;
}

function formatDisplayDate(dateString) {
    if (!dateString) return 'Date N/A';
    
    try {
        const date = new Date(dateString);
        
        if (!isNaN(date.getTime())) {
            // Format as "01 Dec 2025"
            const day = date.getDate().toString().padStart(2, '0');
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                               'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const month = monthNames[date.getMonth()];
            const year = date.getFullYear();
            
            return `${day} ${month} ${year}`;
        }
        
    } catch (error) {
        console.warn("⚠️ Date formatting error for:", dateString, error);
    }
    
    return dateString;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add CSS styles
if (!document.querySelector('#latest-articles-styles')) {
    const style = document.createElement('style');
    style.id = 'latest-articles-styles';
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .loading-container {
            text-align: center;
            width: 100%;
            grid-column: 1 / -1;
            padding: 40px;
        }
        
        .loading-spinner {
            border: 3px solid rgba(0, 0, 0, 0.1);
            border-top: 3px solid #0b5ed7;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 15px;
        }
        
        .loading-text {
            color: #0b5ed7;
            font-size: 16px;
        }
        
        .error-message {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
            color: #856404;
            text-align: center;
        }
        
        .article-card {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            background: white;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            transition: transform 0.2s;
        }
        
        .article-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 10px rgba(0,0,0,0.15);
        }
        
        .article-title {
            margin: 0 0 10px 0;
            color: #333;
            font-size: 18px;
            line-height: 1.4;
        }
        
        .article-authors {
            color: #666;
            margin: 0 0 5px 0;
            font-size: 14px;
            line-height: 1.4;
            font-style: italic;
        }
        
        .article-date {
            color: #666;
            font-size: 14px;
            margin-top: 5px;
        }
        
        .article-actions {
            margin-top: 15px;
            display: flex;
            gap: 10px;
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
            transition: background-color 0.2s;
            border: none;
            font-family: inherit;
            font-size: 14px;
        }
        
        .pdf-button:hover {
            background: #0a58ca;
            text-decoration: none;
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
            transition: background-color 0.2s;
            border: none;
            font-family: inherit;
            font-size: 14px;
        }
        
        .view-more-button:hover {
            background: #5c636a;
            text-decoration: none;
        }
        
        .fa-file-pdf, .fa-external-link-alt {
            font-size: 14px;
        }
    `;
    document.head.appendChild(style);
}

// Window load fallback
window.addEventListener('load', function() {
    console.log("📄 Window loaded - checking if articles loaded...");
    
    setTimeout(() => {
        const container = document.getElementById('latest-articles-container');
        if (container && (container.innerHTML.includes('Loading') || container.innerHTML === '')) {
            console.log("🔄 Window.load: Loading articles...");
            loadLatestArticles();
        }
    }, 1000);
});

// Debug and utility functions
window.articleDebug = {
    // Test JSON loading
    testJsonLoad: async function() {
        console.log("🧪 Testing JSON load...");
        try {
            const response = await fetch(ARTICLES_JSON);
            const data = await response.json();
            console.log("✅ JSON loaded successfully");
            console.log("Data type:", typeof data);
            console.log("Is array?", Array.isArray(data));
            console.log("Number of items:", data.length || 'N/A');
            console.log("First item:", data[0] || 'No data');
            return data;
        } catch (error) {
            console.error("❌ Failed to load JSON:", error);
            return null;
        }
    },
    
    // Force reload
    reload: function() {
        console.clear();
        console.log("🔄 Forcing reload...");
        loadLatestArticles();
    },
    
    // Show current state
    showState: function() {
        const container = document.getElementById('latest-articles-container');
        console.log("📊 Container innerHTML:", container ? container.innerHTML : 'No container');
    }
};

console.log("📰 Latest Articles Script Loaded Successfully!");
