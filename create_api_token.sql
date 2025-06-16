-- Create API token for AI assistant integration
USE firefly_iii;

-- Create OAuth client for AI assistant
INSERT INTO oauth_clients (
    id, user_id, name, secret, provider, redirect, personal_access_client, 
    password_client, revoked, created_at, updated_at
) VALUES (
    1, NULL, 'AI Assistant Client', 'firefly-ai-secret', NULL, '', 1, 0, 0, NOW(), NOW()
);

-- Create personal access token
INSERT INTO oauth_access_tokens (
    id, user_id, client_id, name, scopes, revoked, created_at, updated_at, expires_at
) VALUES (
    'firefly-ai-assistant-token-2025', 1, 1, 'AI Assistant Token', '[]', 0, NOW(), NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR)
);

-- Show the token
SELECT 'API Token created' as status, 'firefly-ai-assistant-token-2025' as token;