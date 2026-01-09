// js/latest-articles.js
console.log("📰 Latest Articles Script Starting...");

// Configuration
const ARTICLES_JSON = '../data/articles.json';
const MAX_RETRIES = 3;
const MAX_ARTICLES_TO_SHOW = 3;
const PAPERS_FOLDER = 'papers/'; // Adjust this to your actual folder name

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
        console.log("Sample article structure:", data[0]); // Debug: Show first article
        
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
        console.log(`   PDF Path: ${getPdfPath(article)}`);
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
    // Try to get paper ID from different possible fields
    // Common field names: paper_id, article_id, id, file_name, pdf_name, doi
    let paperId = '';
    
    // Check various possible field names for paper ID
    const possibleIdFields = [
        'paper_id',
        'article_id',
        'id',
        'paperId',
        'articleId',
        'file_name',
        'pdf_name',
        'pdf',
        'file',
        'doi',
        'DOI'
    ];
    
    for (const field of possibleIdFields) {
        if (article[field]) {
            paperId = article[field];
            console.log(`Found paper ID in field "${field}": ${paperId}`);
            break;
        }
    }
    
    // If no paper ID found, try to extract from DOI
    if (!paperId && (article.doi || article.DOI)) {
        const doi = article.doi || article.DOI;
        // Extract last part of DOI for filename
        const doiParts = doi.split('/');
        if (doiParts.length > 0) {
            paperId = doiParts[doiParts.length - 1];
            console.log(`Extracted paper ID from DOI: ${paperId}`);
        }
    }
    
    // If still no ID, create from title
    if (!paperId && (article.Title || article.title)) {
        const title = article.Title || article.title;
        paperId = title.toLowerCase()
            .replace(/[^a-z0-9]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');
        console.log(`Created paper ID from title: ${paperId}`);
    }
    
    // Add .pdf extension if not present
    if (paperId && !paperId.toLowerCase().endsWith('.pdf')) {
        paperId += '.pdf';
    }
    
    // Return the full path
    const pdfPath = `${PAPERS_FOLDER}${paperId}`;
    console.log(`Final PDF path: ${pdfPath}`);
    return pdfPath;
}

function createArticleHTML(article) {
    // Extract data - handle both uppercase and lowercase field names
    const title = article.Title || article.title || 'Untitled Article';
    const authors = article.Author || article.author || 'Unknown Author';
    const publishedDate = article.Published || article.published || '';
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
                alert(`PDF not found for: ${title}\n\nPlease check the file path:\n${url}`);
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
    
    // Fallback based on your screenshot
    const fallbackArticles = [
        { 
            Title: "Trails", 
            Author: "Karan, Vishnu", 
            Published: "Dec 24, 2026",
            paper_id: "trails_2026.pdf"  // Example paper ID
        },
        { 
            Title: "Trail2", 
            Author: "VVVV", 
            Published: "Mar 11, 2026",
            paper_id: "trail2_2026.pdf"  // Example paper ID
        },
        { 
            Title: "Trail4", 
            Author: "Ram, Ravi, Hari", 
            Published: "Jun 19, 2026",
            paper_id: "trail4_2026.pdf"  // Example paper ID
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
            border: 3px solid rgba(255, 255, 255, 0.1);
            border-top: 3px solid #00b0ff;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 15px;
        }
        
        .loading-text {
            color: #00b0ff;
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
        const articleCard = container.querySelectorAll('.article-card')[articleIndex];
        if (articleCard) {
            const pdfLink = articleCard.querySelector('.pdf-button');
            if (pdfLink) {
                const url = pdfLink.getAttribute('href');
                const title = articleCard.querySelector('.article-title').textContent;
                checkAndOpenPdf(url, title);
            }
        }
    },
    showData: async function() {
        try {
            const response = await fetch(ARTICLES_JSON);
            const data = await response.json();
            console.log("📊 Full JSON data:", data);
            console.log("📋 First article fields:", Object.keys(data[0] || {}));
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    }
};

console.log("📰 Latest Articles Script Loaded Successfully!");
