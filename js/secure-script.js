/**
 * SECURE VERSION OF THE CODE
 * 
 * This file shows how the vulnerable code should be rewritten to prevent XSS attacks.
 * It should NOT be used in the demo application as it would fix the vulnerability we're demonstrating.
 */

document.addEventListener('DOMContentLoaded', function() {
    const API_URL = 'http://localhost:3003/api';
    const commentForm = document.getElementById('comment-form');
    const commentsContainer = document.getElementById('comments-container');
    const loadingElement = document.getElementById('loading-comments');
    
    // SECURE: Add Content-Security-Policy meta tag
    // This would normally be added to the HTML head or sent as an HTTP header
    function addCSP() {
        const meta = document.createElement('meta');
        meta.httpEquiv = "Content-Security-Policy";
        meta.content = "default-src 'self'; script-src 'self'; object-src 'none';";
        document.head.appendChild(meta);
    }
    
    // Fetch comments from the server - SECURE VERSION
    async function fetchComments() {
        try {
            const response = await fetch(`${API_URL}/comments`);
            if (!response.ok) {
                throw new Error('Failed to fetch comments');
            }
            
            const comments = await response.json();
            
            // Remove loading message
            if (loadingElement) {
                loadingElement.remove();
            }
            
            // Display comments SECURELY
            if (Array.isArray(comments)) {
                comments.forEach(comment => {
                    addCommentToDOM_Secure({
                        id: comment.id,
                        name: comment.name,
                        comment: comment.comment,
                        date: new Date(comment.created_at).toLocaleString()
                    });
                });
            }
        } catch (error) {
            console.error('Error:', error);
            if (loadingElement) {
                loadingElement.textContent = 'Failed to load comments. Please try again later.';
            }
        }
    }
    
    // Handle form submission - SECURE VERSION
    commentForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const nameInput = document.getElementById('name');
        const commentInput = document.getElementById('comment');
        
        // SECURE: Validate input
        if (!validateInput(nameInput.value) || !validateInput(commentInput.value)) {
            alert('Invalid input. Please avoid using HTML tags or special characters.');
            return;
        }
        
        // Create comment object
        const commentObj = {
            name: nameInput.value,
            comment: commentInput.value
        };
        
        try {
            // Send comment to the server
            const response = await fetch(`${API_URL}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(commentObj)
            });
            
            if (!response.ok) {
                throw new Error('Failed to post comment');
            }
            
            const newComment = await response.json();
            
            // SECURE: Add new comment to DOM using secure function
            addCommentToDOM_Secure({
                id: newComment.id,
                name: newComment.name,
                comment: newComment.comment,
                date: new Date(newComment.created_at).toLocaleString()
            });
            
            // Reset form
            commentForm.reset();
            
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to post comment. Please try again later.');
        }
    });
    
    // SECURE: Basic input validation function
    function validateInput(input) {
        // Check for potential malicious content
        if (/<script|javascript:|on\w+=/i.test(input)) {
            return false;
        }
        return true;
    }
    
    // SECURE: Function to add comment to DOM - Uses textContent instead of innerHTML
    function addCommentToDOM_Secure(commentObj) {
        if (!commentsContainer) {
            console.error('Comments container not found');
            return;
        }
        
        const commentDiv = document.createElement('div');
        commentDiv.className = 'comment';
        
        // If comment has an ID, store it as a data attribute
        if (commentObj.id) {
            commentDiv.dataset.commentId = commentObj.id;
        }
        
        // SECURE: Create elements properly using textContent
        const authorDiv = document.createElement('div');
        authorDiv.className = 'comment-author';
        authorDiv.textContent = commentObj.name || 'Anonymous';
        
        const textDiv = document.createElement('div');
        textDiv.className = 'comment-text';
        textDiv.textContent = commentObj.comment || '';
        
        const dateDiv = document.createElement('div');
        dateDiv.className = 'comment-date';
        dateDiv.textContent = commentObj.date || new Date().toLocaleString();
        
        const removeButton = document.createElement('button');
        removeButton.className = 'remove-comment-btn';
        removeButton.textContent = 'Remove';
        
        // Add elements to comment div
        commentDiv.appendChild(authorDiv);
        commentDiv.appendChild(textDiv);
        commentDiv.appendChild(dateDiv);
        commentDiv.appendChild(removeButton);
        
        // SECURE: Add event listener directly to the button
        removeButton.addEventListener('click', async function() {
            if (commentObj.id) {
                try {
                    const response = await fetch(`${API_URL}/comments/${commentObj.id}`, {
                        method: 'DELETE'
                    });
                    
                    if (!response.ok) {
                        throw new Error('Failed to delete comment');
                    }
                    
                    console.log('Comment deleted from database');
                } catch (error) {
                    console.error('Error deleting comment:', error);
                }
            }
            
            // Remove from DOM
            commentDiv.remove();
        });
        
        commentsContainer.appendChild(commentDiv);
    }
    
    // Initialize the page - SECURE VERSION
    function init() {
        addCSP(); // Add Content Security Policy
        fetchComments(); // Get initial comments
    }
    
    init();
});