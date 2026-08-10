import { Card } from '../../components/ui';

export default function ContentPage({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-3xl font-bold text-g-ink">{title}</h1>
      <Card className="mt-6">
        <p className="leading-relaxed text-slate-600">{body}</p>
        <p className="mt-4 text-xs text-slate-400">This is a foundation prototype — this section is a placeholder that will be driven by the CMS workflow in a later phase.</p>
      </Card>
    </div>
  );
}
