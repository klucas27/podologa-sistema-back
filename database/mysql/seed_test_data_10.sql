USE podiatry_db;

START TRANSACTION;

DELETE FROM evolution_pathologies;
DELETE FROM clinical_evolutions;
DELETE FROM billings;
DELETE FROM anamnesis;
DELETE FROM appointments;
DELETE FROM pathologies;
DELETE FROM patient;
DELETE FROM `user`;

CREATE TEMPORARY TABLE tmp_seed_users (
    seq INT NOT NULL PRIMARY KEY,
    id VARCHAR(36) NOT NULL,
    username VARCHAR(191) NOT NULL,
    professional_name VARCHAR(200) NOT NULL,
    workday_start VARCHAR(5) NOT NULL,
    workday_end VARCHAR(5) NOT NULL
);

INSERT INTO tmp_seed_users (seq, id, username, professional_name, workday_start, workday_end) VALUES
    (1, '20000000-0000-0000-0000-000000000001', 'amanda.costa', 'Amanda Costa', '07:00', '16:00'),
    (2, '20000000-0000-0000-0000-000000000002', 'beatriz.almeida', 'Beatriz Almeida', '08:00', '17:00'),
    (3, '20000000-0000-0000-0000-000000000003', 'camila.rocha', 'Camila Rocha', '09:00', '18:00'),
    (4, '20000000-0000-0000-0000-000000000004', 'daniela.sousa', 'Daniela Sousa', '10:00', '19:00'),
    (5, '20000000-0000-0000-0000-000000000005', 'eduarda.melo', 'Eduarda Melo', '07:30', '16:30'),
    (6, '20000000-0000-0000-0000-000000000006', 'fernanda.ribeiro', 'Fernanda Ribeiro', '08:30', '17:30'),
    (7, '20000000-0000-0000-0000-000000000007', 'gabriela.lima', 'Gabriela Lima', '09:30', '18:30'),
    (8, '20000000-0000-0000-0000-000000000008', 'helena.martins', 'Helena Martins', '07:00', '15:00'),
    (9, '20000000-0000-0000-0000-000000000009', 'isabela.fonseca', 'Isabela Fonseca', '08:00', '16:00'),
    (10, '20000000-0000-0000-0000-000000000010', 'juliana.pires', 'Juliana Pires', '09:00', '17:00'),
    (11, '20000000-0000-0000-0000-000000000011', 'karina.duarte', 'Karina Duarte', '10:00', '18:00'),
    (12, '20000000-0000-0000-0000-000000000012', 'larissa.barros', 'Larissa Barros', '11:00', '19:00'),
    (13, '20000000-0000-0000-0000-000000000013', 'mariana.teixeira', 'Mariana Teixeira', '07:00', '16:00'),
    (14, '20000000-0000-0000-0000-000000000014', 'natalia.moreira', 'Natalia Moreira', '08:00', '17:00'),
    (15, '20000000-0000-0000-0000-000000000015', 'patricia.silva', 'Patricia Silva', '09:00', '18:00'),
    (16, '20000000-0000-0000-0000-000000000016', 'renata.azevedo', 'Renata Azevedo', '10:00', '19:00'),
    (17, '20000000-0000-0000-0000-000000000017', 'sabrina.cardoso', 'Sabrina Cardoso', '07:30', '16:30'),
    (18, '20000000-0000-0000-0000-000000000018', 'tatiane.araujo', 'Tatiane Araujo', '08:30', '17:30'),
    (19, '20000000-0000-0000-0000-000000000019', 'vanessa.freitas', 'Vanessa Freitas', '09:30', '18:30'),
    (20, '20000000-0000-0000-0000-000000000020', 'yasmin.gomes', 'Yasmin Gomes', '07:00', '15:00'),
    (21, '20000000-0000-0000-0000-000000000021', 'alice.nogueira', 'Alice Nogueira', '08:00', '16:00'),
    (22, '20000000-0000-0000-0000-000000000022', 'bianca.cunha', 'Bianca Cunha', '09:00', '17:00'),
    (23, '20000000-0000-0000-0000-000000000023', 'clarissa.brito', 'Clarissa Brito', '10:00', '18:00'),
    (24, '20000000-0000-0000-0000-000000000024', 'debora.torres', 'Debora Torres', '11:00', '19:00'),
    (25, '20000000-0000-0000-0000-000000000025', 'elaine.moraes', 'Elaine Moraes', '07:00', '16:00'),
    (26, '20000000-0000-0000-0000-000000000026', 'fabiana.queiroz', 'Fabiana Queiroz', '08:00', '17:00'),
    (27, '20000000-0000-0000-0000-000000000027', 'giselle.reis', 'Giselle Reis', '09:00', '18:00'),
    (28, '20000000-0000-0000-0000-000000000028', 'heloisa.viana', 'Heloisa Viana', '10:00', '19:00'),
    (29, '20000000-0000-0000-0000-000000000029', 'ingrid.peixoto', 'Ingrid Peixoto', '07:30', '16:30'),
    (30, '20000000-0000-0000-0000-000000000030', 'joana.batista', 'Joana Batista', '08:30', '17:30');

