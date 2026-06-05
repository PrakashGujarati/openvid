"use client";

import { AuthProvider } from "@/hooks/useAuth";
import { RecordingProvider } from "@/hooks/RecordingContext";
import RecordingOverlay from "../../components/ui/RecordingOverlay";
import { MotionProvider } from "@/app/contexts/MotionContext";

export default function EditorLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <RecordingProvider>
                <MotionProvider>
                    <div className="min-h-screen bg-neutral-950">
                        {children}
                    </div>
                </MotionProvider>
                <RecordingOverlay />
            </RecordingProvider>
        </AuthProvider>
    );
}
