#!/usr/bin/env bash
set -euo pipefail

parse_header() {
  local filepath="$1"
  local class=""
  local req_backup=""
  local author=""
  local created=""
  local desc=""

  if [ ! -f "$filepath" ]; then
    echo "::error::Arquivo $filepath nao existe"
    return 1
  fi

  while IFS= read -r line; do
    if [[ "$line" =~ --[[:space:]]*@class:[[:space:]]*(online-safe|manual-risk)$ ]]; then
      class="${BASH_REMATCH[1]}"
    elif [[ "$line" =~ --[[:space:]]*@requires-backup:[[:space:]]*(true|false)$ ]]; then
      req_backup="${BASH_REMATCH[1]}"
    elif [[ "$line" =~ --[[:space:]]*@author:[[:space:]]*(.+)$ ]]; then
      author="${BASH_REMATCH[1]}"
    elif [[ "$line" =~ --[[:space:]]*@created:[[:space:]]*(.+)$ ]]; then
      created="${BASH_REMATCH[1]}"
    elif [[ "$line" =~ --[[:space:]]*@description:[[:space:]]*(.+)$ ]]; then
      desc="${BASH_REMATCH[1]}"
    fi
  done < <(head -n 20 "$filepath")

  if [ -z "$class" ] || [ -z "$req_backup" ] || [ -z "$author" ] || [ -z "$created" ] || [ -z "$desc" ]; then
    echo "::error::$filepath falhou na validacao de campos do cabecalho."
    return 1
  fi

  if [ "$req_backup" = "true" ] && [ "$class" = "online-safe" ]; then
    echo "::error::$filepath: Incoerencia. requires-backup=true exige class=manual-risk"
    return 1
  fi

  echo "CLASS=$class"
  echo "REQUIRES_BACKUP=$req_backup"
  return 0
}

validate_sql_against_class() {
  local filepath="$1"
  local class="$2"

  if [ "$class" != "online-safe" ]; then
    return 0
  fi

  # remove comentarios e busca por palavras proibidas
  if sed -e 's/--.*//' -e 's/\/\*.*\*\///g' "$filepath" | grep -Eiq '\b(DROP|TRUNCATE|DELETE\s+FROM)\b'; then
    echo "::error::$filepath esta marcada como online-safe mas contem instrucoes destrutivas."
    return 1
  fi

  return 0
}

list_pending_by_set_diff() {
  local compose="$1"
  local dbservice="$2"

  # local is only disk
  local in_disk
  in_disk=$(find ./database -maxdepth 1 -name "migration_*.sql" -exec basename {} \; | sort)

  local in_db
  in_db=$(docker compose -f "$compose" exec -T "$dbservice" psql -U admin -d mesas_rpg -tAc "SELECT migration_name FROM schema_migrations ORDER BY migration_name" 2>/dev/null || echo "")

  local fail_i2=0
  local to_apply=()

  # Check what's in db but not in disk
  for db_mig in $in_db; do
    if ! echo "$in_disk" | grep -Fxq "$db_mig"; then
      echo "::error::Drift I2 detectado. $db_mig existe no banco mas nao no disco (branch local defasada)."
      fail_i2=1
    fi
  done

  if [ "$fail_i2" -eq 1 ]; then
    return 1
  fi

  for file in $in_disk; do
    if ! echo "$in_db" | grep -Fxq "$file"; then
      to_apply+=("$file")
    fi
  done

  if [ ${#to_apply[@]} -gt 0 ]; then
    printf "%s\n" "${to_apply[@]}"
  fi
  return 0
}

acquire_lock() {
  local compose="$1"
  local dbservice="$2"
  local pg_opts="$3"
  
  local max_retries=60
  local retry=0
  
  echo "[migrations] Tentando adquirir pg_advisory_lock..."
  
  while [ $retry -lt $max_retries ]; do
    local locked
    locked=$(docker compose -f "$compose" exec -T -e PGOPTIONS="$pg_opts" "$dbservice" psql -U admin -d mesas_rpg -tAc "SELECT pg_try_advisory_lock(918273645);" 2>/dev/null || echo "f")
    
    if [ "$locked" = "t" ]; then
      echo "[migrations] pg_advisory_lock adquirido com sucesso."
      return 0
    fi
    
    if [ $retry -eq 30 ]; then
      echo "[migrations] WARNING: Lock rodando a mais de 30s. Possivel execucao presa. Avalie seletivamente SELECT pg_advisory_unlock(918273645)."
    fi
    
    sleep 1
    retry=$((retry + 1))
  done
  
  echo "::error::pg_advisory_lock falhou apos timeout de 60s."
  return 1
}

release_lock() {
  local compose="$1"
  local dbservice="$2"
  local pg_opts="$3"
  
  echo "[migrations] Liberando pg_advisory_lock..."
  docker compose -f "$compose" exec -T -e PGOPTIONS="$pg_opts" "$dbservice" psql -U admin -d mesas_rpg -tAc "SELECT pg_advisory_unlock(918273645);" > /dev/null 2>&1 || true
  return 0
}
