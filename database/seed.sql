-- ==============================================================================
-- ASR WATER & DRAINAGE (ASR-WD) - SEED DATA
-- Clearly marked development & demonstration seed records
-- Password for all demo accounts: admin123
-- Bcrypt Hash: $2y$12$6t3N.8p/x5P5w2a0mI7WxeZg8d.cIqI8r0qB/W.9nUvJ1v0oP8u3W
-- ==============================================================================

USE `asr_water_drainage`;

-- ------------------------------------------------------------------------------
-- 1. SEED USERS
-- ------------------------------------------------------------------------------
INSERT INTO `users` (`id`, `name`, `email`, `phone`, `password_hash`, `role`, `status`, `preferred_language`) VALUES
(1, 'ASR Super Administrator', 'superadmin@asr.civic', '9848011111', '$2y$12$6t3N.8p/x5P5w2a0mI7WxeZg8d.cIqI8r0qB/W.9nUvJ1v0oP8u3W', 'super_admin', 'active', 'en'),
(2, 'Paderu District Officer', 'admin@asr.civic', '9848022222', '$2y$12$6t3N.8p/x5P5w2a0mI7WxeZg8d.cIqI8r0qB/W.9nUvJ1v0oP8u3W', 'admin', 'active', 'en'),
(3, 'RWSS Division Lead', 'rwss.lead@asr.civic', '9848033333', '$2y$12$6t3N.8p/x5P5w2a0mI7WxeZg8d.cIqI8r0qB/W.9nUvJ1v0oP8u3W', 'organization_admin', 'active', 'en'),
(4, 'K. Ramana (Demo Resident)', 'citizen@asr.civic', '9848044444', '$2y$12$6t3N.8p/x5P5w2a0mI7WxeZg8d.cIqI8r0qB/W.9nUvJ1v0oP8u3W', 'citizen', 'active', 'te');

-- ------------------------------------------------------------------------------
-- 2. SEED LOCATIONS (District -> Mandals -> Localities)
-- ------------------------------------------------------------------------------
-- Root District
INSERT INTO `locations` (`id`, `name`, `name_te`, `parent_id`, `location_type`, `latitude`, `longitude`, `status`) VALUES
(1, 'Alluri Sitharama Raju District', 'అల్లూరి సీతారామరాజు జిల్లా', NULL, 'district', 18.0827000, 82.6635000, 'active');

-- Mandals
INSERT INTO `locations` (`id`, `name`, `name_te`, `parent_id`, `location_type`, `latitude`, `longitude`, `status`) VALUES
(2, 'Paderu', 'పాడేరు', 1, 'mandal', 18.0827000, 82.6635000, 'active'),
(3, 'Araku Valley', 'అరకు లోయ', 1, 'mandal', 18.3333000, 82.8833000, 'active'),
(4, 'Chintapalle', 'చింతపల్లి', 1, 'mandal', 17.8719000, 82.3524000, 'active'),
(5, 'Ananthagiri', 'అనంతగిరి', 1, 'mandal', 18.2389000, 83.0089000, 'active'),
(6, 'Dumbriguda', 'డుంబ్రిగుడ', 1, 'mandal', 18.2780000, 82.7820000, 'active'),
(7, 'G. Madugula', 'జి. మాడుగుల', 1, 'mandal', 17.9820000, 82.5020000, 'active'),
(8, 'G. K. Veedhi', 'గూడెం కొత్త వీధి', 1, 'mandal', 17.9250000, 82.1640000, 'active'),
(9, 'Hukumpeta', 'హుకుంపేట', 1, 'mandal', 18.1560000, 82.7150000, 'active'),
(10, 'Koyyuru', 'కొయ్యూరు', 1, 'mandal', 17.6540000, 82.2350000, 'active'),
(11, 'Munchingput', 'ముంచంగిపుట్టు', 1, 'mandal', 18.4200000, 82.5200000, 'active'),
(12, 'Pedabayalu', 'పెదబయలు', 1, 'mandal', 18.2800000, 82.5700000, 'active');

-- Localities under Paderu & Araku
INSERT INTO `locations` (`id`, `name`, `name_te`, `parent_id`, `location_type`, `latitude`, `longitude`, `status`) VALUES
(101, 'Paderu Main Road', 'పాడేరు మెయిన్ రోడ్డు', 2, 'locality', 18.0835000, 82.6642000, 'active'),
(102, 'Talari Singi', 'తలారి సింగి', 2, 'locality', 18.0750000, 82.6580000, 'active'),
(103, 'RTC Bus Complex Area', 'ఆర్టీసీ బస్ కాంప్లెక్స్ ప్రాంతం', 2, 'locality', 18.0860000, 82.6680000, 'active'),
(104, 'Railway Station Road', 'రైల్వే స్టేషన్ రోడ్డు', 3, 'locality', 18.3300000, 82.8870000, 'active'),
(105, 'Padmapuram Gardens Area', 'పద్మాపురం గార్డెన్స్ ప్రాంతం', 3, 'locality', 18.3350000, 82.8810000, 'active'),
(106, 'Lambasingi Junction', 'లంబసింగి జంక్షన్', 4, 'locality', 17.8920000, 82.3850000, 'active');

