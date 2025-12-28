import fetch from 'node-fetch';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testNFUpload() {
  try {
    console.log('Testando upload da NF-e...\n');

    // Ler o arquivo NF-e
    const nfePath = path.join(__dirname, 'XML', 'Nfe001000057390.xml');
    const fileBuffer = fs.readFileSync(nfePath);

    // Criar FormData
    const formData = new FormData();
    formData.append('file', fileBuffer, {
      filename: 'Nfe001000057390.xml',
      contentType: 'text/xml'
    });

    // Fazer upload para preview
    console.log('Enviando para /api/import/xml/preview...');
    const response = await fetch('http://localhost:3000/api/import/xml/preview', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Preview bem-sucedido!');
      console.log('Tipo detectado:', result.xmlType);
      console.log('Total de itens:', result.totalItems);
      console.log('Itens:');
      result.previewItems.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.name} (Qtd: ${item.quantity}, Preço: R$ ${item.salePrice})`);
        console.log(`     Código: ${item.internalCode}, Barra: ${item.barcode}`);
        if (item.existing) {
          console.log(`     Status: Já existe no banco`);
        } else {
          console.log(`     Status: Novo produto`);
        }
      });
    } else {
      console.log('❌ Erro na preview:', result.error);
      if (result.supportedFormats) {
        console.log('Formatos suportados:', result.supportedFormats);
      }
    }

  } catch (error) {
    console.error('Erro no teste:', error.message);
  }
}

testNFUpload();