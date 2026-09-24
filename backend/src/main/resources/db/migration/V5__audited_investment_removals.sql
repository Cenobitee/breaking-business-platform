CREATE TABLE investment_removals (
    id BIGSERIAL PRIMARY KEY,
    transaction_id BIGINT NOT NULL UNIQUE REFERENCES investment_transactions(id),
    investor_id BIGINT NOT NULL REFERENCES users(id),
    amount NUMERIC(16, 2) NOT NULL CHECK (amount >= 1.00),
    removed_at TIMESTAMPTZ NOT NULL,
    removed_by BIGINT NOT NULL REFERENCES users(id)
);

CREATE INDEX idx_investment_removals_investor ON investment_removals(investor_id, removed_at DESC);

CREATE TRIGGER investment_removals_are_immutable
BEFORE UPDATE OR DELETE ON investment_removals
FOR EACH ROW EXECUTE FUNCTION reject_financial_record_mutation();
