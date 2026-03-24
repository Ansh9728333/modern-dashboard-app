import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL_ENV;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: '405 Method Not Allowed' });
    }
    
    // 9. Protect routes with JWT/session authentication
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        // 7. Return clear API errors
        return res.status(401).json({ error: '401 Unauthorized: Access denied. No authentication token provided in headers.' });
    }

    const token = authHeader.split(' ')[1];
    
    if (!supabaseUrl || !supabaseServiceKey) {
        return res.status(500).json({ error: 'Server configuration error: Missing Secret Keys.' });
    }

    // Initialize Supabase correctly with the Service Role bypassing RLS securely on the server
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    try {
        // 10. Middleware-equivalent check: Verify JWT Token securely via Supabase Auth
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (authError || !user) {
            return res.status(401).json({ error: '401 Unauthorized: Invalid or expired token.' });
        }

        // 10. Middleware-equivalent check: Verify Admin Role
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profileError || profile?.role !== 'admin') {
            // 7. Provide 403 Forbidden: User is logged in but NOT an admin
            console.warn(`[SECURITY LOCKDOWN] User ${user.email} attempted unauthorized admin data entry into the tickets table.`);
            return res.status(403).json({ error: '403 Forbidden: Stop right there! Admin access is strictly required to submit data.' });
        }

        // 6. Validate all input before saving
        const { name, mobile, issue } = req.body;
        
        if (!name || typeof name !== 'string' || name.trim() === '') {
            return res.status(422).json({ error: '422 Validation error: Name is missing or invalid.' });
        }
        if (!mobile || typeof mobile !== 'string' || mobile.trim() === '') {
            return res.status(422).json({ error: '422 Validation error: Mobile is required.' });
        }
        if (!issue || typeof issue !== 'string' || issue.trim() === '') {
            return res.status(422).json({ error: '422 Validation error: Issue description is required.' });
        }

        // 2. Only authenticated admin users can add data! (Role was verified above).
        const { data: ticket, error: insertError } = await supabaseAdmin
            .from('tickets')
            .insert([{ name: name.trim(), mobile: mobile.trim(), issue: issue.trim() }])
            .select()
            .single();

        if (insertError) throw insertError;

        return res.status(201).json({ success: true, data: ticket });
    } catch (error) {
        return res.status(500).json({ error: '500 Internal Server Error: ' + error.message });
    }
}