CREATE TEMPORARY TABLE tmp_seed_patients (
    seq INT NOT NULL PRIMARY KEY,
    id VARCHAR(36) NOT NULL,
    full_name VARCHAR(191) NOT NULL,
    date_of_birth DATE NULL,
    marital_status ENUM('single','married','divorced','widowed','other') NOT NULL,
    occupation VARCHAR(100) NULL,
    cpf CHAR(11) NOT NULL,
    phone_number VARCHAR(20) NULL,
    email VARCHAR(191) NULL,
    zip_code VARCHAR(20) NULL,
    street VARCHAR(255) NULL,
    address_number VARCHAR(20) NULL,
    neighborhood VARCHAR(100) NULL,
    city VARCHAR(100) NULL,
    state CHAR(2) NULL
);

INSERT INTO tmp_seed_patients (
    seq, id, full_name, date_of_birth, marital_status, occupation, cpf, phone_number, email, zip_code, street, address_number, neighborhood, city, state
) VALUES
    (1, '10000000-0000-0000-0000-000000000001', 'Ana Paula Mendes', '1986-03-14', 'married', 'Professora', '34782156001', '11987654301', 'ana.mendes@exemplo.com', '01311000', 'Rua Vergueiro', '145', 'Liberdade', 'Sao Paulo', 'SP'),
    (2, '10000000-0000-0000-0000-000000000002', 'Carlos Eduardo Lima', '1979-07-22', 'married', 'Motorista', '34782156002', '11987654302', 'carlos.lima@exemplo.com', '13013010', 'Rua Barreto Leme', '280', 'Centro', 'Campinas', 'SP'),
    (3, '10000000-0000-0000-0000-000000000003', 'Mariana Souza Ribeiro', '1991-11-05', 'single', 'Arquiteta', '34782156003', '11987654303', 'mariana.ribeiro@exemplo.com', '80010020', 'Rua XV de Novembro', '312', 'Centro', 'Curitiba', 'PR'),
    (4, '10000000-0000-0000-0000-000000000004', 'Roberto Alves Martins', '1968-02-18', 'widowed', 'Aposentado', '34782156004', '11987654304', 'roberto.martins@exemplo.com', '30140071', 'Avenida Afonso Pena', '910', 'Funcionarios', 'Belo Horizonte', 'MG'),
    (5, '10000000-0000-0000-0000-000000000005', 'Fernanda Costa Araujo', '1988-09-29', 'divorced', 'Advogada', '34782156005', '11987654305', 'fernanda.araujo@exemplo.com', '88010200', 'Rua Bocaiuva', '77', 'Centro', 'Florianopolis', 'SC'),
    (6, '10000000-0000-0000-0000-000000000006', 'Joao Marcos da Silva', '1994-05-11', 'single', 'Analista de TI', '34782156006', '11987654306', 'joao.silva@exemplo.com', '69005010', 'Rua Ramos Ferreira', '654', 'Centro', 'Manaus', 'AM'),
    (7, '10000000-0000-0000-0000-000000000007', 'Patricia Helena Gomes', '1983-12-02', 'married', 'Enfermeira', '34782156007', '11987654307', 'patricia.gomes@exemplo.com', '40020000', 'Rua Chile', '215', 'Centro', 'Salvador', 'BA'),
    (8, '10000000-0000-0000-0000-000000000008', 'Luciana Farias Melo', '1975-01-27', 'married', 'Comerciante', '34782156008', '11987654308', 'luciana.melo@exemplo.com', '50010000', 'Rua do Sol', '402', 'Santo Antonio', 'Recife', 'PE'),
    (9, '10000000-0000-0000-0000-000000000009', 'Mateus Henrique Dias', '1990-06-30', 'single', 'Engenheiro Civil', '34782156009', '11987654309', 'mateus.dias@exemplo.com', '64000090', 'Avenida Frei Serafim', '1200', 'Centro', 'Teresina', 'PI'),
    (10, '10000000-0000-0000-0000-000000000010', 'Juliana Barbosa Nunes', '1987-10-09', 'married', 'Fisioterapeuta', '34782156010', '11987654310', 'juliana.nunes@exemplo.com', '69900070', 'Rua Benjamin Constant', '87', 'Centro', 'Rio Branco', 'AC'),
    (11, '10000000-0000-0000-0000-000000000011', 'Ricardo Teixeira Lopes', '1981-08-16', 'divorced', 'Administrador', '34782156011', '11987654311', 'ricardo.lopes@exemplo.com', '57020000', 'Rua do Imperador', '140', 'Centro', 'Maceio', 'AL'),
    (12, '10000000-0000-0000-0000-000000000012', 'Sabrina Oliveira Prado', '1996-04-01', 'single', 'Designer Grafica', '34782156012', '11987654312', 'sabrina.prado@exemplo.com', '68900098', 'Avenida FAB', '500', 'Central', 'Macapa', 'AP'),
    (13, '10000000-0000-0000-0000-000000000013', 'Vinicius Carvalho Pinto', '1984-11-21', 'married', 'Professor Universitario', '34782156013', '11987654313', 'vinicius.pinto@exemplo.com', '69057030', 'Rua Para', '211', 'Nossa Senhora das Gracas', 'Manaus', 'AM'),
    (14, '10000000-0000-0000-0000-000000000014', 'Carla Regina Moreira', '1977-03-08', 'widowed', 'Assistente Social', '34782156014', '11987654314', 'carla.moreira@exemplo.com', '49010020', 'Rua Itabaianinha', '95', 'Centro', 'Aracaju', 'SE'),
    (15, '10000000-0000-0000-0000-000000000015', 'Diego Fernandes Rocha', '1992-07-19', 'single', 'Personal Trainer', '34782156015', '11987654315', 'diego.rocha@exemplo.com', '59010000', 'Avenida Rio Branco', '680', 'Cidade Alta', 'Natal', 'RN'),
    (16, '10000000-0000-0000-0000-000000000016', 'Renata Pereira Castro', '1989-02-12', 'married', 'Contadora', '34782156016', '11987654316', 'renata.castro@exemplo.com', '66017000', 'Rua dos Mundurucus', '414', 'Batista Campos', 'Belem', 'PA'),
    (17, '10000000-0000-0000-0000-000000000017', 'Thiago Santos Vieira', '1985-09-04', 'divorced', 'Vendedor', '34782156017', '11987654317', 'thiago.vieira@exemplo.com', '58010001', 'Rua Duque de Caxias', '331', 'Centro', 'Joao Pessoa', 'PB'),
    (18, '10000000-0000-0000-0000-000000000018', 'Camila Duarte Cardoso', '1993-12-25', 'single', 'Biomedica', '34782156018', '11987654318', 'camila.cardoso@exemplo.com', '79002000', 'Rua 14 de Julho', '920', 'Centro', 'Campo Grande', 'MS'),
    (19, '10000000-0000-0000-0000-000000000019', 'Felipe Goncalves Moura', '1974-05-28', 'married', 'Empresario', '34782156019', '11987654319', 'felipe.moura@exemplo.com', '78005000', 'Avenida Isaac Povoas', '140', 'Centro Norte', 'Cuiaba', 'MT'),
    (20, '10000000-0000-0000-0000-000000000020', 'Daniela Correia Freitas', '1982-06-15', 'married', 'Farmaceutica', '34782156020', '11987654320', 'daniela.freitas@exemplo.com', '76801020', 'Avenida Carlos Gomes', '1001', 'Sao Cristovao', 'Porto Velho', 'RO'),
    (21, '10000000-0000-0000-0000-000000000021', 'Bruno Henrique Tavares', '1997-01-10', 'single', 'Estudante de Medicina', '34782156021', '11987654321', 'bruno.tavares@exemplo.com', '69301010', 'Avenida Ville Roy', '170', 'Centro', 'Boa Vista', 'RR'),
    (22, '10000000-0000-0000-0000-000000000022', 'Aline Rodrigues Pacheco', '1980-10-17', 'divorced', 'Psicologa', '34782156022', '11987654322', 'aline.pacheco@exemplo.com', '77001010', 'Avenida JK', '250', 'Plano Diretor Norte', 'Palmas', 'TO'),
    (23, '10000000-0000-0000-0000-000000000023', 'Leonardo Rezende Faria', '1986-08-03', 'married', 'Dentista', '34782156023', '11987654323', 'leonardo.faria@exemplo.com', '74010010', 'Rua 3', '88', 'Setor Central', 'Goiania', 'GO'),
    (24, '10000000-0000-0000-0000-000000000024', 'Priscila Machado Esteves', '1995-04-26', 'single', 'Jornalista', '34782156024', '11987654324', 'priscila.esteves@exemplo.com', '20040002', 'Rua da Quitanda', '210', 'Centro', 'Rio de Janeiro', 'RJ'),
    (25, '10000000-0000-0000-0000-000000000025', 'Gustavo Ribeiro Neves', '1978-09-13', 'married', 'Chef de Cozinha', '34782156025', '11987654325', 'gustavo.neves@exemplo.com', '30112000', 'Rua da Bahia', '1500', 'Lourdes', 'Belo Horizonte', 'MG'),
    (26, '10000000-0000-0000-0000-000000000026', 'Monica Figueiredo Sales', '1984-12-07', 'widowed', 'Pedagoga', '34782156026', '11987654326', 'monica.sales@exemplo.com', '64049010', 'Rua Coelho Rodrigues', '120', 'Centro', 'Teresina', 'PI'),
    (27, '10000000-0000-0000-0000-000000000027', 'Rafael Assis Cunha', '1991-03-19', 'single', 'Publicitario', '34782156027', '11987654327', 'rafael.cunha@exemplo.com', '69053040', 'Rua Recife', '510', 'Adrianopolis', 'Manaus', 'AM'),
    (28, '10000000-0000-0000-0000-000000000028', 'Leticia Santana Borges', '1988-07-01', 'married', 'Nutricionista', '34782156028', '11987654328', 'leticia.borges@exemplo.com', '29100030', 'Avenida Jeronimo Monteiro', '390', 'Centro', 'Vitoria', 'ES'),
    (29, '10000000-0000-0000-0000-000000000029', 'Pedro Augusto Braga', '1973-11-23', 'married', 'Corretor de Imoveis', '34782156029', '11987654329', 'pedro.braga@exemplo.com', '57036010', 'Avenida Fernandes Lima', '2400', 'Farol', 'Maceio', 'AL'),
    (30, '10000000-0000-0000-0000-000000000030', 'Vanessa Cristina Peixoto', '1994-02-05', 'single', 'Veterinaria', '34782156030', '11987654330', 'vanessa.peixoto@exemplo.com', '88015001', 'Rua Felipe Schmidt', '188', 'Centro', 'Florianopolis', 'SC');

