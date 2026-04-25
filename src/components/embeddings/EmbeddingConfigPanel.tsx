import { useState } from 'react';
import { AlertCircle, CheckCircle2, Key, Loader2, TestTube } from 'lucide-react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { useEmbeddingStore } from '../../stores/embedding-store';
import {
  useOpenAIKeyStatus,
  useSaveOpenAIKey,
  useAvailableModels,
  useTestEmbedding,
  useModelDownloadProgress,
} from '../../hooks/use-embedding';
import type { EmbeddingProvider, DType, OpenAIModel } from '../../../shared/schemas';

interface EmbeddingConfigPanelProps {
  onConfigChange?: () => void;
}

export function EmbeddingConfigPanel({ onConfigChange }: EmbeddingConfigPanelProps) {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [hfModelSource, setHfModelSource] = useState<'preset' | 'custom'>('preset');

  // Store state
  const {
    selectedProvider,
    defaultConfig,
    openaiConfig,
    huggingfaceConfig,
    hasOpenAIKey,
    setProvider,
    setDefaultModel,
    setDefaultDType,
    setOpenAIModel,
    setOpenAIDimensions,
    setHuggingFaceModel,
    setHuggingFaceDType,
    buildEmbeddingConfig,
  } = useEmbeddingStore();

  // Queries and mutations
  const { isLoading: isCheckingKey } = useOpenAIKeyStatus();
  const saveApiKey = useSaveOpenAIKey();
  const { data: modelsData, isLoading: isLoadingModels } = useAvailableModels();
  const testEmbedding = useTestEmbedding();
  const downloadProgress = useModelDownloadProgress();

  const handleProviderChange = (provider: string) => {
    setProvider(provider as EmbeddingProvider);
    onConfigChange?.();
  };

  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) return;
    await saveApiKey.mutateAsync(apiKeyInput);
    setApiKeyInput('');
    setShowApiKeyInput(false);
  };

  const handleTestEmbedding = () => {
    const config = buildEmbeddingConfig();
    testEmbedding.mutate({ config });
  };

  const availableModels = modelsData?.models || [];

  return (
    <div className="space-y-4">
      {/* Provider Selection */}
      <div className="space-y-2">
        <Label>Embedding Provider</Label>
        <Select value={selectedProvider} onValueChange={handleProviderChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default (Local)</SelectItem>
            <SelectItem value="openai">OpenAI</SelectItem>
            <SelectItem value="huggingface">HuggingFace</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {selectedProvider === 'default' &&
            'Uses local transformer models via @chroma-core/default-embed'}
          {selectedProvider === 'openai' && 'Uses OpenAI embedding API (requires API key)'}
          {selectedProvider === 'huggingface' &&
            'Uses HuggingFace transformer models (downloaded locally)'}
        </p>
      </div>

      {/* Default Provider Config */}
      {selectedProvider === 'default' && (
        <div className="space-y-4 rounded-lg border p-4">
          <div className="space-y-2">
            <Label>Model</Label>
            <Select
              value={defaultConfig.model}
              onValueChange={(value) => {
                setDefaultModel(value);
                onConfigChange?.();
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {isLoadingModels ? (
                  <SelectItem value="_loading" disabled>
                    Loading models...
                  </SelectItem>
                ) : availableModels.length === 0 ? (
                  <SelectItem value="_empty" disabled>
                    No models available
                  </SelectItem>
                ) : (
                  availableModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name} ({model.dimensions}d, {model.size})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Quantization</Label>
            <Select
              value={defaultConfig.dtype}
              onValueChange={(value) => {
                setDefaultDType(value as DType);
                onConfigChange?.();
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fp32">FP32 (Full precision)</SelectItem>
                <SelectItem value="fp16">FP16 (Half precision)</SelectItem>
                <SelectItem value="q8">Q8 (8-bit quantized)</SelectItem>
                <SelectItem value="int8">INT8 (Integer 8-bit)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Lower precision = smaller size, faster inference, slightly lower quality
            </p>
          </div>
        </div>
      )}

      {/* OpenAI Provider Config */}
      {selectedProvider === 'openai' && (
        <div className="space-y-4 rounded-lg border p-4">
          {/* API Key Status */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              API Key Status
            </Label>
            {isCheckingKey ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking...
              </div>
            ) : hasOpenAIKey ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  API key configured
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                >
                  Update Key
                </Button>
              </div>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  OpenAI API key not configured. Please add your API key to use OpenAI embeddings.
                </AlertDescription>
              </Alert>
            )}

            {/* API Key Input */}
            {(showApiKeyInput || !hasOpenAIKey) && (
              <div className="flex gap-2 mt-2">
                <Input
                  type="password"
                  placeholder="sk-..."
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={handleSaveApiKey}
                  disabled={!apiKeyInput.trim() || saveApiKey.isPending}
                >
                  {saveApiKey.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Save'
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <Label>Model</Label>
            <Select
              value={openaiConfig.model}
              onValueChange={(value) => {
                setOpenAIModel(value as OpenAIModel);
                onConfigChange?.();
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text-embedding-3-small">
                  text-embedding-3-small (1536d, fast)
                </SelectItem>
                <SelectItem value="text-embedding-3-large">
                  text-embedding-3-large (3072d, best quality)
                </SelectItem>
                <SelectItem value="text-embedding-ada-002">
                  text-embedding-ada-002 (1536d, legacy)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dimensions (for text-embedding-3 models) */}
          {(openaiConfig.model === 'text-embedding-3-small' ||
            openaiConfig.model === 'text-embedding-3-large') && (
            <div className="space-y-2">
              <Label>Custom Dimensions (optional)</Label>
              <Input
                type="number"
                placeholder={
                  openaiConfig.model === 'text-embedding-3-small' ? '1536' : '3072'
                }
                min={256}
                max={openaiConfig.model === 'text-embedding-3-small' ? 1536 : 3072}
                value={openaiConfig.dimensions || ''}
                onChange={(e) => {
                  const value = e.target.value ? parseInt(e.target.value, 10) : undefined;
                  setOpenAIDimensions(value);
                  onConfigChange?.();
                }}
              />
              <p className="text-xs text-muted-foreground">
                Reduce dimensions to save storage (min 256). Leave empty for default.
              </p>
            </div>
          )}
        </div>
      )}

      {/* HuggingFace Provider Config */}
      {selectedProvider === 'huggingface' && (
        <div className="space-y-4 rounded-lg border p-4">
          {/* Model Source Tabs */}
          <Tabs value={hfModelSource} onValueChange={(v) => setHfModelSource(v as 'preset' | 'custom')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="preset">Preset Models</TabsTrigger>
              <TabsTrigger value="custom">Custom Model</TabsTrigger>
            </TabsList>

            <TabsContent value="preset" className="space-y-2 mt-4">
              <Label>Model</Label>
              <Select
                value={huggingfaceConfig.model}
                onValueChange={(value) => {
                  setHuggingFaceModel(value);
                  onConfigChange?.();
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingModels ? (
                    <SelectItem value="_loading" disabled>
                      Loading models...
                    </SelectItem>
                  ) : availableModels.length === 0 ? (
                    <SelectItem value="_empty" disabled>
                      No models available
                    </SelectItem>
                  ) : (
                    availableModels.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.name} ({model.dimensions}d, {model.size})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {availableModels.find((m) => m.id === huggingfaceConfig.model)?.description && (
                <p className="text-xs text-muted-foreground">
                  {availableModels.find((m) => m.id === huggingfaceConfig.model)?.description}
                </p>
              )}
            </TabsContent>

            <TabsContent value="custom" className="space-y-2 mt-4">
              <Label>HuggingFace Model ID</Label>
              <Input
                type="text"
                placeholder="e.g., sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
                onChange={(e) => {
                  if (e.target.value.trim()) {
                    setHuggingFaceModel(e.target.value.trim());
                    onConfigChange?.();
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Enter any HuggingFace model ID compatible with transformers.js
              </p>
            </TabsContent>
          </Tabs>

          {/* Show currently selected model */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Selected:</span>
            <Badge variant="secondary">{huggingfaceConfig.model}</Badge>
          </div>

          {/* Quantization */}
          <div className="space-y-2">
            <Label>Quantization</Label>
            <Select
              value={huggingfaceConfig.dtype}
              onValueChange={(value) => {
                setHuggingFaceDType(value as DType);
                onConfigChange?.();
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fp32">FP32 (Full precision)</SelectItem>
                <SelectItem value="fp16">FP16 (Half precision)</SelectItem>
                <SelectItem value="q8">Q8 (8-bit quantized)</SelectItem>
                <SelectItem value="int8">INT8 (Integer 8-bit)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Download Progress */}
      {downloadProgress && downloadProgress.status === 'downloading' && (
        <div className="space-y-2 rounded-lg border p-4">
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Downloading model: {downloadProgress.modelId}
          </div>
          <Progress value={downloadProgress.progress || 0} />
          <p className="text-xs text-muted-foreground">
            {downloadProgress.progress?.toFixed(0)}% complete
          </p>
        </div>
      )}

      {/* Test Button */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={handleTestEmbedding}
          disabled={
            testEmbedding.isPending ||
            (selectedProvider === 'openai' && !hasOpenAIKey)
          }
        >
          {testEmbedding.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <TestTube className="mr-2 h-4 w-4" />
          )}
          Test Embedding
        </Button>
        {testEmbedding.data?.success && (
          <span className="text-sm text-green-600">
            <CheckCircle2 className="inline h-4 w-4 mr-1" />
            {testEmbedding.data.dimensions} dimensions
          </span>
        )}
      </div>
    </div>
  );
}
