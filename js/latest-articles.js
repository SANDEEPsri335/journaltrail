// js/latest-articles.js
console.log("📰 Latest Articles Script Starting...");

// Configuration
const ARTICLES_JSON = '../data/articles.json';
const MAX_RETRIES = 3;
const MAX_ARTICLES_TO_SHOW = 3;
const PAPERS_FOLDER = 'paper/'; // CHANGE THIS to your actual folder path

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
        
        retryCount = 0; // Reset retry count on success
        
    } catch (error) {
        console.error("❌ Error loading articles:", error);
        
        // Try fallback after error
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
        // Add timestamp to prevent caching issues
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
        console.log(`   PDF path: ${getPdfPath(article)}`);
    });
    
    console.log("✅ All articles displayed successfully");
}

function getPdfPath(article) {
    // Adjust this based on your folder structure
    const articleId = article.article_id || '';
    
    // Try different possible paths
    const possiblePaths = [
        `paper/${articleId}.pdf`,           // papers/IJACM_16_06_025.pdf
        `../paper/${articleId}.pdf`,        // ../papers/IJACM_16_06_025.pdf
        `./paper/${articleId}.pdf`,         // ./papers/IJACM_16_06_025.pdf
        `/paper/${articleId}.pdf`,          // /papers/IJACM_16_06_025.pdf
        `assets/paper/${articleId}.pdf`,    // assets/papers/IJACM_16_06_025.pdf
        `../assets/paper/${articleId}.pdf`  // ../assets/papers/IJACM_16_06_025.pdf
    ];
    
    return possiblePaths[0]; // Change index based on your structure
}

function createArticleHTML(article) {
    // Extract data from JSON
    const title = article.title || 'Untitled Article';
    const authors = article.authors || 'Unknown Author';
    const date = formatDate(article.published);
    const pdfUrl = getPdfPath(article);
    const viewMoreUrl = 'pages/current-issue.html'; // Current issue page
    
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
                   onclick="return checkPdfExists('${pdfUrl}', '${title}')"
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

// Add this function to check if PDF exists before opening
function checkPdfExists(url, title) {
    console.log(`Checking if PDF exists: ${url}`);
    
    // You can add a fetch check here if needed
    // fetch(url, { method: 'HEAD' })
    //     .then(response => {
    //         if (!response.ok) {
    //             alert(`PDF not found for: ${title}\nPath: ${url}`);
    //             return false;
    //         }
    //     })
    //     .catch(() => {
    //         alert(`PDF not found for: ${title}\nPath: ${url}`);
    //         return false;
    //     });
    
    return true; // Allow navigation
}

function showFallbackArticles() {
    console.log("🔄 Showing fallback articles");
    
    const container = document.getElementById('latest-articles-container');
    
    const fallbackArticles = [
        { 
            title: "Trail8", 
            authors: "Author8", 
            published: "2027-06-19",
            article_id: "IJACM_16_06_026"
        },
        { 
            title: "Trail6", 
            authors: "Karan, Vishnu", 
            published: "2026-12-24",
            article_id: "IJACM_16_06_024"
        },
        { 
            title: "Trail4", 
            authors: "Ram, Ravi, Hari", 
            published: "2026-06-19",
            article_id: "IJACM_16_06_022"
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

function formatDate(dateString) {
    if (!dateString) return 'Date N/A';
    
    try {
        // Parse YYYY-MM-DD format
        if (dateString.includes('-')) {
            const parts = dateString.split('-');
            if (parts.length === 3) {
                const year = parts[0];
                const month = parseInt(parts[1], 10);
                const day = parseInt(parts[2], 10);
                
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                
                if (month >= 1 && month <= 12) {
                    const monthName = monthNames[month - 1];
                    return `${day.toString().padStart(2, '0')} ${monthName} ${year}`;
                }
            }
        }
        
        // Try to parse as Date object
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
            return date.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        }
        
        return dateString;
        
    } catch (error) {
        console.warn("⚠️ Date formatting error for:", dateString, error);
        return dateString;
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Also load on window load as fallback
window.addEventListener('load', function() {
    console.log("📄 Window loaded - checking if articles loaded...");
    
    // Check if articles loaded successfully after 2 seconds
    setTimeout(() => {
        const container = document.getElementById('latest-articles-container');
        if (container && container.innerHTML.includes('Loading')) {
            console.log("🔄 Window.load: Articles still loading, retrying...");
            loadLatestArticles();
        }
    }, 2000);
});

// Export for debugging
window.debugLatestArticles = {
    load: loadLatestArticles,
    testPDF: function(articleId) {
        const url = `paper/${articleId}.pdf`;
        console.log(`Testing PDF URL: ${url}`);
        window.open(url, '_blank');
    }
};