CREATE TABLE sale_cancellations (
    id BIGSERIAL PRIMARY KEY,
    sale_id BIGINT NOT NULL UNIQUE REFERENCES sales(id),
    cancelled_by BIGINT NOT NULL REFERENCES users(id),
    reason VARCHAR(240) NOT NULL,
    cancelled_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sale_cancellations_cancelled_at ON sale_cancellations(cancelled_at);

CREATE TRIGGER sale_cancellations_are_immutable
BEFORE UPDATE OR DELETE ON sale_cancellations
FOR EACH ROW EXECUTE FUNCTION reject_financial_record_mutation();
