interface Connection {
  domain: string;
  description: string;
  reason: string;
  href: string;
}

interface UnexpectedConnectionsProps {
  connections: Connection[];
}

export function UnexpectedConnections({
  connections,
}: UnexpectedConnectionsProps) {
  if (connections.length === 0) return null;

  return (
    <div>
      <p className="label text-accent">Unexpected Connections</p>
      <p className="mt-1 text-xs text-ink-faint">
        Outside your field — structurally similar
      </p>
      <ul className="mt-4 space-y-5">
        {connections.map((c) => (
          <li key={c.domain}>
            <a
              href={c.href}
              className="group block"
            >
              <p className="label transition-colors group-hover:text-accent">
                {c.domain}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                {c.description}
              </p>
              <p className="mt-1.5 text-xs italic leading-relaxed text-ink-faint">
                {c.reason}
              </p>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
