ALTER TABLE catalog_products
    ADD COLUMN stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    ADD COLUMN low_stock_threshold INTEGER NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0);

ALTER TABLE sales
    ADD COLUMN product_id BIGINT REFERENCES catalog_products(id) ON DELETE SET NULL;

CREATE INDEX idx_sales_product ON sales(product_id);
