export default function Field({ label, ...props }) {
  return (
    <div className="field">
      <label htmlFor={props.name}>{label}</label>
      <input id={props.name} className="input" {...props} />
    </div>
  );
}
