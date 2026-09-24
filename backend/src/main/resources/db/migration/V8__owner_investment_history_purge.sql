CREATE FUNCTION reject_investment_record_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF current_setting('app.allow_investment_purge', TRUE) = 'true' AND TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RAISE EXCEPTION '% records are append-only and cannot be updated or deleted', TG_TABLE_NAME;
END;
$$;

DROP TRIGGER investment_transactions_are_immutable ON investment_transactions;
CREATE TRIGGER investment_transactions_are_immutable
BEFORE UPDATE OR DELETE ON investment_transactions
FOR EACH ROW EXECUTE FUNCTION reject_investment_record_mutation();

DROP TRIGGER investment_removals_are_immutable ON investment_removals;
CREATE TRIGGER investment_removals_are_immutable
BEFORE UPDATE OR DELETE ON investment_removals
FOR EACH ROW EXECUTE FUNCTION reject_investment_record_mutation();
