import { useState } from "react";
import { Button, Card, Input, Label, Badge } from "@immersive-lang/ui/components/atoms";
import { Cloud, CloudOff, Loader2, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { useSync } from "@immersive-lang/ui/hooks";
import { useAuth } from "@immersive-lang/ui/hooks";

export const SyncSettings = () => {
    const { status, lastResult, isSyncing, syncNow } = useSync();
    const { isAuthenticated } = useAuth();
    const [serverUrl, setServerUrl] = useState("");

    const handleSync = async () => {
        await syncNow();
    };

    const formatTimestamp = (timestamp?: number) => {
        if (!timestamp) return "Never";
        return new Date(timestamp).toLocaleString();
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Sync Status Card */}
            <Card style={{ padding: "1.5rem" }}>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "1rem",
                    }}
                >
                    <h3 style={{ fontSize: "1.125rem", fontWeight: "600", margin: 0 }}>Cloud Sync Status</h3>
                    {status?.configured && isAuthenticated ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#61bf7b" }}>
                            <Cloud style={{ width: "1.25rem", height: "1.25rem" }} />
                            <span style={{ fontSize: "0.875rem" }}>Connected</span>
                        </div>
                    ) : (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                color: "rgba(255, 255, 255, 0.4)",
                            }}
                        >
                            <CloudOff style={{ width: "1.25rem", height: "1.25rem" }} />
                            <span style={{ fontSize: "0.875rem" }}>Disconnected</span>
                        </div>
                    )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.875rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "rgba(255, 255, 255, 0.6)" }}>Last synced:</span>
                        <span>{formatTimestamp(status?.lastSyncAt)}</span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: "rgba(255, 255, 255, 0.6)" }}>Pending changes:</span>
                        {(status?.pendingChanges ?? 0) > 0 ? (
                            <Badge style={{ backgroundColor: "#d4a600" }}>{status?.pendingChanges}</Badge>
                        ) : (
                            <span style={{ color: "#61bf7b" }}>None</span>
                        )}
                    </div>

                    {lastResult && (
                        <div
                            style={{
                                marginTop: "0.5rem",
                                padding: "0.75rem",
                                borderRadius: "0.5rem",
                                backgroundColor: lastResult.success
                                    ? "rgba(97, 191, 123, 0.1)"
                                    : "rgba(220, 38, 38, 0.1)",
                                border: lastResult.success
                                    ? "1px solid rgba(97, 191, 123, 0.3)"
                                    : "1px solid rgba(220, 38, 38, 0.3)",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                    marginBottom: "0.5rem",
                                }}
                            >
                                {lastResult.success ? (
                                    <CheckCircle style={{ width: "1rem", height: "1rem", color: "#61bf7b" }} />
                                ) : (
                                    <AlertCircle style={{ width: "1rem", height: "1rem", color: "#fca5a5" }} />
                                )}
                                <span style={{ fontWeight: "500" }}>
                                    {lastResult.success ? "Sync completed" : "Sync failed"}
                                </span>
                            </div>
                            <div style={{ fontSize: "0.8125rem", color: "rgba(255, 255, 255, 0.7)" }}>
                                Pushed: {lastResult.pushed} • Pulled: {lastResult.pulled}
                                {lastResult.conflicts > 0 && ` • Conflicts: ${lastResult.conflicts}`}
                                {lastResult.error && (
                                    <div style={{ marginTop: "0.25rem", color: "#fca5a5" }}>{lastResult.error}</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {isAuthenticated && (
                    <Button
                        onClick={handleSync}
                        disabled={isSyncing || !status?.configured}
                        style={{
                            width: "100%",
                            marginTop: "1rem",
                            background: "linear-gradient(135deg, #61bf7b 0%, #509f63 100%)",
                        }}
                    >
                        {isSyncing ? (
                            <>
                                <Loader2
                                    style={{
                                        width: "1rem",
                                        height: "1rem",
                                        marginRight: "0.5rem",
                                        animation: "spin 1s linear infinite",
                                    }}
                                />
                                Syncing...
                            </>
                        ) : (
                            <>
                                <RefreshCw style={{ width: "1rem", height: "1rem", marginRight: "0.5rem" }} />
                                Sync Now
                            </>
                        )}
                    </Button>
                )}
            </Card>

            {/* Server Configuration Card */}
            <Card style={{ padding: "1.5rem" }}>
                <h3 style={{ fontSize: "1.125rem", fontWeight: "600", marginBottom: "1rem" }}>Server Configuration</h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div>
                        <Label htmlFor="server-url">Server URL</Label>
                        <Input
                            id="server-url"
                            type="url"
                            placeholder="http://localhost:3000"
                            value={serverUrl || status?.serverUrl || ""}
                            onChange={(e) => setServerUrl(e.target.value)}
                            disabled
                        />
                        <p
                            style={{
                                fontSize: "0.75rem",
                                color: "rgba(255, 255, 255, 0.5)",
                                marginTop: "0.25rem",
                                marginBottom: 0,
                            }}
                        >
                            Current server: {status?.serverUrl || "Not configured"}
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
};