CREATE TEMPORARY TABLE tmp_seed_pathologies (
    seq INT NOT NULL PRIMARY KEY,
    id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL
);

INSERT INTO tmp_seed_pathologies (seq, id, name, description) VALUES
    (1, '50000000-0000-0000-0000-000000000001', 'Onicocriptose', 'Unha encravada com dor e inflamacao local.'),
    (2, '50000000-0000-0000-0000-000000000002', 'Onicomicose', 'Infeccao fungica da lamina ungueal.'),
    (3, '50000000-0000-0000-0000-000000000003', 'Tinea pedis', 'Micose plantar com descamacao e prurido.'),
    (4, '50000000-0000-0000-0000-000000000004', 'Verruga plantar', 'Lesao viral dolorosa em apoio plantar.'),
    (5, '50000000-0000-0000-0000-000000000005', 'Heloma duro', 'Calo profundo com nucleo central doloroso.'),
    (6, '50000000-0000-0000-0000-000000000006', 'Heloma mole', 'Lesao interdigital macerada por atrito e umidade.'),
    (7, '50000000-0000-0000-0000-000000000007', 'Hiperqueratose plantar', 'Espessamento cutaneo em area de carga.'),
    (8, '50000000-0000-0000-0000-000000000008', 'Fissura calcanea', 'Rachaduras dolorosas em calcaneo ressecado.'),
    (9, '50000000-0000-0000-0000-000000000009', 'Bromidrose plantar', 'Odor acentuado associado a suor excessivo.'),
    (10, '50000000-0000-0000-0000-000000000010', 'Hiperidrose plantar', 'Sudorese excessiva em planta dos pes.'),
    (11, '50000000-0000-0000-0000-000000000011', 'Onicolise', 'Descolamento parcial da unha do leito.'),
    (12, '50000000-0000-0000-0000-000000000012', 'Paroniquia', 'Inflamacao do tecido periungueal.'),
    (13, '50000000-0000-0000-0000-000000000013', 'Granuloma periungueal', 'Tecido de granulacao associado a unha encravada.'),
    (14, '50000000-0000-0000-0000-000000000014', 'Psoriase ungueal', 'Alteracao ungueal compativel com psoriase.'),
    (15, '50000000-0000-0000-0000-000000000015', 'Trauma subungueal', 'Hematoma ou lesao apos impacto na unha.'),
    (16, '50000000-0000-0000-0000-000000000016', 'Calosidade metatarsal', 'Aumento de queratina em cabecas metatarsais.'),
    (17, '50000000-0000-0000-0000-000000000017', 'Poroqueratose plantar', 'Lesao puntiforme queratosica dolorosa.'),
    (18, '50000000-0000-0000-0000-000000000018', 'Maceracao interdigital', 'Umidade persistente entre os dedos.'),
    (19, '50000000-0000-0000-0000-000000000019', 'Eritrasma', 'Infeccao bacteriana superficial em dobras.'),
    (20, '50000000-0000-0000-0000-000000000020', 'Unha distrofica', 'Deformidade ungueal cronica e irregular.'),
    (21, '50000000-0000-0000-0000-000000000021', 'Edema distal', 'Inchaco recorrente em extremidade distal.'),
    (22, '50000000-0000-0000-0000-000000000022', 'Pele xerotica', 'Ressecamento intenso com perda de elasticidade.'),
    (23, '50000000-0000-0000-0000-000000000023', 'Bolha por atrito', 'Lesao vesicular causada por friccao repetitiva.'),
    (24, '50000000-0000-0000-0000-000000000024', 'Dermatite de contato', 'Irritacao cutanea por contato com substancia.'),
    (25, '50000000-0000-0000-0000-000000000025', 'Micose interdigital', 'Comprometimento fungico entre pododactilos.'),
    (26, '50000000-0000-0000-0000-000000000026', 'Clavo subungueal', 'Queratinizacao abaixo da lamina ungueal.'),
    (27, '50000000-0000-0000-0000-000000000027', 'Exostose subungueal', 'Proeminencia ossea abaixo da unha.'),
    (28, '50000000-0000-0000-0000-000000000028', 'Onicofose', 'Acumulo de queratina no sulco ungueal.'),
    (29, '50000000-0000-0000-0000-000000000029', 'Podopatia diabetica inicial', 'Sinais iniciais de risco em pe diabetico.'),
    (30, '50000000-0000-0000-0000-000000000030', 'Ulceracao superficial', 'Perda superficial de tecido em area de pressao.');

