// js/latest-articles.js
console.log("📰 Latest Articles Script Starting...");

// Configuration
const ARTICLES_JSON = '../data/articles.json';
const MAX_RETRIES = 3;
const MAX_ARTICLES_TO_SHOW = 3;
const PAPERS_FOLDER = 'paper/';

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
        // Handle different date formats
        const dateA = parseCustomDate(a.Published || a.published || '1970-01-01');
        const dateB = parseCustomDate(b.Published || b.published || '1970-01-01');
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
        console.log(`✅ Displayed article ${index + 1}: ${article.Title || article.title}`);
    });
    
    console.log("✅ All articles displayed successfully");
}

function parseCustomDate(dateString) {
    if (!dateString) return new Date('1970-01-01');
    
    try {
        // Format: "Dec 24, 2026" (from your screenshot)
        if (dateString.includes(',')) {
            const parts = dateString.split(' ');
            if (parts.length === 3) {
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const month = monthNames.indexOf(parts[0]) + 1;
                const day = parseInt(parts[1].replace(',', ''), 10);
                const year = parseInt(parts[2], 10);
                
                if (month > 0 && !isNaN(day) && !isNaN(year)) {
                    return new Date(year, month - 1, day);
                }
            }
        }
        
        // Format: "YYYY-MM-DD"
        if (dateString.includes('-')) {
            const parts = dateString.split('-');
            if (parts.length === 3) {
                const year = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10);
                const day = parseInt(parts[2], 10);
                
                if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
                    return new Date(year, month - 1, day);
                }
            }
        }
        
        // Try default Date parsing
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
            return date;
        }
        
    } catch (error) {
        console.warn("⚠️ Date parsing error for:", dateString, error);
    }
    
    return new Date('1970-01-01');
}

function getPdfPath(article) {
    // Use DOI or create from title for PDF path
    let pdfId = article.DOI || article.doi || '';
    
    if (!pdfId && article.Title) {
        // Create a simple ID from title
        pdfId = article.Title.toLowerCase()
            .replace(/[^a-z0-9]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');
    }
    
    // Use your papers folder path
    return `${PAPERS_FOLDER}${pdfId}.pdf`;
}

function createArticleHTML(article) {
    // Extract data - handle both uppercase and lowercase field names
    const title = article.Title || article.title || 'Untitled Article';
    const authors = article.Author || article.author || 'Unknown Author';
    const publishedDate = article.Published || article.published || '';
    const date = formatDisplayDate(publishedDate);
    const pdfUrl = getPdfPath(article);
    const viewMoreUrl = 'pages/current-issue.html';
    
    return `
        <div class="article-card">
            <h3 class="article-title">${escapeHtml(title)}</h3>
            <p class="article-authors">${escapeHtml(authors)}</p>
            <p style="color: #666; font-size: 14px; margin-top: 5px;">
                <i class="far fa-calendar-alt"></i> ${date}
            </p>
            <div style="margin-top: 15px; display: flex; gap: 10px;">
                <a href="${pdfUrl}" 
                   target="_blank" 
                   onclick="return checkPdfExists('${pdfUrl}', '${escapeHtml(title)}')"
                   style="background: #0b5ed7; color: white; padding: 8px 16px; border-radius: 4px; text-decoration: none; display: inline-flex; align-items: center; gap: 5px; cursor: pointer;">
                    <i class="fas fa-file-pdf"></i> PDF
                </a>
                <a href="${viewMoreUrl}" 
                   style="background: #6c757d; color: white; padding: 8px 16px; border-radius: 4px; text-decoration: none; display: inline-flex; align-items: center; gap: 5px; cursor: pointer;">
                    <i class="fas fa-external-link-alt"></i> View More
                </a>
            </div>
        </div>
    `;
}

function checkPdfExists(url, title) {
    console.log(`Opening PDF: ${url}`);
    window.open(url, '_blank');
    return false;
}

function showFallbackArticles() {
    console.log("🔄 Showing fallback articles");
    
    const container = document.getElementById('latest-articles-container');
    
    // Fallback based on your screenshot - showing 3 most recent articles
    const fallbackArticles = [
        { 
            Title: "Trails", 
            Author: "Karan, Vishnu", 
            Published: "Dec 24, 2026",
            DOI: "10.1007/s40430-020-02750-7"
        },
        { 
            Title: "Trail2", 
            Author: "VVVV", 
            Published: "Mar 11, 2026",
            DOI: "10.1007/s40430-020-02750-8"
        },
        { 
            Title: "Trail4", 
            Author: "Ram, Ravi, Hari", 
            Published: "Jun 19, 2026",
            DOI: "10.1007/s40430-020-02750-5"
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
        <div style="text-align:center; width:100%; grid-column: 1 / -1; color:#fff; padding: 40px;">
            <div style="border: 3px solid rgba(255, 255, 255, 0.1); border-top: 3px solid #00b0ff; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 15px;"></div>
            <p style="color: #00b0ff;">Loading latest articles...</p>
        </div>
    `;
}

function formatDisplayDate(dateString) {
    if (!dateString) return 'Date N/A';
    
    try {
        const date = parseCustomDate(dateString);
        
        if (date && !isNaN(date.getTime()) && date.getFullYear() > 1970) {
            return date.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        }
        
        // Return original if it looks like a proper date string
        if (dateString.includes(',') || dateString.includes('-')) {
            return dateString;
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

// Add CSS for loading animation
if (!document.querySelector('#latest-articles-styles')) {
    const style = document.createElement('style');
    style.id = 'latest-articles-styles';
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

console.log("📰 Latest Articles Script Loaded Successfully!");
