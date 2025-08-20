#!/usr/bin/env python3
import argparse
import os
import sys
from pathlib import Path

def list_py_files(root: Path):
    for p in root.rglob('*.py'):
        # skip __pycache__ and virtual envs
        if any(part == '__pycache__' for part in p.parts):
            continue
        if any(part.startswith('.') for part in p.parts):
            # allow .github, etc., but keep it simple: skip hidden dirs
            continue
        yield p

def file_contains_nulls(path: Path) -> bool:
    try:
        with path.open('rb') as f:
            chunk = f.read()
            return b'\x00' in chunk
    except Exception as e:
        print(f"WARN: Could not read {path}: {e}", file=sys.stderr)
        return False


def strip_nulls(path: Path, dry_run: bool=False, make_backup: bool=True) -> bool:
    """Return True if file was modified."""
    try:
        data = path.read_bytes()
    except Exception as e:
        print(f"WARN: Skipping {path}: {e}", file=sys.stderr)
        return False
    if b'\x00' not in data:
        return False
    new_data = data.replace(b'\x00', b'')
    if dry_run:
        print(f"DRY-RUN: Would strip {len(data) - len(new_data)} null bytes from {path}")
        return False
    # Write atomically
    tmp_path = path.with_suffix(path.suffix + '.tmp')
    if make_backup:
        backup_path = path.with_suffix(path.suffix + '.bak')
        try:
            if backup_path.exists():
                backup_path.unlink()
            backup_path.write_bytes(data)
        except Exception as e:
            print(f"WARN: Could not create backup for {path}: {e}", file=sys.stderr)
    tmp_path.write_bytes(new_data)
    tmp_path.replace(path)
    print(f"Fixed: {path} (removed {len(data) - len(new_data)} null bytes)")
    return True


def main():
    ap = argparse.ArgumentParser(description='Strip null bytes from Python source files.')
    ap.add_argument('paths', nargs='*', default=['.'], help='Paths to scan (default: current directory)')
    ap.add_argument('--dry-run', action='store_true', help='Only report files that would be changed')
    ap.add_argument('--no-backup', action='store_true', help='Do not create .bak backups before writing')
    args = ap.parse_args()

    total = 0
    modified = 0
    for root in args.paths:
        root_path = Path(root)
        if root_path.is_file() and root_path.suffix == '.py':
            candidates = [root_path]
        else:
            candidates = list_py_files(root_path)
        for p in candidates:
            if file_contains_nulls(p):
                total += 1
                if strip_nulls(p, dry_run=args.dry_run, make_backup=not args.no_backup):
                    modified += 1
    print(f"Checked: {total} file(s) with nulls detected; Modified: {modified}")
    return 0

if __name__ == '__main__':
    raise SystemExit(main())