-- ------------------------------------------------------------------------------
-- 3. SEED PROBLEM CATEGORIES
-- ------------------------------------------------------------------------------
INSERT INTO `categories` (`id`, `name`, `name_te`, `type`, `description`, `status`) VALUES
(1, 'No Water Supply', 'నీటి సరఫరా లేదు', 'water', 'Complete interruption of tap or borewell water supply', 'active'),
(2, 'Irregular Water Supply', 'సక్రమంగా నీరు రాకపోవడం', 'water', 'Erratic hours, insufficient delivery quantity', 'active'),
(3, 'Water Leakage', 'నీరు లీకేజీ', 'water', 'Burst distribution pipes or leaking main line', 'active'),
(4, 'Pipeline Damage', 'పైప్‌లైన్ డ్యామేజ్', 'water', 'Broken distribution pipes or construction breaks', 'active'),
(5, 'Water Infrastructure Damage', 'నీటి వసతుల నష్టం', 'water', 'Damaged motor, broken hand pump or reservoir', 'active'),
(6, 'Water Quality Concern', 'కలుషిత నీరు / నాణ్యత సమస్య', 'water', 'Muddy, colored, foul odor, or contaminated supply', 'active'),
(7, 'Other Water Problem', 'ఇతర నీటి సమస్య', 'water', 'Any other drinking water supply issue', 'active'),

(8, 'Blocked Drain', 'డ్రైనేజీ పూడిక / మూసుకుపోవడం', 'drainage', 'Silt, garbage, or solid waste choking drainage', 'active'),
(9, 'Drainage Overflow', 'డ్రైనేజీ పొంగిపొర్లడం', 'drainage', 'Wastewater flooding public roads and pedestrian paths', 'active'),
(10, 'Stagnant Water', 'నిలిచిన మురుగునీరు', 'drainage', 'Standing stagnant wastewater breeding vectors', 'active'),
(11, 'Sewage / Wastewater', 'మురుగునీరు / వ్యర్థాలు', 'drainage', 'Broken septic sewer or dangerous effluent leaks', 'active'),
(12, 'Damaged Drain', 'డ్రైన్ కాలువ దెబ్బతినడం', 'drainage', 'Broken concrete slabs, collapsed retaining channels', 'active'),
(13, 'Drainage Flooding', 'డ్రైనేజీ వరద / నీరు చేరడం', 'drainage', 'Inadequate drainage causing residential waterlogging', 'active'),
(14, 'Other Sanitation Problem', 'ఇతర పారిశుధ్య సమస్య', 'drainage', 'General public drainage or sanitation concern', 'active'),

(15, 'Rainwater Drip/Drainage Opening Not Available', 'వర్షపు నీటి డ్రిప్/డ్రైనేజీ మార్గం అందుబాటులో లేదు', 'rainwater', 'No suitable rainwater drip hole or drainage opening exists at the location', 'active'),
(16, 'Rainwater Opening Blocked', 'వర్షపు నీటి మార్గం మూసుకుపోయింది', 'rainwater', 'Existing rainwater drainage opening choked with debris, silt or garbage', 'active'),
(17, 'Rainwater Opening Damaged', 'వర్షపు నీటి మార్గం దెబ్బతింది', 'rainwater', 'Broken slab, collapsed inlet grating or damaged drip channel', 'active'),
(18, 'Rainwater Overflow', 'వర్షపు నీరు పొంగిపొర్లడం', 'rainwater', 'Heavy runoff overflowing onto walkways, roads or surrounding premises', 'active'),
(19, 'Rainwater Waterlogging', 'వర్షపు నీరు నిలిచిపోవడం / ముంపు', 'rainwater', 'Stagnant rainwater puddles causing inconvenience and health concerns', 'active'),
(20, 'Rainwater Path Blocked', 'వర్షపు నీటి ప్రవాహ మార్గానికి అడ్డంకి', 'rainwater', 'Obstruction or construction blocking natural rainwater storm path', 'active'),
(21, 'Rainwater Collection Problem', 'వర్షపు నీటి నిల్వ సమస్య', 'rainwater', 'Failure or absence of community rainwater harvesting or collection point', 'active'),
(22, 'Drainage Connection Problem', 'డ్రైనేజీ అనుసంధాన సమస్య', 'rainwater', 'Rainwater opening not properly connected to storm drain network', 'active'),
(23, 'Other Rainwater Issue', 'ఇతర వర్షపు నీటి సమస్య', 'rainwater', 'Any other observation regarding rainwater drainage or drip opening', 'active');

