import { Badge, Card } from "../ui";
import "./shells.css";

export interface PlaceholderPageProps {
  eyebrow: string;
  title: string;
}

export function PlaceholderPage({ eyebrow, title }: PlaceholderPageProps) {
  return (
    <Card as="section" className="placeholder-page">
      <Badge tone="neutral">Route placeholder</Badge>
      <p className="placeholder-page__eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p>
        Shell dan rute sudah siap. Konten fitur akan diimplementasikan pada
        issue terpisah.
      </p>
    </Card>
  );
}
