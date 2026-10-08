import { COLLEGE } from '../lib/config';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-logos">
          <img src="/college-logo.png" alt="PSG iTech" height="54" />
          <span className="divider-v" />
          <img src="/broadcast-logo.png" alt="iTech Broadcast" height="54" />
          <div>
            <b>iTech Broadcast</b>
            <div className="faint">{COLLEGE}</div>
          </div>
        </div>
        <div className="footer-line">
          <span>Developed by <b>Vaseem M</b> and <b>Broadcast Team</b></span>
          <span className="row" style={{ gap: 18 }}>
            <a href="/activity-point-circular.pdf" target="_blank" rel="noreferrer">Activity point circular</a>
          </span>
        </div>
      </div>
    </footer>
  );
}
