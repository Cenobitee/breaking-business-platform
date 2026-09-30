alter table investment_packages
    add column project_name varchar(140) not null default 'Business growth project',
    add column purpose varchar(500) not null default 'Fund a specific business asset or expansion.',
    add column funding_target numeric(16, 2);

update investment_packages
set funding_target = amount * total_units;

alter table investment_packages
    alter column funding_target set not null,
    add constraint ck_investment_project_target check (funding_target > 0);

create table investment_package_products (
    package_id bigint not null references investment_packages(id) on delete cascade,
    product_id bigint not null references catalog_products(id) on delete cascade,
    primary key (package_id, product_id)
);
