export default function ShareNotFound() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#f7f8fa]">
      <div className="text-center">
        <p className="text-4xl mb-3">🔍</p>
        <h1 className="text-lg font-bold">공유된 글을 찾을 수 없습니다</h1>
        <p className="text-sm text-[var(--muted)] mt-2">
          삭제되었거나 잘못된 링크일 수 있습니다.
        </p>
      </div>
    </div>
  );
}
