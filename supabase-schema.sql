-- ============================================================
-- SSI Billing – Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Clients
create table if not exists clients (
  id          text primary key,
  name        text not null default '',
  project_name     text not null default '',
  project_address  text not null default '',
  city_province    text not null default '',
  attention   text not null default '',
  email       text not null default '',
  phone       text not null default '',
  notes       text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 2. Invoices
create table if not exists invoices (
  id              text primary key,
  invoice_number  text not null default '',
  client_id       text not null default '',
  invoice_date    text not null default '',
  due_date        text not null default '',
  status          text not null default 'draft',
  line_items      jsonb not null default '[]'::jsonb,
  discount        numeric not null default 0,
  discount_type   text not null default 'fixed',
  notes           text not null default '',
  sent_date       text,
  paid_date       text,
  paid_amount     numeric,
  reminder_sent_dates jsonb not null default '[]'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- 3. Service Templates
create table if not exists service_templates (
  id           text primary key,
  name         text not null default '',
  description  text not null default '',
  default_rate numeric not null default 0,
  created_at   timestamptz not null default now()
);

-- 4. Settings (singleton row with id = 'default')
create table if not exists settings (
  id                       text primary key,
  company_name             text not null default '',
  address                  text not null default '',
  city_province            text not null default '',
  gst_number               text not null default '',
  gst_rate                 numeric not null default 5,
  beneficiary_name         text not null default '',
  cheque_payable_to        text not null default '',
  etransfer_email          text not null default '',
  contact_email            text not null default '',
  phone                    text not null default '',
  default_payment_term_days integer not null default 21,
  default_hourly_rate      numeric not null default 0,
  invoice_prefix           text not null default '',
  next_invoice_number      integer not null default 75001,
  logo_url                 text
);

-- 5. Reminders
create table if not exists reminders (
  id              text primary key,
  invoice_id      text not null default '',
  type            text not null default 'send',
  due_date        text not null default '',
  completed       boolean not null default false,
  completed_date  text,
  notes           text not null default '',
  created_at      timestamptz not null default now()
);

-- ============================================================
-- Row Level Security (RLS)
-- Using anon key = full access (single-user app).
-- Enable RLS but allow all operations for authenticated/anon.
-- ============================================================

alter table clients enable row level security;
alter table invoices enable row level security;
alter table service_templates enable row level security;
alter table settings enable row level security;
alter table reminders enable row level security;

-- Allow full access for anon (single-user billing app)
create policy "Allow all on clients"          on clients          for all using (true) with check (true);
create policy "Allow all on invoices"          on invoices          for all using (true) with check (true);
create policy "Allow all on service_templates" on service_templates for all using (true) with check (true);
create policy "Allow all on settings"          on settings          for all using (true) with check (true);
create policy "Allow all on reminders"         on reminders         for all using (true) with check (true);

-- ============================================================
-- Seed default settings
-- ============================================================
insert into settings (
  id, company_name, address, city_province, gst_number, gst_rate,
  beneficiary_name, cheque_payable_to, etransfer_email, contact_email,
  phone, default_payment_term_days, default_hourly_rate, invoice_prefix, next_invoice_number
) values (
  'default',
  'SSI Construction Management Inc.',
  '4415 11th Ave NW',
  'Edmonton Ab. T6L6M7',
  '78059 3620RT001',
  5,
  'Parmjit Kandola',
  'SSI Construction Management Inc.',
  'kandola.parm@gmail.com',
  'kandola.parm@gmail.com',
  '',
  21,
  0,
  '',
  75001
) on conflict (id) do nothing;
