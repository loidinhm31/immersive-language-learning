import { useState, useEffect } from "react";
import { Button, Card, Input, Label } from "@immersive-lang/ui/components/atoms";
import { Key, CheckCircle, XCircle, ExternalLink, Eye, EyeOff } from "lucide-react";
import { GEMINI_STORAGE_KEYS, encryptForStorage, decryptFromStorage } from "@immersive-lang/shared";

export const GeminiSettings = () => {
    const [apiKey, setApiKey] = useState("");
    const [isConfigured, setIsConfigured] = useState(false);
    const [showKey, setShowKey] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Check if API key is configured on mount
    useEffect(() => {
        const checkStoredKey = async () => {
            try {
                const encryptedKey = localStorage.getItem(GEMINI_STORAGE_KEYS.API_KEY);
                if (encryptedKey) {
                    // Try to decrypt to verify it's valid
                    await decryptFromStorage(encryptedKey);
                    setIsConfigured(true);
                }
            } catch {
                // Invalid or corrupted key, remove it
                localStorage.removeItem(GEMINI_STORAGE_KEYS.API_KEY);
                setIsConfigured(false);
            }
        };
        checkStoredKey();
    }, []);

    const handleSave = async () => {
        if (!apiKey.trim()) {
            setMessage({ type: "error", text: "Please enter an API key" });
            return;
        }

        setIsSaving(true);
        setMessage(null);

        try {
            const encrypted = await encryptForStorage(apiKey.trim());
            localStorage.setItem(GEMINI_STORAGE_KEYS.API_KEY, encrypted);
            setIsConfigured(true);
            setApiKey("");
            setMessage({ type: "success", text: "API key saved successfully" });
        } catch (error) {
            console.error("Failed to encrypt API key:", error);
            setMessage({ type: "error", text: "Failed to save API key" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleClear = () => {
        localStorage.removeItem(GEMINI_STORAGE_KEYS.API_KEY);
        setIsConfigured(false);
        setApiKey("");
        setMessage({ type: "success", text: "API key removed" });
    };

    return (
        <Card>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Gemini API Key</h3>
                {isConfigured ? (
                    <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm">Configured</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-white/40">
                        <XCircle className="w-5 h-5" />
                        <span className="text-sm">Not configured</span>
                    </div>
                )}
            </div>

            <p className="text-sm text-white/60 mb-4">
                Provide your own Gemini API key to use the voice conversation features. Your key is encrypted before
                being stored locally.
            </p>

            <div className="flex flex-col gap-4">
                <div>
                    <Label htmlFor="gemini-api-key" className="flex items-center gap-2">
                        <Key className="w-4 h-4" />
                        API Key
                    </Label>
                    <div className="relative">
                        <Input
                            id="gemini-api-key"
                            type={showKey ? "text" : "password"}
                            placeholder={isConfigured ? "••••••••••••••••" : "Enter your Gemini API key"}
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowKey(!showKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                        >
                            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                    <a
                        href="https://aistudio.google.com/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-2"
                    >
                        Get your API key from Google AI Studio
                        <ExternalLink className="w-3 h-3" />
                    </a>
                </div>

                {message && (
                    <div
                        className={`p-3 rounded-lg text-sm ${
                            message.type === "success"
                                ? "bg-green-500/10 border border-green-500/30 text-green-400"
                                : "bg-red-600/10 border border-red-600/30 text-red-300"
                        }`}
                    >
                        {message.text}
                    </div>
                )}

                <div className="flex gap-2">
                    <Button variant="primary" size="sm" onClick={handleSave} disabled={isSaving || !apiKey.trim()}>
                        {isSaving ? "Saving..." : "Save Key"}
                    </Button>
                    {isConfigured && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClear}
                            className="text-red-400 hover:text-red-300"
                        >
                            Clear Key
                        </Button>
                    )}
                </div>
            </div>
        </Card>
    );
};