INSERT INTO `user` (
    id,
    username,
    password_hash,
    professional_name,
    workday_start,
    workday_end,
    created_at,
    updated_at,
    deleted_at
)
SELECT
    id,
    username,
    password_hash,
    professional_name,
    workday_start,
    workday_end,
    DATE_SUB(CURRENT_TIMESTAMP, INTERVAL (45 - seq) DAY),
    CURRENT_TIMESTAMP,
    NULL
FROM (
    SELECT
        seq,
        id,
        username,
        '$2b$10$6QJ2m9Q5FQ1m2wY4QdM2Eu8D8Qe9v7jJ7V7sQ2G1uY1J8R0mP2c7K' AS password_hash,
        professional_name,
        workday_start,
        workday_end
    FROM tmp_seed_users
) AS seed_users;

INSERT INTO patient (
    id,
    created_at,
    updated_at,
    full_name,
    date_of_birth,
    marital_status,
    occupation,
    cpf,
    phone_number,
    email,
    zip_code,
    street,
    address_number,
    neighborhood,
    city,
    state
)
SELECT
    id,
    DATE_SUB(CURRENT_TIMESTAMP, INTERVAL (75 - seq) DAY),
    CURRENT_TIMESTAMP,
    full_name,
    date_of_birth,
    marital_status,
    occupation,
    cpf,
    phone_number,
    email,
    zip_code,
    street,
    address_number,
    neighborhood,
    city,
    state
