-- Quick Migration: Update Categories in Supabase Cloud
-- Run in Supabase SQL Editor if you want to apply immediately:

delete from public.categories 
where name in (
  'Books & Study Supplies',
  'Entertainment & Hanging Out',
  'Food & Canteen',
  'Gifts & Side Hustles',
  'Pocket Money / Allowance',
  'Subscriptions',
  'Transport & Commute'
);

insert into public.categories (user_id, name, type, color) values
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Allowance', 'income', '#10b981'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Stationary', 'expense', '#8b5cf6'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Junk Food', 'expense', '#f97316'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Vegetable', 'expense', '#22c55e'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Fruits', 'expense', '#ef4444'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Juice', 'expense', '#eab308'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Commute', 'expense', '#3b82f6'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Subscription', 'expense', '#ec4899'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Personal & Misc', 'expense', '#64748b')
on conflict (user_id, name, type) do nothing;
