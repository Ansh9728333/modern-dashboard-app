document.addEventListener('DOMContentLoaded', async () => {
    // ======== AUTHENTICATION GUARD ========
    // Make sure we have a valid session before showing the dashboard
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    // If not logged in, immediately kick them to login screen
    if (!session) {
        window.location.href = 'index.html';
        return;
    }
    
    // Update the UI with their email prefix
    const userEmail = session.user.email;
    const userNameElement = document.querySelector('.user-info .name');
    if (userNameElement) {
        userNameElement.textContent = userEmail.split('@')[0];
    }

    // Role Guard Check
    const { data: profile } = await supabaseClient.from('profiles').select('role').eq('id', session.user.id).single();
    
    // If an employee tries to peek at the admin dashboard, kick them out
    if (window.location.pathname.includes('admin-dashboard') && profile?.role !== 'admin') {
        window.location.href = 'employee-dashboard.html';
        return;
    }
    // ======================================

    console.log("Modern Dashboard Initialized successfully! 🚀");

    // Navigation Interactivity
    const navItems = document.querySelectorAll('.sidebar-nav li');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // Handle Logout Button
    const btnLogout = document.querySelector('.btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            await supabaseClient.auth.signOut();
            window.location.href = 'index.html';
        });
    }



    // Modal & Form Interaction
    const modal = document.getElementById('entryModal');
    const btnOpenModal = document.getElementById('openModalBtn');
    const btnCloseModal = document.getElementById('closeModalBtn');
    const btnCancelModal = document.getElementById('cancelModalBtn');
    const entryForm = document.getElementById('entryForm');

    const openModal = () => modal.classList.add('active');
    const closeModal = () => {
        modal.classList.remove('active');
        entryForm.reset();
    };

    if (btnOpenModal) btnOpenModal.addEventListener('click', openModal);
    if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
    if (btnCancelModal) btnCancelModal.addEventListener('click', closeModal);

    // Close modal if clicked outside the container
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Handle Form Submission
    entryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Indicate loading state
        const submitBtn = entryForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = 'Saving...';
        submitBtn.disabled = true;
        
        try {
            // Get values
            const name = document.getElementById('userName').value;
            const mobile = document.getElementById('userMobile').value;
            const issue = document.getElementById('userIssue').value;

            // 9. Securely gather JWT Session token
            const { data: { session } } = await supabaseClient.auth.getSession();
            const token = session?.access_token;
            if (!token) throw new Error("401 Unauthorized: You are not logged in.");

            // 10. Call Admin-only POST endpoint securely
            const res = await fetch('/api/adminData', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name, mobile, issue })
            });

            const responseData = await res.json();

            // 7. Read clear API errors (401, 403, 422) directly from our backend
            if (!res.ok) {
                throw new Error(responseData.error || 'Unknown Server Error');
            }

            console.log("Secure Entry Passed Validation and Saved:", responseData.data);
            
            // Show success alert
            alert(`Success! Admin entry stored securely for ${name}.`);
            
            closeModal();
        } catch (error) {
            console.error('Error saving data:', error);
            alert(`Error saving entry: ${error.message} \n\nDid you forget to add your Supabase credentials in config.js?`);
        } finally {
            // Reset button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });

    // Interactive Hover on KPI Cards
    const kpiCards = document.querySelectorAll('.kpi-card');
    kpiCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            const icon = card.querySelector('.kpi-icon i');
            if(icon) {
                icon.style.transform = 'scale(1.1) rotate(5deg)';
                icon.style.transition = 'transform 0.3s ease';
            }
        });
        
        card.addEventListener('mouseleave', () => {
            const icon = card.querySelector('.kpi-icon i');
            if(icon) {
                icon.style.transform = 'scale(1) rotate(0deg)';
            }
        });
    });
});
