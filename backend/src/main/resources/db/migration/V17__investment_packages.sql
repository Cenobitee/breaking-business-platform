create table investment_packages (
    id bigserial primary key,
    business_id bigint not null references businesses(id) on delete cascade,
    amount numeric(16, 2) not null,
    profit_percentage numeric(5, 2) not null,
    constraint uq_investment_package_business_amount unique (business_id, amount),
    constraint ck_investment_package_amount_positive check (amount > 0),
    constraint ck_investment_package_percentage check (profit_percentage >= 0 and profit_percentage <= 100)
);

insert into investment_packages (business_id, amount, profit_percentage)
select id, package.amount, package.percentage
from businesses
cross join (values
    (10000.00, 20.00),
    (20000.00, 22.00),
    (50000.00, 25.00),
    (100000.00, 30.00)
) as package(amount, percentage);
