CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(254) NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('OWNER', 'MANAGER', 'INVESTOR')),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sales (
    id BIGSERIAL PRIMARY KEY,
    item_name VARCHAR(120) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    total NUMERIC(14, 2) NOT NULL CHECK (total = unit_price * quantity),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT NOT NULL REFERENCES users(id)
);

ALTER TABLE sales ADD CONSTRAINT grape_pulp_juice_fixed_price
    CHECK (item_name <> 'Grape Pulp Juice' OR unit_price = 130.00);

CREATE INDEX idx_sales_created_at ON sales(created_at);
CREATE INDEX idx_sales_created_by ON sales(created_by);

CREATE TABLE expenses (
    id BIGSERIAL PRIMARY KEY,
    description VARCHAR(240) NOT NULL,
    amount NUMERIC(14, 2) NOT NULL CHECK (amount >= 0),
    incurred_on DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT NOT NULL REFERENCES users(id)
);

CREATE INDEX idx_expenses_incurred_on ON expenses(incurred_on);

-- Reserved for the planned stock-deduction module.
CREATE TABLE inventory (
    id BIGSERIAL PRIMARY KEY,
    item_name VARCHAR(120) NOT NULL UNIQUE,
    quantity_on_hand INTEGER NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
    reorder_level INTEGER NOT NULL DEFAULT 0 CHECK (reorder_level >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Reserved for the planned equity and profit-distribution module.
CREATE TABLE investors (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id),
    initial_capital NUMERIC(16, 2) NOT NULL CHECK (initial_capital >= 0),
    equity_percentage NUMERIC(7, 4) NOT NULL CHECK (equity_percentage BETWEEN 0 AND 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE FUNCTION reject_financial_record_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION '% records are append-only and cannot be updated or deleted', TG_TABLE_NAME;
END;
$$;

CREATE TRIGGER sales_are_immutable
BEFORE UPDATE OR DELETE ON sales
FOR EACH ROW EXECUTE FUNCTION reject_financial_record_mutation();

CREATE TRIGGER expenses_are_immutable
BEFORE UPDATE OR DELETE ON expenses
FOR EACH ROW EXECUTE FUNCTION reject_financial_record_mutation();
