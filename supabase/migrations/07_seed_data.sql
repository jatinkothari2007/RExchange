-- ====================================================================
-- RExchange Supabase Migration 07: Comprehensive Demo Seed Data
-- ====================================================================

-- 1. SEED CAMPUS USERS (~15 Students)
-- Note: auth_id is set to NULL for mock demo users so it bypasses foreign key checks against auth.users
INSERT INTO public.users (id, name, email, department, year, hostel_block, reputation_score, karma_balance, current_streak)
VALUES
    ('11111111-0000-0000-0000-000000000001', 'Aarav Sharma', 'aarav.sharma@srmist.edu.in', 'Computer Science & Engineering', 3, 'Java Block 3', 4.9, 145, 4),
    ('11111111-0000-0000-0000-000000000002', 'Priya Nair', 'priya.nair@srmist.edu.in', 'Electronics & Communication', 3, 'KC Block B', 4.8, 120, 3),
    ('11111111-0000-0000-0000-000000000003', 'Rohan Gupta', 'rohan.gupta@srmist.edu.in', 'Biotechnology', 4, 'Adhiyaman Block', 4.7, 190, 5),
    ('11111111-0000-0000-0000-000000000004', 'Sneha Reddy', 'sneha.reddy@srmist.edu.in', 'Information Technology', 2, 'MKN Block', 4.6, 85, 2),
    ('11111111-0000-0000-0000-000000000005', 'Karthik Raja', 'karthik.raja@srmist.edu.in', 'Mechanical Engineering', 3, 'Java Block 1', 4.5, 60, 1),
    ('11111111-0000-0000-0000-000000000006', 'Ananya Verma', 'ananya.verma@srmist.edu.in', 'Electrical & Electronics', 2, 'KC Block A', 4.8, 95, 2),
    ('11111111-0000-0000-0000-000000000007', 'Vikram Singh', 'vikram.singh@srmist.edu.in', 'Civil Engineering', 4, 'Nelson Mandela Block', 4.4, 110, 3),
    ('11111111-0000-0000-0000-000000000008', 'Diya Menon', 'diya.menon@srmist.edu.in', 'Aerospace Engineering', 1, 'MKN Block', 4.9, 45, 1),
    ('11111111-0000-0000-0000-000000000009', 'Aditya Joshi', 'aditya.joshi@srmist.edu.in', 'Data Science & AI', 3, 'Java Block 4', 4.7, 130, 4),
    ('11111111-0000-0000-0000-000000000010', 'Meera Pillai', 'meera.pillai@srmist.edu.in', 'Chemical Engineering', 2, 'KC Block C', 4.6, 75, 2),
    ('11111111-0000-0000-0000-000000000011', 'Siddharth Roy', 'siddharth.roy@srmist.edu.in', 'Computer Science & Engineering', 1, 'Java Block 2', 4.3, 35, 1),
    ('11111111-0000-0000-0000-000000000012', 'Pooja Hegde', 'pooja.hegde@srmist.edu.in', 'Biomedical Engineering', 3, 'Adhiyaman Block', 4.8, 105, 3),
    ('11111111-0000-0000-0000-000000000013', 'Varun Deshmukh', 'varun.deshmukh@srmist.edu.in', 'Mechatronics', 4, 'Java Block 3', 4.9, 210, 6),
    ('11111111-0000-0000-0000-000000000014', 'Kavya Raman', 'kavya.raman@srmist.edu.in', 'Automobile Engineering', 2, 'MKN Block', 4.5, 70, 1),
    ('11111111-0000-0000-0000-000000000015', 'Nikhil Kumar', 'nikhil.kumar@srmist.edu.in', 'Cyber Security', 3, 'Java Block 1', 4.7, 150, 4)
ON CONFLICT (id) DO NOTHING;


