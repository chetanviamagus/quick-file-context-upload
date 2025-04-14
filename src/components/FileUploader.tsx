
import React, { useState, useRef, useEffect } from "react";
import { Upload, X, File, PaperclipIcon, Trash2, CheckCircle, AlertCircle, Loader } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

export interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  context: string;
  lastModified: number;
  status?: "uploading" | "success" | "error";
  progress?: number;
}

interface FileUploaderProps {
  onFileSelect?: (file: FileItem | null) => void;
  maxSizeMB?: number;
  acceptedFileTypes?: string[];
  initialSelectedFile?: FileItem | null;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelect,
  maxSizeMB = 10,
  acceptedFileTypes = ["*/*"],
  initialSelectedFile = null,
}) => {
  // Static list of files for demo purposes - in a real app, this would come from your backend
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(initialSelectedFile);
  const [context, setContext] = useState<string>(initialSelectedFile?.context || "");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showContextInput, setShowContextInput] = useState<boolean>(!!initialSelectedFile);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Initialize with some mock files for demo purposes
  useEffect(() => {
    // Check if we already have files to avoid duplicating them on each render
    if (files.length === 0) {
      const mockFiles: FileItem[] = [
        {
          id: "1",
          name: "document.pdf",
          size: 2500000,
          type: "application/pdf",
          context: "Project proposal",
          lastModified: Date.now() - 86400000, // 1 day ago
          status: "success",
          progress: 100
        },
        {
          id: "2",
          name: "image.jpg",
          size: 1200000,
          type: "image/jpeg",
          context: "Product screenshot",
          lastModified: Date.now() - 172800000, // 2 days ago
          status: "success",
          progress: 100
        }
      ];
      setFiles(mockFiles);
    }
  }, [files.length]);

  // Set initial context from selected file if any
  useEffect(() => {
    if (initialSelectedFile) {
      setSelectedFile(initialSelectedFile);
      setContext(initialSelectedFile.context || "");
      setShowContextInput(true);
    }
  }, [initialSelectedFile]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (fileList && fileList.length > 0) {
      const file = fileList[0];
      
      // Check file size
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `Maximum file size is ${maxSizeMB}MB`,
          variant: "destructive",
        });
        return;
      }
      
      // Check file type if specific types are provided
      if (acceptedFileTypes[0] !== "*/*") {
        const fileType = file.type;
        const isAccepted = acceptedFileTypes.some(type => 
          fileType === type || type.endsWith("/*") && fileType.startsWith(type.replace("/*", "/")));
          
        if (!isAccepted) {
          toast({
            title: "Invalid file type",
            description: `Accepted file types: ${acceptedFileTypes.join(", ")}`,
            variant: "destructive",
          });
          return;
        }
      }

      // Create new file with uploading status
      const newFile: FileItem = {
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type,
        context: "",
        lastModified: file.lastModified,
        status: "uploading",
        progress: 0
      };

      setFiles(prev => [...prev, newFile]);
      setSelectedFile(newFile);
      setContext("");
      setShowContextInput(false);
      
      // Simulate file upload progress
      simulateUpload(newFile);
    }
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const simulateUpload = (file: FileItem) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        // Update file status to success after upload completes
        setFiles(prev => 
          prev.map(f => 
            f.id === file.id 
              ? { ...f, status: "success" as const, progress: 100 } 
              : f
          )
        );

        if (selectedFile?.id === file.id) {
          setSelectedFile(prev => 
            prev && prev.id === file.id 
              ? { ...prev, status: "success" as const, progress: 100 } 
              : prev
          );
          setShowContextInput(true);
        }

        toast({
          title: "Upload complete",
          description: `${file.name} has been uploaded successfully`,
        });
      } else {
        // Update progress
        setFiles(prev => 
          prev.map(f => 
            f.id === file.id 
              ? { ...f, progress: Math.round(progress) } 
              : f
          )
        );

        if (selectedFile?.id === file.id) {
          setSelectedFile(prev => 
            prev && prev.id === file.id 
              ? { ...prev, progress: Math.round(progress) } 
              : prev
          );
        }
      }
    }, 200);
  };

  const handleContextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContext = e.target.value;
    setContext(newContext);
    
    if (selectedFile) {
      // Update context for the selected file
      const updatedFile = { ...selectedFile, context: newContext };
      setSelectedFile(updatedFile);
      setFiles(prev => prev.map(f => f.id === selectedFile.id ? updatedFile : f));
      
      // Notify the parent component about the context change
      onFileSelect?.(updatedFile);
    }
  };

  const selectExistingFile = (file: FileItem) => {
    setSelectedFile(file);
    setContext(file.context || "");
    setShowContextInput(file.status === "success");
    onFileSelect?.(file);
  };

  const removeFile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFiles(prev => prev.filter(file => file.id !== id));
    
    if (selectedFile && selectedFile.id === id) {
      setSelectedFile(null);
      setContext("");
      setShowContextInput(false);
      onFileSelect?.(null);
    }
    
    toast({
      title: "File removed",
      description: "The file has been removed",
    });
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      // Create a new event to reuse handleFileChange
      const event = {
        target: {
          files: droppedFiles
        }
      } as React.ChangeEvent<HTMLInputElement>;
      
      handleFileChange(event);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSelect = () => {
    if (selectedFile) {
      onFileSelect?.(selectedFile);
    }
  };

  const getStatusIcon = (file: FileItem) => {
    if (!file.status || file.status === "uploading") {
      return <Loader className="h-3.5 w-3.5 text-blue-400 animate-spin" />;
    } else if (file.status === "success") {
      return <CheckCircle className="h-3.5 w-3.5 text-green-400" />;
    } else if (file.status === "error") {
      return <AlertCircle className="h-3.5 w-3.5 text-red-400" />;
    }
    return null;
  };

  // Show the list of files first for better UX
  return (
    <div className="w-full space-y-3">
      {/* Recent files section - now displayed at the top for immediate visibility */}
      {files.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium">Available files</p>
          <ul className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
            {files.map((file) => (
              <li 
                key={file.id}
                className={cn(
                  "flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-zinc-800/50 text-sm",
                  selectedFile?.id === file.id ? "bg-zinc-800" : "bg-zinc-900"
                )}
                onClick={() => selectExistingFile(file)}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="flex items-center gap-1">
                    <PaperclipIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    {getStatusIcon(file)}
                  </div>
                  <div className="overflow-hidden">
                    <div className="flex items-center">
                      <p className="text-xs font-medium truncate max-w-[150px]">{file.name}</p>
                      {file.context && <span className="text-xs text-zinc-500 ml-1.5">- {file.context.substring(0, 15)}{file.context.length > 15 ? '...' : ''}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-70 hover:opacity-100 rounded-full"
                  onClick={(e) => removeFile(file.id, e)}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Selected file info with progress and status */}
      {selectedFile && (
        <div className="border rounded-lg p-3 bg-zinc-900/50 border-zinc-800">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <File className="h-7 w-7 text-primary" />
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate max-w-[160px]">{selectedFile.name}</p>
                  {getStatusIcon(selectedFile)}
                </div>
                <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFile(null);
                setContext("");
                setShowContextInput(false);
                onFileSelect?.(null);
              }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          
          {/* Progress bar for uploading files */}
          {selectedFile.status === "uploading" && (
            <div className="mt-2">
              <Progress value={selectedFile.progress} className="h-1.5" />
              <p className="text-xs text-muted-foreground mt-1">
                Uploading: {selectedFile.progress}%
              </p>
            </div>
          )}
        </div>
      )}

      {/* Context textarea - Always show when a file is successfully uploaded */}
      {selectedFile && showContextInput && (
        <div className="space-y-1">
          <p className="text-xs font-medium">Add context about this file</p>
          <Textarea
            placeholder="What's this file about?"
            className="min-h-[60px] resize-none text-sm bg-zinc-900 border-zinc-700"
            value={context}
            onChange={handleContextChange}
          />
        </div>
      )}

      {/* File uploader area - at the bottom now */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-4 transition-colors cursor-pointer",
          isDragging 
            ? "border-primary bg-primary/10" 
            : "border-zinc-700 hover:border-primary/50",
          "flex flex-col items-center justify-center gap-2"
        )}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept={acceptedFileTypes.join(",")}
        />
        
        <div className="flex flex-col items-center gap-1 text-center">
          <Upload className="h-8 w-8 text-muted-foreground mb-1" />
          <h3 className="text-sm font-medium">Upload a file</h3>
          <p className="text-xs text-muted-foreground">
            Drag and drop or click to browse
          </p>
        </div>
      </div>

      {/* Confirm selection button */}
      {selectedFile && selectedFile.status === "success" && (
        <Button 
          className="w-full text-sm py-1.5 h-8" 
          size="sm"
          onClick={handleSelect}
        >
          Use this file
        </Button>
      )}
    </div>
  );
};

export default FileUploader;
