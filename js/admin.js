document.addEventListener('DOMContentLoaded', async () => {
    if (!window.location.pathname.includes('admin-dashboard')) return;

    const btnAddEmployee = document.getElementById('btnAddEmployee');
    const addEmployeeModal = document.getElementById('addEmployeeModal');
    const closeEmployeeModalBtn = document.getElementById('closeEmployeeModalBtn');
    const addEmployeeForm = document.getElementById('addEmployeeForm');
    const employeeTableBody = document.getElementById('employeeTableBody');
    const employeeError = document.getElementById('employeeError');

    // Modal Toggles
    if (btnAddEmployee) btnAddEmployee.addEventListener('click', () => addEmployeeModal.classList.add('active'));
    if (closeEmployeeModalBtn) closeEmployeeModalBtn.addEventListener('click', () => {
        addEmployeeModal.classList.remove('active');
        addEmployeeForm.reset();
        employeeError.style.display = 'none';
    });

    // Fetch JWT Token to securely communicate with our Vercel API
    const getAuthToken = async () => {
        const { data: { session } } = await supabaseClient.auth.getSession();
        return session?.access_token;
    };

    // Load Users
    const loadUsers = async () => {
        const { data: profiles, error } = await supabaseClient.from('profiles').select('*').order('created_at', { ascending: false });
        
        if (error) {
            employeeTableBody.innerHTML = `<tr><td colspan="4" style="color: var(--danger); padding: 24px; text-align: center;">Failed to load users: ${error.message}</td></tr>`;
            return;
        }

        employeeTableBody.innerHTML = '';
        profiles.forEach(profile => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
            tr.style.transition = 'background 0.2s';
            tr.addEventListener('mouseenter', () => tr.style.background = 'rgba(255,255,255,0.02)');
            tr.addEventListener('mouseleave', () => tr.style.background = 'transparent');

            tr.innerHTML = `
                <td style="padding: 16px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, var(--primary) 0%, #818cf8 100%); display: flex; align-items: center; justify-content: center; font-weight: bold; color: white;">
                            ${profile.full_name ? profile.full_name[0].toUpperCase() : 'U'}
                        </div>
                        <span style="font-weight: 500;">${profile.full_name || 'Unknown'}</span>
                    </div>
                </td>
                <td style="padding: 16px; color: var(--text-muted);">${profile.email}</td>
                <td style="padding: 16px;">
                    <span style="background: ${profile.role === 'admin' ? 'rgba(99,102,241,0.1)' : 'rgba(16,185,129,0.1)'}; color: ${profile.role === 'admin' ? 'var(--primary)' : 'var(--success)'}; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                        ${profile.role === 'admin' ? '<i class="ph ph-shield-check" style="margin-right: 4px;"></i>' : '<i class="ph ph-user" style="margin-right: 4px;"></i>'}${profile.role}
                    </span>
                </td>
                <td style="padding: 16px; text-align: right;">
                    ${profile.role !== 'admin' ? `<button class="btn-delete" data-id="${profile.id}" style="background: rgba(239,68,68,0.1); color: var(--danger); border: 1px solid rgba(239,68,68,0.2); padding: 8px 16px; border-radius: 8px; cursor: pointer; transition: all 0.2s; font-weight: 500; display: inline-flex; align-items: center; gap: 6px;"><i class="ph ph-trash"></i> Remove</button>` : '<span style="color: var(--text-muted); font-size: 13px;">Owner</span>'}
                </td>
            `;
            employeeTableBody.appendChild(tr);
        });

        // Attach Delete Listeners
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if (!confirm("CRITICAL: Are you sure you want to permanently delete this employee account? This breaks their login access.")) return;
                const userId = e.currentTarget.getAttribute('data-id');
                const originalHtml = e.currentTarget.innerHTML;
                
                try {
                    e.currentTarget.innerHTML = '<i class="ph ph-spinner ph-spin"></i>';
                    e.currentTarget.disabled = true;
                    
                    const token = await getAuthToken();
                    const res = await fetch('/api/deleteUser', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ userIdTarget: userId })
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Failed to delete user serverside');
                    loadUsers();
                } catch (err) {
                    alert("Error deleting user: " + err.message);
                    e.currentTarget.innerHTML = originalHtml;
                    e.currentTarget.disabled = false;
                }
            });
        });
    };

    // Add User Form Submissions
    addEmployeeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        employeeError.style.display = 'none';

        const submitBtn = document.getElementById('submitEmployeeBtn');
        const originalText = submitBtn.textContent;
        submitBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Creating...';
        submitBtn.disabled = true;

        const fullName = document.getElementById('empName').value;
        const email = document.getElementById('empEmail').value;
        const password = document.getElementById('empPassword').value;

        try {
            const token = await getAuthToken();
            const res = await fetch('/api/createUser', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ email, password, fullName })
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.error || 'Failed to create user from API');
            }

            closeEmployeeModalBtn.click();
            loadUsers();
            
            // Give them a nice confirmation alert
            setTimeout(() => alert(`Success! Employee created for ${fullName}. They can now login with ${email}`), 300);
        } catch (err) {
            employeeError.textContent = err.message;
            employeeError.style.display = 'block';
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });

    // Initial Load execution
    loadUsers();
});
