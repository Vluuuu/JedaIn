
create table public.partner_profiles (
  id text primary key,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  role text not null check (role in ('EO','DESTINATION','ADMIN')),
  display_name text not null,
  business_name text not null,
  destination_identity_id text,
  organizer_review_ref text,
  guide_status text check (guide_status is null or guide_status in ('CONCEPT_ONLY','CERTIFIED_GUIDE')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.destinations (
  id text primary key,
  partner_id text references public.partner_profiles(id) on delete set null,
  name text not null,
  location_label text not null,
  province text not null,
  city text not null,
  verification_level text not null default 'BASIC' check (verification_level in ('BASIC','PLUS')),
  guide_ready boolean not null default false,
  base_cost_per_person integer not null default 0 check (base_cost_per_person >= 0),
  local_guide_fee_per_person integer not null default 0 check (local_guide_fee_per_person >= 0),
  description text not null default '',
  highlights jsonb not null default '[]'::jsonb,
  capacity_per_session integer not null default 1 check (capacity_per_session > 0),
  image_url text,
  media_gallery jsonb not null default '[]'::jsonb,
  status text not null default 'INACTIVE' check (status in ('ACTIVE','INACTIVE')),
  available_activities jsonb not null default '[]'::jsonb,
  facilities jsonb not null default '[]'::jsonb,
  operational_notes jsonb not null default '[]'::jsonb,
  local_guide_summary text,
  base_cost_includes jsonb not null default '[]'::jsonb,
  base_cost_excludes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.packages (
  id text primary key,
  eo_id text not null references public.partner_profiles(id) on delete restrict,
  eo_display_name text not null,
  destination_id text not null references public.destinations(id) on delete restrict,
  title text not null,
  short_summary text not null default '',
  value_proposition text not null default '',
  image_url text,
  image_urls jsonb not null default '[]'::jsonb,
  insight_id text,
  duration_label text not null,
  suitable_group_types jsonb not null default '[]'::jsonb,
  highlights jsonb not null default '[]'::jsonb,
  itinerary jsonb not null default '[]'::jsonb,
  included_items jsonb not null default '[]'::jsonb,
  excluded_items jsonb not null default '[]'::jsonb,
  safety_notes jsonb not null default '[]'::jsonb,
  meeting_point_label text,
  departure_time_label text,
  outbound_transport text,
  return_transport text,
  access_notes jsonb not null default '[]'::jsonb,
  destination_base_cost integer not null default 0 check (destination_base_cost >= 0),
  local_guide_fee integer not null default 0 check (local_guide_fee >= 0),
  eo_margin integer not null default 0 check (eo_margin >= 0),
  customer_price integer not null default 0 check (customer_price >= 0),
  guide_status text not null check (guide_status in ('CONCEPT_ONLY','CERTIFIED_GUIDE')),
  guide_source text not null check (guide_source in ('DESTINATION','EO')),
  status text not null default 'DRAFT' check (status in ('DRAFT','PENDING_ADMIN_REVIEW','REJECTED','APPROVED','LIVE')),
  validation_result jsonb,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sessions (
  id text primary key,
  package_id text not null references public.packages(id) on delete cascade,
  eo_id text not null references public.partner_profiles(id) on delete restrict,
  start_at timestamptz not null,
  end_at timestamptz not null,
  capacity integer not null check (capacity > 0),
  remaining_slots integer not null check (remaining_slots >= 0 and remaining_slots <= capacity),
  price_per_person integer not null check (price_per_person >= 0),
  status text not null default 'OPEN' check (status in ('OPEN','FULL','CLOSED','CANCELLED')),
  operational_note text,
  operational_note_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_at > start_at)
);

create index idx_partner_profiles_auth_user_id on public.partner_profiles(auth_user_id);
create index idx_destinations_partner_id on public.destinations(partner_id);
create index idx_destinations_status_guide on public.destinations(status, guide_ready);
create index idx_packages_eo_id on public.packages(eo_id);
create index idx_packages_destination_id on public.packages(destination_id);
create index idx_packages_status on public.packages(status);
create index idx_sessions_package_id on public.sessions(package_id);
create index idx_sessions_eo_id on public.sessions(eo_id);
create index idx_sessions_status_start on public.sessions(status, start_at);

alter table public.partner_profiles enable row level security;
alter table public.destinations enable row level security;
alter table public.packages enable row level security;
alter table public.sessions enable row level security;

grant select on public.destinations, public.packages, public.sessions to anon;
grant select on public.partner_profiles, public.destinations, public.packages, public.sessions to authenticated;
grant insert, update on public.packages, public.sessions to authenticated;
grant update on public.destinations to authenticated;

create policy "partner can read own profile"
on public.partner_profiles for select
to authenticated
using ((select auth.uid()) = auth_user_id);

create policy "admin can read partner profiles"
on public.partner_profiles for select
to authenticated
using (
  exists (
    select 1
    from public.partner_profiles me
    where me.auth_user_id = (select auth.uid())
      and me.role = 'ADMIN'
  )
);

create policy "public can read active destinations"
on public.destinations for select
to anon, authenticated
using (status = 'ACTIVE');

create policy "destination partner can read own destination"
on public.destinations for select
to authenticated
using (
  exists (
    select 1
    from public.partner_profiles p
    where p.id = destinations.partner_id
      and p.auth_user_id = (select auth.uid())
      and p.role = 'DESTINATION'
  )
);

create policy "admin can read all destinations"
on public.destinations for select
to authenticated
using (
  exists (
    select 1 from public.partner_profiles me
    where me.auth_user_id = (select auth.uid()) and me.role = 'ADMIN'
  )
);

create policy "destination partner can update active destination content"
on public.destinations for update
to authenticated
using (
  status = 'ACTIVE'
  and exists (
    select 1 from public.partner_profiles p
    where p.id = destinations.partner_id
      and p.auth_user_id = (select auth.uid())
      and p.role = 'DESTINATION'
  )
)
with check (
  status = 'ACTIVE'
  and exists (
    select 1 from public.partner_profiles p
    where p.id = destinations.partner_id
      and p.auth_user_id = (select auth.uid())
      and p.role = 'DESTINATION'
  )
);

create policy "destination partner can update inactive destination content"
on public.destinations for update
to authenticated
using (
  status = 'INACTIVE'
  and exists (
    select 1 from public.partner_profiles p
    where p.id = destinations.partner_id
      and p.auth_user_id = (select auth.uid())
      and p.role = 'DESTINATION'
  )
)
with check (
  status = 'INACTIVE'
  and exists (
    select 1 from public.partner_profiles p
    where p.id = destinations.partner_id
      and p.auth_user_id = (select auth.uid())
      and p.role = 'DESTINATION'
  )
);

create policy "admin can update destinations"
on public.destinations for update
to authenticated
using (
  exists (
    select 1 from public.partner_profiles me
    where me.auth_user_id = (select auth.uid()) and me.role = 'ADMIN'
  )
)
with check (
  exists (
    select 1 from public.partner_profiles me
    where me.auth_user_id = (select auth.uid()) and me.role = 'ADMIN'
  )
);

create policy "public can read live packages"
on public.packages for select
to anon, authenticated
using (status = 'LIVE');

create policy "eo can read own packages"
on public.packages for select
to authenticated
using (
  exists (
    select 1 from public.partner_profiles p
    where p.id = packages.eo_id
      and p.auth_user_id = (select auth.uid())
      and p.role = 'EO'
  )
);

create policy "admin can read all packages"
on public.packages for select
to authenticated
using (
  exists (
    select 1 from public.partner_profiles me
    where me.auth_user_id = (select auth.uid()) and me.role = 'ADMIN'
  )
);

create policy "eo can create draft package"
on public.packages for insert
to authenticated
with check (
  status = 'DRAFT'
  and exists (
    select 1 from public.partner_profiles p
    where p.id = packages.eo_id
      and p.auth_user_id = (select auth.uid())
      and p.role = 'EO'
  )
);

create policy "eo can edit draft or rejected package"
on public.packages for update
to authenticated
using (
  status in ('DRAFT','REJECTED')
  and exists (
    select 1 from public.partner_profiles p
    where p.id = packages.eo_id
      and p.auth_user_id = (select auth.uid())
      and p.role = 'EO'
  )
)
with check (
  status in ('DRAFT','REJECTED')
  and exists (
    select 1 from public.partner_profiles p
    where p.id = packages.eo_id
      and p.auth_user_id = (select auth.uid())
      and p.role = 'EO'
  )
);

create policy "eo can submit package for review"
on public.packages for update
to authenticated
using (
  status in ('DRAFT','REJECTED')
  and exists (
    select 1 from public.partner_profiles p
    where p.id = packages.eo_id
      and p.auth_user_id = (select auth.uid())
      and p.role = 'EO'
  )
)
with check (
  status = 'PENDING_ADMIN_REVIEW'
  and exists (
    select 1 from public.partner_profiles p
    where p.id = packages.eo_id
      and p.auth_user_id = (select auth.uid())
      and p.role = 'EO'
  )
);

create policy "eo can publish approved package"
on public.packages for update
to authenticated
using (
  status = 'APPROVED'
  and exists (
    select 1 from public.partner_profiles p
    where p.id = packages.eo_id
      and p.auth_user_id = (select auth.uid())
      and p.role = 'EO'
  )
)
with check (
  status = 'LIVE'
  and exists (
    select 1 from public.partner_profiles p
    where p.id = packages.eo_id
      and p.auth_user_id = (select auth.uid())
      and p.role = 'EO'
  )
);

create policy "admin can review pending package"
on public.packages for update
to authenticated
using (
  status = 'PENDING_ADMIN_REVIEW'
  and exists (
    select 1 from public.partner_profiles me
    where me.auth_user_id = (select auth.uid()) and me.role = 'ADMIN'
  )
)
with check (
  status in ('APPROVED','REJECTED')
  and exists (
    select 1 from public.partner_profiles me
    where me.auth_user_id = (select auth.uid()) and me.role = 'ADMIN'
  )
);

create policy "public can read future open sessions"
on public.sessions for select
to anon, authenticated
using (
  status = 'OPEN'
  and start_at > now()
  and exists (
    select 1 from public.packages p
    where p.id = sessions.package_id and p.status = 'LIVE'
  )
);

create policy "eo can read own sessions"
on public.sessions for select
to authenticated
using (
  exists (
    select 1 from public.partner_profiles p
    where p.id = sessions.eo_id
      and p.auth_user_id = (select auth.uid())
      and p.role = 'EO'
  )
);

create policy "admin can read all sessions"
on public.sessions for select
to authenticated
using (
  exists (
    select 1 from public.partner_profiles me
    where me.auth_user_id = (select auth.uid()) and me.role = 'ADMIN'
  )
);

create policy "eo can create session for own approved package"
on public.sessions for insert
to authenticated
with check (
  status = 'OPEN'
  and start_at > now()
  and exists (
    select 1
    from public.packages pkg
    join public.partner_profiles p on p.id = pkg.eo_id
    where pkg.id = sessions.package_id
      and pkg.eo_id = sessions.eo_id
      and pkg.status in ('APPROVED','LIVE')
      and p.auth_user_id = (select auth.uid())
      and p.role = 'EO'
  )
);

create policy "eo can update own session"
on public.sessions for update
to authenticated
using (
  exists (
    select 1 from public.partner_profiles p
    where p.id = sessions.eo_id
      and p.auth_user_id = (select auth.uid())
      and p.role = 'EO'
  )
)
with check (
  status in ('OPEN','FULL','CLOSED','CANCELLED')
  and (status <> 'OPEN' or start_at > now())
  and exists (
    select 1
    from public.packages pkg
    join public.partner_profiles p on p.id = pkg.eo_id
    where pkg.id = sessions.package_id
      and pkg.eo_id = sessions.eo_id
      and pkg.status in ('APPROVED','LIVE')
      and p.auth_user_id = (select auth.uid())
      and p.role = 'EO'
  )
);

insert into public.partner_profiles
  (id, role, display_name, business_name, destination_identity_id, organizer_review_ref, guide_status)
values
  ('eo_jeda_alam','EO','Budi Santoso','Jeda Alam Nusantara',null,'org_lereng_batu','CERTIFIED_GUIDE'),
  ('eo_kreatif_desa','EO','Dewi Lestari','Ruang Kreatif Wellness',null,'org_kreatif_desa','CONCEPT_ONLY'),
  ('dest_partner_lereng_hijau','DESTINATION','Hadi Purnomo','Pengelola Lereng Hijau Batu','dest_lereng_hijau',null,null),
  ('dest_partner_lembah_pacet','DESTINATION','Sari Wulandari','Pengelola Lembah Alam Pacet','dest_lembah_pacet',null,null),
  ('dest_partner_hutan_trawas','DESTINATION','Agus Pranoto','Pengelola Hutan Bambu Trawas','dest_hutan_trawas',null,null),
  ('admin_jedain','ADMIN','Admin JedaIn','JedaIn',null,null,null);

insert into public.destinations
  (id, partner_id, name, location_label, province, city, verification_level, guide_ready, base_cost_per_person, local_guide_fee_per_person, description, highlights, capacity_per_session, status, available_activities, facilities, operational_notes, local_guide_summary, base_cost_includes, base_cost_excludes)
values
(
  'dest_lereng_hijau','dest_partner_lereng_hijau','Lereng Hijau Batu','Batu / Malang Raya','Jawa Timur','Batu','BASIC',true,125000,25000,
  'Kawasan perkebunan teh dan lereng bukit berkabut yang tenang, terkelola secara lestari bersama warga lokal. Memiliki pemandu lokal terlatih di lokasi.',
  '["Jalur jalan santai kebun teh dengan kontur landai","Pemandu lokal standby dan ramah rute","Saung santai dan fasilitas air bersih"]'::jsonb,
  20,'ACTIVE',
  '["Walking tour kebun teh lereng bukit","Sesi hening & respirasi udara sejuk","Edukasi petik teh bersama warga lokal","Santap siang lalapan pedesaan"]'::jsonb,
  '["Saung istirahat bambu","Toilet & sanitasi bersih","Area parkir kendaraan","Musholla semi-terbuka","Pos P3K sederhana"]'::jsonb,
  '["Waktu terbaik berkunjung adalah pukul 07.00–14.00 WIB sebelum kabut tebal sore.","Disarankan mengenakan alas kaki anti-selip dan jaket ringan berhawa sejuk."]'::jsonb,
  'Pemandu lokal warga lereng terlatih memahami rute kebun teh dan sejarah konservasi perkebunan.',
  '["Tiket masuk kawasan Lereng Hijau","Akses saung istirahat dan fasilitas umum"]'::jsonb,
  '["Transportasi menuju titik kumpul awal","Pengeluaran dan konsumsi pribadi"]'::jsonb
),
(
  'dest_lembah_pacet','dest_partner_lembah_pacet','Lembah Alam Pacet','Mojokerto Raya','Jawa Timur','Mojokerto','PLUS',true,160000,30000,
  'Lembah hutan pinus berhawa sejuk dengan aliran sungai jernih dan area mindfulness outdoor, didukung SOP keselamatan kawasan.',
  '["Sungai alami dangkal untuk terapi suara air","Kawasan bebas bising dan fasilitas retreat","Guide lokal terakreditasi siap mendampingi"]'::jsonb,
  15,'ACTIVE',
  '["Sound healing gemericik aliran sungai alami","Jeda meditasi hening tepi hutan pinus","Jalan kaki tanpa alas di area rumput terawat","Seduh wedang rempah herbal lokal"]'::jsonb,
  '["Paviliun kayu untuk sesi hening","Toilet standar wisata bersih","Titik bilas air pegunungan","Dapur seduh rempah tradisional","Area parkir beraspal"]'::jsonb,
  '["Kawasan bebas asap rokok dan kebisingan musik eksternal untuk menjaga ketenangan.","Debit air sungai dipantau harian dengan batas aman debit terverifikasi tim pengelola."]'::jsonb,
  'Pemandu retreat lokal telah mengikuti pelatihan SOP darurat alam terbuka.',
  '["Akses area konservasi Lembah Alam Pacet","Penggunaan paviliun hening & area tepi sungai"]'::jsonb,
  '["Transportasi pribadi","Konsumsi & belanja pribadi"]'::jsonb
),
(
  'dest_hutan_trawas','dest_partner_hutan_trawas','Hutan Bambu Trawas','Mojokerto / Pasuruan','Jawa Timur','Pasuruan','BASIC',false,95000,0,
  'Kawasan hutan bambu hening untuk kontemplasi tenang dan jalan santai mandiri di bawah naungan rumpun bambu alami.',
  '["Suasana sangat hening dan sejuk alami","Spot meditasi dan lorong bambu teduh","Jalur setapak kanopi bambu yang tenang"]'::jsonb,
  12,'INACTIVE',
  '["Jalan hening melintasi kanopi rumpun bambu","Sesi journaling & kontemplasi santai","Edukasi kerajinan anyaman bambu dasar","Cicip camilan umbi rebus pedesaan"]'::jsonb,
  '["Gazebo anyaman bambu teduh","Toilet alam bersih","Titik kumpul awal pendopo desa","Tempat cuci tangan higienis"]'::jsonb,
  '["Jalur setapak tanah padat dengan kemiringan sangat landai, cocok untuk pemula.","Kapasitas per sesi dibatasi maksimal 12 orang demi menjaga kekhidmatan hening."]'::jsonb,
  'Belum memiliki pemandu lokal resmi di lokasi. Pengunjung menikmati kawasan secara mandiri.',
  '[]'::jsonb,
  '[]'::jsonb
);

insert into public.packages (
  id, eo_id, eo_display_name, destination_id, title, short_summary, value_proposition,
  insight_id, duration_label, suitable_group_types, highlights, itinerary,
  included_items, excluded_items, safety_notes, meeting_point_label, departure_time_label,
  outbound_transport, return_transport, access_notes, destination_base_cost,
  local_guide_fee, eo_margin, customer_price, guide_status, guide_source, status,
  validation_result, submitted_at, reviewed_at, created_at, updated_at
) values
(
  'slow_green_day','eo_jeda_alam','Jeda Alam Nusantara','dest_lereng_hijau',
  'Sehari Pelan di Lereng Hijau',
  'Lepaskan kepenatan rutinitas harian dengan berjalan santai di perkebunan teh yang asri, menikmati udara sejuk lereng Batu, dan menikmati teh herbal hangat bersama pemandu lokal.',
  'Aktivitas santai menikmati panorama perkebunan teh dan lereng asri Batu dengan ritme tidak terburu-buru.',
  'ins_nature_batu_1d','1 hari','["SOLO","PARTNER","FRIENDS","FAMILY"]'::jsonb,
  '["Jalan santai menyusuri perkebunan teh lereng Batu dengan udara pegunungan segar","Sesi hening dan relaksasi bernapas di titik pandang lembah hijau","Mencicipi seduhan teh herbal racikan petani lokal","Santap siang hangat menu pedesaan lokal"]'::jsonb,
  '[{"order":1,"title":"Pagi - Berkumpul & Perjalanan Santai","description":"Berkumpul di titik kumpul Alun-Alun Kota Batu, perkenalan hangat dengan tim Travel Organizer, dan perjalanan bersama menuju Lereng Hijau Batu.","timeOfDayLabel":"Pagi","durationLabel":"1 jam"},{"order":2,"title":"Menjelajah Jalur Teh & Latihan Napas","description":"Berjalan kaki santai menyusuri jalur perkebunan teh yang tenang, dipandu dengan sesi jeda napas ringan untuk merilekskan pikiran.","timeOfDayLabel":"Pagi - Siang","durationLabel":"2.5 jam"},{"order":3,"title":"Santap Siang & Refleksi Santai","description":"Menikmati hidangan lokal khas pedesaan, waktu bebas untuk bersantai atau membaca buku, dan penutupan sesi.","timeOfDayLabel":"Siang - Sore","durationLabel":"2 jam"}]'::jsonb,
  '["Transportasi PP dari titik kumpul","Tiket masuk kawasan Lereng Hijau Batu","Pemandu lokal selama sesi kegiatan","Seduhan teh herbal dan kudapan lokal","Santap siang menu pedesaan"]'::jsonb,
  '["Transportasi peserta menuju titik kumpul awal","Pengeluaran dan belanja pribadi di luar paket"]'::jsonb,
  '["Gunakan sepatu berjalan yang nyaman dan tidak licin.","Bawa jaket atau pakaian hangat tipis."]'::jsonb,
  'Area keberangkatan Alun-Alun Kota Batu',
  'Peserta berkumpul pukul 07.00 WIB sebelum keberangkatan.',
  'Minibus Travel Organizer dari titik kumpul Batu menuju Lereng Hijau Batu.',
  'Minibus kembali ke titik kumpul Batu setelah seluruh kegiatan selesai.',
  '["Area keberangkatan mudah diakses kendaraan pribadi di pusat Kota Batu.","Titik kumpul berada di sisi timur Alun-Alun Kota Batu dengan penanda JedaIn."]'::jsonb,
  125000,25000,150000,300000,'CERTIFIED_GUIDE','DESTINATION','LIVE',
  null,null,'2026-08-05T10:00:00Z','2026-08-01T08:00:00Z','2026-08-05T10:00:00Z'
),
(
  'pkg_pacet_mindful_retreat','eo_jeda_alam','Jeda Alam Nusantara','dest_lembah_pacet',
  'Pagi Hening Tepi Sungai Pacet',
  'Retreat setengah hari di tepi sungai Pacet yang jernih dengan terapi suara air alami dan sesi relaksasi napas.',
  'Jeda singkat memulihkan pikiran dari bising perkotaan di lembah hutan pinus berhawa sejuk.',
  'ins_mindful_pacet_halfday','Setengah hari','["SOLO","PARTNER","FRIENDS"]'::jsonb,
  '["Sesi meditasi suara sungai alami","Jeda hening pagi dan teh herbal lokal","Piknik ringan buah segar"]'::jsonb,
  '[{"order":1,"title":"Pagi - Berkumpul di Saung Lembah","description":"Penyambutan dan persiapan sesi hening.","timeOfDayLabel":"Pagi","durationLabel":"45 menit"},{"order":2,"title":"Sesi Hening & Terapi Suara Sungai","description":"Relaksasi kesadaran penuh di bebatuan sungai yang tenang.","timeOfDayLabel":"Pagi - Siang","durationLabel":"2 jam"},{"order":3,"title":"Teh Herbal & Penutupan","description":"Menikmati teh hangat dan kudapan sehat.","timeOfDayLabel":"Siang","durationLabel":"1 jam"}]'::jsonb,
  '["Transportasi PP dari titik kumpul Pacet","Tiket masuk Lembah Alam Pacet","Pemandu retreat bersertifikat","Teh herbal dan kudapan buah sehat"]'::jsonb,
  '["Transportasi peserta menuju titik kumpul awal","Belanja pribadi"]'::jsonb,
  '["Kenakan pakaian santai yang nyaman.","Hati-hati saat melangkah di bebatuan tepi sungai."]'::jsonb,
  'Pendopo Utama Lembah Alam Pacet',
  'Berkumpul 15 menit sebelum kegiatan dimulai',
  'Shuttle Travel Organizer dari titik kumpul Pacet',
  'Shuttle kembali ke titik kumpul Pacet setelah sesi selesai',
  '["Dapat diakses mobil dan motor, area parkir luas di gerbang utama."]'::jsonb,
  160000,30000,100000,290000,'CERTIFIED_GUIDE','DESTINATION','PENDING_ADMIN_REVIEW',
  '{"valid":true,"errors":[]}'::jsonb,'2026-08-28T09:00:00Z',null,'2026-08-28T08:30:00Z','2026-08-28T09:00:00Z'
);

insert into public.sessions (
  id, package_id, eo_id, start_at, end_at, capacity, remaining_slots,
  price_per_person, status, operational_note, operational_note_updated_at, created_at, updated_at
) values
(
  'ses_sgd_1','slow_green_day','eo_jeda_alam',
  '2026-10-10T08:00:00+07:00','2026-10-10T14:00:00+07:00',
  6,6,300000,'OPEN',
  'Rute jalan kaki menggunakan jalur kebun teh sisi barat. Area saung bambu disiapkan untuk istirahat sesi hening.',
  '2026-08-10T14:30:00Z','2026-08-05T10:00:00Z','2026-08-10T14:30:00Z'
),
(
  'ses_sgd_2','slow_green_day','eo_jeda_alam',
  '2026-10-17T08:00:00+07:00','2026-10-17T14:00:00+07:00',
  6,4,300000,'OPEN',null,null,'2026-08-05T10:00:00Z','2026-08-05T10:00:00Z'
);

alter table public.destinations replica identity full;
alter table public.packages replica identity full;
alter table public.sessions replica identity full;

alter publication supabase_realtime add table public.destinations;
alter publication supabase_realtime add table public.packages;
alter publication supabase_realtime add table public.sessions;
;
