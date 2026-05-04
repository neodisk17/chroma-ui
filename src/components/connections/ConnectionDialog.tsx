import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plug, CheckCircle2, XCircle, Wifi } from 'lucide-react';
import {
  CreateConnectionRequestSchema,
  CreateConnectionRequest,
  ConnectionProfile
} from '../../../shared/schemas';
import { useConnectionStore } from '../../stores/connection-store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface ConnectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  connection?: ConnectionProfile | null;
}

export function ConnectionDialog({ isOpen, onClose, connection }: ConnectionDialogProps) {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const { createConnection, updateConnection, testConnection } = useConnectionStore();

  const isEditMode = !!connection;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    reset,
    setValue,
  } = useForm<CreateConnectionRequest>({
    resolver: zodResolver(CreateConnectionRequestSchema) as Resolver<CreateConnectionRequest>,
    defaultValues: {
      name: '',
      host: 'localhost',
      port: 8000,
      authType: 'none',
      useSSL: false,
    },
  });

  const authType = watch('authType');

  useEffect(() => {
    if (isOpen && connection) {
      reset({
        name: connection.name,
        host: connection.host,
        port: connection.port,
        authType: connection.authType,
        useSSL: connection.useSSL,
      });
    } else if (!isOpen) {
      reset({
        name: '',
        host: 'localhost',
        port: 8000,
        authType: 'none',
        useSSL: false,
      });
      setTestResult(null);
    }
  }, [isOpen, connection, reset]);

  const onSubmit = async (data: CreateConnectionRequest) => {
    let result;
    if (isEditMode && connection) {
      result = await updateConnection({ id: connection.id, ...data });
    } else {
      result = await createConnection(data);
    }
    if (result) onClose();
  };

  const handleTestConnection = async () => {
    const formData = watch();
    setIsTesting(true);
    setTestResult(null);
    const result = await testConnection({
      host: formData.host,
      port: formData.port,
      authType: formData.authType,
      useSSL: formData.useSSL,
      token: formData.token,
      username: formData.username,
      password: formData.password,
    });
    setTestResult(result);
    setIsTesting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        className="sm:max-w-[520px] p-0 overflow-hidden gap-0"
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Cyan accent bar at top */}
        <div className="h-0.5 w-full bg-gradient-to-r from-primary/0 via-primary to-primary/0" />

        <div className="p-6">
          <DialogHeader className="mb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 border border-primary/20">
                <Plug className="h-4 w-4 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold">
                  {isEditMode ? 'Edit Connection' : 'New Connection'}
                </DialogTitle>
                <DialogDescription className="text-xs mt-0.5">
                  {isEditMode
                    ? `Updating "${connection?.name}"`
                    : 'Connect to a ChromaDB instance'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Connection Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Connection Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="My ChromaDB"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Host + Port in a row */}
            <div className="grid grid-cols-[1fr_120px] gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="host" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Host <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="host"
                  {...register('host')}
                  placeholder="localhost"
                  className={errors.host ? 'border-destructive' : ''}
                />
                {errors.host && (
                  <p className="text-xs text-destructive">{errors.host.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="port" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Port <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="port"
                  {...register('port', { valueAsNumber: true })}
                  type="number"
                  placeholder="8000"
                  className={errors.port ? 'border-destructive' : ''}
                />
                {errors.port && (
                  <p className="text-xs text-destructive">{errors.port.message}</p>
                )}
              </div>
            </div>

            {/* SSL Checkbox */}
            <div className="flex items-center gap-3 rounded-md border border-border bg-muted/30 px-3 py-2.5">
              <Checkbox
                id="useSSL"
                checked={watch('useSSL')}
                onCheckedChange={(checked) => setValue('useSSL', !!checked)}
              />
              <div className="flex-1">
                <label htmlFor="useSSL" className="text-sm font-medium cursor-pointer select-none">
                  Use SSL (HTTPS)
                </label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Enable for secure connections on port 443
                </p>
              </div>
            </div>

            {/* Auth Type */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Authentication
              </Label>
              <Select
                value={authType}
                onValueChange={(val) => setValue('authType', val as CreateConnectionRequest['authType'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="token">Token</SelectItem>
                  <SelectItem value="basic">Basic (Username / Password)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Token */}
            {authType === 'token' && (
              <div className="space-y-1.5">
                <Label htmlFor="token" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  API Token
                </Label>
                <Input
                  id="token"
                  {...register('token')}
                  type="password"
                  placeholder="••••••••••••"
                  className={errors.token ? 'border-destructive' : ''}
                />
                {errors.token && (
                  <p className="text-xs text-destructive">{errors.token.message}</p>
                )}
              </div>
            )}

            {/* Basic Auth */}
            {authType === 'basic' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="username" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Username
                  </Label>
                  <Input
                    id="username"
                    {...register('username')}
                    placeholder="Username"
                    className={errors.username ? 'border-destructive' : ''}
                  />
                  {errors.username && (
                    <p className="text-xs text-destructive">{errors.username.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Password
                  </Label>
                  <Input
                    id="password"
                    {...register('password')}
                    type="password"
                    placeholder="••••••••"
                    className={errors.password ? 'border-destructive' : ''}
                  />
                  {errors.password && (
                    <p className="text-xs text-destructive">{errors.password.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Test Result */}
            {testResult && (
              <div
                className={`flex items-start gap-2.5 rounded-md border p-3 text-sm ${
                  testResult.success
                    ? 'border-primary/20 bg-primary/5 text-primary'
                    : 'border-destructive/20 bg-destructive/5 text-destructive'
                }`}
              >
                {testResult.success
                  ? <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  : <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                }
                <span>{testResult.message}</span>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestConnection}
                disabled={isTesting || isSubmitting}
                className="gap-1.5 text-muted-foreground hover:text-foreground"
              >
                {isTesting
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Wifi className="h-3.5 w-3.5" />
                }
                {isTesting ? 'Testing…' : 'Test'}
              </Button>

              <div className="flex-1" />

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                disabled={isSubmitting || isTesting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || isTesting}
                className="min-w-[130px]"
              >
                {isSubmitting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                {isSubmitting
                  ? 'Saving…'
                  : isEditMode
                    ? 'Update Connection'
                    : 'Save Connection'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
