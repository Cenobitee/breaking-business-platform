create table investment_cycles (
    id bigserial primary key,
    transaction_id bigint not null unique references investment_transactions(id),
    starts_at timestamptz not null,
    ends_at timestamptz not null,
    status varchar(20) not null default 'ACTIVE',
    completed_at timestamptz,
    completed_by bigint references users(id),
    final_revenue numeric(16, 2),
    final_expenses numeric(16, 2),
    distributable_profit numeric(16, 2),
    investor_profit numeric(16, 2),
    constraint ck_investment_cycle_dates check (ends_at > starts_at),
    constraint ck_investment_cycle_status check (status in ('ACTIVE', 'COMPLETED'))
);

insert into investment_cycles (transaction_id, starts_at, ends_at)
select itx.id, itx.invested_at, itx.invested_at + interval '30 days'
from investment_transactions itx
where not exists (
    select 1 from investment_removals removal where removal.transaction_id = itx.id
);

create index idx_investment_cycles_status_end on investment_cycles(status, ends_at);
