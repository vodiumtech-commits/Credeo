-- The WhatsApp flow moved from campus-only onboarding to community-based vendor onboarding,
-- and now asks for the customer's phone before amount.
-- Add the missing enum values safely for databases created from older migrations.
ALTER TYPE "WhatsAppState" ADD VALUE IF NOT EXISTS 'ONBOARDING_COMMUNITY';
ALTER TYPE "WhatsAppState" ADD VALUE IF NOT EXISTS 'ADDING_CREDIT_PHONE';
