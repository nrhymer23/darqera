import Link from "next/link";

/** A2 footer. Gold = Noel's hand: the badge + signature are the only gold here. */
export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__by">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="badge-dark" src="/brand/no-ls-badge-round-ink.svg" alt="No Ls badge" width={44} height={44} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="badge-light" src="/brand/no-ls-badge-round-gold.svg" alt="No Ls badge" width={44} height={44} />
          <div className="site-footer__sig">
            <span className="grule" aria-hidden="true" />
            <span className="gtag">A publication by</span>
            <span className="sig">Noel Rhymer</span>
          </div>
        </div>
        <p className="site-footer__fine">
          © {new Date().getFullYear()} DARQ Era. Tech news and analysis.
        </p>
        <nav className="site-footer__links" aria-label="Footer">
          <Link href="/about">About</Link>
          <span aria-hidden="true"> · </span>
          <a href="/feed.xml">RSS</a>
          <span aria-hidden="true"> · </span>
          <Link href="/archive">Archive</Link>
        </nav>
      </div>
    </footer>
  );
}
