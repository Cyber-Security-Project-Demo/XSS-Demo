# Cross-Site Scripting (XSS) Vulnerability Demonstration

#webApp script
```<img src=x onerror="(async()=>{try{const api='http://localhost:5000';console.log('[XSS] cookie=',document.cookie);const r=await fetch(api+'/api/admin/users',{credentials:'include'});const users=await r.json();console.log('[XSS] users:',users);}catch(e){console.error('[XSS] error',e);}})()">```


This project demonstrates a Cross-Site Scripting (XSS) vulnerability in a comment system with a database backend. It's designed for educational purposes to help understand how XSS vulnerabilities work, their potential impact, and how to prevent them.

## ⚠️ Important Warning

**This code intentionally contains security vulnerabilities for educational purposes. DO NOT use this in production environments or on any public-facing websites.**

## Project Overview

This demonstration simulates a simple blog with a vulnerable comment section that allows users to:
- Add comments that are stored in a database
- Remove comments they've added
- Exploit XSS vulnerabilities to access sensitive information

## Where is the Vulnerability?

The main XSS vulnerability exists in the `addCommentToDOM` function in `js/script.js`:

```javascript
// VULNERABLE CODE
function addCommentToDOM(commentObj) {
    const commentDiv = document.createElement('div');
    commentDiv.className = 'comment';
    
    // Direct insertion of user input into innerHTML without sanitization
    commentDiv.innerHTML = `
        <div class="comment-author">${commentObj.name}</div>
        <div class="comment-text">${commentObj.comment}</div>
        <div class="comment-date">${commentObj.date}</div>
        <button class="remove-comment-btn">Remove</button>
    `;
    
    // ... rest of function
}
```

The vulnerability occurs because:
1. User input is directly inserted into the DOM using `innerHTML` without sanitization
2. This allows JavaScript code in the `name` or `comment` fields to be executed
3. The server-side API endpoints are also vulnerable as they don't sanitize inputs
4. The user data endpoint has no authentication, allowing any script to access it

## How to Clone and Run This Project

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation and Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/xss-vulnerability-demo.git
   cd xss-vulnerability-demo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   The project includes a `.env` file with database configuration. The application will work even without a real database connection as it has a fallback mock database.

4. **Start the server**
   ```bash
   npm start
   ```

5. **Access the application**
   Open your browser and navigate to:
   ```
   http://localhost:3003
   ```

### Testing the XSS Vulnerability

You can test the XSS vulnerability by adding a comment with JavaScript code. Here are some examples:

#### Example 1: Basic Alert
```html
<script>alert('XSS Attack Successful!');</script>
```

#### Example 2: Stealing User Data
```html
<script>
  setTimeout(function() {
    fetch('/api/users')
      .then(response => response.json())
      .then(users => {
        alert('Found ' + users.length + ' users in the database!\n\n' + 
              users.map(u => u.username + ':' + u.password).join('\n'));
      });
  }, 1000);
</script>
```

#### Example 3: Changing Page Appearance
```html
<script>document.body.style.backgroundColor = 'red';</script>
```

## How to Prevent XSS Vulnerabilities

To fix this vulnerability, the following measures should be implemented:

### 1. Client-side Protections
- Use `textContent` instead of `innerHTML` when inserting user-generated content:
  ```javascript
  // SECURE CODE
  function addCommentToDOM_Secure(commentObj) {
      const commentDiv = document.createElement('div');
      commentDiv.className = 'comment';
      
      const authorDiv = document.createElement('div');
      authorDiv.className = 'comment-author';
      authorDiv.textContent = commentObj.name;
      
      const textDiv = document.createElement('div');
      textDiv.className = 'comment-text';
      textDiv.textContent = commentObj.comment;
      
      // ... rest of function
  }
  ```

### 2. Server-side Protections
- Sanitize all user inputs before storing in the database or returning in responses
- Use packages like `DOMPurify` or `xss-filters` to sanitize HTML content
- Implement proper authentication and authorization for sensitive endpoints
- Use parameterized queries for database operations

### 3. HTTP Headers and Content Security Policy (CSP)
- Implement a strict Content Security Policy:
  ```
  Content-Security-Policy: default-src 'self'; script-src 'self'
  ```
- Set appropriate X-XSS-Protection headers:
  ```
  X-XSS-Protection: 1; mode=block
  ```

### 4. Additional Best Practices
- Validate input on both client and server sides
- Encode data when outputting to HTML, URLs, or JavaScript contexts
- Keep software dependencies updated
- Use HTTPS to prevent data tampering in transit
- Never store sensitive data like passwords in plaintext

## Project Structure

```
├── css/
│   └── style.css           # Styling for the application
├── js/
│   └── script.js           # Client-side JavaScript with the vulnerability
├── .env                    # Environment variables including DB configuration
├── index.html              # Main HTML page with the comment system
├── package.json            # Project dependencies and scripts
├── README.md               # This documentation
├── server.js               # Node.js/Express server with API endpoints
└── setup_database.sql      # SQL script to set up the database tables
```

## Disclaimer

This project is for educational purposes only. Unauthorized testing of XSS vulnerabilities on websites without permission is illegal and unethical. Always practice security testing in controlled environments that you have permission to test.
