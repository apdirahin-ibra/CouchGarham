-- ==============================================================================
-- 1. ENUMS & EXTENSIONS
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO  BEGIN
    CREATE TYPE public.attendance_status AS ENUM('xadir', 'maqan', 'daahay');
EXCEPTION WHEN duplicate_object THEN null;
END ;

DO  BEGIN
    CREATE TYPE public.finance_type AS ENUM('income', 'expense');
EXCEPTION WHEN duplicate_object THEN null;
END ;

DO  BEGIN
    CREATE TYPE public.request_origin AS ENUM('admin', 'player');
EXCEPTION WHEN duplicate_object THEN null;
END ;

DO  BEGIN
    CREATE TYPE public.request_status AS ENUM('pending', 'approved', 'denied');
EXCEPTION WHEN duplicate_object THEN null;
END ;

DO  BEGIN
    CREATE TYPE public.app_role AS ENUM('admin', 'player');
EXCEPTION WHEN duplicate_object THEN null;
END ;

-- ==============================================================================
-- 2. TABLES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.players (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	auth_user_id text UNIQUE,
	name varchar(255) NOT NULL,
	nickname varchar(255),
	position varchar(100),
	jersey_number integer,
	whatsapp varchar(50),
	legacy_pin varchar(50),
	is_active boolean DEFAULT true NOT NULL,
	created_at timestamp (3) with time zone DEFAULT now() NOT NULL,
	updated_at timestamp (3) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user (
	id text PRIMARY KEY NOT NULL,
	name text NOT NULL,
	email text NOT NULL UNIQUE,
	email_verified boolean DEFAULT false NOT NULL,
	image text,
	role app_role DEFAULT 'player' NOT NULL,
	username varchar(255) UNIQUE,
	created_at timestamp (3) with time zone DEFAULT now() NOT NULL,
	updated_at timestamp (3) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.account (
	id text PRIMARY KEY NOT NULL,
	account_id text NOT NULL,
	provider_id text NOT NULL,
	user_id text NOT NULL REFERENCES public.user(id) ON DELETE cascade,
	access_token text,
	refresh_token text,
	id_token text,
	access_token_expires_at timestamp (3) with time zone,
	refresh_token_expires_at timestamp (3) with time zone,
	scope text,
	password text,
	created_at timestamp (3) with time zone DEFAULT now() NOT NULL,
	updated_at timestamp (3) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.session (
	id text PRIMARY KEY NOT NULL,
	expires_at timestamp (3) with time zone NOT NULL,
	token text NOT NULL UNIQUE,
	created_at timestamp (3) with time zone DEFAULT now() NOT NULL,
	updated_at timestamp (3) with time zone DEFAULT now() NOT NULL,
	ip_address text,
	user_agent text,
	user_id text NOT NULL REFERENCES public.user(id) ON DELETE cascade,
	role app_role DEFAULT 'player' NOT NULL,
	player_id uuid REFERENCES public.players(id) ON DELETE set null
);

CREATE TABLE IF NOT EXISTS public.verification (
	id text PRIMARY KEY NOT NULL,
	identifier text NOT NULL,
	value text NOT NULL,
	expires_at timestamp (3) with time zone NOT NULL,
	created_at timestamp (3) with time zone DEFAULT now() NOT NULL,
	updated_at timestamp (3) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.attendance_records (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE cascade,
	attendance_date date NOT NULL,
	status attendance_status NOT NULL,
	created_at timestamp (3) with time zone DEFAULT now() NOT NULL,
	updated_at timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT attendance_player_date_unique UNIQUE(player_id, attendance_date)
);

CREATE TABLE IF NOT EXISTS public.attendance_excuses (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE cascade,
	attendance_date date NOT NULL,
	reason text NOT NULL,
	created_by varchar(255) NOT NULL,
	created_at timestamp (3) with time zone DEFAULT now() NOT NULL,
	updated_at timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT excuse_player_date_unique UNIQUE(player_id, attendance_date)
);

CREATE TABLE IF NOT EXISTS public.excuse_requests (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE cascade,
	request_date date NOT NULL,
	attendance_type attendance_status NOT NULL,
	reason text NOT NULL,
	status request_status DEFAULT 'pending' NOT NULL,
	reviewed_at timestamp (3) with time zone,
	reviewed_by varchar(255),
	created_at timestamp (3) with time zone DEFAULT now() NOT NULL,
	updated_at timestamp (3) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.leave_requests (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE cascade,
	leave_date date NOT NULL,
	reason text NOT NULL,
	status request_status DEFAULT 'pending' NOT NULL,
	created_by_role app_role DEFAULT 'player' NOT NULL,
	reviewed_at timestamp (3) with time zone,
	reviewed_by varchar(255),
	created_at timestamp (3) with time zone DEFAULT now() NOT NULL,
	updated_at timestamp (3) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	author_role app_role NOT NULL,
	player_id uuid REFERENCES public.players(id) ON DELETE set null,
	author_name_snapshot varchar(255) NOT NULL,
	text text NOT NULL,
	created_at timestamp (3) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.club_settings (
	id varchar(50) PRIMARY KEY DEFAULT 'default' NOT NULL,
	rules_text text DEFAULT '' NOT NULL,
	announcement_text text DEFAULT '' NOT NULL,
	announcement_audio_path text,
	admin_whatsapp varchar(50),
	updated_at timestamp (3) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.finance_entries (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	type finance_type NOT NULL,
	amount numeric(12, 2) NOT NULL,
	note text NOT NULL,
	entry_date date NOT NULL,
	created_at timestamp (3) with time zone DEFAULT now() NOT NULL,
	updated_at timestamp (3) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.gallery_photos (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	storage_bucket varchar(100) DEFAULT 'club-gallery' NOT NULL,
	storage_path text NOT NULL,
	caption text,
	uploaded_by varchar(255) NOT NULL,
	created_at timestamp (3) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.join_requests (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	name varchar(255) NOT NULL,
	phone varchar(50) NOT NULL,
	message text,
	status request_status DEFAULT 'pending' NOT NULL,
	reviewed_at timestamp (3) with time zone,
	reviewed_by varchar(255),
	created_at timestamp (3) with time zone DEFAULT now() NOT NULL,
	updated_at timestamp (3) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.login_logs (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	role app_role NOT NULL,
	player_id uuid REFERENCES public.players(id) ON DELETE set null,
	display_name varchar(255) NOT NULL,
	logged_in_at timestamp (3) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.player_monthly_stats (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE cascade,
	month_key varchar(7) NOT NULL,
	goals integer DEFAULT 0 NOT NULL,
	assists integer DEFAULT 0 NOT NULL,
	errors integer DEFAULT 0 NOT NULL,
	created_at timestamp (3) with time zone DEFAULT now() NOT NULL,
	updated_at timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT player_month_stats_unique UNIQUE(player_id, month_key)
);

CREATE TABLE IF NOT EXISTS public.schedule_entries (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	day_name varchar(50) NOT NULL,
	time_text varchar(100) NOT NULL,
	place varchar(255) NOT NULL,
	created_at timestamp (3) with time zone DEFAULT now() NOT NULL,
	updated_at timestamp (3) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.suggestions (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE cascade,
	text text NOT NULL,
	submission_date date NOT NULL,
	created_at timestamp (3) with time zone DEFAULT now() NOT NULL,
	updated_at timestamp (3) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.tips (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	text text NOT NULL,
	sort_order integer DEFAULT 0 NOT NULL,
	created_at timestamp (3) with time zone DEFAULT now() NOT NULL,
	updated_at timestamp (3) with time zone DEFAULT now() NOT NULL
);

-- ==============================================================================
-- 3. SEED INITIAL ROSTER & DATA
-- ==============================================================================

INSERT INTO public.players (name, nickname, position, jersey_number, whatsapp, is_active)
VALUES
	('Axmed Cali', 'Goolhaye', 'Goolhaye', 1, '+252615551234', true),
	('Maxamed Jaamac', 'Difaac', 'Difaac', 4, '+252615555678', true),
	('Cabdullaahi Nuur', 'Khad', 'Khad Dhexe', 8, '+252615559012', true),
	('Xasan Cabdi', 'Weerar', 'Weerar', 9, '+252615553456', true),
	('Yaxye Cismaan', 'Garab', 'Garab', 11, '+252615557890', true),
	('Cumar Faarax', 'Dhagacad', 'Difaac Midig', 3, '+252615551122', true),
	('Khaalid Shiikh', 'Khad', 'Khad Weerar', 7, '+252615553344', true),
	('Mustafa Cilmi', 'Dheere', 'Khad Dhexe', 10, '+252615555566', true),
	('Saahid Yuusuf', 'Bir', 'Difaac Dhexe', 14, '+252615557788', true)
ON CONFLICT DO NOTHING;

INSERT INTO public.schedule_entries (day_name, time_text, place)
VALUES
	('Isniin', '4:30 PM - 6:30 PM', 'Garoonka Weyn ee Degmada'),
	('Arbaco', '4:30 PM - 6:30 PM', 'Garoonka Weyn ee Degmada'),
	('Jimco', '4:00 PM - 6:00 PM', 'Garoonka Jaamacadaha (Kulanka Tartanka)')
ON CONFLICT DO NOTHING;

INSERT INTO public.club_settings (id, rules_text, announcement_text)
VALUES (
	'default',
	'1. Ilaali waqtiga tababarka iyo kulamada kooxda.\n2. Ixtiraam maamulka, tababaraha iyo asxaabta kooxda.\n3. Haysashada direyska kooxda iyo daryeelka agabka waa khasab.\n4. Cudurdaarka waa in la soo gudbiyaa ka hor inta uusan tababarku bilaaban.\n5. Ka fogow anshax xumada iyo doodaha aan loo baahnayn.',
	'Kusoo dhowaada Best Official App. Dhammaan ciyaartooyda waxaa la ogeysiinayaa in tababarka la ilaaliyo.'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tips (text, sort_order)
VALUES
	('Hurdo kugu filan seexo habeenka ka horreeya ciyaarta (ugu yaraan 8 saacadood).', 1),
	('Cab biyo badan maalin kasta, gaar ahaan 2 saacadood ka hor tababarka.', 2),
	('Ixtiraam garsooraha iyo asxaabtaada, kubbaddu waa anshax iyo ciyaar wanaag.', 3)
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- 4. PROVISION ADMIN ACCOUNT (admin / CouchGarham@2026)
-- ==============================================================================

DO 
DECLARE
    v_user_id text := '00000000-0000-0000-0000-000000000001';
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.user WHERE username = 'admin') THEN
        INSERT INTO public.user (id, name, email, username, role)
        VALUES (v_user_id, 'Maamulaha Kooxda (Coach)', 'admin@bestofficial.club', 'admin', 'admin');

        INSERT INTO public.account (id, account_id, provider_id, user_id, password)
        VALUES (
            '00000000-0000-0000-0000-000000000002',
            'admin',
            'credential',
            v_user_id,
            '3be94949cfa82f2a12038b10a2c8143c:4760995bad30cfc448086a2955644907c4ee500c2d71feaec975e76ee81472845cb081ba602459b54bae3277a7d4f93c1e6712ad8bbbc9ea35d9c4e3bb08c6e7'
        );
    END IF;
END ;
