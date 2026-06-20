-- Sample specialists so the Directory has something to show in local/dev environments.
insert into public.specialists
  (name, specialty_type, practice_name, zip_code, city, state, phone, website, insurance_accepted, telehealth, notes)
values
  ('Dr. Maria Chen', 'developmental_pediatrician', 'Bright Path Pediatrics', '94110', 'San Francisco', 'CA', '415-555-0142', 'https://brightpathpeds.example.com', array['Aetna', 'Blue Shield CA', 'Medicaid'], false, 'Accepting new patients, ~3 month wait.'),
  ('Sunrise ABA Therapy', 'aba', 'Sunrise Behavioral Health', '94103', 'San Francisco', 'CA', '415-555-0199', 'https://sunriseaba.example.com', array['Aetna', 'Cigna', 'Kaiser'], true, 'In-home and clinic-based sessions.'),
  ('Jamie Patel, M.S. CCC-SLP', 'speech', 'Clear Voice Speech Therapy', '94114', 'San Francisco', 'CA', '415-555-0177', 'https://clearvoiceslp.example.com', array['Blue Shield CA', 'United Healthcare'], true, 'Specializes in AAC and apraxia.'),
  ('Little Steps OT', 'ot', 'Little Steps Pediatric Therapy', '94107', 'San Francisco', 'CA', '415-555-0163', null, array['Medicaid', 'Aetna'], false, 'Sensory integration focus.'),
  ('Feeding Matters Clinic', 'feeding', null, '94109', 'San Francisco', 'CA', '415-555-0188', 'https://feedingmatters.example.com', array['Cigna'], true, 'Multi-disciplinary feeding team.'),
  ('Dr. Aaron Lee', 'neurology', 'Bay Area Pediatric Neurology', '94115', 'San Francisco', 'CA', '415-555-0121', null, array['Kaiser', 'Aetna', 'Blue Shield CA'], false, null),
  ('Hopeful Minds Psychology', 'psychology', null, '94102', 'San Francisco', 'CA', '415-555-0155', 'https://hopefulminds.example.com', array['United Healthcare', 'Medicaid'], true, 'ADOS-2 and cognitive testing.');
