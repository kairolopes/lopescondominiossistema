@echo off
set PATH=%PATH%;C:\Program Files\Git\cmd
echo ========================================================
echo   ATUALIZAR GITHUB E RENDER
echo ========================================================
echo.
echo Adicionando alteracoes...
git add .

echo.
echo Salvando versao unificada (Site + Robo)...
git commit -m "Unificando Backend e Frontend para Render"

echo.
echo Enviando para o GitHub...
git push origin main

echo.
echo ========================================================
echo   SUCESSO!
echo   O Render vai detectar a mudanca e fazer o deploy.
echo   Seu sistema estara acessivel em um unico link!
echo ========================================================
pause
