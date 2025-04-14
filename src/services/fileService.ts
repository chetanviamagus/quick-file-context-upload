
import { FileItem } from "@/components/FileUploader";

// In-memory storage for submitted files
let submittedFiles: FileItem[] = [];

// This function would be replaced with an actual API call in a real application
export const submitFile = async (file: FileItem): Promise<FileItem> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Add file to our "database"
  const submittedFile = { ...file, id: file.id || crypto.randomUUID() };
  submittedFiles = [submittedFile, ...submittedFiles];
  
  console.log("File submitted to API:", submittedFile);
  return submittedFile;
};

// Get all previously submitted files
export const getSubmittedFiles = async (): Promise<FileItem[]> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // If we don't have any files yet, create some mock files for demo purposes
  if (submittedFiles.length === 0) {
    submittedFiles = [
      {
        id: crypto.randomUUID(),
        name: "kubernetes-logs.tgz",
        size: 4500000,
        type: "application/gzip",
        context: "Production Kubernetes cluster that experienced 503 errors",
        lastModified: Date.now() - 3600000,
        status: "success"
      },
      {
        id: crypto.randomUUID(),
        name: "api-metrics.json",
        size: 1240000,
        type: "application/json",
        context: "API Gateway performance metrics from last 24 hours",
        lastModified: Date.now() - 7200000,
        status: "success"
      },
      {
        id: crypto.randomUUID(),
        name: "diags.tgz",
        size: 8900000,
        type: "application/gzip",
        context: "Application's diagnostics bundle from production Kubernetes cluster",
        lastModified: Date.now() - 86400000,
        status: "success"
      }
    ];
  }
  
  return submittedFiles;
};

// Delete a file
export const deleteFile = async (fileId: string): Promise<boolean> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const initialLength = submittedFiles.length;
  submittedFiles = submittedFiles.filter(file => file.id !== fileId);
  
  // Return true if a file was deleted
  return submittedFiles.length < initialLength;
};

// Analyze a diagnostic file and return results
// In a real application, this would send the file to a backend service for analysis
export const analyzeFile = async (fileId: string, prompt: string): Promise<any> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const file = submittedFiles.find(f => f.id === fileId);
  
  if (!file) {
    throw new Error("File not found");
  }
  
  console.log(`Analyzing file ${file.name} with prompt: ${prompt}`);
  
  // Mock response - in a real app this would come from the backend
  return {
    summary: "Analysis identified multiple pod startup failures in the Kubernetes cluster. The issues appear to be related to container initialization problems with the 'alex-bird' service.",
    insights: [
      "Consistent failures in pod initialization at 11:57:35 AM on September 26",
      "All errors are related to the same service component",
      "The StartContainer command is failing consistently"
    ],
    recommendations: [
      "Check the container image for the 'alex-bird' service",
      "Verify resource constraints on the affected pods",
      "Inspect init container configurations"
    ]
  };
};
