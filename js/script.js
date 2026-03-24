document.addEventListener('DOMContentLoaded', () => {
    console.log("Modern Dashboard Initialized successfully! 🚀");

    // Navigation Interactivity
    const navItems = document.querySelectorAll('.sidebar-nav li');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // Add active class to clicked item
            item.classList.add('active');
        });
    });

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

            // Save data to Supabase table 'tickets'
            const { data, error } = await supabaseClient
                .from('tickets')
                .insert([
                    { name: name, mobile: mobile, issue: issue }
                ]);

            if (error) throw error;

            console.log("New Entry Saved Successfully:", data);
            
            // Show success alert
            alert(`Success! Entry saved safely to Supabase for ${name}.`);
            
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