FROM tmp_seed_patients;

INSERT INTO pathologies (
    id,
    name,
    description,
    created_at,
    updated_at
)
SELECT
    id,
    name,
    description,
    DATE_SUB(CURRENT_TIMESTAMP, INTERVAL (40 - seq) DAY),
    CURRENT_TIMESTAMP
FROM tmp_seed_pathologies;

INSERT INTO appointments (
    id,
    patient_id,
    user_id,
    professional_id,
    scheduled_start,
    scheduled_end,
    scheduled_date,
    actual_start_time,
    actual_end_time,
    status,
    notes,
    created_at,
    updated_at,
    deleted_at
)
SELECT
    CONCAT('40000000-0000-0000-0000-', LPAD(p.seq, 12, '0')),
    p.id,
    u.id,
    NULL,
    TIMESTAMP(
        CASE
            WHEN p.seq BETWEEN 1 AND 8 THEN CURDATE()
            WHEN p.seq BETWEEN 9 AND 12 THEN DATE_SUB(CURDATE(), INTERVAL 1 DAY)
            WHEN p.seq BETWEEN 13 AND 22 THEN DATE_SUB(CURDATE(), INTERVAL (p.seq - 10) DAY)
            ELSE DATE_ADD(CURDATE(), INTERVAL (p.seq - 22) DAY)
        END,
        MAKETIME(7 + MOD(p.seq - 1, 10), IF(MOD(p.seq, 2) = 0, 30, 0), 0)
    ),
    TIMESTAMP(
        CASE
            WHEN p.seq BETWEEN 1 AND 8 THEN CURDATE()
            WHEN p.seq BETWEEN 9 AND 12 THEN DATE_SUB(CURDATE(), INTERVAL 1 DAY)
            WHEN p.seq BETWEEN 13 AND 22 THEN DATE_SUB(CURDATE(), INTERVAL (p.seq - 10) DAY)
            ELSE DATE_ADD(CURDATE(), INTERVAL (p.seq - 22) DAY)
        END,
        MAKETIME(8 + MOD(p.seq - 1, 10), IF(MOD(p.seq, 2) = 0, 20, 50), 0)
    ),
    CASE
        WHEN p.seq BETWEEN 1 AND 8 THEN CURDATE()
        WHEN p.seq BETWEEN 9 AND 12 THEN DATE_SUB(CURDATE(), INTERVAL 1 DAY)
        WHEN p.seq BETWEEN 13 AND 22 THEN DATE_SUB(CURDATE(), INTERVAL (p.seq - 10) DAY)
        ELSE DATE_ADD(CURDATE(), INTERVAL (p.seq - 22) DAY)
    END,
    CASE
        WHEN p.seq IN (4, 5) OR p.seq BETWEEN 9 AND 20 THEN TIMESTAMP(
            CASE
                WHEN p.seq BETWEEN 1 AND 8 THEN CURDATE()
                WHEN p.seq BETWEEN 9 AND 12 THEN DATE_SUB(CURDATE(), INTERVAL 1 DAY)
                WHEN p.seq BETWEEN 13 AND 22 THEN DATE_SUB(CURDATE(), INTERVAL (p.seq - 10) DAY)
                ELSE DATE_ADD(CURDATE(), INTERVAL (p.seq - 22) DAY)
            END,
            MAKETIME(7 + MOD(p.seq - 1, 10), IF(MOD(p.seq, 2) = 0, 30, 0), 0)
        )
        ELSE NULL
    END,
    CASE
        WHEN p.seq BETWEEN 9 AND 20 THEN TIMESTAMP(
            CASE
                WHEN p.seq BETWEEN 1 AND 8 THEN CURDATE()
                WHEN p.seq BETWEEN 9 AND 12 THEN DATE_SUB(CURDATE(), INTERVAL 1 DAY)
                WHEN p.seq BETWEEN 13 AND 22 THEN DATE_SUB(CURDATE(), INTERVAL (p.seq - 10) DAY)
                ELSE DATE_ADD(CURDATE(), INTERVAL (p.seq - 22) DAY)
            END,
            MAKETIME(8 + MOD(p.seq - 1, 10), IF(MOD(p.seq, 2) = 0, 20, 50), 0)
        )
        ELSE NULL
    END,
    CASE
        WHEN p.seq BETWEEN 1 AND 3 THEN 'confirmed'
        WHEN p.seq BETWEEN 4 AND 5 THEN 'in_progress'
        WHEN p.seq BETWEEN 6 AND 8 THEN 'scheduled'
        WHEN p.seq BETWEEN 9 AND 20 THEN 'completed'
        WHEN p.seq BETWEEN 21 AND 24 THEN 'confirmed'
        WHEN p.seq BETWEEN 25 AND 26 THEN 'cancelled'
        ELSE 'scheduled'
    END,
    ELT(
        ((p.seq - 1) % 6) + 1,
        'Avaliacao podologica inicial com foco em pele e unhas.',
        'Retorno para acompanhamento de onicocriptose.',
        'Sessao de curativo especializado e alivio de pressao.',
        'Controle de calosidade plantar e orientacoes preventivas.',
        'Acompanhamento de pe diabetico com teste de sensibilidade.',
        'Reavaliacao de micose interdigital e ajuste de rotina domiciliar.'
    ),
    DATE_SUB(CURRENT_TIMESTAMP, INTERVAL (35 - p.seq) DAY),
    CURRENT_TIMESTAMP,
    NULL