-- 2. SEED MIXED LISTINGS (~30 Listings)
INSERT INTO public.listings (id, owner_id, type, title, description, category, tags, karma_value, status, pickup_point, expires_at)
VALUES
    -- Items
    ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'item', 'Casio fx-991EX ClassWiz Scientific Calculator', 'Solar powered, ideal for Engineering Maths I & II. Excellent condition.', 'Electronics & Lab Equipment', ARRAY['calculator', 'maths', 'casio'], 35, 'available', 'Java Block 3 Lobby', NOW() + INTERVAL '30 days'),
    ('22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000002', 'item', 'Engineering Mini Drafter + Sheet Holder Tube', 'Complete mechanical drafting kit for 1st year graphics lab. Spotless condition.', 'Electronics & Lab Equipment', ARRAY['graphics', 'drafter', 'mechanical'], 25, 'available', 'KC Block B Entrance', NOW() + INTERVAL '25 days'),
    ('22222222-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000003', 'item', 'ESP32 IoT Development Kit + Jumper Wires', 'Dual core Wi-Fi/Bluetooth board with breadboard & sensor modules.', 'Electronics & Lab Equipment', ARRAY['esp32', 'iot', 'hardware', 'sih'], 30, 'available', 'Adhiyaman Block Lounge', NOW() + INTERVAL '20 days'),
    ('22222222-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000005', 'item', 'Cotton Lab Coat (Size L) - Chemistry & Workshop', 'Standard white lab coat, clean condition.', 'Electronics & Lab Equipment', ARRAY['labcoat', 'chemistry', 'workshop'], 15, 'available', 'Java Block 1', NOW() + INTERVAL '15 days'),
    ('22222222-0000-0000-0000-000000000007', '11111111-0000-0000-0000-000000000007', 'item', 'Digital Multimeter with Test Probes', 'Accurate voltage & resistance tester for BEE lab practicals.', 'Electronics & Lab Equipment', ARRAY['multimeter', 'bee', 'circuits'], 20, 'available', 'Nelson Mandela Block', NOW() + INTERVAL '18 days'),

    -- Notes
    ('22222222-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000002', 'note', 'Handwritten Operating Systems End-Sem Notes', 'Complete spiral copy covering Semaphore algorithms, Deadlocks & Paging.', 'Study Notes & Academics', ARRAY['os', 'cse', 'handwritten', 'notes'], 20, 'available', 'Central Library Bench', NOW() + INTERVAL '40 days'),
    ('22222222-0000-0000-0000-000000000006', '11111111-0000-0000-0000-000000000003', 'note', 'Molecular Biology & Genetics Formula Sheet', 'Concise diagrams for PCR, CRISPR mechanisms and gene mapping.', 'Study Notes & Academics', ARRAY['biotech', 'genetics', 'notes'], 15, 'available', 'Adhiyaman Block', NOW() + INTERVAL '35 days'),
    ('22222222-0000-0000-0000-000000000008', '11111111-0000-0000-0000-000000000009', 'note', 'Machine Learning & Neural Nets Exam Summary', 'Formulae, backpropagation derivations and PyTorch code snippets.', 'Study Notes & Academics', ARRAY['ml', 'ai', 'pytorch'], 25, 'available', 'Java Block 4', NOW() + INTERVAL '45 days'),
    ('22222222-0000-0000-0000-000000000010', '11111111-0000-0000-0000-000000000010', 'note', 'Thermodynamics & Heat Transfer Solved Question Bank', 'Previous 5 year end-sem question solutions with step-by-step working.', 'Study Notes & Academics', ARRAY['thermo', 'mechanical', 'chem'], 20, 'available', 'KC Block C', NOW() + INTERVAL '30 days'),

    -- Tickets
    ('22222222-0000-0000-0000-000000000011', '11111111-0000-0000-0000-000000000003', 'ticket', 'Milan 2026 EDM Pro-Nite VIP Pass', 'Extra wristband for main stage DJ pro-nite. Can meet at gate.', 'Campus Events & Cultural', ARRAY['milan', 'pass', 'pronite'], 30, 'available', 'TP Ganesan Auditorium Gate 2', NOW() + INTERVAL '5 days'),
    ('22222222-0000-0000-0000-000000000012', '11111111-0000-0000-0000-000000000013', 'ticket', 'TEDxSRMIST 2026 Early Bird Entry Ticket', 'Pass for all 6 speaker keynotes and networking lunch session.', 'Campus Events & Cultural', ARRAY['tedx', 'conference', 'ticket'], 25, 'available', 'Tech Park FabLab', NOW() + INTERVAL '12 days'),

    -- Skills & Tutoring
    ('22222222-0000-0000-0000-000000000013', '11111111-0000-0000-0000-000000000001', 'skill', '1-on-1 React & TypeScript Architecture Mentorship', '60-min interactive session covering state management, custom hooks and clean API layering.', 'Skills & Mentorship', ARRAY['react', 'typescript', 'tutoring'], 40, 'available', 'UB 3rd Floor Co-working Area', NOW() + INTERVAL '60 days'),
    ('22222222-0000-0000-0000-000000000014', '11111111-0000-0000-0000-000000000002', 'skill', 'DSP & Signals & Systems Problem Solving Session', '45-min tutoring on FFT, Z-transforms and pole-zero plots.', 'Skills & Mentorship', ARRAY['dsp', 'ece', 'tutoring'], 35, 'available', 'KC Block B Study Lounge', NOW() + INTERVAL '50 days'),
    ('22222222-0000-0000-0000-000000000015', '11111111-0000-0000-0000-000000000009', 'skill', 'Python Data Processing & Pandas Crash Course', 'Learn DataFrames, vectorized operations and visualization in 60 mins.', 'Skills & Mentorship', ARRAY['python', 'pandas', 'datascience'], 30, 'available', 'Java Block 4', NOW() + INTERVAL '40 days'),

    -- Opportunities
    ('22222222-0000-0000-0000-000000000016', '11111111-0000-0000-0000-000000000004', 'opportunity', 'Shortlisted SIH Hardware Team - Looking for 1 Embedded C Dev', 'Grand finale qualified team needs 1 member for ESP32 firmware development.', 'Opportunities & Gigs', ARRAY['sih', 'hackathon', 'hardware'], 15, 'available', 'Tech Park 6th Floor', NOW() + INTERVAL '10 days')
