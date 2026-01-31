const fs = require('fs');
const pdf = require('pdf-parse');

let dataBuffer = fs.readFileSync('Apresentação Comercial WL - Novembro 2025.pdf');

pdf(dataBuffer).then(function(data) {
    console.log(data.text);
}).catch(function(error) {
    console.error(error);
});
