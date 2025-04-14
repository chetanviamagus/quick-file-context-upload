
import { FileItem, FileUploadStatus } from "@/components/FileUploader";

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

// Generate a batch of mock files for demo purposes
const generateMockFiles = (count: number): FileItem[] => {
  const fileTypes = ["application/gzip", "application/json", "text/plain", "application/yaml", "text/csv"];
  const fileExtensions = [".tgz", ".json", ".log", ".yaml", ".csv"];
  const fileContexts = [
    "Production Kubernetes cluster logs",
    "API Gateway performance metrics",
    "Application's diagnostics bundle",
    "Database performance logs",
    "Service mesh traffic data",
    "Container orchestration logs",
    "Infrastructure scaling events",
    "Network latency measurements",
    "Authentication service audit logs",
    "Cache hit/miss statistics"
  ];
  const filePrefixes = [
    "diags", "logs", "metrics", "perf", "audit", 
    "debug", "trace", "system", "app", "api",
    "backend", "frontend", "database", "cache", "auth",
    "network", "infra", "monitoring", "security", "events"
  ];

  const mockFiles: FileItem[] = [];
  
  for (let i = 0; i < count; i++) {
    const typeIndex = i % fileTypes.length;
    const fileType = fileTypes[typeIndex];
    const fileExtension = fileExtensions[typeIndex];
    const contextIndex = i % fileContexts.length;
    const context = fileContexts[contextIndex];
    const prefixIndex = Math.floor(i / 5) % filePrefixes.length;
    const prefix = filePrefixes[prefixIndex];
    
    // Calculate a file size between 100KB and 30MB
    const fileSize = 100000 + Math.floor(Math.random() * 30000000);
    
    // Create a date between 1 day ago and 30 days ago
    const date = new Date();
    date.setDate(date.getDate() - (1 + Math.floor(Math.random() * 30)));
    
    mockFiles.push({
      id: crypto.randomUUID(),
      name: `${prefix}-${i + 1}${fileExtension}`,
      size: fileSize,
      type: fileType,
      context: `${context} from ${date.toLocaleDateString()}`,
      lastModified: date.getTime(),
      status: FileUploadStatus.FILE_UPLOAD_STATUS_COMPLETE,
      progress: 100
    });
  }
  
  console.log(`Generated ${count} mock files`);
  return mockFiles;
};

// Get all previously submitted files
export const getSubmittedFiles = async (): Promise<FileItem[]> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  console.log("Getting submitted files, current count:", submittedFiles.length);
  
  // If we don't have any files yet, create some mock files for demo purposes
  if (submittedFiles.length === 0) {
    submittedFiles = generateMockFiles(1000); // Changed from 27 to 1000
    console.log("Generated mock files:", submittedFiles.length);
  }
  
  return submittedFiles;
};

// Get files with pagination and filtering
export const getFilteredFiles = async (
  filters: {
    query?: string;
    fileTypes?: string[];
    dateRange?: { from?: Date; to?: Date };
  },
  pagination: {
    page: number;
    limit: number;
  }
): Promise<{ files: FileItem[]; total: number }> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Ensure we have files to filter
  if (submittedFiles.length === 0) {
    submittedFiles = generateMockFiles(1000); // Changed from 27 to 1000
    console.log("Generated mock files in getFilteredFiles:", submittedFiles.length);
  }
  
  // Filter files based on criteria
  let filtered = [...submittedFiles];
  
  // Apply text search filter
  if (filters.query && filters.query.trim() !== '') {
    const query = filters.query.toLowerCase();
    filtered = filtered.filter(
      file => 
        file.name.toLowerCase().includes(query) || 
        (file.context && file.context.toLowerCase().includes(query))
    );
  }
  
  // Apply file type filter
  if (filters.fileTypes && filters.fileTypes.length > 0) {
    filtered = filtered.filter(file => 
      filters.fileTypes?.includes(file.type)
    );
  }
  
  // Apply date range filter
  if (filters.dateRange) {
    if (filters.dateRange.from) {
      filtered = filtered.filter(file => 
        file.lastModified >= filters.dateRange!.from!.getTime()
      );
    }
    
    if (filters.dateRange.to) {
      filtered = filtered.filter(file => 
        file.lastModified <= filters.dateRange!.to!.getTime()
      );
    }
  }
  
  // Get total count before pagination
  const total = filtered.length;
  
  // Apply pagination
  const startIdx = (pagination.page - 1) * pagination.limit;
  const endIdx = startIdx + pagination.limit;
  const paginatedFiles = filtered.slice(startIdx, endIdx);
  
  console.log(`Filtered files: ${filtered.length}, Paginated: ${paginatedFiles.length}, Page: ${pagination.page}, Limit: ${pagination.limit}, StartIdx: ${startIdx}, EndIdx: ${endIdx}`);
  
  return { files: paginatedFiles, total };
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
