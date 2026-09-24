CREATE TABLE businesses (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Existing installations become the initial Irodori business without losing data.
INSERT INTO businesses (name)
SELECT 'Irodori'
WHERE EXISTS (SELECT 1 FROM users);

ALTER TABLE users ADD COLUMN business_id BIGINT;
UPDATE users SET business_id = (SELECT id FROM businesses ORDER BY id LIMIT 1);
ALTER TABLE users ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE users ADD CONSTRAINT users_business_fk FOREIGN KEY (business_id) REFERENCES businesses(id);
CREATE INDEX idx_users_business ON users(business_id, role);

CREATE UNIQUE INDEX one_owner_per_business ON users(business_id) WHERE role = 'OWNER';
