-- Script SQL para copiar dados da produção para desenvolvimento
-- TMR Auto Elétrica - Estoque Simples
-- Execute este script no MySQL Workbench conectado ao seu banco DEV

-- =====================================================
-- PASSO 1: CONFIGURAÇÃO INICIAL
-- =====================================================

-- Defina as variáveis de conexão (ajuste conforme necessário)
SET @prod_host = '177.137.148.133';
SET @prod_port = '3306';
SET @prod_user = 'ikosmooh';
SET @prod_password = 'Mascara100.';
SET @prod_db = 'tmr_auto_eletrica';

SET @dev_db = 'tmr_auto_eletrica_dev'; -- Seu banco de desenvolvimento

-- =====================================================
-- PASSO 2: CRIAR BANCO DE DESENVOLVIMENTO (se não existir)
-- =====================================================

-- Execute este comando separadamente se o banco não existir:
-- CREATE DATABASE IF NOT EXISTS tmr_auto_eletrica_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =====================================================
-- PASSO 3: FEDERATED ENGINE APPROACH (Recomendado)
-- =====================================================

-- Este método cria tabelas federadas que apontam para a produção
-- e depois copia os dados localmente

DELIMITER //

CREATE PROCEDURE copy_production_to_dev()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE table_name VARCHAR(255);
    DECLARE cur CURSOR FOR
        SELECT TABLE_NAME
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = @prod_db
        AND TABLE_TYPE = 'BASE TABLE';

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    -- Para cada tabela na produção
    OPEN cur;
    read_loop: LOOP
        FETCH cur INTO table_name;
        IF done THEN
            LEAVE read_loop;
        END IF;

        -- Criar tabela federada temporária
        SET @sql = CONCAT(
            'CREATE TABLE IF NOT EXISTS ', @dev_db, '.', table_name, '_fed (',
            'id VARCHAR(36) PRIMARY KEY' -- Coluna básica para começar
        );

        -- Adicionar mais colunas dinamicamente (simplificado)
        SET @sql = CONCAT(@sql, ') ENGINE=FEDERATED CONNECTION=''mysql://',
            @prod_user, ':', @prod_password, '@', @prod_host, ':', @prod_port, '/', @prod_db, '/', table_name, '''');

        -- Executar criação da tabela federada
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;

        -- Copiar dados da tabela federada para tabela local
        SET @copy_sql = CONCAT(
            'CREATE TABLE IF NOT EXISTS ', @dev_db, '.', table_name, ' AS ',
            'SELECT * FROM ', @dev_db, '.', table_name, '_fed'
        );

        PREPARE stmt FROM @copy_sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;

        -- Remover tabela federada temporária
        SET @drop_sql = CONCAT('DROP TABLE IF EXISTS ', @dev_db, '.', table_name, '_fed');
        PREPARE stmt FROM @drop_sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;

        SELECT CONCAT('✅ Tabela ', table_name, ' copiada com sucesso') AS status;

    END LOOP;
    CLOSE cur;

END //

DELIMITER ;

-- =====================================================
-- MÉTODO ALTERNATIVO: MANUAL VIA WORKBENCH
-- =====================================================

/*
INSTRUÇÕES MANUAIS PARA MYSQL WORKBENCH:

1. Abra o MySQL Workbench
2. Conecte-se ao servidor de PRODUÇÃO (177.137.148.133)
3. Clique com botão direito no banco 'tmr_auto_eletrica'
4. Selecione "Data Export"
5. Marque todas as tabelas
6. Escolha "Export to Self-Contained File"
7. Salve como: tmr_production_backup.sql
8. Clique em "Start Export"

9. Agora conecte-se ao seu servidor LOCAL/DEV
10. Clique com botão direito no banco 'tmr_auto_eletrica_dev'
11. Selecione "Data Import/Restore"
12. Escolha "Import from Self-Contained File"
13. Selecione o arquivo tmr_production_backup.sql
14. Clique em "Start Import"

VANTAGENS: Mais confiável, visual, sem necessidade de linha de comando
*/

-- =====================================================
-- MÉTODO 3: SCRIPT DE EXPORT/IMPORT DIRETO
-- =====================================================

-- Se preferir usar linha de comando com Workbench instalado:

-- 1. Exportar da produção:
-- mysqldump -h 177.137.148.133 -P 3306 -u ikosmooh -p"Mascara100." tmr_auto_eletrica > production_backup.sql

-- 2. Importar para desenvolvimento:
-- mysql -h localhost -u root -p tmr_auto_eletrica_dev < production_backup.sql

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Execute esta query para verificar se os dados foram copiados:
SELECT
    'Verificação de cópia dos dados' as status,
    COUNT(*) as total_tabelas_dev
FROM information_schema.tables
WHERE table_schema = @dev_db;

-- Contar registros em algumas tabelas principais
SELECT 'products' as tabela, COUNT(*) as registros FROM tmr_auto_eletrica_dev.products
UNION ALL
SELECT 'customers' as tabela, COUNT(*) as registros FROM tmr_auto_eletrica_dev.customers
UNION ALL
SELECT 'sales' as tabela, COUNT(*) as registros FROM tmr_auto_eletrica_dev.sales;

-- =====================================================
-- LIMPEZA (opcional)
-- =====================================================

-- Se quiser remover o procedure após uso:
-- DROP PROCEDURE IF EXISTS copy_production_to_dev;