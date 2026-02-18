import { Avatar, AvatarFallback } from "../../app/ui/avatar";
import { Badge } from "../../app/ui/badge";
import { Card } from "../../app/ui/card";

type FeedItem = {
    user: string;
    track: string;
    artist: string;
    mood: string;
    tags: string[];
};

function generateGradient(seed: string) {
    const colors = [
        "from-zinc-800 to-zinc-900",
        "from-neutral-800 to-black",
        "from-stone-800 to-zinc-900",
        "from-gray-800 to-neutral-900",
    ];

    const index = seed.length % colors.length;
    return colors[index];
}

export default function MusicPost({ item }: { item: FeedItem }) {
    const gradient = generateGradient(item.track);

    return (
        <Card className="relative overflow-hidden rounded-3xl border-0 bg-card p-5">
            {/* Градиентный фон */}
            <div
                className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-40`}
            />

            <div className="relative z-10 flex items-start gap-3">
                <Avatar className="h-9 w-9">
                    <AvatarFallback>
                        {item.user.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">@{item.user}</div>
                        <div className="text-xs text-muted-foreground">сейчас</div>
                    </div>

                    <div className="mt-4 flex items-center gap-4">
                        {/* Обложка */}
                        <div className="h-16 w-16 rounded-2xl bg-black/40 backdrop-blur-sm border border-white/10" />

                        <div>
                            <div className="text-base font-semibold">
                                {item.track}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {item.artist}
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 text-sm text-foreground/90 leading-relaxed">
                        {item.mood}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        {item.tags.map((t) => (
                            <Badge
                                key={t}
                                variant="secondary"
                                className="rounded-full bg-white/10 backdrop-blur border border-white/10 text-foreground"
                            >
                                {t}
                            </Badge>
                        ))}
                    </div>

                    <div className="mt-4 flex items-center gap-6 text-sm text-muted-foreground">
                        <button className="hover:text-foreground transition">♡</button>
                        <button className="hover:text-foreground transition">Комментарий</button>
                        <button className="hover:text-foreground transition ml-auto">➕</button>
                    </div>
                </div>
            </div>
        </Card>
    );
}
