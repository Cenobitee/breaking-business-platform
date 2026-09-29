alter table investment_requests
    add column profit_percentage numeric(5, 2);

update investment_requests request
set profit_percentage = coalesce(
    (select package.profit_percentage
     from investment_packages package
     where package.business_id = (select investor.business_id from users investor where investor.id = request.investor_id)
       and package.amount = request.amount),
    0.00
);

alter table investment_requests
    alter column profit_percentage set not null;

alter table investment_transactions
    add column profit_percentage numeric(5, 2);

alter table investment_transactions
    disable trigger investment_transactions_are_immutable;

update investment_transactions transaction
set profit_percentage = request.profit_percentage
from investment_requests request
where request.id = transaction.request_id;

alter table investment_transactions
    enable trigger investment_transactions_are_immutable;

alter table investment_transactions
    alter column profit_percentage set not null;
