INSERT INTO aggregator_sources (name, platform, server_id, channel_id, allow_paid, publish_mode, notes)
VALUES (
  'Imperio RPG - Campanhas',
  'discord',
  '1012065638556119050',
  '1012065641282404481',
  true,
  'manual_review',
  'Canal de campanhas do servidor Imperio RPG - export_exemple.json'
)
ON CONFLICT (platform, server_id, channel_id) DO NOTHING
RETURNING id, name;
