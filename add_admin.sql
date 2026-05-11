UPDATE users SET hashed_password = '$2b$12$cM/sWgmRsPIBN9hITgOTve/ooSyZDBdrMBevr9okpulV7chG48zU6' WHERE username = 'admin';
SELECT username, role, is_active, left(hashed_password, 10) as hash_preview FROM users;
