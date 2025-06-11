'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
    Settings,
    ExternalLink,
    CheckCircle,
    XCircle,
    AlertCircle,
    RefreshCw,
    Copy
} from 'lucide-react';

interface PrintifySettings {
    apiConnected: boolean;
    shopId: string;
    shopName: string;
    webhookConfigured: boolean;
    autoFulfillment: boolean;
    defaultMarkup: number;
}

export default function PrintifySettings() {
    const [settings, setSettings] = useState<PrintifySettings>({
        apiConnected: false,
        shopId: '',
        shopName: '',
        webhookConfigured: false,
        autoFulfillment: false,
        defaultMarkup: 100,
    });
    const [loading, setLoading] = useState(true);
    const [testing, setTesting] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/printify/settings');

            if (!response.ok) {
                throw new Error('Failed to fetch settings');
            }

            const data = await response.json();
            setSettings(data);
        } catch (error) {
            console.error('Error fetching settings:', error);
            toast.error('Failed to load Printify settings');
        } finally {
            setLoading(false);
        }
    };

    const testConnection = async () => {
        try {
            setTesting(true);
            const response = await fetch('/api/admin/printify/test-connection', {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error('Connection test failed');
            }

            const result = await response.json();
            toast.success('Printify API connection successful!');

            // Update settings with test results
            setSettings(prev => ({
                ...prev,
                apiConnected: true,
                shopId: result.shopId,
                shopName: result.shopName,
            }));

        } catch (error) {
            console.error('Error testing connection:', error);
            toast.error('Printify API connection failed');
            setSettings(prev => ({ ...prev, apiConnected: false }));
        } finally {
            setTesting(false);
        }
    };

    const saveSettings = async () => {
        try {
            setSaving(true);
            const response = await fetch('/api/admin/printify/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    autoFulfillment: settings.autoFulfillment,
                    defaultMarkup: settings.defaultMarkup,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to save settings');
            }

            toast.success('Settings saved successfully!');
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const copyWebhookUrl = () => {
        const webhookUrl = `${window.location.origin}/api/webhook/printify`;
        navigator.clipboard.writeText(webhookUrl);
        toast.success('Webhook URL copied to clipboard!');
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <div className="h-4 bg-muted rounded animate-pulse" />
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="h-3 bg-muted rounded animate-pulse" />
                                    <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Connection Status */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        API Connection
                    </CardTitle>
                    <CardDescription>
                        Configure your Printify API connection
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <Label>Connection Status</Label>
                            <div className="flex items-center gap-2">
                                {settings.apiConnected ? (
                                    <>
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        <span className="text-sm text-green-600">Connected</span>
                                        <Badge variant="secondary">{settings.shopName}</Badge>
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="h-4 w-4 text-red-500" />
                                        <span className="text-sm text-red-600">Not Connected</span>
                                    </>
                                )}
                            </div>
                        </div>
                        <Button
                            onClick={testConnection}
                            disabled={testing}
                            variant="outline"
                        >
                            {testing ? (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Testing...
                                </>
                            ) : (
                                'Test Connection'
                            )}
                        </Button>
                    </div>

                    {settings.shopId && (
                        <div className="space-y-1">
                            <Label>Shop ID</Label>
                            <p className="text-sm text-muted-foreground font-mono">
                                {settings.shopId}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Webhook Configuration */}
            <Card>
                <CardHeader>
                    <CardTitle>Webhook Configuration</CardTitle>
                    <CardDescription>
                        Set up webhooks to receive order updates from Printify
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <Label>Webhook Status</Label>
                            <div className="flex items-center gap-2">
                                {settings.webhookConfigured ? (
                                    <>
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        <span className="text-sm text-green-600">Configured</span>
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                                        <span className="text-sm text-yellow-600">Not Configured</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Webhook URL</Label>
                        <div className="flex gap-2">
                            <Input
                                value={`${window.location.origin}/api/webhook/printify`}
                                readOnly
                                className="font-mono text-sm"
                            />
                            <Button size="sm" variant="outline" onClick={copyWebhookUrl}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Add this URL to your Printify webhook settings
                        </p>
                    </div>

                    <Button
                        variant="outline"
                        onClick={() => window.open('https://printify.com/app/account/api', '_blank')}
                    >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Configure in Printify
                    </Button>
                </CardContent>
            </Card>

            {/* Fulfillment Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Fulfillment Settings</CardTitle>
                    <CardDescription>
                        Configure how orders are processed and fulfilled
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <Label>Auto-Fulfillment</Label>
                            <p className="text-sm text-muted-foreground">
                                Automatically send orders to Printify when payment is confirmed
                            </p>
                        </div>
                        <Switch
                            checked={settings.autoFulfillment}
                            onCheckedChange={(checked) =>
                                setSettings(prev => ({ ...prev, autoFulfillment: checked }))
                            }
                        />
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <Label>Default Markup (%)</Label>
                        <Input
                            type="number"
                            value={settings.defaultMarkup}
                            onChange={(e) =>
                                setSettings(prev => ({
                                    ...prev,
                                    defaultMarkup: parseInt(e.target.value) || 0
                                }))
                            }
                            min="0"
                            max="1000"
                        />
                        <p className="text-xs text-muted-foreground">
                            Default markup percentage for imported products
                        </p>
                    </div>

                    <Button onClick={saveSettings} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Settings'}
                    </Button>
                </CardContent>
            </Card>

            {/* Documentation */}
            <Card>
                <CardHeader>
                    <CardTitle>Documentation & Support</CardTitle>
                    <CardDescription>
                        Helpful resources for Printify integration
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Button
                        variant="outline"
                        onClick={() => window.open('https://developers.printify.com/', '_blank')}
                        className="w-full justify-start"
                    >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Printify API Documentation
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() => window.open('https://help.printify.com/', '_blank')}
                        className="w-full justify-start"
                    >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Printify Help Center
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
} 