import { useControls } from "leva";
import { useEffect } from "react";

export type EnvironmentPreset = "sunset" | "dawn" | "night" | "warehouse" | "forest" | "apartment" | "studio" | "city" | "park" | "lobby";

interface ViewerControlsOptions {
    defaultEnvironment?: EnvironmentPreset;
}

export function ViewerControls3D({ defaultEnvironment = "studio" }: ViewerControlsOptions = {}) {
    const [controls, set] = useControls("Configuration 3D", () => ({
        autoRotate: false,
        rotationSpeed: { value: 3.5, min: 0.1, max: 10, step: 0.1 },
        glow: { value: 1.0, min: 0.0, max: 5.0, step: 0.1 },
        environment: {
            options: ['sunset', 'dawn', 'night', 'warehouse', 'forest', 'apartment', 'studio', 'city', 'park', 'lobby'],
            value: defaultEnvironment
        }
    }));

    useEffect(() => {
        set({ 
            environment: defaultEnvironment 
        });
    }, [defaultEnvironment, set]);

    return controls;
}