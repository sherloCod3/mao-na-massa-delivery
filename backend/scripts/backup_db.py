#!/usr/bin/env python3
"""
Backup do banco SQLite do Mão na Massa.

Uso:
    python scripts/backup_db.py                          # backup com timestamp
    python scripts/backup_db.py --output /backups/db.sqlite  # destino específico
    python scripts/backup_db.py --gzip                    # compactar com gzip
    python scripts/backup_db.py --keep 7                  # manter apenas os 7 mais recentes

Recomendação para Railway:
    Agende via cron ou GitHub Actions para rodar periodicamente.
    Ou configure backups automáticos do Railway Volume.
"""

import argparse
import gzip
import shutil
import sqlite3
import sys
import tempfile
from datetime import datetime
from pathlib import Path


def _find_db_file() -> Path | None:
    """Tenta localizar o arquivo do banco SQLite."""
    import os

    candidates = [
        Path("mao-na-massa.db"),
        Path.home() / ".local/share/mao-na-massa.db",
        Path("/data/mao-na-massa.db"),  # Railway volume mount
    ]

    # Também verifica variável de ambiente
    db_url = os.getenv("DATABASE_URL", "")
    if db_url.startswith("sqlite+aiosqlite:///"):
        path_str = db_url[len("sqlite+aiosqlite:///") :]
        candidates.insert(0, Path(path_str))

    for p in candidates:
        if p.exists() and p.is_file():
            return p.resolve()
    return None


def _backup(
    source: Path,
    output: Path | None,
    use_gzip: bool,
    keep: int,
) -> Path:
    """Executa o backup via SQLite online backup API (consistente mesmo em uso)."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    stem = source.stem  # "mao-na-massa"
    suffix = ".gz" if use_gzip else ""

    if output:
        dest = output
        # Se output não tem extensão, adiciona conforme modo
        if not dest.suffix:
            dest = dest.with_suffix(f".db{suffix}")
    else:
        dest = source.parent / f"{stem}_backup_{timestamp}.db{suffix}"

    print(f"🔹 Origem:  {source}")
    print(f"🔸 Destino: {dest}")
    print(f"🔹 Compactação: {'gzip' if use_gzip else 'nenhuma'}")

    # SQLite online backup — cópia consistente mesmo com escrita concorrente
    src_conn = sqlite3.connect(str(source))
    try:
        # Força checkpoint WAL antes do backup
        src_conn.execute("PRAGMA wal_checkpoint(FULL)")

        if use_gzip:
            # Backup para arquivo temporário → compacta com gzip → move para destino
            with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
                tmp_path = Path(tmp.name)

            try:
                backup_conn = sqlite3.connect(str(tmp_path))
                src_conn.backup(backup_conn, pages=1024)
                backup_conn.close()

                # Compacta o arquivo temporário
                with open(tmp_path, "rb") as f_in:
                    with gzip.open(str(dest), "wb") as f_out:
                        shutil.copyfileobj(f_in, f_out)
            finally:
                # Remove o arquivo temporário
                if tmp_path.exists():
                    tmp_path.unlink()
        else:
            backup_conn = sqlite3.connect(str(dest))
            src_conn.backup(backup_conn, pages=1024)
            backup_conn.close()
    finally:
        src_conn.close()

    size_mb = dest.stat().st_size / (1024 * 1024)
    print(f"✅ Backup concluído: {size_mb:.1f} MB")

    # Limpeza de backups antigos
    if keep > 0:
        pattern = f"{stem}_backup_*.db*"
        backups = sorted(source.parent.glob(pattern))
        while len(backups) > keep:
            old = backups.pop(0)
            old.unlink()
            print(f"🗑️  Removido backup antigo: {old.name}")

    return dest


def main():
    parser = argparse.ArgumentParser(description="Backup do banco SQLite do Mão na Massa")
    parser.add_argument("--output", "-o", type=Path, help="Caminho do arquivo de destino")
    parser.add_argument("--gzip", "-z", action="store_true", help="Compactar com gzip")
    parser.add_argument(
        "--keep",
        "-k",
        type=int,
        default=7,
        help="Manter apenas N backups mais recentes (0 = manter todos)",
    )
    args = parser.parse_args()

    source = _find_db_file()
    if not source:
        print("❌ Arquivo do banco SQLite não encontrado.", file=sys.stderr)
        print(
            "   Verifique se DATABASE_URL está configurada ou o arquivo .db existe.",
            file=sys.stderr,
        )
        sys.exit(1)

    _backup(source, args.output, args.gzip, args.keep)


if __name__ == "__main__":
    main()
