import { useState, useEffect } from "react";
import { chatService } from "@/services/chat-service";
import { AIModels, defaultModels } from "@/types/chat";
import { useToast } from "@/hooks/use-toast";

// Filter only OpenAI and Deepseek models
const filteredModels: AIModels[] = [
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    description: "Most capable model for complex tasks"
  },
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI",
    description: "Smaller and faster version of GPT-4o"
  },
  {
    id: "openai/gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    provider: "OpenAI",
    description: "Fast and cost-effective model"
  },
  {
    id: "deepseek/deepseek-v2",
    name: "Deepseek R1",
    provider: "Deepseek",
    description: "Latest model from Deepseek AI"
  }
];

export const useChatSettings = () => {
  const [availableModels, setAvailableModels] = useState<AIModels[]>(filteredModels);
  const [activeModel, setActiveModelState] = useState<AIModels>(filteredModels[0]);
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [baseUrls, setBaseUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    const savedModel = localStorage.getItem("activeModel");
    if (savedModel) {
      try {
        const model = JSON.parse(savedModel);
        // Check if the saved model is still in our filtered list
        const isAllowedModel = filteredModels.some(m => m.id === model.id);
        
        if (isAllowedModel) {
          setActiveModelState(model);
        } else {
          // If the saved model isn't in our filtered list, use the first model
          setActiveModelState(filteredModels[0]);
          localStorage.setItem("activeModel", JSON.stringify(filteredModels[0]));
        }
      } catch (error) {
        console.error("Failed to parse saved model:", error);
      }
    }
    
    // Load API keys
    const keys = chatService.getAllApiKeys();
    setApiKeys(keys);

    // Load base URLs
    const urls = chatService.getAllBaseUrls();
    setBaseUrls(urls);

    // Load custom models list, but filter for only allowed models
    const savedModels = localStorage.getItem("availableModels");
    if (savedModels) {
      try {
        const models = JSON.parse(savedModels);
        const allowedModels = models.filter((model: AIModels) => 
          model.provider.toLowerCase() === 'openai' || model.provider.toLowerCase() === 'deepseek'
        );
        
        // If we have filtered models, use them, otherwise use default filtered models
        if (allowedModels.length > 0) {
          setAvailableModels(allowedModels);
        } else {
          setAvailableModels(filteredModels);
          localStorage.setItem("availableModels", JSON.stringify(filteredModels));
        }
      } catch (error) {
        console.error("Failed to parse saved models:", error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("activeModel", JSON.stringify(activeModel));
  }, [activeModel]);

  useEffect(() => {
    localStorage.setItem("availableModels", JSON.stringify(availableModels));
  }, [availableModels]);

  const setApiKey = (key: string, provider: string = 'openai') => {
    chatService.setApiKey(key, provider);
    setApiKeys(chatService.getAllApiKeys());
    
    toast({
      title: `${provider.charAt(0).toUpperCase() + provider.slice(1)} API Key Updated`,
      description: `Your ${provider} API key has been saved.`,
    });
  };

  const setBaseUrl = (url: string, provider: string = 'openai') => {
    // Always set to OpenRouter URL
    chatService.setBaseUrl("https://openrouter.ai/api/v1", provider);
    setBaseUrls(chatService.getAllBaseUrls());
    
    toast({
      title: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Base URL Updated`,
      description: `Your ${provider} base URL has been saved to OpenRouter.`,
    });
  };

  const getApiKey = (provider: string = 'openai') => {
    return chatService.getApiKey(provider);
  };

  const getBaseUrl = (provider: string = 'openai') => {
    return chatService.getBaseUrl(provider);
  };

  const getAllApiKeys = () => {
    return apiKeys;
  };

  const getAllBaseUrls = () => {
    return baseUrls;
  };

  const setActiveModel = (model: AIModels) => {
    setActiveModelState(model);
  };

  const removeModel = (modelId: string) => {
    // Check if model is currently active
    if (activeModel.id === modelId) {
      // Set to first available model that's not being removed
      const firstAvailableModel = availableModels.find(m => m.id !== modelId) || filteredModels[0];
      setActiveModelState(firstAvailableModel);
      toast({
        title: "Active Model Changed",
        description: `Active model was removed. Now using ${firstAvailableModel.name}.`,
      });
    }

    // Remove the model from available models
    const updatedModels = availableModels.filter(model => model.id !== modelId);
    setAvailableModels(updatedModels);
    
    toast({
      title: "Model Removed",
      description: "The selected model has been removed from the available models list.",
    });
  };

  const addModel = (model: AIModels) => {
    // Check if model with same ID already exists
    if (availableModels.some(m => m.id === model.id)) {
      toast({
        title: "Model already exists",
        description: "A model with this ID already exists in your list.",
        variant: "destructive",
      });
      return;
    }

    // Only allow adding OpenAI or Deepseek models
    if (model.provider.toLowerCase() !== 'openai' && model.provider.toLowerCase() !== 'deepseek') {
      toast({
        title: "Invalid model provider",
        description: "Only OpenAI and Deepseek models are allowed.",
        variant: "destructive",
      });
      return;
    }

    // Add the new model to available models
    const updatedModels = [...availableModels, model];
    setAvailableModels(updatedModels);
    
    toast({
      title: "Model Added",
      description: `${model.name} has been added to your available models.`,
    });
  };

  return {
    activeModel,
    availableModels,
    setActiveModel,
    setApiKey,
    getApiKey,
    getAllApiKeys,
    setBaseUrl,
    getBaseUrl,
    getAllBaseUrls,
    removeModel,
    addModel
  };
};
