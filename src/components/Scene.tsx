import { JSX } from "react";

export interface Scene {
    readonly frameCount: number;
    camera({ currentFrame }: { currentFrame: number }): null;
    lighting({ currentFrame }: { currentFrame: number }): JSX.Element;
    objects({ currentFrame }: { currentFrame: number }): JSX.Element;
    description({ currentFrame }: { currentFrame: number }): JSX.Element;
}