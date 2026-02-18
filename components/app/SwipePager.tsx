"use client";

import React from "react";
import { motion, useMotionValue, animate, MotionValue } from "framer-motion";
import { hapticLight } from "@/lib/haptic";

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

const DIR_THRESHOLD = 8;
const DIR_RATIO = 1.3;

export default function SwipePager({
    index,
    onIndexChange,
    children,
    onXChange,
}: {
    index: number;
    onIndexChange: (i: number) => void;
    children: React.ReactNode[];
    onXChange?: (x: MotionValue<number>, width: number) => void;
}) {
    const count = children.length;

    const containerRef = React.useRef<HTMLDivElement | null>(null);
    const [width, setWidth] = React.useState(0);

    const x = useMotionValue(0);

    const isDragging = React.useRef(false);
    const [blockScroll, setBlockScroll] = React.useState(false);
    const lastX = React.useRef(0);
    const startX = React.useRef(0);
    const startY = React.useRef(0);

    React.useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const update = () => setWidth(el.getBoundingClientRect().width);
        update();

        const ro = new ResizeObserver(update);
        ro.observe(el);

        return () => ro.disconnect();
    }, []);

    React.useEffect(() => {
        if (!width) return;
        onXChange?.(x, width);
    }, [onXChange, x, width]);

    React.useEffect(() => {
        if (!width) return;
        const target = -index * width;
        animate(x, target, { type: "spring", stiffness: 400, damping: 35 });
    }, [index, width, x]);

    const leftBound = -(count - 1) * width;
    const rightBound = 0;

    function handlePointerDown(e: React.PointerEvent) {
        lastX.current = e.clientX;
        startX.current = e.clientX;
        startY.current = e.clientY;
        isDragging.current = false;
    }

    function handlePointerMove(e: React.PointerEvent) {
        if (!width) return;

        const dx = e.clientX - startX.current;
        const dy = e.clientY - startY.current;

        if (!isDragging.current) {
            const adx = Math.abs(dx);
            const ady = Math.abs(dy);
            if (adx < DIR_THRESHOLD && ady < DIR_THRESHOLD) return;
            if (adx > ady * DIR_RATIO) {
                isDragging.current = true;
                setBlockScroll(true);
                (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                const initialDelta = e.clientX - startX.current;
                const cur = x.get();
                x.set(Math.max(leftBound - width * 0.15, Math.min(rightBound + width * 0.15, cur + initialDelta)));
                lastX.current = e.clientX;
            } else {
                return;
            }
        }

        e.preventDefault();

        const delta = e.clientX - lastX.current;
        lastX.current = e.clientX;

        const current = x.get();
        let next = current + delta;
        next = Math.max(leftBound - width * 0.15, Math.min(rightBound + width * 0.15, next));
        x.set(next);
    }

    function handlePointerUp(e: React.PointerEvent) {
        try {
            (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        } catch {}

        if (!width) {
            setBlockScroll(false);
            return;
        }

        if (isDragging.current) {
            const currentX = x.get();
            const pageOffset = -currentX / width;
            const threshold = 0.22;
            let next: number;
            if (pageOffset > index + threshold) {
                next = index + 1;
            } else if (pageOffset < index - threshold) {
                next = index - 1;
            } else {
                next = Math.round(pageOffset);
            }
                    next = clamp(next, 0, count - 1);
                    if (next !== index) hapticLight();
                    onIndexChange(next);
        }

        isDragging.current = false;
        setBlockScroll(false);
    }

    return (
        <div
            ref={containerRef}
            className="w-full overflow-hidden"
            style={{ touchAction: blockScroll ? "none" : "pan-y" }}
        >
            <div
                className="w-full select-none"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onPointerLeave={handlePointerUp}
            >
                <motion.div
                    className="flex"
                    style={{
                        x,
                        width: width ? count * width : "100%",
                    }}
                >
                    {children.map((child, i) => (
                        <div key={i} className="shrink-0" style={{ width: width || "100%" }}>
                            {child}
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}
