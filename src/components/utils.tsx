import React, { JSX } from "react";
import { gsap } from "gsap";

export interface Scene {
    readonly frameCount: number;
    camera({ currentFrame }: { currentFrame: number }): null;
    lighting({ currentFrame }: { currentFrame: number }): JSX.Element;
    objects({ currentFrame }: { currentFrame: number }): JSX.Element;
    description({ currentFrame }: { currentFrame: number }): JSX.Element;
    provider?: ({ children }: { children: React.ReactNode }) => JSX.Element | null;
}

type CameraElement = {x: number; y: number; z: number; };

export function AnimateVector(start: CameraElement, end: CameraElement, duration: number, setFunction: (x: number, y: number, z: number) => void) {
    gsap.to(start, {
        x: end.x,
        y: end.y,
        z: end.z,
        duration: duration,
        ease: "power2.inOut",
        onUpdate: () => {
            setFunction(start.x, start.y, start.z);
        }
    });
}
    