FROM tmp_seed_patients AS p
JOIN tmp_seed_users AS u ON u.seq = p.seq;

INSERT INTO clinical_evolutions (
    id,
    appointment_id,
    clinical_notes,
    prescribed_medications,
    home_care_recommendations,
    recommended_return_days,
    created_at,
    updated_at,
    deleted_at
)
SELECT
    CONCAT('60000000-0000-0000-0000-', LPAD(p.seq, 12, '0')),
    CONCAT('40000000-0000-0000-0000-', LPAD(p.seq, 12, '0')),
    ELT(
        ((p.seq - 1) % 5) + 1,
        'Paciente apresentou boa resposta ao desbaste e orientacoes de higiene.',
        'Dor reduzida apos alivio mecanico e limpeza do sulco ungueal.',
        'Pele com melhora parcial, mantendo necessidade de hidratacao intensiva.',
        'Sinais inflamatorios controlados, sem secrecao ao final do atendimento.',
        'Sensibilidade preservada, com orientacao para retorno programado.'
    ),
    ELT(
        ((p.seq - 1) % 5) + 1,
        'Creme hidratante com ureia',
        'Antifungico topico',
        'Pomada cicatrizante',
        'Solucao antisseptica',
        'Sem prescricao medicamentosa'
    ),
    ELT(
        ((p.seq - 1) % 5) + 1,
        'Secar bem entre os dedos apos o banho.',
        'Evitar calcado apertado pelos proximos 5 dias.',
        'Trocar meia diariamente e preferir tecido respiravel.',
        'Manter curativo limpo e retornar em caso de dor intensa.',
        'Aplicar hidratacao noturna em toda a planta do pe.'
    ),
    ELT(((p.seq - 1) % 4) + 1, 7, 14, 21, 30),
    DATE_SUB(CURRENT_TIMESTAMP, INTERVAL (33 - p.seq) DAY),
    CURRENT_TIMESTAMP,
    NULL
