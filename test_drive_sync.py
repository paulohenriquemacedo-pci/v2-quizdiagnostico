import sys
import os
from dotenv import load_dotenv

# Caminho absoluto para o backend
BACKEND_DIR = "d:/0 - SISTEMA ACADEMIA/_command_center/backend"
sys.path.append(BACKEND_DIR)
load_dotenv(os.path.join(BACKEND_DIR, ".env"))

import database
import drive_reader

def main():
    # Corrige a codificação de saída do console para UTF-8 no Windows
    if sys.platform == 'win32':
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

    print("=== TESTANDO INTEGRAÇÃO GOOGLE DRIVE ===")
    status = drive_reader.get_drive_status()
    print("Status do drive:")
    for k, v in status.items():
        print(f"  {k}: {v}")
        
    if not status["fully_configured"]:
        print("\n[ERRO] Google Drive não está totalmente configurado.")
        return
        
    print("\n[1/3] Listando arquivos no Google Drive...")
    try:
        files = drive_reader.list_drive_files()
        print(f"Sucesso! Encontrados {len(files)} arquivos no Google Drive.")
        for f in files[:5]:
            print(f"  - {f['name']} (Categoria: {f['category']}, Pasta: {f['folder_name']})")
        if len(files) > 5:
            print(f"  ... e mais {len(files) - 5} arquivos.")
    except Exception as e:
        print(f"[ERRO] Falha ao listar arquivos: {e}")
        return

    print("\n[2/3] Testando download e leitura do primeiro arquivo...")
    if files:
        test_file = files[0]
        try:
            content = drive_reader.read_file_content(test_file["id"], test_file["name"])
            print(f"Sucesso ao ler: '{test_file['name']}'")
            preview = content[:150].replace('\ufeff', '')
            print(f"Prévia do Conteúdo (150 chars):\n{preview}...")
        except Exception as e:
            print(f"[ERRO] Falha ao ler arquivo: {e}")
            return
            
    print("\n[3/3] Rodando sincronização síncrona com o banco SQLite...")
    try:
        database.init_db()
        database.ensure_knowledge_files_table()
        conn = database.get_connection()
        report = drive_reader.sync_drive_to_db(conn)
        print("\nSincronização Concluída!")
        print(f"  Sincronizados: {len(report.get('synced', []))} arquivos")
        print(f"  Sem alteração: {len(report.get('skipped', []))} arquivos")
        print(f"  Erros: {len(report.get('errors', []))} arquivos")
        if report.get("errors"):
            print("Detalhe dos erros:")
            for err in report["errors"]:
                print(f"    - {err['file']}: {err['error']}")
    except Exception as e:
        print(f"[ERRO] Falha ao sincronizar: {e}")

if __name__ == "__main__":
    main()
