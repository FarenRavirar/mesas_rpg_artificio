#!/usr/bin/env python3
"""
Script para aplicar migrações no banco beta via SSH
"""
import paramiko
import sys
from pathlib import Path

# Configurações
SSH_HOST = "137.131.250.231"
SSH_USER = "ubuntu"
SSH_KEY_PATH = "ssh-key-2026-03-07privada.key"
DB_USER = "admin"
DB_NAME = "mesas_rpg"
CONTAINER_NAME = "mesas-beta-db"

def read_migration_file():
    """Lê o arquivo de migração"""
    migration_path = Path(__file__).parent.parent / "database" / "apply_migrations_06_07.sql"
    with open(migration_path, 'r', encoding='utf-8') as f:
        return f.read()

def apply_migrations():
    """Aplica as migrações via SSH"""
    print("🔄 Conectando ao servidor via SSH...")
    
    # Criar cliente SSH
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        # Conectar usando chave privada
        key_path = Path(__file__).parent.parent / SSH_KEY_PATH
        private_key = paramiko.RSAKey.from_private_key_file(str(key_path))
        
        ssh.connect(
            hostname=SSH_HOST,
            username=SSH_USER,
            pkey=private_key,
            timeout=30
        )
        
        print("✅ Conexão SSH estabelecida!")
        
        # Ler arquivo de migração
        print("📄 Lendo arquivo de migração...")
        migration_sql = read_migration_file()
        print(f"📏 Tamanho: {len(migration_sql)} bytes")
        
        # Aplicar migrações via docker exec
        print("🔄 Aplicando migrações no banco de dados...")
        
        # Comando para executar SQL via docker
        cmd = f"cd /opt/mesas-beta && docker exec -i {CONTAINER_NAME} psql -U {DB_USER} -d {DB_NAME}"
        
        # Executar comando com stdin
        stdin, stdout, stderr = ssh.exec_command(cmd)
        
        # Enviar SQL via stdin
        stdin.write(migration_sql)
        stdin.channel.shutdown_write()
        
        # Ler output
        output = stdout.read().decode('utf-8')
        errors = stderr.read().decode('utf-8')
        
        if errors and 'ERROR' in errors:
            print("❌ Erro ao aplicar migrações:")
            print(errors)
            return False
        
        print("✅ Migrações aplicadas com sucesso!")
        print("\n📊 Output:")
        print(output)
        
        # Verificar tabelas criadas
        print("\n🔍 Verificando tabelas criadas...")
        verify_cmd = f"docker exec {CONTAINER_NAME} psql -U {DB_USER} -d {DB_NAME} -c \"SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('system_suggestions', 'notifications') ORDER BY table_name;\""
        
        stdin, stdout, stderr = ssh.exec_command(f"cd /opt/mesas-beta && {verify_cmd}")
        verify_output = stdout.read().decode('utf-8')
        
        print(verify_output)
        
        return True
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        import traceback
        traceback.print_exc()
        return False
        
    finally:
        ssh.close()
        print("\n🔌 Conexão SSH fechada")

if __name__ == "__main__":
    print("=" * 60)
    print("Aplicação de Migrações - Beta Environment")
    print("=" * 60)
    print()
    
    success = apply_migrations()
    
    if success:
        print("\n✅ Processo concluído com sucesso!")
        sys.exit(0)
    else:
        print("\n❌ Processo falhou!")
        sys.exit(1)
