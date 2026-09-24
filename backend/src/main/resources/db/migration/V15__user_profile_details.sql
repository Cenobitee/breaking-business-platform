ALTER TABLE users
    ADD COLUMN contact_email VARCHAR(254),
    ADD COLUMN phone VARCHAR(40),
    ADD COLUMN address VARCHAR(500),
    ADD COLUMN profile_image_data_url TEXT;

UPDATE users SET contact_email = email WHERE contact_email IS NULL;
