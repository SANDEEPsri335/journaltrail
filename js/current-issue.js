// js/current-issue.js - Compact View Paper Button
document.addEventListener('DOMContentLoaded', function() {
    const JSON_FILE = '../data/articles.json';
    const ITEMS_PER_PAGE = 9; // 3 columns × 3 rows
    let currentPage = 1;
    let allArticles = [];
    
    // DOM Elements
    const articlesContainer = document.getElementById('articles-container');
    const paginationContainer = document.getElementById('pagination');
    const totalPapersElement = document.getElementById('total-papers');
    const latestDateElement = document.getElementById('latest-date');
    
    // Initialize
    init();
    
    async function init() {
        await loadArticles();
        renderArticles();
        renderPagination();
    }
    
    async function loadArticles() {
        try {
            const response = await fetch(JSON_FILE);
            
            if (!response.ok) {
                throw new Error(`Failed to load: ${response.status}`);
            }
            
            allArticles = await response.json();
            
            // Sort by date (newest first)
            allArticles.sort((a, b) => {
                const dateA = parseDateString(a.published);
                const dateB = parseDateString(b.published);
                return dateB - dateA;
            });
            
            // Update header info
            totalPapersElement.textContent = allArticles.length;
            
            if (allArticles.length > 0) {
                latestDateElement.textContent = formatDate(allArticles[0].published);
            } else {
                latestDateElement.textContent = 'No date';
            }
            
        } catch (error) {
            console.error('Error loading articles:', error);
            allArticles = getFallbackArticles();
            totalPapersElement.textContent = allArticles.length;
            
            if (allArticles.length > 0) {
                latestDateElement.textContent = formatDate(allArticles[0].published);
            }
        }
    }
    
    function parseDateString(dateStr) {
        if (!dateStr) return new Date(0);
        
        try {
            const parts = dateStr.split('-');
            if (parts.length === 3) {
                const year = parseInt(parts[0]);
                const month = parseInt(parts[1]) - 1;
                const day = parseInt(parts[2]);
                return new Date(year, month, day);
            }
            return new Date(dateStr);
        } catch (e) {
            return new Date(0);
        }
    }
    
    function formatDate(dateStr) {
        if (!dateStr) return 'N/A';
        
        try {
            const date = parseDateString(dateStr);
            if (date.getTime() === 0) return dateStr;
            
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch (e) {
            return dateStr;
        }
    }
    
    function getFallbackArticles() {
        return [
         <!--  {
                "title": "Paper 1",
                "authors": "Author A",
                "article_id": "IJACM_01",
                "pages": "1-5",
                "published": "2025-01-01",
                "doi": "https://doi.org/1",
                "issue": "1"
            },
            {
                "title": "Paper 2",
                "authors": "Author B",
                "article_id": "IJACM_02",
                "pages": "6-10",
                "published": "2025-01-02",
                "doi": "https://doi.org/2",
                "issue": "1"
            },
            {
                "title": "Paper 3",
                "authors": "Author C",
                "article_id": "IJACM_03",
                "pages": "11-15",
                "published": "2025-01-03",
                "doi": "https://doi.org/3",
                "issue": "1"
            } -->
        ];
    }
    
    function renderArticles() {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const pageArticles = allArticles.slice(startIndex, endIndex);
        
        if (allArticles.length === 0) {
            articlesContainer.innerHTML = `
                <div class="no-articles">
                    <p>No articles available in current issue</p>
                </div>
            `;
            return;
        }
        
        if (pageArticles.length === 0) {
            articlesContainer.innerHTML = `
                <div class="no-articles">
                    <p>No articles on this page</p>
                </div>
            `;
            return;
        }
        
        articlesContainer.innerHTML = pageArticles.map(article => createArticleCard(article)).join('');
    }
    
    function createArticleCard(article) {
        const formattedDate = formatDate(article.published);
        const doiShort = article.doi ? article.doi.replace('https://doi.org/', '') : '';
        
        return `
            <div class="article-card">
                <div class="article-header">RESEARCH ARTICLE</div>
                
                <div class="article-title">${article.title || 'Untitled Paper'}</div>
                
                <div class="article-meta">
                    <div class="meta-row">
                        <span class="meta-label">Author:</span>
                        <span class="meta-value">${article.authors || 'Unknown Author'}</span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">Published:</span>
                        <span class="meta-value">${formattedDate}</span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">Issue:</span>
                        <span class="meta-value">Vol 1 Issue ${article.issue || '1'}</span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">DOI:</span>
                        <span class="meta-value">
                            ${article.doi ? 
                                `<a href="${article.doi}" target="_blank" title="${article.doi}">${doiShort}</a>` : 
                                'No DOI'}
                        </span>
                    </div>
                </div>
                
                <div class="article-footer">
                    <a href="../paper/${article.article_id || 'document'}.pdf" 
                       target="_blank" 
                       class="view-paper-btn">
                        <i class="fas fa-file-pdf"></i>
                        View Paper
                    </a>
                </div>
            </div>
        `;
    }
    
    function renderPagination() {
        const totalPages = Math.ceil(allArticles.length / ITEMS_PER_PAGE);
        
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }
        
        let paginationHTML = '';
        
        // Previous button
        paginationHTML += `
            <button class="page-btn ${currentPage === 1 ? 'disabled' : ''}" 
                    onclick="changePage(${currentPage - 1})" 
                    ${currentPage === 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i>
            </button>
        `;
        
        // Page numbers
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="page-btn ${i === currentPage ? 'active' : ''}" 
                        onclick="changePage(${i})">
                    ${i}
                </button>
            `;
        }
        
        // Next button
        paginationHTML += `
            <button class="page-btn ${currentPage === totalPages ? 'disabled' : ''}" 
                    onclick="changePage(${currentPage + 1})" 
                    ${currentPage === totalPages ? 'disabled' : ''}>
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
        
        paginationContainer.innerHTML = paginationHTML;
    }
    
    // Global function for pagination buttons
    window.changePage = function(page) {
        if (page < 1 || page > Math.ceil(allArticles.length / ITEMS_PER_PAGE)) return;
        currentPage = page;
        renderArticles();
        renderPagination();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
});
