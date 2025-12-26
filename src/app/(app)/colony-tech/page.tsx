export default function Page() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-headline text-2xl font-semibold text-primary">
          Colony Tech
        </h1>
        <p className="text-sm text-muted-foreground">
          This module page exists so the sidebar only contains ColonyGo modules
          (as requested).
        </p>
      </header>

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="text-sm font-medium text-foreground">Status</div>
            <div className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs text-foreground">
              In progress
            </div>
          </div>
          <div className="h-10 w-10 rounded-2xl bg-primary/10" />
        </div>
      </div>
    </div>
  );
}
