ALTER TABLE sales
    ADD COLUMN unit_cost_snapshot NUMERIC(12, 2);

DROP TRIGGER sales_are_immutable ON sales;

UPDATE sales s
SET unit_cost_snapshot = COALESCE(p.unit_cost, 0)
FROM catalog_products p
WHERE s.product_id = p.id
  AND s.unit_cost_snapshot IS NULL;

UPDATE sales
SET unit_cost_snapshot = 0
WHERE unit_cost_snapshot IS NULL;

ALTER TABLE sales
    ALTER COLUMN unit_cost_snapshot SET NOT NULL,
    ADD CONSTRAINT sales_unit_cost_snapshot_non_negative CHECK (unit_cost_snapshot >= 0);

CREATE TRIGGER sales_are_immutable
BEFORE UPDATE OR DELETE ON sales
FOR EACH ROW EXECUTE FUNCTION reject_financial_record_mutation();
