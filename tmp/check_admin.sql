SELECT id, email, role::text FROM users WHERE role::text = 'admin' LIMIT 3;
