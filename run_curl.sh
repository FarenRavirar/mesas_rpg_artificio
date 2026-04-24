#!/bin/bash
TOKEN=$(docker exec mesas-beta-api node -e "const jwt = require('jsonwebtoken'); console.log(jwt.sign({userId:'15f19890-625d-4b4c-8761-dc5f30e1cec9',role:'admin'}, process.env.JWT_SECRET, {expiresIn:'5m'}));")
curl -i -X POST 'https://mesasbeta.artificiorpg.com/api/v1/admin/sync/hydrate?dry_run=false' -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"
