export function MetricCard({ label, value, context }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {context && <small>{context}</small>}
    </article>
  )
}
