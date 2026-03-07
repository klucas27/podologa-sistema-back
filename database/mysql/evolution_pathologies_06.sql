USE podiatry_db;

-- DROP TABLE IF EXISTS evolution_pathologies;

CREATE TABLE
    evolution_pathologies (
        evolution_id VARCHAR(36) NOT NULL,
        pathology_id VARCHAR(36) NOT NULL,
        body_part ENUM (
            'right_foot',
            'left_foot',
            'right_hand',
            'left_hand'
        ) NOT NULL,
        notes VARCHAR(255),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (evolution_id, pathology_id, body_part),
        CONSTRAINT fk_evolution_pathologies_evolution FOREIGN KEY (evolution_id) REFERENCES clinical_evolutions (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_evolution_pathologies_pathology FOREIGN KEY (pathology_id) REFERENCES pathologies (id) ON DELETE RESTRICT ON UPDATE CASCADE,
        INDEX idx_evolution_pathologies_pathology (pathology_id)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;