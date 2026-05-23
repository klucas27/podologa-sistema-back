-- Ajustes para suporte ao agendamento via WhatsApp
-- Executar no banco podiatry_db

-- Torna o CPF opcional (pacientes cadastrados pelo WhatsApp não têm CPF)
ALTER TABLE `patient`
  MODIFY COLUMN `cpf` CHAR(11) NULL;

-- Expande a coluna de estado da conversa para suportar JSON (agendamento + anamnese)
ALTER TABLE `whatsapp_conversation_states`
  MODIFY COLUMN `state` TEXT NOT NULL;
