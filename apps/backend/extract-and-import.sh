#!/bin/bash

# Ensure these variables are set
SUPABASE_DB_URL=${SUPABASE_DB_URL:-"postgresql://postgres:PASSWORD@db.pryajpxntjyddzscwltf.supabase.co:5432/postgres"}
NEON_DB_URL="postgresql://neondb_owner:npg_TwploF0rZP3z@ep-fragrant-star-aopy2h8u-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true"

echo "Extracting data from Supabase..."
# Use pg_dump to extract only the application tables as INSERT statements
pg_dump "$SUPABASE_DB_URL" -n public --data-only --column-inserts \
  -t users \
  -t leave_balances \
  -t attendance_records \
  -t leave_requests \
  -t overtime_requests \
  -t document_chunks \
  -t chat_logs > data_dump.sql

if [ $? -ne 0 ]; then
    echo "Failed to extract data. Please check your SUPABASE_DB_URL."
    exit 1
fi

echo "Cleaning data (Renaming overtime_requests to overtime_records)..."
# The Prisma schema maps OvertimeRecord to overtime_records, but Supabase exported overtime_requests
sed -i.bak 's/INTO public.overtime_requests/INTO public.overtime_records/g' data_dump.sql
sed -i.bak 's/INTO "public"."overtime_requests"/INTO "public"."overtime_records"/g' data_dump.sql
sed -i.bak 's/INTO overtime_requests/INTO overtime_records/g' data_dump.sql

echo "Importing data into NeonDB..."
# Use psql to run the inserts on NeonDB
psql "$NEON_DB_URL" -f data_dump.sql

echo "Data migration complete! Please run 'npm run start' to validate your application."
