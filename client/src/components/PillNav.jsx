/**
 * PillNav.jsx — src/components/PillNav.jsx
 *
 * Animation strategy: opacity crossfade (not vertical slide).
 * - Bubble circle expands from bottom (GSAP, clipped by pill overflow:hidden)
 * - Default label fades OUT on hover
 * - Gold hover label fades IN on hover
 * No vertical movement → nothing can leak above/below the nav bar.
 */
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { gsap } from 'gsap';
import './PillNav.css';

const PillNav = ({ items = [], rightSlot, scrolled = false }) => {
  const location   = useLocation();
  const activeHref = location.pathname;
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const circleRefs      = useRef([]);
  const tlRefs          = useRef([]);
  const activeTweenRefs = useRef([]);
  const logoTextRef     = useRef(null);
  const logoTweenRef    = useRef(null);
  const hamburgerRef    = useRef(null);
  const mobileMenuRef   = useRef(null);

  useEffect(() => {
    const setup = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            circleRefs.current.forEach((circle, i) => {
              if (!circle) return;
              const pill = circle.closest('.pill');
              if (!pill) return;

              const { width: w, height: h } = pill.getBoundingClientRect();
              if (!w || !h) return;

              // Size bubble to fully cover pill when scaled
              const R       = ((w * w) / 4 + h * h) / (2 * h);
              const D       = Math.ceil(2 * R) + 2;
              const delta   = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;
              const originY = D - delta;

              circle.style.width  = `${D}px`;
              circle.style.height = `${D}px`;
              circle.style.bottom = `-${delta}px`;

              gsap.set(circle, {
                xPercent: -50,
                scale: 0,
                transformOrigin: `50% ${originY}px`,
              });

              const label = pill.querySelector('.pill-label');
              const hover = pill.querySelector('.pill-label-hover');

              tlRefs.current[i]?.kill();
              const tl = gsap.timeline({ paused: true });

              // 1. Bubble expands
              tl.to(circle, {
                scale: 1.2, xPercent: -50,
                duration: 0.45, ease: 'power3.out', overwrite: 'auto',
              }, 0);

              // 2. Default label fades out
              if (label) {
                tl.to(label, {
                  opacity: 0,
                  duration: 0.2, ease: 'power2.out', overwrite: 'auto',
                }, 0);
              }

              // 3. Gold hover label fades in (slight delay so bubble appears first)
              if (hover) {
                tl.to(hover, {
                  opacity: 1,
                  duration: 0.25, ease: 'power2.out', overwrite: 'auto',
                }, 0.1);
              }

              tlRefs.current[i] = tl;
            });
          }, 200);
        });
      });
    };

    setup();
    window.addEventListener('resize', setup);
    document.fonts?.ready?.then(setup).catch(() => {});
    return () => window.removeEventListener('resize', setup);
  }, [items]);

  const handleEnter = (i) => {
    const tl = tlRefs.current[i];
    if (!tl) return;
    activeTweenRefs.current[i]?.kill();
    activeTweenRefs.current[i] = tl.tweenTo(tl.duration(), {
      duration: 0.3, ease: 'power2.out', overwrite: 'auto',
    });
  };

  const handleLeave = (i) => {
    const tl = tlRefs.current[i];
    if (!tl) return;
    activeTweenRefs.current[i]?.kill();
    activeTweenRefs.current[i] = tl.tweenTo(0, {
      duration: 0.25, ease: 'power2.in', overwrite: 'auto',
    });
  };

  const handleLogoHover = () => {
    const el = logoTextRef.current;
    if (!el) return;
    logoTweenRef.current?.kill();
    gsap.set(el, { rotate: 0 });
    logoTweenRef.current = gsap.to(el, {
      rotate: 360, duration: 0.4, ease: 'power3.out', overwrite: 'auto',
    });
  };

  const toggleMobile = () => {
    const next = !isMobileOpen;
    setIsMobileOpen(next);
    const lines = hamburgerRef.current?.querySelectorAll('.hamburger-line');
    if (lines) {
      gsap.to(lines[0], { rotation: next ? 45  : 0, y: next ?  3 : 0, duration: 0.25 });
      gsap.to(lines[1], { rotation: next ? -45 : 0, y: next ? -3 : 0, duration: 0.25 });
    }
    const menu = mobileMenuRef.current;
    if (!menu) return;
    if (next) {
      gsap.set(menu, { visibility: 'visible' });
      gsap.fromTo(menu, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.25 });
    } else {
      gsap.to(menu, {
        opacity: 0, y: 8, duration: 0.2,
        onComplete: () => gsap.set(menu, { visibility: 'hidden' }),
      });
    }
  };

  const isActive = (href) =>
    activeHref === href ||
    (href !== '/dashboard' && href !== '/' && activeHref.startsWith(href));

  return (
    <div
      className="pill-nav-wrapper"
      style={{ boxShadow: scrolled ? '0 4px 24px rgba(15,23,42,0.5)' : 'none' }}
    >
      <div className="pill-nav-gold-line" />
      <div className="pill-nav-inner">

        <div className="pill-nav-left">
          <Link
            to="/dashboard"
            className="pill-logo"
            onMouseEnter={handleLogoHover}
            aria-label="Home"
          >
            <span className="pill-logo-text" ref={logoTextRef}>K</span>
          </Link>

          <div className="pill-nav-items desktop-only">
            <ul className="pill-list" role="menubar">
              {items.map((item, i) => (
                <li key={item.href} role="none">
                  <Link
                    role="menuitem"
                    to={item.href}
                    className={`pill${isActive(item.href) ? ' is-active' : ''}`}
                    onMouseEnter={() => handleEnter(i)}
                    onMouseLeave={() => handleLeave(i)}
                  >
                    {/* Bubble — inside pill overflow:hidden, stays contained */}
                    <span
                      className="hover-circle"
                      aria-hidden="true"
                      ref={el => { circleRefs.current[i] = el; }}
                    />

                    {/* Labels — opacity crossfade, no vertical movement */}
                    <span className="label-stack">
                      <span className="pill-label">{item.label}</span>
                      <span className="pill-label-hover" aria-hidden="true">
                        {item.label}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pill-nav-right">
          {rightSlot}
          <button
            className="mobile-menu-button mobile-only"
            onClick={toggleMobile}
            ref={hamburgerRef}
            aria-label="Toggle menu"
          >
            <span className="hamburger-line" />
            <span className="hamburger-line" />
          </button>
        </div>
      </div>

      {items.length > 0 && (
        <div
          className="mobile-menu-popover"
          ref={mobileMenuRef}
          style={{ visibility: 'hidden' }}
        >
          <ul className="mobile-menu-list">
            {items.map(item => (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={`mobile-menu-link${isActive(item.href) ? ' is-active' : ''}`}
                  onClick={() => setIsMobileOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PillNav;