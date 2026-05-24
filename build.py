#!/usr/bin/env python3
"""Build script: compila back-end e front-end, empacota tudo e envia para AlwaysData via SCP."""

import shutil
import subprocess
import sys
import zipfile
from pathlib import Path

BACK_DIR = Path(__file__).parent.resolve()
FRONT_DIR = BACK_DIR.parent / "podologa-sistema-front"
CLIENT_DIR = BACK_DIR / "dist" / "client"
DEPLOY_ZIP = BACK_DIR / "deploy.zip"
DEPLOY_SH = BACK_DIR / "deploy.sh"

SSH_USER = "podologia-anapaula"

# conteudo do script que sera executado no servidor apos o upload
DEPLOY_SCRIPT = """\
#!/bin/bash
set -euo pipefail

DEPLOY_DIR="$HOME/www"
ZIP="deploy.zip"

echo "============================================"
echo " Deploy - Podologa Sistema"
echo "============================================"
echo ""

cd "$DEPLOY_DIR"

if [ ! -f "$ZIP" ]; then
    echo "ERRO: $ZIP nao encontrado em $DEPLOY_DIR"
    exit 1
fi

echo "[1/3] Removendo arquivos anteriores..."
rm -rf dist node_modules package.json package-lock.json .env

echo "[2/3] Desempacotando $ZIP..."
unzip -q -o "$ZIP"
rm -f "$ZIP"

echo "[3/3] Verificando estrutura..."
for item in dist node_modules package.json .env; do
    if [ -e "$item" ]; then
        echo "  OK: $item"
    else
        echo "  AVISO: $item nao encontrado"
    fi
done

echo ""
echo "============================================"
echo " Deploy concluido!"
echo " Reinicie o app no painel do AlwaysData."
echo "============================================"
"""


def run(cmd: list[str], cwd: Path) -> None:
    print(f"\n$ {' '.join(cmd)}  (em {cwd})")
    result = subprocess.run(cmd, cwd=cwd)
    if result.returncode != 0:
        print(f"\nERRO ao executar: {' '.join(cmd)}")
        sys.exit(result.returncode)


def add_dir_to_zip(zf: zipfile.ZipFile, src: Path, arcname: str) -> None:
    for file in src.rglob("*"):
        if file.is_file():
            zf.write(file, arcname + "/" + file.relative_to(src).as_posix())


def ask_deploy_target() -> str:
    print()
    print("── Deploy ──────────────────────────────────────────────")
    host = input("  Host SSH  (ex: ssh-podologia-anapaula.alwaysdata.net): ").strip()
    if not host:
        print("ERRO: host SSH obrigatorio.")
        sys.exit(1)
    return f"{SSH_USER}@{host}"


def generate_deploy_script() -> None:
    DEPLOY_SH.write_text(DEPLOY_SCRIPT)
    DEPLOY_SH.chmod(0o755)
    print(f"OK: script de deploy gerado em {DEPLOY_SH}")


def package() -> None:
    print("=" * 60)
    print("4/5  Empacotando para deploy...")
    print("=" * 60)

    env_file = BACK_DIR / ".env"
    if not env_file.exists():
        print("ERRO: .env nao encontrado. Configure o .env de producao antes de empacotar.")
        sys.exit(1)

    if DEPLOY_ZIP.exists():
        DEPLOY_ZIP.unlink()

    print("  Adicionando dist/ ...")
    with zipfile.ZipFile(DEPLOY_ZIP, "w", zipfile.ZIP_DEFLATED) as zf:
        add_dir_to_zip(zf, BACK_DIR / "dist", "dist")

        print("  Adicionando node_modules/ (pode demorar)...")
        add_dir_to_zip(zf, BACK_DIR / "node_modules", "node_modules")

        print("  Adicionando package.json, package-lock.json e .env...")
        for rel in ["package.json", "package-lock.json", ".env"]:
            src = BACK_DIR / rel
            if src.exists():
                zf.write(src, rel)
            else:
                print(f"  Aviso: {rel} nao encontrado, pulando.")

    size_mb = DEPLOY_ZIP.stat().st_size / 1_048_576
    print(f"OK: pacote gerado  {DEPLOY_ZIP.name}  ({size_mb:.1f} MB)")

    generate_deploy_script()


def send(ssh_host: str) -> None:
    print("=" * 60)
    print("5/5  Enviando via SCP...")
    print("=" * 60)

    remote = f"{ssh_host}:~/www/"

    for local_file in [DEPLOY_ZIP, DEPLOY_SH]:
        cmd = ["scp", str(local_file), remote]
        print(f"$ {' '.join(cmd)}")
        result = subprocess.run(cmd)
        if result.returncode != 0:
            print(f"\nERRO: falha ao enviar {local_file.name} para {remote}.")
            print("  Verifique conexao, chave SSH e permissoes em ~/www/.")
            sys.exit(result.returncode)
        print(f"OK: {local_file.name} enviado.")

    print()
    print("Para finalizar o deploy, execute no servidor:")
    print(f"  ssh {ssh_host}")
    print("  cd ~/www && bash deploy.sh")


def main() -> None:
    ssh_host = ask_deploy_target()

    print("=" * 60)
    print("1/5  Build do back-end...")
    print("=" * 60)
    run(["npm", "run", "build"], cwd=BACK_DIR)

    print("=" * 60)
    print("2/5  Build do front-end...")
    print("=" * 60)
    run(["npm", "run", "build"], cwd=FRONT_DIR)

    print("=" * 60)
    print("3/5  Copiando front-end para dist/client/...")
    print("=" * 60)
    front_dist = FRONT_DIR / "dist"
    if not front_dist.exists():
        print(f"ERRO: dist do front-end nao encontrado: {front_dist}")
        sys.exit(1)
    if CLIENT_DIR.exists():
        shutil.rmtree(CLIENT_DIR)
    shutil.copytree(front_dist, CLIENT_DIR)
    print(f"OK: front-end copiado para {CLIENT_DIR}")

    package()
    send(ssh_host)

    print("\n" + "=" * 60)
    print("Deploy concluido com sucesso!")
    print(f"  {ssh_host}:~/www/deploy.zip")
    print(f"  {ssh_host}:~/www/deploy.sh")
    print("=" * 60)


if __name__ == "__main__":
    main()
