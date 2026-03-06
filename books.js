// books.js - Book Management Functions

// Load all books from XML
async function loadBooks() {
    try {
        const booksXML = await getXMLData('books.xml');
        if (!booksXML) {
            return [];
        }
        
        const books = [];
        const bookElements = booksXML.getElementsByTagName('book');
        
        for (let book of bookElements) {
            books.push({
                id: book.getAttribute('id'),
                title: book.getElementsByTagName('title')[0].textContent,
                author: book.getElementsByTagName('author')[0].textContent,
                category: book.getElementsByTagName('category')[0].textContent,
                publishedYear: book.getElementsByTagName('publishedYear')[0].textContent,
                available: book.getElementsByTagName('available')[0].textContent === 'true'
            });
        }
        
        return books;
    } catch (error) {
        console.error('Error loading books:', error);
        return [];
    }
}

// Get book by ID
async function getBookById(bookId) {
    const books = await loadBooks();
    return books.find(book => book.id === bookId);
}

// Display books in grid
function displayBooks(books, containerId = 'booksGrid') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (books.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No books found</h3>
                <p>Try adjusting your search or filters</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = books.map(book => `
        <div class="book-card" data-book-id="${book.id}">
            <h3>${book.title}</h3>
            <div class="book-info">
                <p><strong>Author:</strong> ${book.author}</p>
                <p><strong>Category:</strong> ${book.category}</p>
                <p><strong>Published:</strong> ${book.publishedYear}</p>
            </div>
            <span class="book-status ${book.available ? 'available' : 'unavailable'}">
                ${book.available ? '✓ Available' : '✗ Unavailable'}
            </span>
            <div class="book-actions">
                ${book.available 
                    ? `<button class="btn btn-success" onclick="borrowBook('${book.id}')">Borrow</button>`
                    : `<button class="btn btn-secondary" disabled>Not Available</button>`
                }
            </div>
        </div>
    `).join('');
}

// Filter books by category
function filterBooks(books, category) {
    if (category === 'all') {
        return books;
    }
    return books.filter(book => book.category === category);
}

// Search books
function searchBooks(books, query) {
    if (!query || query.trim() === '') {
        return books;
    }
    
    query = query.toLowerCase();
    return books.filter(book => 
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        book.category.toLowerCase().includes(query)
    );
}

// Borrow a book
async function borrowBook(bookId) {
    if (!isUserLoggedIn()) {
        showAlert('Please login to borrow books', 'error');
        return;
    }
    
    try {
        const currentUser = getCurrentUser();
        
        // Load XMLs
        const booksXML = await getXMLData('books.xml');
        const usersXML = await getXMLData('users.xml');
        
        if (!booksXML || !usersXML) {
            showAlert('Failed to load data', 'error');
            return;
        }
        
        // Find book
        const bookElements = booksXML.getElementsByTagName('book');
        let targetBook = null;
        
        for (let book of bookElements) {
            if (book.getAttribute('id') === bookId) {
                targetBook = book;
                break;
            }
        }
        
        if (!targetBook) {
            showAlert('Book not found', 'error');
            return;
        }
        
        // Check availability
        const availableElement = targetBook.getElementsByTagName('available')[0];
        if (availableElement.textContent !== 'true') {
            showAlert('Book is not available', 'error');
            return;
        }
        
        // Update book availability
        availableElement.textContent = 'false';
        saveXMLFile('books.xml', booksXML);
        
        // Add to user's borrow history
        const users = usersXML.getElementsByTagName('user');
        for (let user of users) {
            if (user.getAttribute('id') === currentUser.id) {
                const borrowHistory = user.getElementsByTagName('borrowHistory')[0];
                
                const borrowElement = usersXML.createElement('borrow');
                
                const bookIdElement = usersXML.createElement('bookId');
                bookIdElement.textContent = bookId;
                borrowElement.appendChild(bookIdElement);
                
                const borrowedOnElement = usersXML.createElement('borrowedOn');
                borrowedOnElement.textContent = new Date().toISOString().split('T')[0];
                borrowElement.appendChild(borrowedOnElement);
                
                const returnedElement = usersXML.createElement('returned');
                returnedElement.textContent = 'false';
                borrowElement.appendChild(returnedElement);
                
                borrowHistory.appendChild(borrowElement);
                break;
            }
        }
        
        saveXMLFile('users.xml', usersXML);
        
        showAlert('Book borrowed successfully!', 'success');
        
        // Refresh the display
        setTimeout(() => {
            loadAndDisplayAllBooks();
        }, 1000);
        
    } catch (error) {
        console.error('Error borrowing book:', error);
        showAlert('Failed to borrow book', 'error');
    }
}

// Return a book
async function returnBook(bookId) {
    if (!isUserLoggedIn()) {
        showAlert('Please login to return books', 'error');
        return;
    }
    
    try {
        const currentUser = getCurrentUser();
        
        // Load XMLs
        const booksXML = await getXMLData('books.xml');
        const usersXML = await getXMLData('users.xml');
        
        if (!booksXML || !usersXML) {
            showAlert('Failed to load data', 'error');
            return;
        }
        
        // Update book availability
        const bookElements = booksXML.getElementsByTagName('book');
        for (let book of bookElements) {
            if (book.getAttribute('id') === bookId) {
                const availableElement = book.getElementsByTagName('available')[0];
                availableElement.textContent = 'true';
                break;
            }
        }
        saveXMLFile('books.xml', booksXML);
        
        // Update user's borrow history
        const users = usersXML.getElementsByTagName('user');
        for (let user of users) {
            if (user.getAttribute('id') === currentUser.id) {
                const borrows = user.getElementsByTagName('borrow');
                
                for (let borrow of borrows) {
                    const borrowBookId = borrow.getElementsByTagName('bookId')[0].textContent;
                    const returned = borrow.getElementsByTagName('returned')[0];
                    
                    if (borrowBookId === bookId && returned.textContent === 'false') {
                        returned.textContent = 'true';
                        
                        // Add returnedOn date if it doesn't exist
                        let returnedOnElement = borrow.getElementsByTagName('returnedOn')[0];
                        if (!returnedOnElement) {
                            returnedOnElement = usersXML.createElement('returnedOn');
                            borrow.appendChild(returnedOnElement);
                        }
                        returnedOnElement.textContent = new Date().toISOString().split('T')[0];
                        break;
                    }
                }
                break;
            }
        }
        
        saveXMLFile('users.xml', usersXML);
        
        showAlert('Book returned successfully!', 'success');
        
        // Refresh the display
        setTimeout(() => {
            showMyBorrowedBooks();
        }, 1000);
        
    } catch (error) {
        console.error('Error returning book:', error);
        showAlert('Failed to return book', 'error');
    }
}

