import type { SVGProps } from 'react';

const PATHS: Record<string, React.ReactNode> = {
  search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>,
  phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.5 2.8.6a2 2 0 0 1 1.7 2Z" />,
  mail: <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></>,
  pin: <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></>,
  user: <><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
  bed: <><path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9" /></>,
  flask: <><path d="M10 2v6.3L4.4 18a2 2 0 0 0 1.8 3h11.6a2 2 0 0 0 1.8-3L14 8.3V2" /><path d="M8.5 2h7M7 15h10" /></>,
  pill: <><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" /><path d="m8.5 8.5 7 7" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  alert: <><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></>,
  wifi: <><path d="M5 13a10 10 0 0 1 14 0M8.5 16.5a5 5 0 0 1 7 0M2 8.8a15 15 0 0 1 20 0" /><path d="M12 20h.01" /></>,
  wifiOff: <><path d="m2 2 20 20M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5-2.7M2 8.8a15 15 0 0 1 6-3.3M16.7 6.9a15 15 0 0 1 5.3 2" /></>,
  check: <path d="m4 12.5 5 5L20 6.5" />,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  chevDown: <path d="m6 9 6 6 6-6" />,
  arrowRight: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
  home: <><path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" /><path d="M9 22V12h6v10" /></>,
  pulse: <><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></>,
  activity: <path d="M22 12h-4l-3-9-6 18-3-9H2" />,
  clipboard: <><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h0a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></>,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></>,
  refresh: <><path d="M3 12a9 9 0 0 1 15.4-6.4L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.4 6.4L3 16M3 21v-5h5" /></>,
  building: <><rect x="4" y="2" width="16" height="20" rx="1" /><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01" /></>,
  stethoscope: <><path d="M4.5 3v6a4.5 4.5 0 0 0 9 0V3M6 3v2M12 3v2" /><path d="M4.5 9H4a2 2 0 0 0-2 2 10 10 0 0 0 10 10 10 10 0 0 0 10-10 2 2 0 0 0-2-2h-.5" /></>,
  ambulance: <><path d="M10 17h4V5H2v12h3M20 17h2v-3.3a1 1 0 0 0-.2-.6l-2.4-3.1a1 1 0 0 0-.8-.4H14" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /><path d="M9 17h6" /></>,
  syringe: <><path d="m18 2 4 4M17 7l3-3M19 9 8.7 19.3a2.4 2.4 0 0 1-3.4 0L3.7 17.7a2.4 2.4 0 0 1 0-3.4L14 4M22 12 12 22M6.5 12.5l5 5" /></>,
  baby: <><path d="M9 12h.01M15 12h.01M12 2a2 2 0 0 0-2 2v1c-2.8.5-5 2.9-5 5.8V13a7 7 0 0 0 14 0v-2.2c0-2.9-2.2-5.3-5-5.8V4a2 2 0 0 0-2-2Z" /></>,
  fileText: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" /></>,
  card: <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></>,
  truck: <><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2M15 18h2M9 18h3" /><path d="M14 8h3.6a1 1 0 0 1 .8.4L21 12v5a1 1 0 0 1-1 1h-1" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h.01" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z" /></>,
  chat: <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" /></>,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  star: <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1Z" />,
  list: <><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></>,
  hash: <><path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18" /></>,
  drop: <><path d="M12 2.7 6.2 9.5a7 7 0 1 0 11.6 0Z" /><path d="M12 14.5a2.5 2.5 0 0 0-2.5 2.5" /></>,
  scalpel: <><path d="m14.5 3.5 6 6M4.5 19.5 12 12l1.5 1.5-8 6.5z" /><path d="m14.5 3.5-8.5 8.5 6 6 8.5-8.5" /></>,
};

export type IconName = keyof typeof PATHS;

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
}

export function Icon({ name, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {PATHS[name]}
    </svg>
  );
}
