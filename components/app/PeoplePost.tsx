import { Avatar, AvatarFallback } from "../../app/ui/avatar";
import { Badge } from "../../app/ui/badge";
import { Card } from "../../app/ui/card";

export type PeopleItem = {
    user: string;
    name?: string;
    time: string;
    text: string;
    tags?: string[];
    hasPhoto?: boolean;
};

export default function PeoplePost({ item }: { item: PeopleItem }) {
    return (
        <Card className="rounded-3xl p-5 border-0 bg-card">
            <div className="flex items-start gap-3">
                <Avatar className="h-9 w-9">
                    <AvatarFallback>{item.user.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <div className="truncate text-sm font-medium">
                                {item.name ? item.name : `@${item.user}`}
                            </div>
                            <div className="text-xs text-muted-foreground">@{item.user}</div>
                        </div>
                        <div className="text-xs text-muted-foreground">{item.time}</div>
                    </div>

                    <div className="mt-3 text-sm leading-relaxed text-foreground/90">
                        {item.text}
                    </div>

                    {item.hasPhoto && (
                        <div className="mt-4 h-44 w-full rounded-2xl bg-muted" />
                    )}

                    {!!item.tags?.length && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {item.tags.map((t) => (
                                <Badge key={t} variant="secondary" className="rounded-full">
                                    {t}
                                </Badge>
                            ))}
                        </div>
                    )}

                    <div className="mt-4 flex items-center gap-5 text-sm text-muted-foreground">
                        <button className="hover:text-foreground">♡</button>
                        <button className="hover:text-foreground">Комментарий</button>
                        <button className="hover:text-foreground ml-auto">Поделиться</button>
                    </div>
                </div>
            </div>
        </Card>
    );
}
