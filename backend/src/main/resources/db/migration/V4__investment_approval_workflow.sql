CREATE TABLE investment_requests (
    id BIGSERIAL PRIMARY KEY,
    investor_id BIGINT NOT NULL REFERENCES users(id),
    amount NUMERIC(16, 2) NOT NULL CHECK (amount >= 1.00),
    status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'APPROVED')),
    requested_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMPTZ,
    approved_by BIGINT REFERENCES users(id),
    CONSTRAINT investment_request_approval_consistency CHECK (
        (status = 'PENDING' AND approved_at IS NULL AND approved_by IS NULL)
        OR (status = 'APPROVED' AND approved_at IS NOT NULL AND approved_by IS NOT NULL)
    )
);

CREATE INDEX idx_investment_requests_investor ON investment_requests(investor_id, requested_at DESC);
CREATE INDEX idx_investment_requests_pending ON investment_requests(status, requested_at);

CREATE TABLE investment_transactions (
    id BIGSERIAL PRIMARY KEY,
    request_id BIGINT NOT NULL UNIQUE REFERENCES investment_requests(id),
    investor_id BIGINT NOT NULL REFERENCES users(id),
    amount NUMERIC(16, 2) NOT NULL CHECK (amount >= 1.00),
    invested_at TIMESTAMPTZ NOT NULL,
    approved_by BIGINT NOT NULL REFERENCES users(id)
);

CREATE INDEX idx_investment_transactions_investor ON investment_transactions(investor_id, invested_at DESC);

CREATE TRIGGER investment_transactions_are_immutable
BEFORE UPDATE OR DELETE ON investment_transactions
FOR EACH ROW EXECUTE FUNCTION reject_financial_record_mutation();
