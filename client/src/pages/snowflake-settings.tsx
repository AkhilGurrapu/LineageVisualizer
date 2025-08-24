import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { X, Database, CheckCircle, AlertCircle } from "lucide-react";

interface SnowflakeSettingsProps {
  onClose: () => void;
}

interface SnowflakeConfig {
  account: string;
  user: string;
  role: string;
  warehouse: string;
  database: string;
  schema: string;
}

export default function SnowflakeSettings({ onClose }: SnowflakeSettingsProps) {
  const { toast } = useToast();
  const [config, setConfig] = useState<SnowflakeConfig>({
    account: "YECALEZ-TCB02565",
    user: "SVC_AKHIL", 
    role: "ACCOUNTADMIN",
    warehouse: "COMPUTE_WH",
    database: "SNOWFLAKE_MONITORING",
    schema: "MONITORING_SEMANTIC"
  });

  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/snowflake/test-connection', config);
      return await response.json();
    },
    onSuccess: (data) => {
      setConnectionStatus('success');
      toast({
        title: "Connection Successful",
        description: `Connected to Snowflake. Found ${data.tableCount || 0} tables.`,
      });
    },
    onError: (error) => {
      setConnectionStatus('error');
      toast({
        title: "Connection Failed",
        description: "Please check your credentials and try again.",
        variant: "destructive",
      });
    }
  });

  const loadDataMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/snowflake/load-data', config);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Data Loaded Successfully",
        description: `Loaded ${data.tableCount} tables, ${data.columnCount} columns from Snowflake.`,
      });
      
      // Invalidate and refetch all data
      queryClient.invalidateQueries({ queryKey: ['/api/databases'] });
      queryClient.invalidateQueries({ queryKey: ['/api/schemas'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tables'] });
      queryClient.invalidateQueries({ queryKey: ['/api/columns'] });
      
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Data Load Failed",
        description: "Failed to load data from Snowflake. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleTestConnection = () => {
    setConnectionStatus('testing');
    testConnectionMutation.mutate();
  };

  const handleLoadData = () => {
    loadDataMutation.mutate();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-blue-600" />
            <span>Snowflake Connection Settings</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Connection Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="account">Account</Label>
                  <Input
                    id="account"
                    value={config.account}
                    onChange={(e) => setConfig(prev => ({ ...prev, account: e.target.value }))}
                    placeholder="YECALEZ-TCB02565"
                    data-testid="input-account"
                  />
                </div>
                <div>
                  <Label htmlFor="user">User</Label>
                  <Input
                    id="user"
                    value={config.user}
                    onChange={(e) => setConfig(prev => ({ ...prev, user: e.target.value }))}
                    placeholder="SVC_AKHIL"
                    data-testid="input-user"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={config.role}
                    onChange={(e) => setConfig(prev => ({ ...prev, role: e.target.value }))}
                    placeholder="ACCOUNTADMIN"
                    data-testid="input-role"
                  />
                </div>
                <div>
                  <Label htmlFor="warehouse">Warehouse</Label>
                  <Input
                    id="warehouse"
                    value={config.warehouse}
                    onChange={(e) => setConfig(prev => ({ ...prev, warehouse: e.target.value }))}
                    placeholder="COMPUTE_WH"
                    data-testid="input-warehouse"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="database">Database</Label>
                  <Input
                    id="database"
                    value={config.database}
                    onChange={(e) => setConfig(prev => ({ ...prev, database: e.target.value }))}
                    placeholder="SNOWFLAKE_MONITORING"
                    data-testid="input-database"
                  />
                </div>
                <div>
                  <Label htmlFor="schema">Schema</Label>
                  <Input
                    id="schema"
                    value={config.schema}
                    onChange={(e) => setConfig(prev => ({ ...prev, schema: e.target.value }))}
                    placeholder="MONITORING_SEMANTIC"
                    data-testid="input-schema"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Authentication</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Personal Access Token Required</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      This connection uses <code>PROGRAMMATIC_ACCESS_TOKEN</code> authentication.
                      Make sure you have added your Snowflake PAT to the Replit secrets with the key <code>SNOWFLAKE_PAT</code>.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Connection Status */}
          {connectionStatus !== 'idle' && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  {connectionStatus === 'testing' && (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm text-slate-600">Testing connection...</span>
                    </>
                  )}
                  {connectionStatus === 'success' && (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-700">Connection successful!</span>
                    </>
                  )}
                  {connectionStatus === 'error' && (
                    <>
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-700">Connection failed. Please check your settings.</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} data-testid="button-cancel">
              Cancel
            </Button>
            <Button 
              variant="outline" 
              onClick={handleTestConnection}
              disabled={testConnectionMutation.isPending}
              data-testid="button-test-connection"
            >
              Test Connection
            </Button>
            <Button 
              onClick={handleLoadData}
              disabled={loadDataMutation.isPending || connectionStatus !== 'success'}
              data-testid="button-load-data"
            >
              {loadDataMutation.isPending ? 'Loading...' : 'Load Data from Snowflake'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}