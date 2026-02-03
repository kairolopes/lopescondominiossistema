@echo off
echo ==========================================
echo      RECONSTRUINDO DASHBOARD (FRONTEND)
echo ==========================================
echo.
cd dashboard
echo Instalando dependencias...
call npm install
echo.
echo Construindo versao de producao...
call npm run build
echo.
echo ==========================================
echo      SUCESSO! AGORA REINICIE O SERVIDOR
echo ==========================================
pause
