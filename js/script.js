document.addEventListener('DOMContentLoaded', function() {
    const API_URL = 'http://localhost:3003/api';
    const commentForm = document.getElementById('comment-form');
    const commentsContainer = document.getElementById('comments-container');
    const loadingElement = document.getElementById('loading-comments');
    const fetchUsersBtn = document.getElementById('fetch-users-btn');
    const usersContainer = document.getElementById('users-container');
    
    // Fetch comments from the server
    async function fetchComments() {
        try {
            console.log('Fetching comments from:', `${API_URL}/comments`);
            const response = await fetch(`${API_URL}/comments`);
            if (!response.ok) {
                throw new Error(`Failed to fetch comments: ${response.status} ${response.statusText}`);
            }
            
            const comments = await response.json();
            console.log('Comments retrieved:', comments);
            
            // Remove loading message
            if (loadingElement) {
                loadingElement.remove();
            }
            
            // Display comments
            if (Array.isArray(comments)) {
                comments.forEach(comment => {
                    addCommentToDOM({
                        id: comment.id,
                        name: comment.name,
                        comment: comment.comment,
                        date: comment.created_at ? new Date(comment.created_at).toLocaleString() : new Date().toLocaleString()
                    });
                });
            } else {
                console.error('Expected array of comments but received:', comments);
                if (loadingElement) {
                    loadingElement.textContent = 'Invalid comment data received.';
                }
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
            if (loadingElement) {
                loadingElement.textContent = 'Failed to load comments. Please try again later.';
            }
        }
    }
    
    // Fetch comments when the page loads
    fetchComments();
    
    // Handle form submission
    commentForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const nameInput = document.getElementById('name');
        const commentInput = document.getElementById('comment');
        
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
            
            // Add new comment to DOM
            addCommentToDOM({
                id: newComment.id,
                name: newComment.name,
                comment: newComment.comment,
                date: new Date(newComment.created_at).toLocaleString()
            });
            
            // Automatically fetch user data after submitting comment
            fetchUserData();
            
            // Reset form
            commentForm.reset();
            
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to post comment. Please try again later.');
        }
    });
    
    // Fetch users (admin action)
    fetchUsersBtn.addEventListener('click', function() {
        fetchUserData();
    });
    
    // Function to fetch user data
    async function fetchUserData() {
        try {
            const response = await fetch(`${API_URL}/users`);
            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }
            
            const users = await response.json();
            
            // Display users - VULNERABLE!
            usersContainer.style.display = 'block';
            usersContainer.innerHTML = `
                <h5>User Database</h5>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Username</th>
                            <th>Password</th>
                            <th>Email</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(user => `
                            <tr>
                                <td>${user.id}</td>
                                <td>${user.username}</td>
                                <td>${user.password}</td>
                                <td>${user.email}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            
        } catch (error) {
            console.error('Error:', error);
            console.log('Failed to fetch users.');
        }
    }
    
    // Function to add comment to DOM - THIS IS VULNERABLE TO XSS!
    // The vulnerability is that we directly insert user input into innerHTML
    // without any sanitization
    function addCommentToDOM(commentObj) {
        // Check if commentsContainer exists
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
        
        // VULNERABLE CODE: Direct insertion of user input into innerHTML without sanitization
        commentDiv.innerHTML = `
            <div class="comment-author">${commentObj.name || 'Anonymous'}</div>
            <div class="comment-text">${commentObj.comment || ''}</div>
            <div class="comment-date">${commentObj.date || new Date().toLocaleString()}</div>
            <button class="remove-comment-btn">Remove</button>
        `;
        
        // Add event listener for the remove button
        const removeButton = commentDiv.querySelector('.remove-comment-btn');
        if (removeButton) {
            removeButton.addEventListener('click', async function() {
                // If the comment has an ID, delete it from the server
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
                        // Still remove the comment from DOM even if server deletion fails
                    }
                }
                
                // Remove from DOM
                commentDiv.remove();
            });
        }
        
        commentsContainer.appendChild(commentDiv);
    }
    
    // Secure version of the function would be:
    /*
    function addCommentToDOM_Secure(commentObj) {
        const commentDiv = document.createElement('div');
        commentDiv.className = 'comment';
        
        const authorDiv = document.createElement('div');
        authorDiv.className = 'comment-author';
        authorDiv.textContent = commentObj.name;
        
        const textDiv = document.createElement('div');
        textDiv.className = 'comment-text';
        textDiv.textContent = commentObj.comment;
        
        const dateDiv = document.createElement('div');
        dateDiv.className = 'comment-date';
        dateDiv.textContent = commentObj.date;
        
        commentDiv.appendChild(authorDiv);
        commentDiv.appendChild(textDiv);
        commentDiv.appendChild(dateDiv);
        
        commentsContainer.appendChild(commentDiv);
    }
    */
});