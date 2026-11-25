-- Remove duplicate signup triggers causing double inserts into profiles/user_roles
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;