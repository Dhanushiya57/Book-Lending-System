// app.js - Main Application Logic

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split('/').pop();
    
    // Page-specific initialization
    switch(currentPage) {
        case 'register.html':
            initRegisterPage();
            break;
        case 'login.html':
            initLoginPage();
            break;
        case 'books.html':
            initBooksPage();
            break;
        case 'index.html':
        case '':
            initIndexPage();
            break;
    }
});

// Initialize Index Page
function initIndexPage() {
    // Redirect to books if already logged in
    if (isUserLoggedIn()) {
        const buttons = document.querySelectorAll('.cta-buttons .btn-primary');
        if (buttons.length > 0) {
            buttons[0].textContent = 'Go to Library';
            buttons[0].href = 'books.html';
        }
    }
}

// Initialize Register Page
function initRegisterPage() {
    redirectIfLoggedIn();
    
    const registerForm = document.getElementById('registerForm');
    if (!registerForm) return;
    
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        try {
            // Clear previous errors
            document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
            document.querySelectorAll('input').forEach(el => el.classList.remove('error'));
            document.getElementById('successMessage').classList.remove('show');
            
            // Get form values
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            let hasError = false;
            
            // Validate username
            const usernameError = validateUsername(username);
            if (usernameError) {
                document.getElementById('usernameError').textContent = usernameError;
                document.getElementById('username').classList.add('error');
                hasError = true;
            }
            
            // Validate password
            const passwordError = validatePassword(password);
            if (passwordError) {
                document.getElementById('passwordError').textContent = passwordError;
                document.getElementById('password').classList.add('error');
                hasError = true;
            }
            
            // Validate password confirmation
            if (password !== confirmPassword) {
                document.getElementById('confirmPasswordError').textContent = 'Passwords do not match';
                document.getElementById('confirmPassword').classList.add('error');
                hasError = true;
            }
            
            if (hasError) return;
            
            // Disable submit button
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating Account...';
            
            // Register user
            const result = await registerUser(username, password);
            
            if (result.success) {
                // Show success message
                const successDiv = document.getElementById('successMessage');
                if (successDiv) {
                    successDiv.classList.add('show');
                }
                
                // Clear form
                registerForm.reset();
                
                // Redirect to login after 2 seconds
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                // Show error message
                const errorMsg = result.error || 'Registration failed. Please try again.';
                const successDiv = document.getElementById('successMessage');
                if (successDiv) {
                    successDiv.textContent = '❌ ' + errorMsg;
                    successDiv.style.background = 'rgba(239, 68, 68, 0.1)';
                    successDiv.style.color = '#dc2626';
                    successDiv.style.borderColor = 'rgba(239, 68, 68, 0.25)';
                    successDiv.classList.add('show');
                }
                
                submitBtn.disabled = false;
                submitBtn.textContent = 'Create My Account';
            }
        } catch (error) {
            console.error('Registration error:', error);
            const successDiv = document.getElementById('successMessage');
            if (successDiv) {
                successDiv.textContent = '❌ An unexpected error occurred. Please try again.';
                successDiv.style.background = 'rgba(239, 68, 68, 0.1)';
                successDiv.style.color = '#dc2626';
                successDiv.style.borderColor = 'rgba(239, 68, 68, 0.25)';
                successDiv.classList.add('show');
            }
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Create My Account';
            }
        }
    });
}

