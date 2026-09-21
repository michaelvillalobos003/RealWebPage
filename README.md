# Michael Villalobos - Personal Portfolio & Web Project

Welcome to the official web project for **Michael Villalobos**!

This website was built as part of a high school Web Development class. It features server-side JavaScript (Node.js & Express), client-side interactivity, persistent contact data storage in JSON, and an administrative dashboard.

---

## 🎨 Visual Design & Theme
- **Student Name**: Michael Villalobos
- **Primary Accent**: Light Blue (`#38bdf8`)
- **Secondary / Canvas**: Black & Deep Dark surfaces (`#030712`, `#0b1120`)
- **Theme Inspiration**: Modern dark UI layout with soft ambient light-blue glow, sleek pill badges, and dark dashboard window frames.

---

## 📂 6 Site Pages & Structure
1. **`index.html` (Home)**:
   - Full student name (`Michael Villalobos`) in primary `<h1>` above the fold.
   - Student face photo placeholder prominently displayed above the fold.
   - 3 structured biography `<p>` paragraphs using formatted Lorem Ipsum and clear placeholder instructions.
   - Two featured media items (video & photo placeholders).
   - Direct inquiries contact form with persistent submission handling.
2. **`media.html` (Media Gallery)**:
   - 10 structured media items (project demos, photo showcases, social updates) with clear placeholder labels.
   - Interactive Lightbox modal to inspect images and videos full-screen.
3. **`future.html` (Future Roadmap)**:
   - Realistic long-term milestone card.
   - 5-year progressive timeline (Year 1 to Year 5) with Lorem Ipsum placeholders for your goals.
4. **`projects.html` (Choice Page #1 - Projects)**:
   - Showcase cards for technical projects, web experiments, and class builds.
5. **`experience.html` (Choice Page #2 - Experience & Activities)**:
   - Coursework, clubs, peer tutoring, and extracurricular timeline.
6. **`admin.html` (Admin Dashboard)**:
   - Password-protected portal (Default class test password: `admin123`).
   - 4 summary stat cards: Total Submissions, New, Replied, and Response Rate %.
   - Live Chart.js visualization of inquiry reasons styled in the Light Blue palette.
   - Message filtering (All, New, Replied) and "Mark as Replied" feature.

---

## 🛠️ File Structure
- `index.html` - Home page
- `media.html` - Media gallery
- `future.html` - Future roadmap
- `projects.html` - Choice page 1 (Projects)
- `experience.html` - Choice page 2 (Experience)
- `admin.html` - Admin portal
- `styles.css` - Light Blue and Black design system
- `script.js` - Client-side form handling and lightbox
- `admin.js` - Admin authentication and analytics logic
- `server.js` - Express backend server
- `data/contactReceived.json` - Persistent contact inquiry storage
- `assets/images/` - Image and SVG placeholder assets
- `assets/videos/` - Video demonstration files

---

## 💡 How to Customize Your Content
- **Photo**: Place your face photo in `assets/images/` (e.g. `michael_portrait.jpg`).
- **Biography**: On `index.html`, replace the Lorem Ipsum in `bioParagraph1`, `bioParagraph2`, and `bioParagraph3` with your personal story.
- **Admin Password**: Configured in `server.js` or via the `ADMIN_PASSWORD` environment variable (default: `admin123`).
