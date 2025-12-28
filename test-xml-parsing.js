import { XMLParser } from 'fast-xml-parser';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

// Testar parsing dos arquivos XML
const xmlDir = path.join(__dirname, 'XML');

console.log('Testando parsing dos arquivos XML...\n');

const files = fs.readdirSync(xmlDir);
files.forEach(file => {
  if (file.endsWith('.xml') || file.endsWith('.ofx')) {
    console.log(`\n=== Testando arquivo: ${file} ===`);

    try {
      const filePath = path.join(xmlDir, file);
      const xmlContent = fs.readFileSync(filePath, 'utf-8');
      const parsed = parser.parse(xmlContent);

      // Detectar tipo
      if (parsed.nfeProc?.NFe?.infNFe?.det || parsed.NFe?.infNFe?.det) {
        console.log('✅ Tipo detectado: NF-e brasileiro');
        const infNFe = parsed.nfeProc?.NFe?.infNFe || parsed.NFe?.infNFe;
        const det = infNFe.det;
        const items = Array.isArray(det) ? det : [det];
        console.log(`📦 Itens encontrados: ${items.length}`);

        items.forEach((item, index) => {
          const prod = item.prod;
          console.log(`  Item ${index + 1}: ${prod.xProd} (Código: ${prod.cProd}, Quantidade: ${prod.qCom}, Preço: R$ ${prod.vProd})`);
        });

      } else if (parsed.PurchaseOrders?.PurchaseOrder) {
        console.log('✅ Tipo detectado: Purchase Orders');
        const purchaseOrders = Array.isArray(parsed.PurchaseOrders.PurchaseOrder)
          ? parsed.PurchaseOrders.PurchaseOrder
          : [parsed.PurchaseOrders.PurchaseOrder];

        let totalItems = 0;
        purchaseOrders.forEach(po => {
          if (po.Items?.Item) {
            const poItems = Array.isArray(po.Items.Item) ? po.Items.Item : [po.Items.Item];
            totalItems += poItems.length;
          }
        });
        console.log(`📦 Itens encontrados: ${totalItems}`);

      } else if (parsed.OFX?.BANKMSGSRSV1?.STMTTRNRS?.STMTRS?.BANKTRANLIST?.STMTTRN) {
        console.log('⚠️  Tipo detectado: OFX (extrato bancário) - NÃO SUPORTADO');
        const bankTranList = parsed.OFX.BANKMSGSRSV1.STMTTRNRS.STMTRS.BANKTRANLIST;
        const stmtTrn = bankTranList.STMTTRN;
        const transactions = Array.isArray(stmtTrn) ? stmtTrn : [stmtTrn];
        console.log(`💳 Transações encontradas: ${transactions.length}`);

      } else {
        console.log('❌ Tipo não reconhecido');
        console.log('Conteúdo inicial:', xmlContent.substring(0, 200) + '...');
      }

    } catch (error) {
      console.log('❌ Erro ao processar arquivo:', error.message);
    }
  }
});

console.log('\n=== Teste concluído ===');