# app.py at repo root
import subprocess
import sys
import os
from pathlib import Path

ROOT = Path(__file__).parent

if __name__ == "__main__":
    env = os.environ.copy()

    # 1) Start backend using python -m uvicorn so it works inside venv
    subprocess.Popen(
        [
            sys.executable,
            "-m",
            "uvicorn",
            "main:app",
            "--host",
            "0.0.0.0",
            "--port",
            "8000",
        ],
        cwd=str(ROOT / "backend"),
        env=env,
    )

    # 2) Start frontend dev server (assumes Node + npm on PATH)
    subprocess.Popen(
        ["npm", "install"],
        cwd=str(ROOT / "frontend"),
        env=env,
        shell=True,  # helps on Windows
    ).wait()

    subprocess.call(
        ["npm", "run", "dev"],
        cwd=str(ROOT / "frontend"),
        env=env,
        shell=True,
    )
