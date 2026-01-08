export const wishes = (() => {
    const API_URL = 'https://script.google.com/macros/s/AKfycbzzsyJxi-DO1fYOjCQEZNl6DYgF9TkUjEl2Jhq3rv9sNqx2u6JIA_kArUF29skUckA/exec';
    const ITEMS_PER_PAGE = 10;
    
    let currentPage = 1;
    let wishesData = [];
    let totalPages = 1;
    
    /**
     * Fetch data using JSONP to bypass CORS
     */
    const fetchWishesData = () => {
        return new Promise((resolve, reject) => {
            console.log('Fetching wishes via JSONP from:', API_URL);
            
            // Create unique callback name
            const callbackName = 'wishesCallback_' + Math.random().toString(36).substring(7);
            const timeout = 10000; // 10 seconds timeout
            
            let timeoutId;
            
            // Create global callback function
            window[callbackName] = (result) => {
                console.log('JSONP Response received:', result);
                
                // Clear timeout
                clearTimeout(timeoutId);
                
                // Cleanup
                delete window[callbackName];
                if (document.body.contains(script)) {
                    document.body.removeChild(script);
                }
                
                if (result && result.success && Array.isArray(result.data)) {
                    wishesData = result.data;
                    
                    // Reverse to show newest first
                    wishesData.reverse();
                    
                    totalPages = Math.ceil(wishesData.length / ITEMS_PER_PAGE);
                    console.log(`✅ Loaded ${wishesData.length} wishes, ${totalPages} pages`);
                    resolve(true);
                } else {
                    console.warn('Invalid response format:', result);
                    resolve(false);
                }
            };
            
            // Create script tag
            const script = document.createElement('script');
            const url = `${API_URL}?callback=${callbackName}&timestamp=${Date.now()}`;
            console.log('Loading script:', url);
            script.src = url;
            
            script.onerror = (error) => {
                console.error('Error loading script:', error);
                clearTimeout(timeoutId);
                delete window[callbackName];
                if (document.body.contains(script)) {
                    document.body.removeChild(script);
                }
                reject(new Error('Failed to load wishes - script error'));
            };
            
            // Set timeout
            timeoutId = setTimeout(() => {
                console.error('Script loading timeout');
                delete window[callbackName];
                if (document.body.contains(script)) {
                    document.body.removeChild(script);
                }
                reject(new Error('Failed to load wishes - timeout'));
            }, timeout);
            
            // Add script to page
            document.body.appendChild(script);
        });
    };
    
    /**
     * Render wishes for current page
     */
    const renderWishes = () => {
        const container = document.getElementById('wishes-container');
        if (!container) return;
        
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        const pageWishes = wishesData.slice(start, end);
        
        if (pageWishes.length === 0) {
            container.innerHTML = `
                <div class="text-center p-4 mx-0 mt-0 mb-3 bg-theme-auto rounded-4 shadow">
                    <p class="fw-bold p-0 m-0" style="font-size: 0.95rem;">
                        <i class="fa-solid fa-heart me-2" style="color: #a0263a;"></i>
                        Chưa có lời chúc nào. Hãy là người đầu tiên gửi lời chúc!
                    </p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = pageWishes.map(wish => `
            <div class="wish-card mb-3 p-3 bg-theme-auto rounded-4 shadow-sm" data-aos="fade-up">
                <div class="d-flex align-items-start">
                    <div class="flex-shrink-0 me-3">
                        <div class="avatar-circle">
                            <i class="fa-solid fa-user"></i>
                        </div>
                    </div>
                    <div class="flex-grow-1">
                        <h6 class="mb-2 fw-bold text-truncate" style="color: #a0263a;">${escapeHtml(wish.name)}</h6>
                        <p class="mb-0" style="font-size: 0.9rem; line-height: 1.5;">${escapeHtml(wish.message)}</p>
                    </div>
                </div>
            </div>
        `).join('');
        
        renderPagination();
    };
    
    /**
     * Render pagination controls
     */
    const renderPagination = () => {
        const pagination = document.getElementById('wishes-pagination');
        if (!pagination) return;
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }
        
        let html = '<nav aria-label="Wishes pagination"><ul class="pagination justify-content-center mb-0">';
        
        // Previous button
        html += `
            <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#wishes" onclick="window.wishesNavigation.prevPage(); return false;" aria-label="Previous">
                    <i class="fa-solid fa-chevron-left"></i>
                </a>
            </li>
        `;
        
        // Page numbers (show max 5 pages)
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, startPage + 4);
        
        for (let i = startPage; i <= endPage; i++) {
            html += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#wishes" onclick="window.wishesNavigation.goToPage(${i}); return false;">${i}</a>
                </li>
            `;
        }
        
        // Next button
        html += `
            <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#wishes" onclick="window.wishesNavigation.nextPage(); return false;" aria-label="Next">
                    <i class="fa-solid fa-chevron-right"></i>
                </a>
            </li>
        `;
        
        html += '</ul></nav>';
        pagination.innerHTML = html;
    };
    
    /**
     * Escape HTML to prevent XSS
     */
    const escapeHtml = (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };
    
    /**
     * Navigation functions
     */
    const goToPage = (page) => {
        if (page < 1 || page > totalPages) return;
        currentPage = page;
        renderWishes();
        
        // Scroll to wishes section smoothly
        document.getElementById('wishes')?.scrollIntoView({ behavior: 'smooth' });
    };
    
    const nextPage = () => {
        if (currentPage < totalPages) {
            goToPage(currentPage + 1);
        }
    };
    
    const prevPage = () => {
        if (currentPage > 1) {
            goToPage(currentPage - 1);
        }
    };
    
    /**
     * Initialize wishes display
     */
    const init = async () => {
        console.log('Initializing wishes...');
        const container = document.getElementById('wishes-container');
        
        if (!container) {
            console.error('Wishes container not found');
            return;
        }
        
        try {
            const success = await fetchWishesData();
            if (success) {
                renderWishes();
            } else {
                // Show error message
                container.innerHTML = `
                    <div class="text-center p-4 mx-0 mt-0 mb-3 bg-theme-auto rounded-4 shadow">
                        <p class="fw-bold p-0 m-0" style="font-size: 0.95rem; color: #a0263a;">
                            <i class="fa-solid fa-exclamation-circle me-2"></i>
                            Không thể tải lời chúc. Vui lòng thử lại sau.
                        </p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Init error:', error);
            container.innerHTML = `
                <div class="text-center p-4 mx-0 mt-0 mb-3 bg-theme-auto rounded-4 shadow">
                    <p class="fw-bold p-0 m-0" style="font-size: 0.95rem; color: #a0263a;">
                        <i class="fa-solid fa-exclamation-circle me-2"></i>
                        Đã có lỗi xảy ra khi tải lời chúc.
                    </p>
                </div>
            `;
        }
        
        // Refresh every 60 seconds to get new wishes
        setInterval(async () => {
            const success = await fetchWishesData();
            if (success) {
                renderWishes();
            }
        }, 60000);
    };
    
    // Expose navigation functions globally
    window.wishesNavigation = {
        goToPage,
        nextPage,
        prevPage
    };
    
    return { init };
})();