ALTER TABLE catalog_products
    ADD COLUMN unit_cost NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (unit_cost >= 0);

ALTER TABLE expenses
    ADD COLUMN category VARCHAR(40) NOT NULL DEFAULT 'OTHER';

CREATE TABLE expense_budgets (
    id BIGSERIAL PRIMARY KEY,
    business_id BIGINT NOT NULL REFERENCES businesses(id),
    category VARCHAR(40) NOT NULL,
    budget_month DATE NOT NULL,
    amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
    created_by BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_expense_budget UNIQUE (business_id, category, budget_month)
);

CREATE INDEX idx_expense_budget_business_month ON expense_budgets(business_id, budget_month);