FROM tmp_seed_patients AS p;

INSERT INTO evolution_pathologies (
    evolution_id,
    pathology_id,
    body_part,
    notes,
    created_at,
    updated_at
)
SELECT
    CONCAT('60000000-0000-0000-0000-', LPAD(p.seq, 12, '0')),
    ph.id,
    ELT(((p.seq - 1) % 4) + 1, 'right_foot', 'left_foot', 'right_hand', 'left_hand'),
    ELT(
        ((p.seq - 1) % 5) + 1,
        'Lesao localizada em regiao distal com sensibilidade moderada.',
        'Comprometimento superficial sem sinais de infeccao ativa.',
        'Area em melhora, ainda com atrito no calcado habitual.',
        'Necessita monitoramento por recorrencia de dor ao apoio.',
        'Manter cuidado preventivo e revisao no retorno.'
    ),
    DATE_SUB(CURRENT_TIMESTAMP, INTERVAL (32 - p.seq) DAY),
    CURRENT_TIMESTAMP
FROM tmp_seed_patients AS p
JOIN tmp_seed_pathologies AS ph ON ph.seq = p.seq;

INSERT INTO billings (
    id,
    appointment_id,
    amount,
    payment_method,
    status,
    paid_at,
    created_at,
    updated_at,
    deleted_at
)
SELECT
    CONCAT('70000000-0000-0000-0000-', LPAD(p.seq, 12, '0')),
    CONCAT('40000000-0000-0000-0000-', LPAD(p.seq, 12, '0')),
    CAST(ROUND(90 + (p.seq * 8.4), 2) AS DECIMAL(10,2)),
    ELT(((p.seq - 1) % 6) + 1, 'pix', 'credit_card', 'debit_card', 'cash', 'transfer', 'other'),
    CASE
        WHEN p.seq BETWEEN 9 AND 20 THEN 'paid'
        WHEN p.seq BETWEEN 21 AND 22 THEN 'refunded'
        WHEN p.seq BETWEEN 25 AND 26 THEN 'cancelled'
        ELSE 'pending'
    END,
    CASE
        WHEN p.seq BETWEEN 9 AND 22 THEN DATE_SUB(CURRENT_TIMESTAMP, INTERVAL (24 - p.seq) DAY)
        ELSE NULL
    END,
    DATE_SUB(CURRENT_TIMESTAMP, INTERVAL (31 - p.seq) DAY),
    CURRENT_TIMESTAMP,
    NULL
