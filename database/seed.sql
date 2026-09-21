-- ============================================================================
-- TapTrack NFC — Seed Data
-- All data is FICTIONAL — no real people or organizations
-- ============================================================================

-- Admin user (password: Admin@2026!)
INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES
('admin@taptrack.demo', '$2b$12$placeholder.hash.admin', 'Kenn', 'Admin', 'ADMIN');

-- Operator (password: Operator@2026!)
INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES
('operator@taptrack.demo', '$2b$12$placeholder.hash.operator', 'Jordan', 'Operator', 'OPERATOR');

-- Users (password: User@2026!)
INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES
('alex@taptrack.demo', '$2b$12$placeholder.hash.alex', 'Alex', 'Rivera', 'USER'),
('jamie@taptrack.demo', '$2b$12$placeholder.hash.jamie', 'Jamie', 'Chen', 'USER'),
('sam@taptrack.demo', '$2b$12$placeholder.hash.sam', 'Sam', 'Torres', 'USER');

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
