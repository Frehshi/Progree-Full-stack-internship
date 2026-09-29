import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, ArrowUpRight } from 'lucide-react';

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <Link to="/" className="brand" aria-label="Omar Mohamed Aly home">OMA</Link>
      <button className="icon-button mobile-menu-button" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        {open ? <X /> : <Menu />}
      </button>
      <nav className={`site-nav ${open ? 'is-open' : ''}`} aria-label="Main navigation">
        <a href="/#home" onClick={() => setOpen(false)}>Home</a>
        <a href="/#work" onClick={() => setOpen(false)}>Work</a>
        <a href="/#skills" onClick={() => setOpen(false)}>Skills</a>
        <a href="/#contact" onClick={() => setOpen(false)}>Contact</a>
        <NavLink className="nav-project-link" to="/tasks" onClick={() => setOpen(false)}>View projects <ArrowUpRight size={17} /></NavLink>
      </nav>
    </header>
  );
}
