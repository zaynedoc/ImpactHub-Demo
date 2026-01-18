-- ============================================================================
-- Fix handle_new_user trigger to match updated subscriptions table schema
-- The subscriptions table has both 'plan' and 'status' columns for Stripe
-- ============================================================================

-- Updated function to create profile and related records when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create profile
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    
    -- Create default user settings
    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Create free subscription record
    -- Plan 'free', status 'inactive' means no paid subscription
    INSERT INTO public.subscriptions (user_id, plan, status)
    VALUES (NEW.id, 'free', 'inactive')
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Log the signup event
    INSERT INTO public.audit_logs (user_id, event_type, event_data)
    VALUES (
        NEW.id,
        'user_signup',
        jsonb_build_object(
            'email', NEW.email,
            'provider', NEW.raw_app_meta_data->>'provider'
        )
    );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail - at minimum create the profile
        RAISE WARNING 'handle_new_user partial failure for user %: %', NEW.id, SQLERRM;
        
        -- Try to at least create the profile if it doesn't exist
        INSERT INTO public.profiles (id, full_name, avatar_url)
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
            NEW.raw_user_meta_data->>'avatar_url'
        )
        ON CONFLICT (id) DO NOTHING;
        
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
