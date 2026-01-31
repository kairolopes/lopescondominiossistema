import axios from 'axios';

const test = async () => {
    try {
        await axios.post('http://localhost:3000/api/webhook/zapi', {
            phone: '5511999999999',
            text: 'Olá, quero 2 via de boleto',
            senderName: 'Teste User'
        });
        console.log('Webhook Test Sent');
    } catch (error) {
        console.error('Test Failed:', error);
    }
};

test();
