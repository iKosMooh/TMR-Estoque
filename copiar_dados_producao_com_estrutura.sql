-- =====================================================
-- SCRIPT PARA CRIAR E COPIAR TODAS AS TABELAS E DADOS DA PRODUÇÃO
-- TMR Auto Elétrica - Estoque Simples
-- =====================================================

-- Execute este script conectado ao servidor de PRODUÇÃO (177.137.148.133)
-- O script vai criar as tabelas que não existirem e copiar dados de tmr_auto_eletrica para tmr_auto_eletrica_dev

-- =====================================================
-- CONFIGURAÇÕES INICIAIS
-- =====================================================

SET FOREIGN_KEY_CHECKS = 0;
SET UNIQUE_CHECKS = 0;
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- =====================================================
-- CRIAR TABELAS QUE NÃO EXISTEM NO DEV E COPIAR DADOS
-- =====================================================

-- Gera comandos para todas as tabelas do banco de produção
-- Copie e execute o resultado deste bloco no seu Workbench para gerar os comandos CREATE TABLE + INSERT

SELECT GROUP_CONCAT(cmd SEPARATOR '\n') AS script_sql
FROM (
    SELECT CONCAT(
        'CREATE TABLE IF NOT EXISTS tmr_auto_eletrica_dev.', t.TABLE_NAME, ' LIKE tmr_auto_eletrica.', t.TABLE_NAME, ';\n',
        'TRUNCATE TABLE tmr_auto_eletrica_dev.', t.TABLE_NAME, ';\n',
        'INSERT INTO tmr_auto_eletrica_dev.', t.TABLE_NAME, ' SELECT * FROM tmr_auto_eletrica.', t.TABLE_NAME, ';\n'
    ) AS cmd
    FROM INFORMATION_SCHEMA.TABLES t
    WHERE t.TABLE_SCHEMA = 'tmr_auto_eletrica'
      AND t.TABLE_TYPE = 'BASE TABLE'
    ORDER BY t.TABLE_NAME
) AS comandos;

-- Copie o resultado do campo "script_sql" e execute no seu banco de desenvolvimento.

-- =====================================================
-- RESTAURAR CONFIGURAÇÕES
-- =====================================================

SET FOREIGN_KEY_CHECKS = 1;
SET UNIQUE_CHECKS = 1;

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

SELECT 'VERIFICAÇÃO DOS DADOS COPIADOS' as resultado;

SELECT table_name, table_rows
FROM information_schema.tables
WHERE table_schema = 'tmr_auto_eletrica_dev'
ORDER BY table_name;
