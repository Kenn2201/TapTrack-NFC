-- ============================================================================
-- TapTrack NFC — Seed Data
-- All data is FICTIONAL — no real people or organizations
-- ============================================================================

-- Fictional Test Users (password hash is for local dev testing only: TestPassword123!)
-- Admin
INSERT INTO users (email, password_hash, first_name, last_name, role, status, email_verified_at) VALUES
('admin.taptrack@yopmail.com', '$2b$10$PJcBXHH9BvzO3rfTqzBQtONWGsZi0RWhOTMVtT8OfTy20Hvpr9MMW', 'Alex', 'Admin', 'ADMIN', 'ACTIVE', NOW());

-- Operator
INSERT INTO users (email, password_hash, first_name, last_name, role, status, email_verified_at) VALUES
('operator.taptrack@yopmail.com', '$2b$10$PJcBXHH9BvzO3rfTqzBQtONWGsZi0RWhOTMVtT8OfTy20Hvpr9MMW', 'Jordan', 'Operator', 'OPERATOR', 'ACTIVE', NOW());

-- Regular Users
INSERT INTO users (email, password_hash, first_name, last_name, role, status, email_verified_at) VALUES
('alex.taptrack@yopmail.com', '$2b$10$PJcBXHH9BvzO3rfTqzBQtONWGsZi0RWhOTMVtT8OfTy20Hvpr9MMW', 'Alex', 'Rivera', 'USER', 'ACTIVE', NOW()),
('jamie.taptrack@yopmail.com', '$2b$10$PJcBXHH9BvzO3rfTqzBQtONWGsZi0RWhOTMVtT8OfTy20Hvpr9MMW', 'Jamie', 'Chen', 'USER', 'ACTIVE', NOW()),
('sam.taptrack@yopmail.com', '$2b$10$PJcBXHH9BvzO3rfTqzBQtONWGsZi0RWhOTMVtT8OfTy20Hvpr9MMW', 'Sam', 'Torres', 'USER', 'ACTIVE', NOW());

-- Events
INSERT INTO events (name, description, location, starts_at, ends_at, status, created_by) VALUES
('Developer Meetup', 'Monthly developer community meetup', 'Tech Hub Room A', '2026-09-25 18:00:00+08', '2026-09-25 21:00:00+08', 'UPCOMING', 1),
('NFC Workshop', 'Hands-on NFC technology workshop', 'Innovation Lab', '2026-09-28 09:00:00+08', '2026-09-28 17:00:00+08', 'DRAFT', 1),
('Demo Day', 'TapTrack NFC demonstration event', 'Main Auditorium', '2026-10-05 14:00:00+08', '2026-10-05 18:00:00+08', 'DRAFT', 1);

-- NFC Cards (token_hash values are placeholders — real tokens generated at runtime)
INSERT INTO nfc_cards (card_label, user_id, token_hash, status, issued_at, issued_by) VALUES
('NFC-001', 3, 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2', 'ACTIVE', NOW(), 1),
('NFC-002', 4, 'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3', 'ACTIVE', NOW(), 1),
('NFC-003', 5, 'c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4', 'ACTIVE', NOW(), 1),
('NFC-004', NULL, 'd4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5', 'UNASSIGNED', NULL, NULL),
('NFC-005', NULL, 'e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6', 'UNASSIGNED', NULL, NULL);

-- Event Participants
INSERT INTO event_participants (event_id, user_id) VALUES
(1, 3), (1, 4), (1, 5),
(2, 3), (2, 4);
