
const ftp = require("basic-ftp");
const path = require("path");

// ===============================================================
// DADOS DA LOCAWEB (CONFIGURADOS)
// ===============================================================
const CONFIG = {
    // TENTATIVA 2: Usar IP direto se o DNS falhar ou host alternativo
    host: "191.252.83.234", 
    user: "lopescondominios1",
    password: "Bate123ria@555",
    
    // Caminho para a pasta 'sistema' dentro do site público
    remoteRoot: "/public_html/sistema" 
};
// ===============================================================

async function deploy() {
    const client = new ftp.Client();
    client.ftp.verbose = true;

    try {
        console.log("🔌 Conectando ao FTP da Locaweb...");
        await client.access({
            host: CONFIG.host,
            user: CONFIG.user,
            password: CONFIG.password,
            secure: false
        });

        console.log(`📂 Criando/Verificando pasta remota: ${CONFIG.remoteRoot}...`);
        await client.ensureDir(CONFIG.remoteRoot);
        
        console.log("🧹 Limpando arquivos antigos da pasta sistema...");
        await client.clearWorkingDir();

        console.log("🚀 Enviando novos arquivos do Dashboard...");
        // Envia o conteúdo da pasta 'dist' (o build do React)
        await client.uploadFromDir(path.join(__dirname, "dashboard/dist"));

        console.log("\n==================================================");
        console.log("✅ SUCESSO! O Painel foi enviado para a Locaweb.");
        console.log("🔗 Acesse em: http://www.lopescondominios.com.br/sistema");
        console.log("==================================================\n");

    } catch (err) {
        console.log("❌ ERRO NO UPLOAD:", err);
        if (err.code === 550) {
            console.log("Dica: Verifique se a pasta 'public_html' existe. Talvez o caminho seja apenas '/sistema' ou 'www/sistema'.");
        }
    }
    client.close();
}

deploy();
