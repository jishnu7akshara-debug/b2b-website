@echo off
cd /d "%~dp0"
start "" http://localhost:5510
python -m http.server 5510
