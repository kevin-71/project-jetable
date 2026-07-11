interface JobStatusBadgeProps {
  status: 'pending' | 'processing' | 'success' | 'error';
}

export function JobStatusBadge({ status }: JobStatusBadgeProps) {
  return <div className="card">Statut génération: <strong>{status}</strong></div>;
}
