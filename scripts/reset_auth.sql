DELETE FROM "session";
DELETE FROM "account";
DELETE FROM "verificationToken";
DELETE FROM "user";
DELETE FROM "tenants";

INSERT INTO "tenants" (name, slug, stripe_customer_id, subscription_status, created_at, updated_at)
VALUES ('Imobiliária Confiança', 'confianca', 'cus_test_123', 'active', NOW(), NOW());
