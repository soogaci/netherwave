import Link from "next/link";

export default function NotFound() {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
            <h1 className="text-2xl font-semibold">Страница не найдена</h1>
            <p className="text-muted-foreground text-center">
                404 — запрашиваемый адрес не существует
            </p>
            <Link
                href="/"
                className="rounded-xl bg-foreground text-background px-6 py-2 text-sm font-medium hover:opacity-90"
            >
                На главную
            </Link>
        </div>
    );
}
