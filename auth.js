// auth.js - Authentication and User Management

// SHA-256 Hash Function
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// Input Validation
function validateUsername(username) {
    if (!username || username.trim() === '') {
        return 'Username is required';
    }
    if (username.length < 3) {
        return 'Username must be at least 3 characters long';
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return 'Username can only contain letters, numbers, and underscores';
    }
    return null;
}

function validatePassword(password) {
    if (!password || password.trim() === '') {
        return 'Password is required';
    }
    if (password.length < 6) {
        return 'Password must be at least 6 characters long';
    }
    return null;
}

function sanitizeInput(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

// Load XML File
async function loadXMLFile(filename) {
    try {
        const response = await fetch(filename);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "text/xml");
        
        // Check for parsing errors
        const parserError = xmlDoc.querySelector('parsererror');
        if (parserError) {
            console.error('XML parsing error for ' + filename + ':', parserError);
            throw new Error('Failed to parse ' + filename);
        }
        
        return xmlDoc;
    } catch (error) {
        console.error('Error loading XML file (' + filename + '):', error);
        throw error;
    }
}

// Save XML File (using localStorage as browser cannot directly write to files)
function saveXMLFile(filename, xmlDoc) {
    const serializer = new XMLSerializer();
    const xmlString = serializer.serializeToString(xmlDoc);
    localStorage.setItem(filename, xmlString);
}

// Load XML from localStorage or fetch if not exists
async function getXMLData(filename) {
    try {
        const storedData = localStorage.getItem(filename);
        if (storedData) {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(storedData, "text/xml");
            const parserError = xmlDoc.querySelector('parsererror');
            if (parserError) {
                console.warn('Corrupted localStorage data for ' + filename + ', reloading from server');
                localStorage.removeItem(filename);
            } else {
                return xmlDoc;
            }
        }
        
        const xmlDoc = await loadXMLFile(filename);
        if (xmlDoc) {
            saveXMLFile(filename, xmlDoc);
        }
        return xmlDoc;
    } catch (error) {
        console.error('Failed to load user data from ' + filename + ':', error);
        throw new Error('Failed to load user data');
    }
}

// User Registration
async function registerUser(username, password) {
    username = sanitizeInput(username.trim());
    
    // Validate inputs
    const usernameError = validateUsername(username);
    if (usernameError) {
        return { success: false, error: usernameError };
    }
    
    const passwordError = validatePassword(password);
    if (passwordError) {
        return { success: false, error: passwordError };
    }
    
    try {
        // Load users XML
        let usersXML = await getXMLData('users.xml');
        if (!usersXML) {
            console.error('users.xml is null, creating new document');
            const parser = new DOMParser();
            usersXML = parser.parseFromString('<?xml version="1.0" encoding="UTF-8"?><users></users>', 'text/xml');
        }
        
        // Check if username already exists
        const users = usersXML.getElementsByTagName('user');
        for (let user of users) {
            const usernameElement = user.getElementsByTagName('username')[0];
            if (usernameElement && usernameElement.textContent === username) {
                return { success: false, error: 'Username already exists' };
            }
        }
        
        // Generate new user ID
        const newId = users.length > 0 
            ? Math.max(...Array.from(users).map(u => parseInt(u.getAttribute('id')))) + 1 
            : 1;
        
        // Hash password
        const hashedPassword = await hashPassword(password);
        
        // Create new user element
        const newUser = usersXML.createElement('user');
        newUser.setAttribute('id', newId);
        
        const usernameElement = usersXML.createElement('username');
        usernameElement.textContent = username;
        newUser.appendChild(usernameElement);
        
        const passwordElement = usersXML.createElement('password');
        passwordElement.textContent = hashedPassword;
        newUser.appendChild(passwordElement);
        
        const borrowHistoryElement = usersXML.createElement('borrowHistory');
        newUser.appendChild(borrowHistoryElement);
        
        // Add to XML
        usersXML.documentElement.appendChild(newUser);
        
        // Save to localStorage
        saveXMLFile('users.xml', usersXML);
        
        return { success: true, message: 'Registration successful!' };
    } catch (error) {
        console.error('Registration error:', error);
        return { success: false, error: 'Registration failed. Please try again.' };
    }
}

// User Login
async function loginUser(username, password) {
    username = sanitizeInput(username.trim());
    
    // Validate inputs
    const usernameError = validateUsername(username);
    if (usernameError) {
        return { success: false, error: usernameError };
    }
    
    const passwordError = validatePassword(password);
    if (passwordError) {
        return { success: false, error: passwordError };
    }
    
    try {
        // Load users XML
        let usersXML = await getXMLData('users.xml');
        if (!usersXML) {
            return { success: false, error: 'Failed to load user database. Please try again.' };
        }
        
        // Hash the provided password
        const hashedPassword = await hashPassword(password);
        
        // Find matching user
        const users = usersXML.getElementsByTagName('user');
        for (let user of users) {
            const usernameElement = user.getElementsByTagName('username')[0];
            const passwordElement = user.getElementsByTagName('password')[0];
            
            if (usernameElement && passwordElement) {
                const storedUsername = usernameElement.textContent;
                const storedPassword = passwordElement.textContent;
                const userId = user.getAttribute('id');
                
                if (storedUsername === username && storedPassword === hashedPassword) {
                    // Set session
                    sessionStorage.setItem('userId', userId);
                    sessionStorage.setItem('username', storedUsername);
                    sessionStorage.setItem('isLoggedIn', 'true');
                    
                    return { success: true, message: 'Login successful!' };
                }
            }
        }
        
        return { success: false, error: 'Invalid username or password' };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: 'Login failed. Please try again.' };
    }
}

// Check if user is logged in
function isUserLoggedIn() {
    return sessionStorage.getItem('isLoggedIn') === 'true';
}

// Get current user info
function getCurrentUser() {
    if (!isUserLoggedIn()) {
        return null;
    }
    return {
        id: sessionStorage.getItem('userId'),
        username: sessionStorage.getItem('username')
    };
}

// Logout user
function logoutUser() {
    sessionStorage.clear();
    window.location.href = 'index.html';
}

// Protect pages (redirect if not logged in)
function protectPage() {
    if (!isUserLoggedIn()) {
        window.location.href = 'login.html';
    }
}

// Redirect if already logged in
function redirectIfLoggedIn() {
    if (isUserLoggedIn()) {
        window.location.href = 'books.html';
    }
}
