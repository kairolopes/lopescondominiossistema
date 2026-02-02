@echo off
set PATH=%PATH%;C:\Program Files\Git\cmd
echo ========================================================
echo   BAIXAR ATUALIZACOES DO GITHUB
echo ========================================================
echo.
echo Baixando mudancas...
git pull origin main
echo.
echo ========================================================
echo   ATUALIZACAO CONCLUIDA!
echo ========================================================
pause
