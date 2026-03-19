UPDATE auth.users SET 
  encrypted_password = crypt('admin9020secure!', gen_salt('bf')),
  email_confirmed_at = now()
WHERE email = 'admin@school.local';