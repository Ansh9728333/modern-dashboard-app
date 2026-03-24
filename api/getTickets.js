import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL_ENV;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Missing Authorization header' });

    const token = authHeader.split(' ')[1];
    
    if (!supabaseUrl || !supabaseServiceKey) return res.status(500).json({ error: 'Server misconfiguration: Missing Keys' });

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    try {
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (authError || !user) throw new Error('Invalid token');

        // Check if Admin
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profileError || profile?.role !== 'admin') {
            throw new Error('Unauthorized Access. You must be an administrator to view tickets.');
        }

        // Fetch securely bypassing blocked RLS using Service Role
        const { data: tickets, error: getError } = await supabaseAdmin
            .from('tickets')
            .select('*')
            .order('created_at', { ascending: false });

        if (getError) throw getError;

        return res.status(200).json({ success: true, data: tickets });
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
}
