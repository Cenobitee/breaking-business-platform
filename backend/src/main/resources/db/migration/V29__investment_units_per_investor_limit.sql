ALTER TABLE investment_packages
    ADD COLUMN max_units_per_investor INTEGER;

UPDATE investment_packages
SET max_units_per_investor = total_units;

ALTER TABLE investment_packages
    ALTER COLUMN max_units_per_investor SET NOT NULL,
    ADD CONSTRAINT ck_investment_max_units_per_investor
        CHECK (max_units_per_investor >= 1 AND max_units_per_investor <= total_units);
