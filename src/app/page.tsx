import Image from "next/image";

const ArrowUpRight = () => (
  <svg aria-hidden="true" viewBox="0 0 20 20" width="18" height="18">
    <path d="M5 15 15 5M7 5h8v8" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
  </svg>
);

const DownloadIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 20 20" width="18" height="18">
    <path d="M10 3v9m0 0 3.5-3.5M10 12 6.5 8.5M4 15.5h12" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
  </svg>
);

const Check = () => (
  <svg aria-hidden="true" viewBox="0 0 20 20" width="16" height="16">
    <path d="m4 10 4 4 8-9" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
  </svg>
);

const capabilities = [
  {
    number: "01",
    title: "Full-stack systems",
    body: "React and Next.js interfaces backed by Django, REST APIs, PostgreSQL, Redis, Prisma, and SQLite.",
  },
  {
    number: "02",
    title: "Business automation",
    body: "Python workflows that turn messy operational data into validated reports, sheets, files, and scheduled jobs.",
  },
  {
    number: "03",
    title: "WordPress engineering",
    body: "Gutenberg, ACF, PHP, REST API, technical SEO, content recovery, redirects, and production-safe changes.",
  },
  {
    number: "04",
    title: "Applied AI",
    body: "Computer vision, streamed AI services, model evaluation, safety checks, and usable interfaces around AI outputs.",
  },
];

const skillGroups = [
  ["Frontend", "React · Next.js · React Native · TypeScript · Tailwind CSS"],
  ["Backend", "Python · Django REST Framework · PostgreSQL · Redis · Prisma"],
  ["Platforms", "WordPress · Google Workspace APIs · Vercel · GitHub Actions"],
  ["Quality", "Regression testing · API read-back · mobile QA · rollback planning"],
];

