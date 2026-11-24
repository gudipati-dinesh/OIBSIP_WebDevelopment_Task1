// Shown only when the server has no SMTP configured, so the flow can still be tested locally.
export default function DevLink({ link }) {
  if (!link) return null;
  return (
    <div className="dev-note">
      <b>Email is not configured</b>, so here is your link (also printed in the server console):<br />
      <a className="link" href={link}>{link}</a>
    </div>
  );
}
