CREATE TABLE chat_messages (
    id BIGSERIAL PRIMARY KEY,
    business_id BIGINT NOT NULL REFERENCES businesses(id),
    sender_id BIGINT NOT NULL REFERENCES users(id),
    recipient_id BIGINT NOT NULL REFERENCES users(id),
    body VARCHAR(2000) NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMPTZ,
    CONSTRAINT chat_sender_recipient_different CHECK (sender_id <> recipient_id)
);

CREATE INDEX idx_chat_conversation ON chat_messages(business_id, sender_id, recipient_id, sent_at);
CREATE INDEX idx_chat_unread ON chat_messages(recipient_id, read_at, sent_at);
