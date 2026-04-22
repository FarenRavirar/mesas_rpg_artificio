#!/usr/bin/env bash
# Fixit extension: fixit-common.sh
# Shared utilities for fixit scripts

# JSON escape function
json_escape() {
    local str="$1"
    str="${str//\\/\\\\}"
    str="${str//\"/\\\"}"
    str="${str//$'\n'/\\n}"
    str="${str//$'\r'/\\r}"
    str="${str//$'\t'/\\t}"
    echo "$str"
}

# Find project root
get_repo_root() {
    local dir="$PWD"
    while [ "$dir" != "/" ]; do
        if [ -d "$dir/.specify" ] || [ -d "$dir/.git" ]; then
            echo "$dir"
            return 0
        fi
        dir="$(dirname "$dir")"
    done
    return 1
}

# Check if git is available
has_git() {
    local repo_root="${1:-$PWD}"
    git -C "$repo_root" rev-parse --is-inside-work-tree >/dev/null 2>&1
}

# Load configuration from fixit-config.yml
load_config() {
    local config_file="$1"
    if [ ! -f "$config_file" ]; then
        return 1
    fi
    
    # Simple YAML parser for our config
    # This is a minimal implementation - for production use a proper YAML parser
    while IFS=': ' read -r key value; do
        # Skip comments and empty lines
        [[ "$key" =~ ^#.*$ ]] && continue
        [[ -z "$key" ]] && continue
        
        # Remove leading/trailing whitespace and quotes
        key=$(echo "$key" | xargs)
        value=$(echo "$value" | xargs | sed 's/^"//;s/"$//')
        
        # Export as environment variable
        export "FIXIT_${key^^}=$value"
    done < "$config_file"
}

# Print colored output
print_status() {
    local status="$1"
    local message="$2"
    
    case "$status" in
        success)
            echo "✅ $message"
            ;;
        error)
            echo "❌ $message" >&2
            ;;
        warning)
            echo "⚠️  $message" >&2
            ;;
        info)
            echo "ℹ️  $message"
            ;;
        *)
            echo "$message"
            ;;
    esac
}
