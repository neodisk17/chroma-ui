import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CreateConnectionRequestSchema,
  CreateConnectionRequest,
  ConnectionProfile
} from '../../../shared/schemas';
import { useConnectionStore } from '../../stores/connection-store';

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
      // Populate form with existing connection data
      reset({
        name: connection.name,
        host: connection.host,
        port: connection.port,
        authType: connection.authType,
        useSSL: connection.useSSL,
        // Note: We don't populate credentials for security reasons
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
      result = await updateConnection({
        id: connection.id,
        ...data,
      });
    } else {
      result = await createConnection(data);
    }

    if (result) {
      onClose();
    }
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-2xl font-bold mb-4">
          {isEditMode ? 'Edit Connection' : 'New Connection'}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Connection Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Connection Name *</label>
            <input
              {...register('name')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="My ChromaDB"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Host */}
          <div>
            <label className="block text-sm font-medium mb-1">Host *</label>
            <input
              {...register('host')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="localhost"
            />
            {errors.host && (
              <p className="text-red-500 text-sm mt-1">{errors.host.message}</p>
            )}
          </div>

          {/* Port */}
          <div>
            <label className="block text-sm font-medium mb-1">Port *</label>
            <input
              {...register('port', { valueAsNumber: true })}
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="8000"
            />
            {errors.port && (
              <p className="text-red-500 text-sm mt-1">{errors.port.message}</p>
            )}
          </div>

          {/* Use SSL */}
          <div className="flex items-center">
            <input
              {...register('useSSL')}
              type="checkbox"
              id="useSSL"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="useSSL" className="ml-2 text-sm font-medium">
              Use SSL (HTTPS)
            </label>
          </div>

          {/* Auth Type */}
          <div>
            <label className="block text-sm font-medium mb-1">Authentication</label>
            <select
              {...register('authType')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="none">None</option>
              <option value="token">Token</option>
              <option value="basic">Basic (Username/Password)</option>
            </select>
          </div>

          {/* Token (if authType is 'token') */}
          {authType === 'token' && (
            <div>
              <label className="block text-sm font-medium mb-1">Token</label>
              <input
                {...register('token')}
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your API token"
              />
              {errors.token && (
                <p className="text-red-500 text-sm mt-1">{errors.token.message}</p>
              )}
            </div>
          )}

          {/* Username/Password (if authType is 'basic') */}
          {authType === 'basic' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Username</label>
                <input
                  {...register('username')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Username"
                />
                {errors.username && (
                  <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input
                  {...register('password')}
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Password"
                />
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                )}
              </div>
            </>
          )}

          {/* Test Result */}
          {testResult && (
            <div
              className={`p-3 rounded-md ${
                testResult.success
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {testResult.message}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md disabled:opacity-50"
            >
              {isTesting ? 'Testing...' : 'Test Connection'}
            </button>
            <div className="space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : isEditMode ? 'Update Connection' : 'Save Connection'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
