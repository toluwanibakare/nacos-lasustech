-- ============================================================================
-- 005_seed_content.sql   (run after 004; safe to re-run: INSERT IGNORE on id)
-- ----------------------------------------------------------------------------
-- Copies the 20 executives currently shown on the website (from the built-in
-- list in src/data/executives.ts) and the 4 events (from the admin's previous
-- JSON store) into the database. After this, the admin edits
-- them in MySQL. Image paths are kept exactly as they are today.
-- ============================================================================

INSERT IGNORE INTO `executives` (`id`, `name`, `post`, `level`, `image_url`, `description`, `sort_order`, `is_active`) VALUES
  (1, 'Shofunde Jubril Ajibola', 'President', '400 Level', 'uploads/president.jpg', 'Serves as the primary leader and official representative of the NACOS LASUSTECH Chapter, overseeing all activities and strategic growth.', 1, 1),
  (2, 'Toluwani Moses Bakare', 'Vice President', '300 Level', 'uploads/vice_president.jpg', 'Acts as the chief assistant to the President, coordinating administrative programs and ensuring organizational stability.', 2, 1),
  (3, 'Owolabi Grace Oluwafunmilayo', 'Lady Vice-President', '200 Level', 'uploads/lady_vice.jpeg', 'Focuses on the empowerment and representation of female students within the computing community and supporting top-level initiatives.', 3, 1),
  (4, 'Oladepo Damilare David', 'General Secretary', '300 Level', 'uploads/gensec.jpeg', 'The custodian of chapter records, responsible for official documentation, correspondence, and meeting coordination.', 4, 1),
  (5, 'Emmanuel Ariyo Ogunfunwa', 'Assistant General Secretary', '200 Level', 'uploads/ass_gensec.jpg', 'Supports the General Secretary in administrative duties and ensures continuous documentation of chapter affairs.', 5, 1),
  (6, 'Onaade Abdulmuqtadir Ayomide', 'Financial Secretary', '300 Level', 'uploads/finsec.jpg', 'Maintains accurate financial records, manages budget allocations, and ensures financial transparency across all chapter projects.', 6, 1),
  (7, 'Ebhojie Oluwadamilola', 'Treasurer', '300 Level', 'uploads/Treasurer.jpeg', 'Oversees the chapter''s treasury, managing funds, ensuring secure disbursements, and providing detailed financial reports.', 7, 1),
  (8, 'Aladekoye Samuel', 'Public Relations Officer', '100 Level', 'uploads/pro.jpg', 'The official spokesperson for the chapter, managing media relations, brand image, and external communications.', 8, 1),
  (9, 'Fatai Adewale', 'Social Director', '300 Level', 'uploads/social_director.png', 'Organizes social events, workshops, and recreational activities to foster a strong sense of community and networking.', 9, 1),
  (10, 'Egba Uthman Temitayo', 'Sport Director', '200 Level', 'uploads/sports.jpg', 'Coordinates athletic events and fitness programs to promote physical well-being and department-wide team spirit.', 10, 1),
  (11, 'Akinrinade Moses Imisioluwa', 'Director of Studies', '', 'uploads/dir_studies.JPG', 'Oversees the department''s academic programs, curriculum and student''s academic progress.', 11, 1),
  (12, 'Oluwatobi Oluwaseyi Isaac', 'Welfare Director', '400 Level', 'uploads/welfare.jpeg', 'Monitors and ensures the general well-being and support of all computing students within the chapter.', 12, 1),
  (13, 'Olagunju Basheer Olaniyi', 'Electoral Chairman / HOC 400L', '400 Level', 'uploads/hoc_400.jpg', 'Leads the senior class and oversees the integrity and execution of the chapter''s electoral processes.', 13, 1),
  (14, 'Adegoke Muhammed', 'HOC for 300 level', '300 Level', 'uploads/hoc_300.jpg', 'Serves as the primary link between the 300 level students and the executive council, managing class-specific affairs.', 14, 1),
  (15, 'Osho Aishat', 'HOC for 200 level', '200 Level', 'uploads/hoc_200.jpg', 'Coordinates academic and social activities for the 200 level class, ensuring their voices are heard in the chapter.', 15, 1),
  (16, 'Ayara Michael', 'HOC for 100 level', '100 Level', 'uploads/hoc_100.jpeg', 'Guides and represents the path of year-one students, helping them integrate into the NACOS community.', 16, 1),
  (17, 'Adebisi Emmanuel Oluwatobi', 'Assistant HOC for 400L', '400 Level', 'uploads/asshoc_400.jpg', 'Assists the 400L HOC in class management and leadership duties for the graduating class.', 17, 1),
  (18, 'Matti Jadesola', 'Assistant HOC for 300level', '300 Level', 'uploads/asshoc_300.jpeg', 'Provides administrative support to the 300L HOC and class activities.', 18, 1),
  (19, 'Samuel John', 'Assistant HOC for 200L', '200 Level', 'uploads/asshoc_200.jpg', 'Supports class coordination and member welfare for the 200 level students.', 19, 1),
  (20, 'Olatunji Oyindamola Barakat', 'Assistant HOC 100lvl', '100 Level', 'uploads/asshoc_100.jpeg', 'Assists the 100L HOC in welcoming and organizing the newest members of the chapter.', 20, 1);

INSERT IGNORE INTO `events` (`id`, `slug`, `title`, `event_status`, `start_date`, `end_date`, `location`, `description`, `cover_image_url`, `sort_order`, `is_active`) VALUES
  (1, 'hod-cup-finale', 'HOD''S CUP: THE GRAND FINALE', 'past', '2026-05-07 12:00:00', '2026-05-07 15:00:00', 'LASUSTECH Main Field', 'The ultimate glory awaits! Join us for the 3rd Place Match (100L vs 200L) at 12:00 NOON and the Final Match (300L vs 400L) at 1:30 PM. Venue: LASUSTECH Main Field.', 'uploads/final_fixture.jpg', 1, 1),
  (2, 'ladies-in-tech', 'LADIES IN TECH EVENT', 'past', '2026-05-01 20:00:00', '2026-05-01 22:00:00', 'Google Meet', 'Theme: Overcoming fear and imposter syndrome. Featuring guest speakers Agape Oluwa, Mujisatullahi Bakare, and Naheemat Akinyemi A. Hosted by Owolabi Grace (Lady Vice). Join us on Google Meet at 8:00 PM. Contact the PRO (+234 810 563 8170) for more info.', 'uploads/PHOTO-2026-04-29-09-06-01.jpg', 2, 1),
  (3, 'hod-cup', 'HOD''S CUP 2025/2026', 'past', '2026-04-22 08:00:00', '2026-05-07 18:00:00', 'LASUSTECH', 'The annual HOD''S CUP featuring Football, Chess, and Scrabble. A month of intense competition where the department''s best athletes battled for glory.', 'uploads/PHOTO-2026-04-24-17-16-18.jpg', 3, 1),
  (4, 'bootcamp-onboarding', 'NACOS Tech Upscaling Bootcamp Onboarding', 'past', '2026-04-29 10:00:00', '2026-04-29 12:00:00', 'LASUSTECH', 'The official onboarding session for the NACOS Upscaling Bootcamp, introducing students to advanced computing tracks and industry mentorship.', 'uploads/PHOTO-2026-04-28-12-14-22.jpg', 4, 1);
