export function StubScreen({ title, body }: { title: string; body: string }) {
  return (
    <main className="py-16 text-center">
      <h1 className="font-serif text-3xl font-semibold">{title}</h1>
      <p className="mt-3 text-muted">{body}</p>
    </main>
  );
}