ON CONFLICT (id) DO NOTHING;


-- 3. SEED URGENT NEEDS (5 Needs with varying deadlines & urgency)
INSERT INTO public.needs (id, requester_id, title, description, category, tags, deadline, urgency_score, status, hostel_block)
VALUES
    ('33333333-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000004', 'Urgently Need Casio fx-991EX for Maths III Exam Tomorrow', 'Lost my calculator in central library. Need one for 4 hours tomorrow 9 AM.', 'Electronics & Lab Equipment', ARRAY['urgent', 'calculator', 'exam'], NOW() + INTERVAL '14 hours', 7.14, 'open', 'MKN Block'),
    ('33333333-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000006', 'Need Breadboard & Jumper Wires for EC102 Lab Practical', 'Lab test at 2 PM today. Will return immediately after test.', 'Electronics & Lab Equipment', ARRAY['urgent', 'breadboard', 'ece'], NOW() + INTERVAL '5 hours', 20.00, 'open', 'KC Block A'),
    ('33333333-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000008', 'Looking for Handwritten Aerospace Structures Notes', 'Preparing for surprise cat test. Need unit 3 & 4 summary notes.', 'Study Notes & Academics', ARRAY['aerospace', 'notes', 'cat'], NOW() + INTERVAL '24 hours', 4.16, 'open', 'MKN Block'),
    ('33333333-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000011', 'Need White Lab Coat (Size M) for Chemistry Lab Today', 'Forgot lab coat at home. Need for 2 hours chemistry practical at 11 AM.', 'Electronics & Lab Equipment', ARRAY['labcoat', 'chemistry', 'urgent'], NOW() + INTERVAL '3 hours', 33.33, 'open', 'Java Block 2'),
    ('33333333-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000012', '1-on-1 Mock Interview Help for Campus Placement', 'Need CSE senior to review resume and conduct mock technical interview tonight.', 'Skills & Mentorship', ARRAY['interview', 'placement', 'mock'], NOW() + INTERVAL '8 hours', 12.50, 'open', 'Adhiyaman Block')
ON CONFLICT (id) DO NOTHING;


-- 4. SEED COMPLETED EXCHANGES, IMPACT LOG & RATINGS (Populated telemetry for demo)
INSERT INTO public.exchanges (id, listing_id, giver_id, receiver_id, karma_value, status, handoff_confirmed_giver, handoff_confirmed_receiver, created_at, completed_at)
VALUES
    ('eeeeeeee-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000004', 35, 'completed', true, true, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
    ('eeeeeeee-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', 20, 'completed', true, true, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
    ('eeeeeeee-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000013', '11111111-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000003', 40, 'completed', true, true, NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days')
ON CONFLICT (id) DO NOTHING;

-- Seed Impact Logs
INSERT INTO public.impact_log (id, exchange_id, money_saved_estimate, waste_diverted_kg, hours_contributed, created_at)
VALUES
    ('55555555-0000-0000-0000-000000000001', 'eeeeeeee-0000-0000-0000-000000000001', 1450, 1.2, 0.0, NOW() - INTERVAL '5 days'),
    ('55555555-0000-0000-0000-000000000002', 'eeeeeeee-0000-0000-0000-000000000002', 450, 0.5, 0.0, NOW() - INTERVAL '10 days'),
    ('55555555-0000-0000-0000-000000000003', 'eeeeeeee-0000-0000-0000-000000000003', 800, 0.0, 1.0, NOW() - INTERVAL '8 days')
ON CONFLICT (id) DO NOTHING;

-- Seed Ratings
INSERT INTO public.ratings (id, exchange_id, rater_id, ratee_id, score, tags, comment, created_at)
VALUES
    ('66666666-0000-0000-0000-000000000001', 'eeeeeeee-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000001', 5, ARRAY['on time', 'item as described', 'friendly'], 'Calculator worked great! Saved my exam.', NOW() - INTERVAL '5 days'),
    ('66666666-0000-0000-0000-000000000002', 'eeeeeeee-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000002', 5, ARRAY['great notes', 'on time'], 'Super clear OS notes. Semaphore diagrams were top notch.', NOW() - INTERVAL '10 days'),
    ('66666666-0000-0000-0000-000000000003', 'eeeeeeee-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001', 5, ARRAY['great teacher', 'patient', 'deep tech knowledge'], 'Aarav helped debug my React project and setup TypeScript hooks cleanly.', NOW() - INTERVAL '8 days')
ON CONFLICT (id) DO NOTHING;
