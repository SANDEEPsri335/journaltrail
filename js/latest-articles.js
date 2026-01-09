// js/latest-articles.js
console.log("📰 Latest Articles Script Starting...");

// Configuration
const ARTICLES_JSON = '../data/articles.json';
const MAX_RETRIES = 3;
const MAX_ARTICLES_TO_SHOW = 3;
const PAPERS_FOLDER = 'paper/'; // Change this to your actual papers folder

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
        const articles = await fetchArticlesWithRetry();
        
        if (articles && articles.length > 0) {
            console.log(`✅ Successfully loaded ${articles.length} articles`);
            displayArticles(articles);
        } else {
            console.warn("⚠️ No articles found or empty array");
            showFallbackArticles();
        }
        
        retryCount = 0;
        
    } catch (error) {
        console.error("❌ Error loading articles:", error);
        
        if (retryCount < MAX_RETRIES) {
            retryCount++;
            console.log(`🔄 Retrying (${retryCount}/${MAX_RETRIES})...`);
            setTimeout(loadLatestArticles, 1000);
        } else {
            showFallbackArticles();
        }
    } finally {
        isLoading = false;
    }
}

async function fetchArticlesWithRetry() {
    try {
        const response = await fetch(`${ARTICLES_JSON}?t=${Date.now()}`, {
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
        
        if (!Array.isArray(data)) {
            console.warn("⚠️ Data is not an array:", typeof data);
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
    
    // Sort articles by published date (newest first)
    const sortedArticles = [...articles].sort((a, b) => {
        const dateA = new Date(a.published || '1970-01-01');
        const dateB = new Date(b.published || '1970-01-01');
        return dateB - dateA; // Newest first
    });
    
    // Take top N articles
    const topArticles = sortedArticles.slice(0, MAX_ARTICLES_TO_SHOW);
    
    console.log(`📊 Top ${topArticles.length} articles after sorting:`, topArticles);
    
    if (topArticles.length === 0) {
        console.warn("⚠️ No valid articles to display");
        showFallbackArticles();
        return;
    }
    
    container.innerHTML = '';
    
    topArticles.forEach((article, index) => {
        const articleHTML = createArticleHTML(article);
        container.innerHTML += articleHTML;
        console.log(`✅ Displayed article ${index + 1}: ${article.title}`);
        console.log(`   Article ID: ${article.article_id}`);
        console.log(`   PDF Path: ${getPdfPath(article)}`);
    });
    
    console.log("✅ All articles displayed successfully");
}

function getPdfPath(article) {
    // Use the article_id directly for PDF filename
    const articleId = article.article_id;
    
    if (!articleId) {
        console.error("❌ No article_id found for article:", article.title);
        return '#';
    }
    
    // Simple path: papers/IJACM_01_01_001.pdf
    const pdfPath = `${PAPERS_FOLDER}${articleId}.pdf`;
    console.log(`📄 PDF path for ${article.title}: ${pdfPath}`);
    
    return pdfPath;
}

function createArticleHTML(article) {
    // Extract data from your JSON structure
    const title = article.title || 'Untitled Article';
    const authors = article.authors || 'Unknown Author';
    const publishedDate = article.published || '';
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
            <p class="article-authors">${safeAuthors}</p>
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

// Function to check and open PDF
function checkAndOpenPdf(url, title) {
    console.log(`📄 Attempting to open PDF: ${url}`);
    
    // First check if PDF exists
    fetch(url, { method: 'HEAD' })
        .then(response => {
            if (response.ok) {
                console.log(`✅ PDF found: ${url}`);
                // Open PDF in new tab
                window.open(url, '_blank');
            } else {
                console.error(`❌ PDF not found (${response.status}): ${url}`);
                alert(`PDF not found for: ${title}\n\nPath: ${url}`);
            }
        })
        .catch(error => {
            console.error(`❌ Error checking PDF: ${error.message}`);
            alert(`Cannot access PDF for: ${title}\n\nError: ${error.message}\n\nPath: ${url}`);
        });
    
    return false;
}

function showFallbackArticles() {
    console.log("🔄 Showing fallback articles");
    
    const container = document.getElementById('latest-articles-container');
    
    // Fallback based on your JSON structure
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
    
    container.innerHTML = '';
    
    fallbackArticles.forEach(article => {
        container.innerHTML += createArticleHTML(article);
    });
    
    console.log("✅ Fallback articles displayed");
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
            return date.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
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
        if (container && container.innerHTML.includes('Loading')) {
            console.log("🔄 Window.load: Articles still loading, retrying...");
            loadLatestArticles();
        }
    }, 2000);
});

// Debug functions
window.debugArticles = {
    reload: function() {
        console.clear();
        loadLatestArticles();
    },
    testPDF: function(articleIndex = 0) {
        const container = document.getElementById('latest-articles-container');
        const articleCards = container.querySelectorAll('.article-card');
        if (articleCards.length > articleIndex) {
            const pdfLink = articleCards[articleIndex].querySelector('.pdf-button');
            if (pdfLink) {
                const url = pdfLink.getAttribute('href');
                const title = articleCards[articleIndex].querySelector('.article-title').textContent;
                checkAndOpenPdf(url, title);
            }
        }
    },
    showCurrentArticles: function() {
        console.log("📊 Current articles in container:");
        const container = document.getElementById('latest-articles-container');
        const articleCards = container.querySelectorAll('.article-card');
        articleCards.forEach((card, index) => {
            const title = card.querySelector('.article-title').textContent;
            const pdfLink = card.querySelector('.pdf-button').getAttribute('href');
            console.log(`${index + 1}. ${title}`);
            console.log(`   PDF: ${pdfLink}`);
        });
    }
};

console.log("📰 Latest Articles Script Loaded Successfully!");
