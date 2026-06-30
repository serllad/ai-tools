interface Props {
  message: string | null;
}

export function ErrorBanner({ message }: Props) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 px-4 py-2 text-sm border border-red-300 dark:border-red-700"
    >
      {message}
    </div>
  );
}