// Get user's borrowed books
async function getUserBorrowedBooks() {
    if (!isUserLoggedIn()) {
        return [];
    }
    
    try {
        const currentUser = getCurrentUser();
        const usersXML = await getXMLData('users.xml');
        const allBooks = await loadBooks();
        
        if (!usersXML) {
            return [];
        }
        
        const users = usersXML.getElementsByTagName('user');
        const borrowedBooks = [];
        
        for (let user of users) {
            if (user.getAttribute('id') === currentUser.id) {
                const borrows = user.getElementsByTagName('borrow');
                
                for (let borrow of borrows) {
                    const bookId = borrow.getElementsByTagName('bookId')[0].textContent;
                    const returned = borrow.getElementsByTagName('returned')[0].textContent === 'true';
                    
                    if (!returned) {
                        const book = allBooks.find(b => b.id === bookId);
                        if (book) {
                            borrowedBooks.push({
                                ...book,
                                borrowedOn: borrow.getElementsByTagName('borrowedOn')[0].textContent
                            });
                        }
                    }
                }
                break;
            }
        }
        
        return borrowedBooks;
    } catch (error) {
        console.error('Error getting borrowed books:', error);
        return [];
    }
}

// Display borrowed books
async function showMyBorrowedBooks() {
    const borrowedBooks = await getUserBorrowedBooks();
    const container = document.getElementById('borrowedBooksGrid');
    
    if (!container) return;
    
    if (borrowedBooks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No borrowed books</h3>
                <p>You haven't borrowed any books yet</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = borrowedBooks.map(book => `
        <div class="book-card" data-book-id="${book.id}">
            <h3>${book.title}</h3>
            <div class="book-info">
                <p><strong>Author:</strong> ${book.author}</p>
                <p><strong>Category:</strong> ${book.category}</p>
                <p><strong>Published:</strong> ${book.publishedYear}</p>
                <p><strong>Borrowed On:</strong> ${book.borrowedOn}</p>
            </div>
            <div class="book-actions">
                <button class="btn btn-danger" onclick="returnBook('${book.id}')">Return Book</button>
            </div>
        </div>
    `).join('');
}

// Get user's borrowing history
async function getUserBorrowingHistory() {
    if (!isUserLoggedIn()) {
        return [];
    }
    
    try {
        const currentUser = getCurrentUser();
        const usersXML = await getXMLData('users.xml');
        const allBooks = await loadBooks();
        
        if (!usersXML) {
            return [];
        }
        
        const users = usersXML.getElementsByTagName('user');
        const history = [];
        
        for (let user of users) {
            if (user.getAttribute('id') === currentUser.id) {
                const borrows = user.getElementsByTagName('borrow');
                
                for (let borrow of borrows) {
                    const bookId = borrow.getElementsByTagName('bookId')[0].textContent;
                    const borrowedOn = borrow.getElementsByTagName('borrowedOn')[0].textContent;
                    const returned = borrow.getElementsByTagName('returned')[0].textContent === 'true';
                    
                    let returnedOn = '';
                    if (returned) {
                        const returnedOnElement = borrow.getElementsByTagName('returnedOn')[0];
                        returnedOn = returnedOnElement ? returnedOnElement.textContent : '';
                    }
                    
                    const book = allBooks.find(b => b.id === bookId);
                    if (book) {
                        history.push({
                            ...book,
                            borrowedOn,
                            returned,
                            returnedOn
                        });
                    }
                }
                break;
            }
        }
        
        return history.reverse(); // Most recent first
    } catch (error) {
        console.error('Error getting borrowing history:', error);
        return [];
    }
}

// Display borrowing history
async function showBorrowingHistory() {
    const history = await getUserBorrowingHistory();
    const tbody = document.getElementById('historyTableBody');
    
    if (!tbody) return;
    
    if (history.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px; color: var(--text-light);">
                    No borrowing history found
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = history.map(record => `
        <tr>
            <td>${record.title}</td>
            <td>${record.author}</td>
            <td>${record.borrowedOn}</td>
            <td>
                <span class="status-badge ${record.returned ? 'returned' : 'borrowed'}">
                    ${record.returned ? 'Returned' : 'Borrowed'}
                </span>
            </td>
            <td>${record.returnedOn || '-'}</td>
        </tr>
    `).join('');
}

// Load and display all books
async function loadAndDisplayAllBooks() {
    const books = await loadBooks();
    displayBooks(books);
}

// Show alert message
function showAlert(message, type = 'info') {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());
    
    // Create new alert
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    // Insert at top of main content
    const main = document.querySelector('main');
    if (main) {
        main.insertBefore(alert, main.firstChild);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            alert.remove();
        }, 5000);
    }
}
