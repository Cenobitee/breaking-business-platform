CREATE TABLE employees (
    id BIGSERIAL PRIMARY KEY,
    business_id BIGINT NOT NULL REFERENCES businesses(id),
    name VARCHAR(120) NOT NULL,
    position VARCHAR(120) NOT NULL,
    address VARCHAR(300) NOT NULL,
    nid VARCHAR(40) NOT NULL,
    phone VARCHAR(40) NOT NULL,
    shift VARCHAR(80) NOT NULL,
    salary NUMERIC(14,2) NOT NULL CHECK (salary >= 0),
    joining_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_employee_nid_per_business UNIQUE (business_id, nid)
);

CREATE INDEX idx_employees_business_name ON employees(business_id, name);
