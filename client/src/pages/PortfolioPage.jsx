import { ArrowRight, Download, Server, Monitor, Boxes, Github, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SiteHeader } from '../components/SiteHeader';

const capabilities = [
  { icon: Monitor, title: 'Frontend', body: 'Accessible, responsive interfaces with React and modern CSS. Clean components, considered motion, and dependable experiences.', tags: ['React', 'JavaScript', 'CSS Grid', 'Accessibility'] },
  { icon: Server, title: 'Backend', body: 'Reliable APIs and data models with Node.js, Express, and SQLite, with security and maintainability built in.', tags: ['Node.js', 'Express', 'SQLite', 'REST APIs'] },
  { icon: Boxes, title: 'Product Engineering', body: 'End-to-end development from an idea to a tested experience, focused on practical, user-centered outcomes.', tags: ['Git', 'Testing', 'Security', 'Stripe'] }
];

function ProjectPreview({ type }) {
  if (type === 'tasks') {
    return (
      <div className="preview-window task-preview" aria-hidden="true">
        <div className="window-bar"><i /><i /><i /></div>
        <div className="preview-body"><aside>TaskFlow<br /><span>Overview</span><strong>My tasks</strong><span>Completed</span></aside><main><b>My tasks</b>{['Build portfolio case study', 'Connect task API', 'Test mobile navigation'].map((label, index) => <div className="mini-task" key={label}><i className={index === 0 ? 'done' : ''} />{label}</div>)}</main></div>
      </div>
    );
  }
  return (
    <div className="preview-window store-preview" aria-hidden="true">
      <div className="window-bar"><i /><i /><i /></div>
      <div className="store-mini"><div><b>Northstar</b><h3>Everyday essentials,<br />thoughtfully made.</h3><span>Shop collection</span></div><img src="/products/orbit-bottle.webp" alt="" /></div>
    </div>
  );
}

export function PortfolioPage() {
  return (
    <div className="portfolio-page">
      <SiteHeader />
      <main>
        <section className="hero section-shell" id="home">
          <div className="hero-copy">
            <h1>I build thoughtful<br />{' '}digital products.</h1>
            <p>Full-stack developer focused on accessible interfaces, reliable APIs, and useful software.</p>
            <div className="hero-actions">
              <a className="button button--primary" href="#work">Explore my work <ArrowRight size={18} /></a>
              <a className="button button--secondary" href="/Omar-Mohamed-Aly-Resume.txt" download><Download size={17} /> Download resume</a>
            </div>
          </div>
          <div className="hero-visual" aria-label="Task dashboard and code preview">
            <div className="code-window"><div className="window-bar"><i /><i /><i /></div><pre><span>const</span> projects = [<br />  {'{'} name: <em>'TaskFlow'</em>,<br />    focus: <em>'useful software'</em> {'}'},<br />];<br /><br /><span>export default</span> projects;</pre></div>
            <div className="floating-tasks"><b>TaskFlow</b><small>Today</small>{['Design onboarding', 'Build API endpoints', 'Test mobile menu'].map((task, index) => <div key={task}><i className={index === 0 ? 'done' : ''} />{task}</div>)}</div>
          </div>
        </section>

        <section className="work-section section-shell" id="work">
          <div className="section-heading"><h2>Selected work</h2><span>Two complete product experiences</span></div>
          <div className="project-pair">
            <article className="project-feature"><ProjectPreview type="tasks" /><h3>TaskFlow</h3><p>A full-stack task manager with secure authentication, persistent data, and complete CRUD workflows.</p><div className="tag-row"><span>React</span><span>Node.js</span><span>SQLite</span><span>JWT</span></div><Link to="/tasks">View project <ArrowRight size={17} /></Link></article>
            <article className="project-feature"><ProjectPreview type="store" /><h3>Northstar Store</h3><p>A considered storefront with persistent cart state, protected checkout, and atomic inventory updates.</p><div className="tag-row"><span>React</span><span>Express</span><span>Stripe</span><span>Security</span></div><Link to="/shop">View project <ArrowRight size={17} /></Link></article>
          </div>
        </section>

        <section className="capabilities section-shell" id="skills">
          <h2>Capabilities</h2>
          <div className="capability-grid">{capabilities.map(({ icon: Icon, title, body, tags }) => <article key={title}><Icon size={29} /><h3>{title}</h3><p>{body}</p><div className="tag-row">{tags.map((tag) => <span key={tag}>{tag}</span>)}</div></article>)}</div>
        </section>

        <section className="about section-shell">
          <div><h2>About</h2><p>I'm Omar Mohamed Aly, a full-stack development intern who enjoys working across both sides of a product: the interface people use and the systems that keep it dependable.</p><p>For this internship I built a responsive portfolio, an authenticated task manager, and a small storefront with persistent data and a secure checkout flow.</p></div>
          <div className="about-terminal" aria-hidden="true"><div className="window-bar"><i /><i /><i /></div><pre><span>portfolio/</span><br />├── responsive UI<br />├── secure API<br />├── persistent data<br />└── tested workflows<br /><br /><em>✓ ready to demonstrate</em></pre></div>
        </section>

        <section className="contact section-shell" id="contact"><div><h2>Project links</h2><p>The full source and internship announcement are available below.</p></div><div className="hero-actions"><a className="button button--primary" href="https://github.com/Frehshi/Progree-Full-stack-internship/" target="_blank" rel="noreferrer"><Github size={18} /> View source</a><a className="button button--secondary" href="https://lnkd.in/p/ezSQn6P2" target="_blank" rel="noreferrer"><Linkedin size={18} /> LinkedIn post</a></div></section>
      </main>
      <footer className="portfolio-footer section-shell"><strong>OMA</strong><span>© 2026 Omar Mohamed Aly. Progree internship project.</span><div><a href="#home">Home</a><a href="#work">Work</a><a href="#skills">Skills</a></div></footer>
    </div>
  );
}