export default function Home() {
  return (
    <main>
      <a className="skip-link" href="#main-content">Skip to content</a>

      <header className="site-header">
        <a className="brand" href="#top" aria-label="Wrenz Laylo, home">
          <span className="brand-mark">WL</span>
          <span className="brand-copy"><strong>Wrenz Laylo</strong><small>Developer & automation engineer</small></span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#work">Work</a>
          <a href="#experience">Experience</a>
          <a href="#about">About</a>
        </nav>
        <a className="header-contact" href="mailto:wrenzivan2004@gmail.com">Start a conversation <ArrowUpRight /></a>
      </header>

      <div id="main-content">
        <section className="hero" id="top">
          <div className="hero-grid" />
          <div className="hero-copy">
            <p className="eyebrow"><span className="status-dot" /> Available for full-stack, automation, WordPress, and AI roles</p>
            <h1>I build business systems that work <em>outside the demo.</em></h1>
            <p className="hero-lede">I’m Wrenz, a full-stack developer who turns real operating rules into reliable software, from database-backed business apps to production automation and AI-assisted workflows.</p>
            <div className="hero-actions">
              <a className="button button-primary" href="#work">View selected work <ArrowUpRight /></a>
              <a className="button button-secondary" href="/Wrenz_Laylo-Full-Stack.pdf" download>Download résumé <DownloadIcon /></a>
            </div>
            <div className="hero-meta" aria-label="Professional details">
              <span>Based in Bataan, Philippines</span>
              <span>BS Computer Science, Cum Laude</span>
            </div>
          </div>

          <div className="hero-profile" aria-label="Wrenz Laylo profile">
            <div className="portrait-shell">
              <div className="portrait-accent" />
              <Image src="/wrenz-laylo.jpg" alt="Wrenz Ivan Laylo" fill priority sizes="(max-width: 800px) 76vw, 360px" />
              <span className="portrait-label">Wrenz Ivan Laylo</span>
            </div>
            <div className="code-card" aria-hidden="true">
              <div className="code-top"><span /><span /><span /><small>approach.ts</small></div>
              <code><i>const</i> work = {'{'}<br />&nbsp;&nbsp;understand: <b>true</b>,<br />&nbsp;&nbsp;build: <b>carefully</b>,<br />&nbsp;&nbsp;verify: <b>always</b><br />{'}'};</code>
            </div>
          </div>
        </section>

        <section className="proof-bar" aria-label="Selected outcomes">
          <div><strong>61/64</strong><span>legacy pages recovered</span></div>
          <div><strong>153</strong><span>technical PDF links completed</span></div>
          <div><strong>20</strong><span>automation regression tests</span></div>
          <div><strong>3</strong><span>Google APIs integrated</span></div>
        </section>

        <section className="section work-section" id="work">
          <div className="section-heading">
            <div><p className="kicker">Selected work</p><h2>Built around actual operations.</h2></div>
            <p>Each project started with a real workflow, constraint, or failure mode. The interface came after the rules were understood.</p>
          </div>

          <article className="project project-pos">
            <div className="project-copy">
              <div className="project-index">01 / BUSINESS SYSTEM</div>
              <h3>Pig Feeds POS</h3>
              <p className="project-summary">A working point-of-sale and credit ledger for a Philippine sari-sari store, designed around how the owner actually separates sales value, cash received, and customer utang.</p>
              <ul className="project-points">
                <li><Check /> Transactional checkout updates sales and stock together.</li>
                <li><Check /> Customer passbooks preserve charges, payments, and opening balances.</li>
                <li><Check /> Dashboard separates <em>benta</em> from <em>cash na pumasok</em>.</li>
              </ul>
              <div className="tags"><span>Next.js</span><span>TypeScript</span><span>Prisma</span><span>SQLite</span><span>Vitest</span></div>
              <p className="project-note">Private client project · case study available</p>
            </div>
            <div className="project-visual pos-window" aria-label="Illustration of Pig Feeds POS interface">
              <div className="window-bar"><span /><span /><span /><b>Daily order book</b></div>
              <div className="pos-layout">
                <div className="pos-main">
                  <div className="pos-title"><div><small>Today</small><strong>New order</strong></div><button>Walk-in sale</button></div>
                  <div className="product-grid">
                    <div><span>Hog Starter</span><b>₱1,920</b><small>50kg sack · 18 in stock</small></div>
                    <div><span>Grower Pellets</span><b>₱1,760</b><small>50kg sack · 12 in stock</small></div>
                    <div><span>Vitamin Premix</span><b>₱285</b><small>1kg pack · 31 in stock</small></div>
                    <div><span>Feed Scoop</span><b>₱95</b><small>Piece · 9 in stock</small></div>
                  </div>
                </div>
                <aside className="order-rail"><small>CURRENT ORDER</small><h4>Aling Rosa</h4><div className="line"><span>Hog Starter × 2</span><b>₱3,840</b></div><div className="line"><span>Vitamin Premix</span><b>₱285</b></div><div className="order-total"><span>Benta</span><strong>₱4,125</strong></div><div className="cash-split"><span>Cash <b>₱2,000</b></span><span>Utang <b>₱2,125</b></span></div><button className="checkout">Record sale</button></aside>
              </div>
            </div>
          </article>

          <article className="project project-automation">
            <div className="project-copy">
              <div className="project-index">02 / PRODUCTION AUTOMATION</div>
              <h3>AGG Doors time-log system</h3>
              <p className="project-summary">A Python pipeline that turns free-form Google Chat attendance messages into validated weekly employee timesheets in Google Drive.</p>
              <ul className="project-points">
                <li><Check /> Distinguishes physical arrival, login, break, lunch, and logout.</li>
                <li><Check /> Handles shared accounts, account migrations, missing events, and invalid chronology.</li>
                <li><Check /> Backs up before writes and verifies results through API read-back.</li>
              </ul>
              <div className="tags"><span>Python</span><span>Google Chat API</span><span>Sheets API</span><span>Drive API</span><span>GitHub Actions</span></div>
              <a className="text-link" href="https://github.com/WrenzLaylo/MVC-Time-Logs-Automation" target="_blank" rel="noreferrer">View public adaptation <ArrowUpRight /></a>
            </div>
            <div className="project-visual automation-board" aria-label="Illustration of attendance automation workflow">
              <div className="automation-stage chat-stage">
                <small>GOOGLE CHAT · 7:23 AM</small>
                <div className="avatar">WL</div><p><b>Computers</b><br />Login 7:23 -W</p>
                <div className="chat-bubble">Lunch out 12:04<br />Back 12:47</div>
              </div>
              <div className="flow-line"><span>parse</span><span>validate</span><span>map</span></div>
              <div className="automation-stage sheet-stage">
                <div className="sheet-head"><span>D</span><span>E</span><span>F</span><span>G</span><span>H</span><span>I</span><span>J</span><span>K</span></div>
                <div className="sheet-labels"><span>Arrival</span><span>Start</span><span>Break</span><span>In</span><span>Lunch</span><span>In</span><span>Finish</span><span>Total</span></div>
                <div className="sheet-row"><span>7:22</span><span>7:23</span><span>—</span><span>—</span><span>12:04</span><span>12:47</span><span>4:31</span><b>8:25</b></div>
                <div className="verified"><Check /> API read-back verified</div>
              </div>
            </div>
          </article>

          <div className="project-pair">
            <article className="project-small medical-project">
              <div className="small-visual medical-ui">
                <div className="med-nav"><span className="med-icon">+</span><b>Med42 Clinical Suite</b><small>AI Enabled</small></div>
                <div className="med-form"><p>New Diagnosis</p><div className="input-row"><span>Patient Name</span><span>Patient ID</span></div><div className="textarea">Describe patient symptoms...</div><button>Analyze with Med42-v3 AI</button><div className="review-row"><span>Save Draft</span><b>Submit for Review</b></div></div>
              </div>
              <div className="small-copy"><div className="project-index">03 / FULL-STACK + AI</div><h3>Med42 Clinical Suite</h3><p>A clinical workflow with versioned diagnosis and medication APIs, AI response streaming, review states, JWT sessions, rate limiting, and audit logs.</p><div className="tags"><span>Django REST</span><span>PostgreSQL</span><span>Redis</span><span>React</span></div><div className="link-row"><a className="text-link" href="https://medical-diagnosis-app-two.vercel.app" target="_blank" rel="noreferrer">Live application <ArrowUpRight /></a><a className="text-link muted" href="https://github.com/WrenzLaylo/medical-diagnosis-app" target="_blank" rel="noreferrer">Source <ArrowUpRight /></a></div></div>
            </article>

            <article className="project-small katiwala-project">
              <div className="small-visual katiwala-ui">
                <div className="katiwala-brand"><Image src="/katiwala-logo.png" alt="" width={58} height={58} /><span><b>Katiwala</b><small>Home services, handled.</small></span></div>
                <div className="phone-set">
                  <div className="phone phone-one"><div className="phone-head">Book a service</div><div className="service-pill">Home cleaning <span>›</span></div><div className="service-pill">Electrical repair <span>›</span></div><div className="service-pill">Plumbing <span>›</span></div><button>Continue</button></div>
                  <div className="phone phone-two"><div className="phone-head">Provider verification</div><div className="verify-step done"><Check /> Government ID</div><div className="verify-step done"><Check /> Face capture</div><div className="verify-step"><span>3</span> Review & submit</div><div className="pending-badge">Pending verification</div></div>
                </div>
              </div>
              <div className="small-copy"><div className="project-index">04 / MARKETPLACE</div><h3>Katiwala</h3><p>A Filipino home-services marketplace with separate customer and provider journeys, booking flows, identity capture, editable OCR data, and pending verification states.</p><div className="tags"><span>Expo</span><span>React Native</span><span>TypeScript</span><span>Prisma</span></div><p className="project-note">Private product · active development</p></div>
            </article>
          </div>

          <div className="more-work">
            <article><span>PRODUCTION WEBSITE</span><h3>Everyday Rockstar</h3><p>A responsive creator platform with custom motion, conversion-focused content, deployment QA, and ongoing production maintenance.</p><a href="https://everyday-rockstars.com" target="_blank" rel="noreferrer">Visit live site <ArrowUpRight /></a></article>
            <article><span>COMPUTER VISION</span><h3>LiPAD</h3><p>CRNN and GAN research for deblurring and recognizing Philippine license plates. Best Computer Science Thesis Paper and Presenter at IRCITE 2026.</p><small>TensorFlow · PyTorch · CRNN · GAN</small></article>
            <article><span>FULL-STACK FINTECH</span><h3>PesoWise</h3><p>A personal spending tracker built with Next.js, TypeScript, Prisma, authentication, and protected user data flows.</p><a href="https://pesowise-umber.vercel.app" target="_blank" rel="noreferrer">Visit live app <ArrowUpRight /></a></article>
          </div>
        </section>

        <section className="section capabilities-section">
          <div className="section-heading compact"><div><p className="kicker">What I do</p><h2>One developer, four useful angles.</h2></div></div>
          <div className="capability-grid">{capabilities.map((item) => <article key={item.number}><span>{item.number}</span><h3>{item.title}</h3><p>{item.body}</p></article>)}</div>
          <div className="skills-table">{skillGroups.map(([label, items]) => <div key={label}><strong>{label}</strong><span>{items}</span></div>)}</div>
        </section>

        <section className="section experience-section" id="experience">
          <div className="section-heading"><div><p className="kicker">Experience</p><h2>Production work, not coursework dressed up.</h2></div><p>I work close to the operational details: existing data, business rules, live users, rollback paths, and the parts that cannot be guessed.</p></div>
          <div className="timeline">
            <article><div className="timeline-date">2026 — Present</div><div><h3>Freelance Web Developer & Automation Engineer</h3><p className="company">AGG Doors · Client project</p><p>Production WordPress engineering, content recovery, technical SEO, Python automation, Google Workspace APIs, document processing, and verified live changes.</p></div></article>
            <article><div className="timeline-date">2026 — Present</div><div><h3>Freelance Full-Stack Web Developer</h3><p className="company">Self-employed</p><p>Business applications and responsive client sites using React, Next.js, TypeScript, Django, Prisma, and modern deployment workflows.</p></div></article>
            <article><div className="timeline-date">2026</div><div><h3>Full-Stack Developer / AI Engineer Intern</h3><p className="company">eBiZolution · Healthcare portal</p><p>Versioned clinical APIs, approval workflows, SSE-based AI output, PostgreSQL, Redis, JWT sessions, rate limiting, revocation, and audit logging.</p></div></article>
          </div>
        </section>

        <section className="section about-section" id="about">
          <div className="about-copy"><p className="kicker">About</p><h2>I care about the handoff between “it runs” and “it’s reliable.”</h2><p>I’m a Computer Science graduate from Angeles University Foundation, majoring in Data Science. I graduated Cum Laude and now work across software development, automation, WordPress, and applied AI.</p><p>My strongest work usually starts where the requirements get messy: old spreadsheets, inconsistent user input, account migrations, production content, or an AI output that still needs safety and review.</p><div className="about-links"><a href="https://github.com/WrenzLaylo" target="_blank" rel="noreferrer">GitHub <ArrowUpRight /></a><a href="https://linkedin.com/in/wrenzlaylo" target="_blank" rel="noreferrer">LinkedIn <ArrowUpRight /></a></div></div>
          <div className="recognition-card"><p>RECOGNITION</p><div><strong>Cum Laude</strong><span>BS Computer Science, Data Science</span></div><div><strong>Best Thesis Paper & Presenter</strong><span>IRCITE 2026 · LiPAD</span></div><div><strong>1st Place</strong><span>JPCS Hackathon 2025</span></div><div><strong>Microsoft Certified</strong><span>Azure Fundamentals</span></div></div>
        </section>

        <section className="contact-section" id="contact">
          <p className="kicker">Let’s build something useful</p>
          <h2>Have a workflow that has outgrown its spreadsheet?</h2>
          <p>I’m open to full-time roles, freelance projects, and conversations about business systems, automation, WordPress, or applied AI.</p>
          <a className="contact-email" href="mailto:wrenzivan2004@gmail.com">wrenzivan2004@gmail.com <ArrowUpRight /></a>
        </section>
      </div>

      <footer><div><span className="brand-mark small">WL</span><p>Designed and built by Wrenz Laylo.<br />Next.js · TypeScript · Vercel</p></div><div className="footer-links"><a href="#top">Back to top ↑</a><a href="https://github.com/WrenzLaylo" target="_blank" rel="noreferrer">GitHub</a><a href="https://linkedin.com/in/wrenzlaylo" target="_blank" rel="noreferrer">LinkedIn</a></div></footer>
    </main>
  );
}
