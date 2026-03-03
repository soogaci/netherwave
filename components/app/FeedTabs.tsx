"use client"

import { Tabs, TabsList, TabsTrigger } from "../../app/ui/tabs"


export default function FeedTabs() {
    return (
        <Tabs defaultValue="music" className="mb-6">
            <TabsList className="grid w-full grid-cols-3 rounded-2xl bg-background/60 p-1 border backdrop-blur">

                <TabsTrigger
                    value="music"
                    className="rounded-xl data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-sm"

                >
                    Музыка
                </TabsTrigger>

                <TabsTrigger
                    value="people"
                    className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                    Люди
                </TabsTrigger>

                <TabsTrigger
                    value="vibe"
                    className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                    Вайб
                </TabsTrigger>
            </TabsList>
        </Tabs>
    )
}
