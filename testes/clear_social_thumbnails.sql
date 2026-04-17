UPDATE user_links 
SET metadata_status = 'stale', 
    thumbnail_url = NULL 
WHERE type IN ('instagram', 'facebook', 'twitter', 'tiktok') 
  AND thumbnail_url IS NOT NULL;
