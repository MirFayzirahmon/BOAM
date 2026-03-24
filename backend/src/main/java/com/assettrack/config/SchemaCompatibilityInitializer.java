package com.assettrack.config;

import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class SchemaCompatibilityInitializer {

    @Bean
    ApplicationRunner ensureEmployeeInviteColumns(JdbcTemplate jdbcTemplate) {
        return args -> {
            jdbcTemplate.execute("""
                    ALTER TABLE employees
                      ADD COLUMN IF NOT EXISTS phone TEXT,
                      ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ACTIVE',
                      ADD COLUMN IF NOT EXISTS invited_by TEXT,
                      ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ
                    """);

            jdbcTemplate.execute("""
                    DO $$
                    BEGIN
                      IF NOT EXISTS (
                        SELECT 1
                        FROM pg_constraint
                        WHERE conname = 'employees_status_check'
                      ) THEN
                        ALTER TABLE employees
                          ADD CONSTRAINT employees_status_check
                          CHECK (status IN ('ACTIVE', 'PENDING_INVITE', 'INACTIVE'));
                      END IF;
                    END $$;
                    """);

            jdbcTemplate.execute("""
                    CREATE TABLE IF NOT EXISTS asset_requests (
                      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                      requester_email TEXT NOT NULL,
                      requester_name TEXT NOT NULL,
                      request_type TEXT NOT NULL DEFAULT 'NEW_ASSET_PURCHASE',
                      asset_name TEXT NOT NULL,
                      asset_type TEXT NOT NULL,
                      category TEXT NOT NULL DEFAULT 'Other',
                      target_asset_id UUID,
                      requested_status TEXT,
                      justification TEXT NOT NULL,
                      procurement_required BOOLEAN NOT NULL DEFAULT FALSE,
                      status TEXT NOT NULL DEFAULT 'PENDING',
                      admin_notes TEXT,
                      reviewed_by TEXT,
                      created_at TIMESTAMPTZ DEFAULT NOW(),
                      reviewed_at TIMESTAMPTZ
                    )
                    """);

            jdbcTemplate.execute("""
                    ALTER TABLE asset_requests
                      ADD COLUMN IF NOT EXISTS request_type TEXT NOT NULL DEFAULT 'NEW_ASSET_PURCHASE',
                      ADD COLUMN IF NOT EXISTS target_asset_id UUID,
                      ADD COLUMN IF NOT EXISTS requested_status TEXT,
                      ADD COLUMN IF NOT EXISTS procurement_required BOOLEAN NOT NULL DEFAULT FALSE
                    """);

            jdbcTemplate.execute("""
                    CREATE TABLE IF NOT EXISTS profile_update_requests (
                      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                      employee_email TEXT NOT NULL,
                      full_name_requested TEXT,
                      phone_requested TEXT,
                      department_requested TEXT,
                      branch_requested TEXT,
                      reason TEXT NOT NULL,
                      status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
                      admin_notes TEXT,
                      reviewed_by TEXT,
                      created_at TIMESTAMPTZ DEFAULT NOW(),
                      reviewed_at TIMESTAMPTZ
                    )
                    """);

            jdbcTemplate.execute("""
                    DO $$
                    BEGIN
                      IF EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'asset_history' AND column_name = 'old_status'
                      ) THEN
                        ALTER TABLE asset_history
                          ALTER COLUMN old_status TYPE TEXT USING old_status::text;
                      END IF;
                      IF EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'asset_history' AND column_name = 'new_status'
                      ) THEN
                        ALTER TABLE asset_history
                          ALTER COLUMN new_status TYPE TEXT USING new_status::text;
                      END IF;
                      IF EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'assets' AND column_name = 'category'
                      ) THEN
                        ALTER TABLE assets
                          ALTER COLUMN category TYPE TEXT USING category::text;
                      END IF;
                      IF EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'assets' AND column_name = 'status'
                      ) THEN
                        ALTER TABLE assets
                          ALTER COLUMN status TYPE TEXT USING status::text;
                      END IF;
                    END $$;
                    """);
        };
    }
}
