import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL_ENV;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Missing Authorization header' });

    const token = authHeader.split(' ')[1];
    
    if (!supabaseUrl || !supabaseServiceKey) {
        return res.status(500).json({ error: 'Server configuration error: Missing Supabase Environment Variables setup in Vercel' });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    try {
        // 1. Verify whoever is calling this API is actually authenticated
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (authError || !user) throw new Error('Invalid or expired authentication token');

        // 2. Check if calling user is an admin in profiles table
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profileError || profile?.role !== 'admin') {
            throw new Error('Unauthorized Access: You must be an Administrator to perform this action.');
        }

        // 3. Admin verified! Now create the new employee user
        const { email, password, fullName } = req.body;
        
        const { data: newAuthUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true // Force confirmation so they can instantly login
        });
        
        if (createUserError) throw createUserError;

        // 4. Create the profile for the new employee
        const { error: insertProfileError } = await supabaseAdmin
            .from('profiles')
            .insert({
                id: newAuthUser.user.id,
                email: email,
                full_name: fullName,
                role: 'employee'
            });

        if (insertProfileError) throw insertProfileError;

        return res.status(200).json({ success: true, message: 'Employee created successfully', user: newAuthUser.user });
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
}
