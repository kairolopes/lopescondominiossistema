
@echo off
echo ========================================================
echo   ENVIAR PROJETO PARA O GITHUB (PASSO A PASSO)
echo ========================================================
echo.
echo 1. Va no site github.com e crie um "New Repository".
echo 2. De um nome (ex: lopes-bot) e clique em "Create repository".
echo 3. Copie o link HTTPS do repositorio (ex: https://github.com/usuario/lopes-bot.git).
echo.
set /p REPO_URL="Cole o link HTTPS aqui e de ENTER: "

echo.
echo Configurando...
git remote add origin %REPO_URL%
git branch -M main
echo.
echo Enviando arquivos... (Uma janela de login vai abrir)
git push -u origin main

echo.
echo ========================================================
echo   SE TUDO DEU CERTO:
echo   Agora voce pode ir no Render.com e conectar esse repositorio!
echo ========================================================
pause
