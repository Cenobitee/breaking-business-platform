CREATE TABLE expense_cancellations (
    id BIGSERIAL PRIMARY KEY,
    expense_id BIGINT NOT NULL UNIQUE REFERENCES expenses(id),
    cancelled_by BIGINT NOT NULL REFERENCES users(id),
    reason VARCHAR(240) NOT NULL,
    cancelled_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_expense_cancellations_expense ON expense_cancellations(expense_id);