// Initialize Login Page
function initLoginPage() {
    redirectIfLoggedIn();
    
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        try {
            // Clear previous errors
            document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
            document.querySelectorAll('input').forEach(el => el.classList.remove('error'));
            const successDiv = document.getElementById('successMessage');
            if (successDiv) {
                successDiv.classList.remove('show');
            }
            
            // Get form values
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            
            let hasError = false;
            
            // Validate username
            const usernameError = validateUsername(username);
            if (usernameError) {
                document.getElementById('usernameError').textContent = usernameError;
                document.getElementById('username').classList.add('error');
                hasError = true;
            }
            
            // Validate password
            const passwordError = validatePassword(password);
            if (passwordError) {
                document.getElementById('passwordError').textContent = passwordError;
                document.getElementById('password').classList.add('error');
                hasError = true;
            }
            
            if (hasError) return;
            
            // Disable submit button
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Signing In...';
            
            // Login user
            const result = await loginUser(username, password);
            
            if (result.success) {
                // Show success message
                if (successDiv) {
                    successDiv.classList.add('show');
                }
                
                // Redirect to books page after 1.5 seconds
                setTimeout(() => {
                    window.location.href = 'books.html';
                }, 1500);
            } else {
                // Show error message
                const errorMsg = result.error || 'Login failed. Please try again.';
                if (successDiv) {
                    successDiv.textContent = '❌ ' + errorMsg;
                    successDiv.style.background = 'rgba(239, 68, 68, 0.1)';
                    successDiv.style.color = '#dc2626';
                    successDiv.style.borderColor = 'rgba(239, 68, 68, 0.25)';
                    successDiv.classList.add('show');
                }
                
                submitBtn.disabled = false;
                submitBtn.textContent = 'Sign In';
            }
        } catch (error) {
            console.error('Login error:', error);
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Sign In';
            }
            const successDiv = document.getElementById('successMessage');
            if (successDiv) {
                successDiv.textContent = '❌ An unexpected error occurred. Please try again.';
                successDiv.style.background = 'rgba(239, 68, 68, 0.1)';
                successDiv.style.color = '#dc2626';
                successDiv.style.borderColor = 'rgba(239, 68, 68, 0.25)';
                successDiv.classList.add('show');
            }
        }
    });
}

// Initialize Books Page
function initBooksPage() {
    protectPage();
    
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    // Display welcome message
    const welcomeMessage = document.getElementById('welcomeMessage');
    if (welcomeMessage) {
        welcomeMessage.textContent = `Welcome, ${currentUser.username}!`;
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logoutUser);
    }
    
    // View switching
    const showAllBooksBtn = document.getElementById('showAllBooks');
    const showMyBooksBtn = document.getElementById('showMyBooks');
    const showHistoryBtn = document.getElementById('showHistory');
    
    const allBooksView = document.getElementById('allBooksView');
    const myBooksView = document.getElementById('myBooksView');
    const historyView = document.getElementById('historyView');
    
    function switchView(view) {
        // Hide all views
        allBooksView.classList.remove('active');
        myBooksView.classList.remove('active');
        historyView.classList.remove('active');
        
        // Remove active from all buttons
        showAllBooksBtn.classList.remove('active');
        showMyBooksBtn.classList.remove('active');
        showHistoryBtn.classList.remove('active');
        
        // Show selected view
        switch(view) {
            case 'all':
                allBooksView.classList.add('active');
                showAllBooksBtn.classList.add('active');
                loadAndDisplayAllBooks();
                break;
            case 'borrowed':
                myBooksView.classList.add('active');
                showMyBooksBtn.classList.add('active');
                showMyBorrowedBooks();
                break;
            case 'history':
                historyView.classList.add('active');
                showHistoryBtn.classList.add('active');
                showBorrowingHistory();
                break;
        }
    }
    
    showAllBooksBtn.addEventListener('click', () => switchView('all'));
    showMyBooksBtn.addEventListener('click', () => switchView('borrowed'));
    showHistoryBtn.addEventListener('click', () => switchView('history'));
    
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    let allBooks = [];
    let currentCategory = 'all';
    
    async function updateBooksDisplay() {
        let filteredBooks = [...allBooks];
        
        // Apply category filter
        if (currentCategory !== 'all') {
            filteredBooks = filterBooks(filteredBooks, currentCategory);
        }
        
        // Apply search
        const searchQuery = searchInput.value;
        if (searchQuery) {
            filteredBooks = searchBooks(filteredBooks, searchQuery);
        }
        
        displayBooks(filteredBooks);
    }
    
    searchInput.addEventListener('input', updateBooksDisplay);
    
    // Category filters
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentCategory = this.dataset.category;
            updateBooksDisplay();
        });
    });
    
    // Load initial data
    async function initializeBooks() {
        allBooks = await loadBooks();
        displayBooks(allBooks);
    }
    
    initializeBooks();
}

// Utility function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// Clear localStorage (for testing/reset)
function resetData() {
    if (confirm('Are you sure you want to reset all data? This will clear all users and borrowed books.')) {
        localStorage.clear();
        sessionStorage.clear();
        alert('Data reset successfully. Please refresh the page.');
        window.location.reload();
    }
}

// Export for console access (for testing)
window.auth = {
    getCurrentUser,
    isUserLoggedIn,
    logoutUser
};

window.books = {
    loadBooks,
    borrowBook,
    returnBook,
    getUserBorrowedBooks,
    getUserBorrowingHistory
};

window.utils = {
    resetData
};
