CREATE TABLE investment_package_images (
    package_id BIGINT NOT NULL REFERENCES investment_packages(id) ON DELETE CASCADE,
    display_order INTEGER NOT NULL,
    image_data_url TEXT NOT NULL,
    PRIMARY KEY (package_id, display_order)
);

INSERT INTO investment_package_images (package_id, display_order, image_data_url)
SELECT id, 0, image_data_url
FROM investment_packages
WHERE image_data_url IS NOT NULL;
