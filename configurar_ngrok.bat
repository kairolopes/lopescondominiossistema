@echo off
echo ==============================================================================
echo                 CONFIGURACAO OBRIGATORIA DO NGROK
echo ==============================================================================
echo.
echo O sistema nao conseguiu criar um link publico automaticamente devido a bloqueios
echo de rede/firewall no seu computador.
echo.
echo Para resolver, precisamos configurar o NGROK com seu token GRATUITO.
echo.
echo 1. O navegador vai abrir no site do Ngrok.
echo 2. Faca login (ou crie conta com Google).
echo 3. Copie o "Authtoken" que aparece no painel.
echo.
pause
start https://dashboard.ngrok.com/get-started/your-authtoken
echo.
set /p NGROK_TOKEN="Cole o seu Authtoken aqui e aperte ENTER: "
echo.
echo Configurando...
call npx ngrok config add-authtoken %NGROK_TOKEN%
echo.
echo ==============================================================================
echo PRONTO! Agora vamos tentar iniciar o sistema novamente.
echo ==============================================================================
echo.
pause
call npm run start:public
pause