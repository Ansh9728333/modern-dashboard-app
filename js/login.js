document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is already logged in, if so bypass login
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        window.location.href = 'index.html'; // Redirect to dashboard
        return;
    }

    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    const btnSignUp = document.getElementById('btnSignUp');
    const submitBtn = loginForm.querySelector('button[type="submit"]');

    let isLoginMode = true;

    // Toggle between Sign In and Sign Up
    btnSignUp.addEventListener('click', (e) => {
        e.preventDefault();
        isLoginMode = !isLoginMode;
        
        if (isLoginMode) {
            document.querySelector('.login-box h2').textContent = 'Welcome Back';
            document.querySelector('.login-box p').textContent = 'Enter your credentials to access the dashboard';
            submitBtn.textContent = 'Sign In';
            btnSignUp.textContent = 'Sign up';
            btnSignUp.previousElementSibling.textContent = "Don't have an account? ";
        } else {
            document.querySelector('.login-box h2').textContent = 'Create Account';
            document.querySelector('.login-box p').textContent = 'Sign up for a new dashboard account';
            submitBtn.textContent = 'Sign Up';
            btnSignUp.textContent = 'Log in';
            btnSignUp.previousElementSibling.textContent = "Already have an account? ";
        }
        errorMessage.style.display = 'none';
    });

    // Handle Form Submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessage.style.display = 'none';
        
        const email = document.getElementById('userEmail').value;
        const password = document.getElementById('userPassword').value;
        
        const originalText = submitBtn.textContent;
        submitBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Processing...';
        submitBtn.disabled = true;

        try {
            if (isLoginMode) {
                // Sign In
                const { data, error } = await supabaseClient.auth.signInWithPassword({
                    email,
                    password
                });
                if (error) throw error;
                
                // Login successful, redirect to dashboard
                window.location.href = 'index.html';
                
            } else {
                // Sign Up
                const { data, error } = await supabaseClient.auth.signUp({
                    email,
                    password
                });
                if (error) throw error;
                
                alert("Sign up successful! You can now sign in with your credentials.");
                
                // Switch back to login mode
                btnSignUp.click();
            }
        } catch (error) {
            errorMessage.textContent = error.message;
            errorMessage.style.display = 'block';
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
});
