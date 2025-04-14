
import React, { useState, useRef } from "react";
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
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelect,
  maxSizeMB = 10,
  acceptedFileTypes = ["*/*"],
}) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [context, setContext] = useState<string>("");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
    setContext(e.target.value);
    
    if (selectedFile) {
      // Update context for the selected file
      const updatedFile = { ...selectedFile, context: e.target.value };
      setSelectedFile(updatedFile);
      setFiles(prev => prev.map(f => f.id === selectedFile.id ? updatedFile : f));
    }
  };

  const selectExistingFile = (file: FileItem) => {
    setSelectedFile(file);
    setContext(file.context);
    onFileSelect?.(file);
  };

  const removeFile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFiles(prev => prev.filter(file => file.id !== id));
    
    if (selectedFile && selectedFile.id === id) {
      setSelectedFile(null);
      setContext("");
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

  return (
    <div className="w-full space-y-3">
      {/* File uploader area - more compact for the popover */}
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

      {/* Context textarea - Prominently displayed */}
      {selectedFile && selectedFile.status === "success" && (
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

      {/* Previously uploaded files */}
      {files.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium">Recent files</p>
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
                    <p className="text-xs font-medium truncate max-w-[150px]">{file.name}</p>
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
