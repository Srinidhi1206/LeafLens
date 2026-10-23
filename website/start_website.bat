@echo off
rem Starts the LeafLens website (Flask backend + built React frontend) on http://127.0.0.1:5000
rem Uses website\backend\.venv if it exists, otherwise the "python" on PATH.
cd /d "%~dp0backend"
set "VENV_PY=%~dp0backend\.venv\Scripts\python.exe"
if not exist "%VENV_PY%" set "VENV_PY=python"
echo Open http://127.0.0.1:5000 in your browser once the model has loaded.
"%VENV_PY%" app.py
pause
