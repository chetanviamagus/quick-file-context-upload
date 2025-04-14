
import { FileItem } from "@/components/FileUploader";

// In-memory storage for submitted files
let submittedFiles: FileItem[] = [];

// This function would be replaced with an actual API call in a real application
export const submitFile = async (file: FileItem): Promise<FileItem> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
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
  
  return submittedFiles;
};
