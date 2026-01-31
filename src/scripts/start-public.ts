import app from '../server';
import ngrok from 'ngrok';
import { config } from '../config/env';

(async () => {
    const port = config.port || 3000;
    app.listen(port, () => {
        console.log(`Local Server running on port ${port}`);
    });

    try {
        const url = await ngrok.connect(Number(port));
        console.log(`Public URL: ${url}`);
        console.log(`Webhook URL: ${url}/api/webhook/zapi`);
    } catch (error) {
        console.error('Ngrok Error:', error);
    }
})();
