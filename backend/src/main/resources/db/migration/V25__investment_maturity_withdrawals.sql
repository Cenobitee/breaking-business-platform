ALTER TABLE investment_cycles
    ADD COLUMN withdrawn_at TIMESTAMPTZ;

ALTER TABLE investment_cycles
    DROP CONSTRAINT ck_investment_cycle_status,
    ADD CONSTRAINT ck_investment_cycle_status
        CHECK (status IN ('ACTIVE', 'COMPLETED', 'WITHDRAWN'));