-- ------------------------------------------------------------------------------
-- 4. SEED ORGANIZATIONS
-- ------------------------------------------------------------------------------
INSERT INTO `organizations` (`id`, `name`, `description`, `organization_type`, `contact_email`, `contact_phone`, `status`) VALUES
(1, 'Rural Water Supply & Sanitation (RWSS)', 'Water supply maintenance division for ASR District', 'Water Engineering', 'rwss-asr@civic.internal', '0893522201', 'active'),
(2, 'Panchayat Sanitation & Drainage Wing', 'Sanitation, desilting, and drainage clearing team', 'Sanitation Works', 'drainage-paderu@civic.internal', '0893522202', 'active'),
(3, 'Panchayat Raj Engineering Division (PRED)', 'Culvert, roadside drainage, and civil infrastructure cell', 'Civil Works', 'pred-asr@civic.internal', '0893522203', 'active');

-- Bind organization admin to RWSS
INSERT INTO `organization_users` (`organization_id`, `user_id`, `role`) VALUES
(1, 3, 'lead_officer');

-- ------------------------------------------------------------------------------
-- 5. SEED COMPLAINTS
-- ------------------------------------------------------------------------------
INSERT INTO `complaints` 
(`id`, `complaint_number`, `user_id`, `location_id`, `category_id`, `title`, `description`, `landmark`, `latitude`, `longitude`, `citizen_severity`, `system_priority`, `status`, `assigned_organization_id`, `assigned_user_id`, `public_notes`) 
VALUES
(1, 'ASR-WD-000001', 4, 101, 3, 'Water Leakage at Paderu Main Road', 'Major drinking water pipeline broken near junction. Clean water leaking constantly across the road for past 3 days.', 'Near Old Bus Stand Colony, Pillar 14', 18.0835000, 82.6642000, 'high', 'high', 'in_progress', 1, 3, 'Inspection team dispatched on site. Replacement coupler fitted.'),
(2, 'ASR-WD-000002', 4, 104, 9, 'Drain Overflow at Station Road', 'Stormwater drain is blocked with plastic waste and mud. Wastewater overflowing onto pedestrian pathway creating foul smell.', 'Opposite Community Hall', 18.3300000, 82.8870000, 'high', 'high', 'resolved', 2, NULL, 'Drain cleared of plastic silt, flow restored by sanitation crew. Verified on-site.'),
(3, 'ASR-WD-000003', 4, 106, 1, 'No Water Supply in Lambasingi', 'Overhead tank pump burnt out. No drinking water in school and surrounding 40 households since Tuesday.', 'Near Government High School', 17.8920000, 82.3850000, 'critical', 'critical', 'submitted', NULL, NULL, 'Queued for administrative assessment.');

-- ------------------------------------------------------------------------------
-- 6. SEED COMPLAINT UPDATES (TIMELINE)
-- ------------------------------------------------------------------------------
INSERT INTO `complaint_updates` (`complaint_id`, `user_id`, `old_status`, `new_status`, `message`, `is_public`) VALUES
(1, 4, NULL, 'submitted', 'Complaint submitted by citizen via portal.', 1),
(1, 2, 'submitted', 'under_review', 'Reviewed by District Admin desk.', 1),
(1, 2, 'under_review', 'assigned', 'Assigned to Rural Water Supply & Sanitation (RWSS).', 1),
(1, 3, 'assigned', 'in_progress', 'Maintenance crew arrived on site with repair kit.', 1),

(2, 4, NULL, 'submitted', 'Complaint logged with photo proof.', 1),
(2, 2, 'submitted', 'assigned', 'Assigned to Panchayat Sanitation Wing.', 1),
(2, 2, 'assigned', 'resolved', 'Desilting completed and verified.', 1),

(3, 4, NULL, 'submitted', 'Emergency report logged by citizen.', 1);

-- ------------------------------------------------------------------------------
-- 7. SEED MONETIZATION PLANS
-- ------------------------------------------------------------------------------
INSERT INTO `plans` (`id`, `name`, `code`, `description`, `price_monthly`, `price_annual`, `features`, `status`) VALUES
(1, 'Citizen Public Free', 'free', 'Free citizen grievance reporting and tracking for community residents', 0.00, 0.00, '["unlimited_reporting", "complaint_tracking", "public_map"]', 'active'),
(2, 'Community / Organization Tier', 'org_basic', 'Dedicated organizational complaint inbox, department dispatch, and exportable reports', 1499.00, 14990.00, '["organization_dashboard", "worker_dispatch", "sms_alerts", "csv_export"]', 'active'),
(3, 'Institutional Professional', 'institution_pro', 'Comprehensive multi-campus management for universities, hostels, and hospitals', 3999.00, 39990.00, '["ai_duplicate_detection", "priority_sla", "advanced_analytics", "custom_branding"]', 'active');
