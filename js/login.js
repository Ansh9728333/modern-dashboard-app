document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is already logged in, if so bypass login
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        const { data: profile } = await supabaseClient.from('profiles').select('role').eq('id', session.user.id).single();
        if (profile?.role === 'admin') {
            window.location.href = 'admin-dashboard.html';
        } else {
            window.location.href = 'employee-dashboard.html';
        }
        return;
    }

    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    const submitBtn = loginForm.querySelector('button[type="submit"]');

    // Handle Form Submission (Login Only)
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessage.style.display = 'none';
        
        const email = document.getElementById('userEmail').value;
        const password = document.getElementById('userPassword').value;
        
        const originalText = submitBtn.textContent;
        submitBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Processing...';
        submitBtn.disabled = true;

        try {
            // Sign In
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email,
                password
            });
            if (error) throw error;
            
            const { data: profile, error: profileErr } = await supabaseClient.from('profiles').select('role').eq('id', data.user.id).single();
            if (profileErr) throw new Error(`Database Error: ${profileErr.message}`);
            if (!profile) throw new Error("No profile found for this user in the database.");

            // Login successful, route based on role
            if (profile.role === 'admin') {
                window.location.href = 'admin-dashboard.html';
            } else {
                window.location.href = 'employee-dashboard.html';
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
