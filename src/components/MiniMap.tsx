import type { MapData, MapLink } from '../types';

interface Props {
  maps: MapData[];
  links: MapLink[];
  currentMapId: string;
  exploredMapIds: string[];
  pathTaken: string[];
}

function nodePosition(order: number) {
  if (order <= 6) {
    return { x: 48 + (order - 1) * 44, y: 50 };
  }
  return { x: 92 + (order - 7) * 44, y: 122 };
}

export default function MiniMap({ maps, links, currentMapId, exploredMapIds, pathTaken }: Props) {
  return (
    <div className="overflow-hidden rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,#09111a,#070b10)] p-2">
      <svg viewBox="0 0 320 170" className="h-36 w-full" preserveAspectRatio="xMidYMid meet">
        <rect width="320" height="170" rx="20" fill="#030712" />

        {links.map((link) => {
          const fromMap = maps.find((entry) => entry.id === link.from);
          const toMap = maps.find((entry) => entry.id === link.to);
          if (!fromMap || !toMap) return null;
          const from = nodePosition(fromMap.order);
          const to = nodePosition(toMap.order);
          const revealed = exploredMapIds.includes(link.from) || exploredMapIds.includes(link.to);

          return (
            <line
              key={`${link.from}-${link.to}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={revealed ? '#4b647e' : '#18222d'}
              strokeWidth="5"
              strokeLinecap="round"
            />
          );
        })}

        {maps.map((map) => {
          const { x, y } = nodePosition(map.order);
          const explored = exploredMapIds.includes(map.id);
          const current = currentMapId === map.id;
          const visited = pathTaken.includes(map.id);

          return (
            <g key={map.id}>
              <circle
                cx={x}
                cy={y}
                r={current ? 16 : 12}
                fill={current ? '#fbbf24' : explored ? '#3b82f6' : '#0f172a'}
                stroke={visited ? '#f8fafc' : '#334155'}
                strokeWidth={current ? 3 : 2}
              />
              <text x={x} y={y + 4} textAnchor="middle" fontSize="10" fill="#f8fafc">
                {map.order}
              </text>
              <text x={x} y={y + 28} textAnchor="middle" fontSize="9" fill={explored ? '#cbd5e1' : '#64748b'}>
                {map.shortName}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
