// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import {
  cn,
  Button,
  Badge,
  Card,
  StatCard,
  Field,
  EmptyState,
  Spinner,
  Segmented,
  PageHeader,
  FlagStripe,
  DemoBanner,
  Icon,
  Toaster,
  useToast,
} from './ui';

afterEach(() => cleanup());

describe('cn', () => {
  it('joins truthy parts and drops falsy ones', () => {
    expect(cn('a', false, 'b', null, undefined, 'c')).toBe('a b c');
  });
});

describe('Button', () => {
  it('renders the label and applies the requested variant', () => {
    render(<Button variant="navy">Save</Button>);
    const btn = screen.getByRole('button', { name: 'Save' });
    expect(btn.className).toContain('bg-g-navy');
  });

  it('shows a spinner and disables while loading', () => {
    render(<Button loading>Save</Button>);
    const btn = screen.getByRole('button', { name: 'Save' });
    expect(btn).toHaveProperty('disabled', true);
    expect(btn.querySelector('.animate-spin')).toBeTruthy();
  });

  it('renders a leading icon when requested', () => {
    render(<Button icon="plus">Add</Button>);
    expect(screen.getByRole('button', { name: 'Add' }).querySelector('svg')).toBeTruthy();
  });
});

describe('display primitives', () => {
  it('Badge renders children with the tone class', () => {
    render(<Badge tone="green">ACTIVE</Badge>);
    const badge = screen.getByText('ACTIVE');
    expect(badge.className).toContain('text-g-green');
  });

  it('Card renders the title, subtitle and action', () => {
    render(
      <Card title="Heading" subtitle="Sub" action={<button>Go</button>}>
        body
      </Card>,
    );
    expect(screen.getByText('Heading')).toBeTruthy();
    expect(screen.getByText('Sub')).toBeTruthy();
    expect(screen.getByText('Go')).toBeTruthy();
    expect(screen.getByText('body')).toBeTruthy();
  });

  it('StatCard renders label, value and hint', () => {
    render(<StatCard label="Total" value={42} icon="users" tone="green" hint="hint text" />);
    expect(screen.getByText('Total')).toBeTruthy();
    expect(screen.getByText('42')).toBeTruthy();
    expect(screen.getByText('hint text')).toBeTruthy();
  });

  it('Field renders the label and hint around the control', () => {
    render(
      <Field label="Name" hint="required">
        <input />
      </Field>,
    );
    expect(screen.getByLabelText(/Name/)).toBeTruthy();
    expect(screen.getByText('required')).toBeTruthy();
  });

  it('EmptyState renders title, message and action; Spinner shows the label', () => {
    render(
      <EmptyState icon="clock" title="Nothing here" message="Try later" action={<button>Retry</button>} />,
    );
    expect(screen.getByText('Nothing here')).toBeTruthy();
    expect(screen.getByText('Try later')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy();

    render(<Spinner label="Loading…" />);
    expect(screen.getAllByText('Loading…').length).toBeGreaterThan(0);
  });

  it('Segmented calls onChange and marks the active option', () => {
    const onChange = vi.fn();
    render(<Segmented options={[{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }]} value="a" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'B' }));
    expect(onChange).toHaveBeenCalledWith('b');
    expect(screen.getByRole('button', { name: 'A' }).className).toContain('bg-white');
  });

  it('PageHeader renders the title and action', () => {
    render(<PageHeader title="Reports" subtitle="Monthly" action={<button>Export</button>} />);
    expect(screen.getByText('Reports')).toBeTruthy();
    expect(screen.getByText('Monthly')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Export' })).toBeTruthy();
  });

  it('FlagStripe and Icon render', () => {
    const { container } = render(<FlagStripe />);
    expect(container.querySelector('.ghana-flag-stripe')).toBeTruthy();
    const { container: iconBox } = render(<Icon name="shield" />);
    expect(iconBox.querySelector('svg')).toBeTruthy();
  });

  it('DemoBanner has compact and full variants', () => {
    render(<DemoBanner compact />);
    expect(screen.getByText('DEMO / SYNTHETIC DATA')).toBeTruthy();
    render(<DemoBanner />);
    expect(screen.getByText(/DEMO \/ SYNTHETIC DATA — fictional records/)).toBeTruthy();
  });
});

describe('Toaster', () => {
  function Probe() {
    const push = useToast();
    return <button onClick={() => push('Saved successfully', 'success')}>push</button>;
  }

  it('renders toasts pushed through useToast', () => {
    render(
      <Toaster>
        <Probe />
      </Toaster>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'push' }));
    expect(screen.getByText('Saved successfully')).toBeTruthy();
  });

  it('pushes a toast for the offline-save shell event', () => {
    render(
      <Toaster>
        <Probe />
      </Toaster>,
    );
    act(() => window.dispatchEvent(new CustomEvent('gihm:offline-saved', { detail: 'Queued locally' })));
    expect(screen.getByText('Queued locally')).toBeTruthy();
  });
});
