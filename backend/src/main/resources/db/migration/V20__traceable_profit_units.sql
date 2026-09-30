alter table investment_packages
    add column earning_max_percentage numeric(5, 2) not null default 25.00,
    add column duration_months integer not null default 6,
    add column total_units integer not null default 100,
    add column committed_units integer not null default 0;

update investment_packages
set earning_max_percentage = least(profit_percentage + 3.00, 100.00);

alter table investment_packages
    add constraint ck_package_earning_range
        check (profit_percentage >= 0 and earning_max_percentage >= profit_percentage),
    add constraint ck_package_duration check (duration_months between 1 and 60),
    add constraint ck_package_units check (total_units > 0 and committed_units between 0 and total_units);

alter table investment_requests
    add column package_id bigint references investment_packages(id),
    add column unit_price numeric(16, 2),
    add column quantity integer not null default 1,
    add column earning_max_percentage numeric(5, 2),
    add column duration_months integer not null default 1;

update investment_requests
set unit_price = amount,
    earning_max_percentage = profit_percentage;

alter table investment_requests
    alter column unit_price set not null,
    alter column earning_max_percentage set not null,
    add constraint ck_investment_request_quantity check (quantity > 0),
    add constraint ck_investment_request_duration check (duration_months between 1 and 60);

alter table investment_transactions
    add column unit_price numeric(16, 2),
    add column quantity integer not null default 1,
    add column earning_max_percentage numeric(5, 2),
    add column duration_months integer not null default 1;

update investment_transactions itx
set unit_price = itx.amount,
    earning_max_percentage = itx.profit_percentage;

alter table investment_transactions
    alter column unit_price set not null,
    alter column earning_max_percentage set not null;