FROM tmp_seed_patients AS p;

INSERT INTO anamnesis (
    id,
    patient_id,
    created_at,
    updated_at,
    deleted_at,
    frequently_used_footwear,
    frequently_used_socks,
    practiced_sports,
    has_lower_limb_surgery,
    lower_limb_surgery_details,
    medications_in_use,
    is_pregnant,
    has_pacemaker_or_pins,
    has_hypertension,
    has_seizures,
    has_cancer_history,
    has_diabetes,
    has_circulatory_problems,
    has_healing_problems,
    perfusion,
    has_monofilament_sensitivity,
    dermatological_pathologies,
    nail_pathologies,
    other_observations,
    pain_sensitivity
)
SELECT
    CONCAT('80000000-0000-0000-0000-', LPAD(p.seq, 12, '0')),
    p.id,
    DATE_SUB(CURRENT_TIMESTAMP, INTERVAL (29 - p.seq) DAY),
    CURRENT_TIMESTAMP,
    NULL,
    ELT(((p.seq - 1) % 5) + 1, 'Tenis de caminhada', 'Sandalia anatomica', 'Sapato social', 'Sapatilha confortavel', 'Chinelo ortopedico'),
    ELT(((p.seq - 1) % 4) + 1, 'Algodao', 'Esportiva', 'Compressao leve', 'Bambu'),
    ELT(((p.seq - 1) % 5) + 1, 'Caminhada', 'Corrida leve', 'Pilates', 'Natacao', 'Musculacao'),
    IF(MOD(p.seq, 6) = 0, 1, 0),
    CASE
        WHEN MOD(p.seq, 6) = 0 THEN CONCAT('Cirurgia ortopedica em tornozelo realizada ha ', 2 + MOD(p.seq, 4), ' anos.')
        ELSE NULL
    END,
    ELT(((p.seq - 1) % 5) + 1, 'Nenhum', 'Losartana', 'Complexo vitaminico', 'Metformina', 'Cetoconazol topico'),
    IF(MOD(p.seq, 10) = 0, 1, 0),
    IF(MOD(p.seq, 9) = 0, 1, 0),
    IF(MOD(p.seq, 4) = 0, 1, 0),
    IF(MOD(p.seq, 11) = 0, 1, 0),
    IF(MOD(p.seq, 13) = 0, 1, 0),
    IF(MOD(p.seq, 5) = 0, 1, 0),
    IF(MOD(p.seq, 7) = 0, 1, 0),
    IF(MOD(p.seq, 8) = 0, 1, 0),
    ELT(((p.seq - 1) % 4) + 1, 'normal', 'pale', 'cyanotic', 'edematous'),
    IF(MOD(p.seq, 3) = 0, 0, 1),
    ELT(((p.seq - 1) % 5) + 1, 'Ressecamento plantar discreto', 'Calosidade leve em antepe', 'Sem alteracoes dermatologicas relevantes', 'Micose interdigital em regressao', 'Descamacao plantar localizada'),
    ELT(((p.seq - 1) % 5) + 1, 'Unha encravada recorrente', 'Onicomicose leve', 'Lamina integra', 'Espessamento ungueal moderado', 'Fragilidade ungueal distal'),
    ELT(((p.seq - 1) % 5) + 1, 'Paciente relata longos periodos em pe durante o trabalho.', 'Prefere calcados fechados durante toda a semana.', 'Apresenta melhora quando mantem hidratacao noturna.', 'Necessita reforco de orientacoes para secagem interdigital.', 'Refere desconforto ocasional apos atividade fisica intensa.'),
    ELT(((p.seq - 1) % 4) + 1, 'high', 'moderate', 'low', 'none')
FROM tmp_seed_patients AS p;

DROP TEMPORARY TABLE IF EXISTS tmp_seed_pathologies;
DROP TEMPORARY TABLE IF EXISTS tmp_seed_patients;
DROP TEMPORARY TABLE IF EXISTS tmp_seed_users;

COMMIT;