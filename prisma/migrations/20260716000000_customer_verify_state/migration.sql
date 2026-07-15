-- Verification state for reusing an existing customer's number across shops.
ALTER TYPE "WhatsAppState" ADD VALUE IF NOT EXISTS 'VERIFYING_CUSTOMER';
