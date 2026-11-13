// On a laptop or projector, the guest app sits in a black iPhone frame so the
// audience reads it as "the guest's phone". On a real phone (below the sm
// breakpoint) the frame disappears and the app is full screen.
export function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh sm:flex sm:items-center sm:justify-center sm:bg-muted sm:py-3">
      <div className="relative sm:rounded-[3.6rem] sm:bg-[#0b0b0c] sm:p-3 sm:shadow-2xl sm:ring-1 sm:ring-black/50">
        {/* Side buttons */}
        <span aria-hidden className="absolute top-28 -left-[3px] hidden h-8 w-[3px] rounded-l bg-[#1c1c1e] sm:block" />
        <span aria-hidden className="absolute top-44 -left-[3px] hidden h-14 w-[3px] rounded-l bg-[#1c1c1e] sm:block" />
        <span aria-hidden className="absolute top-[15.5rem] -left-[3px] hidden h-14 w-[3px] rounded-l bg-[#1c1c1e] sm:block" />
        <span aria-hidden className="absolute top-48 -right-[3px] hidden h-20 w-[3px] rounded-r bg-[#1c1c1e] sm:block" />

        <main className="relative mx-auto flex h-dvh w-full max-w-md flex-col overflow-hidden bg-background [container-type:size] sm:h-[min(852px,calc(100dvh-2.75rem))] sm:w-[393px] sm:rounded-[2.9rem]">
          <StatusBar />
          {children}
          {/* Home indicator */}
          <div aria-hidden className="hidden h-5 shrink-0 items-center justify-center bg-background sm:flex">
            <span className="h-1 w-32 rounded-full bg-foreground/80" />
          </div>
        </main>
      </div>
    </div>
  );
}

function StatusBar() {
  return (
    <div aria-hidden className="relative hidden h-12 shrink-0 items-center justify-between bg-background px-8 pt-1 text-[15px] font-semibold sm:flex">
      <span>9:41</span>
      {/* Dynamic Island */}
      <span className="absolute top-2.5 left-1/2 h-[30px] w-[110px] -translate-x-1/2 rounded-full bg-black" />
      <span className="flex items-center gap-1.5">
        <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor">
          <rect x="0" y="7" width="3" height="4" rx="1" />
          <rect x="4.5" y="5" width="3" height="6" rx="1" />
          <rect x="9" y="2.5" width="3" height="8.5" rx="1" />
          <rect x="13.5" y="0" width="3" height="11" rx="1" />
        </svg>
        <svg width="15" height="11" viewBox="0 0 15 11" fill="currentColor">
          <path d="M7.5 2.2c2 0 3.9.8 5.3 2.1l1.1-1.1A9 9 0 0 0 7.5.6 9 9 0 0 0 1.1 3.2l1.1 1.1a7.5 7.5 0 0 1 5.3-2.1Zm0 3.2c1.1 0 2.2.4 3 1.2l1.1-1.1a5.9 5.9 0 0 0-8.2 0l1.1 1.1c.8-.8 1.9-1.2 3-1.2Zm0 3.1c-.4 0-.8.2-1.1.5l1.1 1.1 1.1-1.1c-.3-.3-.7-.5-1.1-.5Z" />
        </svg>
        <svg width="26" height="12" viewBox="0 0 26 12" fill="none">
          <rect x="0.5" y="0.5" width="22" height="11" rx="3.5" stroke="currentColor" opacity="0.4" />
          <rect x="2" y="2" width="17" height="8" rx="2" fill="currentColor" />
          <path d="M24 4v4c.8-.3 1.3-1.1 1.3-2S24.8 4.3 24 4Z" fill="currentColor" opacity="0.5" />
        </svg>
      </span>
    </div>
  );
}
