import { useState, useEffect } from "react";
import { Button, Card, Input, Label, Badge } from "@immersive-lang/ui/components/atoms";
import { Cloud, CloudOff, Loader2, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { useSync } from "@immersive-lang/ui/hooks";
import { useAuth } from "@immersive-lang/ui/hooks";
import { isTauri } from "@immersive-lang/ui/adapters/shared";

interface SyncSettingsProps {
}

export const SyncSettings = () => {
    const { status, lastResult, isSyncing, syncProgress, syncNow, configure } = useSync();
    const { isAuthenticated } = useAuth();
    const [serverUrl, setServerUrl] = useState("");

    useEffect(() => {
        if (status?.serverUrl) {
            setServerUrl(status.serverUrl);
        }
    }, [status?.serverUrl]);

    const handleSync = async () => {
        await syncNow();
    };

    const handleConfigureSync = async () => {
        if (!serverUrl) return;
        await configure({ serverUrl });
    };

    const formatTimestamp = (timestamp?: number) => {
        if (!timestamp) return "Never";
        return new Date(timestamp).toLocaleString();
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Sync Status Card */}
            <Card>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Cloud Sync Status</h3>
                    {status?.configured && isAuthenticated ? (
                        <div className="flex items-center gap-2 text-green-400">
                            <Cloud className="w-5 h-5" />
                            <span className="text-sm">Connected</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-white/40">
                            <CloudOff className="w-5 h-5" />
                            <span className="text-sm">Disconnected</span>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-3 text-sm">
                    <div className="flex justify-between">
                        <span className="text-white/60">Last synced:</span>
                        <span>{formatTimestamp(status?.lastSyncAt)}</span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-white/60">Pending changes:</span>
                        {(status?.pendingChanges ?? 0) > 0 ? (
                            <Badge className="bg-yellow-600">{status?.pendingChanges}</Badge>
                        ) : (
                            <span className="text-green-400">None</span>
                        )}
                    </div>

                    {lastResult && (
                        <div
                            className={`mt-2 p-3 rounded-lg border ${
                                lastResult.success
                                    ? "bg-green-500/10 border-green-500/30"
                                    : "bg-red-600/10 border-red-600/30"
                            }`}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                {lastResult.success ? (
                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                ) : (
                                    <AlertCircle className="w-4 h-4 text-red-300" />
                                )}
                                <span className="font-medium">
                                    {lastResult.success ? "Sync completed" : "Sync failed"}
                                </span>
                            </div>
                            <div className="text-[0.8125rem] text-white/70">
                                Pushed: {lastResult.pushed} • Pulled: {lastResult.pulled}
                                {lastResult.conflicts > 0 && ` • Conflicts: ${lastResult.conflicts}`}
                                {lastResult.error && <div className="mt-1 text-red-300">{lastResult.error}</div>}
                            </div>
                        </div>
                    )}
                </div>

                {isAuthenticated && (
                    <Button
                        variant="primary"
                        onClick={handleSync}
                        disabled={isSyncing || !status?.configured}
                        className="w-full mt-4"
                    >
                        {isSyncing ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Syncing...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Sync Now
                            </>
                        )}
                    </Button>
                )}

                {/* Sync Progress */}
                {isSyncing && syncProgress && (
                    <div className="mt-4 p-3 rounded-lg border bg-blue-500/10 border-blue-500/30">
                        <div className="flex items-center gap-2 mb-2">
                            <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                            <span className="font-medium capitalize">
                                {syncProgress.phase === "pushing" ? "Pushing changes..." : "Pulling updates..."}
                            </span>
                        </div>
                        <div className="text-[0.8125rem] text-white/70 space-y-1">
                            {syncProgress.recordsPushed > 0 && <div>Pushed: {syncProgress.recordsPushed} records</div>}
                            {syncProgress.phase === "pulling" && (
                                <>
                                    <div>Pulled: {syncProgress.recordsPulled} records</div>
                                    <div className="flex items-center gap-2">
                                        <span>Page: {syncProgress.currentPage}</span>
                                        {syncProgress.hasMore && (
                                            <Badge className="bg-blue-600 text-xs">More pages...</Badge>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </Card>

            {/* Server Configuration Card - Only shown in Tauri (native) mode */}
            {isTauri() && (
                <Card>
                    <h3 className="text-lg font-semibold mb-4">Server Configuration</h3>

                    <div className="flex flex-col gap-4">
                        <div>
                            <Label htmlFor="server-url">Server URL</Label>
                            <Input
                                id="server-url"
                                type="text"
                                placeholder="http://localhost:3000"
                                value={serverUrl}
                                onChange={(e) => setServerUrl(e.target.value)}
                            />
                            <p className="text-xs text-white/50 mt-1 mb-0">
                                Current server: {status?.serverUrl || "Not configured"}
                            </p>
                        </div>
                        <Button variant="secondary" size="sm" onClick={handleConfigureSync} disabled={!serverUrl}>
                            Save Configuration
                        </Button>
                    </div>
                </Card>
            )}
        </div>
    );
};
