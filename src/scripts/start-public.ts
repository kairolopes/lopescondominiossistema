
import ngrok from 'ngrok';
import localtunnel from 'localtunnel';
import app from '../server';
import { spawn } from 'child_process';

import { config } from '../config/env';

async function startPublic() {
    const port = Number(config.port) || 3006; 

    // Start Server
    const server = app.listen(port, () => {
        console.log(`🚀 Server running locally on port ${port}`);
        console.log('Campaign Engine started.');
    });

    // 1. Tenta Ngrok
    try {
        console.log('🔄 Tentando Ngrok...');
        await ngrok.kill(); 
        const url = await ngrok.connect({ addr: port });
        printSuccess('Ngrok', url);
        return;
    } catch (e) {
        console.log('⚠️ Ngrok falhou (provavelmente sem token).');
    }

    // 2. Tenta LocalTunnel (Programático)
    try {
        console.log('🔄 Tentando LocalTunnel...');
        // Adiciona timeout de 10 segundos
        const tunnelPromise = localtunnel({ port: port });
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('LocalTunnel timeout')), 10000)
        );

        const tunnel: any = await Promise.race([tunnelPromise, timeoutPromise]);
        
        printSuccess('LocalTunnel', tunnel.url);
        
        tunnel.on('close', () => console.log('⚠️ LocalTunnel fechado'));
        // Mantém processo vivo se LT funcionar
        return;
    } catch (e) {
        console.log('⚠️ LocalTunnel falhou/travou ou demorou demais.');
    }

    // 3. Fallback: Serveo.net (SSH)
    console.log('🔄 Tentando Serveo.net (SSH)...');
    startSshTunnel('serveo.net', 80);

    // 4. Fallback: Pinggy.io
    setTimeout(() => {
         console.log('🔄 Tentando Pinggy.io...');
         startSshTunnel('a.pinggy.io', 443, true);
    }, 10000);

    // 5. Fallback: Localhost.run
    setTimeout(() => {
         console.log('🔄 Tentando Localhost.run...');
         startSshTunnel('localhost.run', 80);
    }, 20000);
}

function startSshTunnel(host: string, remotePort: number, secure = false) {
    const args = [
        '-o', 'StrictHostKeyChecking=no',
        '-o', 'ServerAliveInterval=60',
        '-o', 'BatchMode=yes', // Evita prompt de senha
        '-R', `80:localhost:${config.port || 3006}`, 
        host
    ];
    
    // Pinggy usa porta 443 e formato diferente as vezes, mas -R padrao funciona
    if (secure) {
        args.unshift('-p', '443');
        // Pinggy precisa de -R 0:localhost:port
        args[args.indexOf('-R') + 1] = `0:localhost:${config.port || 3006}`;
    }

    // Localhost.run usa porta padrao 22 se nao especificar, mas args estao ok
    // Para localhost.run, o user é 'nopass' as vezes, mas padrao funciona

    const ssh = spawn('ssh', args);
    
    ssh.stdout.on('data', (data) => {
        const str = data.toString();
        console.log(`[${host} STDOUT]: ${str}`); // Debug
        parseTunnelOutput(str, host);
    });
    ssh.stderr.on('data', (data) => {
        const str = data.toString();
        console.log(`[${host} STDERR]: ${str}`); // Debug
        parseTunnelOutput(str, host);
    });
}

function parseTunnelOutput(output: string, serviceName: string) {
    // Regex genérico para pegar URLs https
    const match = output.match(/https:\/\/[a-zA-Z0-9-.]+/);
    if (match) {
        printSuccess(serviceName, match[0]);
    }
}


import * as fs from 'fs';
import * as path from 'path';

function printSuccess(service: string, url: string) {
    const webhookUrl = `${url}/api/webhook/zapi`;
    const message = `
#############################################################
✅  SISTEMA ONLINE via ${service}!
#############################################################
PARA FUNCIONAR, COPIE O LINK ABAIXO E COLE NA Z-API:

👉  ${webhookUrl}

#############################################################
⚠️  NÃO FECHE A JANELA PRETA DO SERVIDOR!
#############################################################
`;

    console.log('\n\n' + message + '\n\n');

    // Salva em arquivo para facilitar
    try {
        fs.writeFileSync(path.join(process.cwd(), 'URL_DO_WEBHOOK.txt'), webhookUrl);
        console.log('✅ Link salvo no arquivo URL_DO_WEBHOOK.txt');
    } catch (e) {
        console.error('Erro ao salvar arquivo de URL:', e);
    }
}

startPublic();
