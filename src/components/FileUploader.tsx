import React, { useState, useRef, useEffect } from "react";
import { Upload, X, File as FileIcon, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

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
  onSubmit?: (file: FileItem) => void;
  onDelete?: (file: FileItem) => void;
  maxSizeMB?: number;
  acceptedFileTypes?: string[];
  initialSelectedFile?: FileItem | null;
  previouslySubmittedFiles?: FileItem[];
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelect,
  onSubmit,
  onDelete,
  maxSizeMB = 10,
  acceptedFileTypes = ["*/*"],
  initialSelectedFile = null,
  previouslySubmittedFiles = [],
}) => {
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(initialSelectedFile);
  const [context, setContext] = useState<string>(initialSelectedFile?.context || "");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation();
    event.preventDefault();
    const fileList = event.target.files;
    if (fileList && fileList.length > 0) {
      const file = fileList[0];
      
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `Maximum file size is ${maxSizeMB}MB`,
          variant: "destructive",
        });
        return;
      }
      
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

      const newFile: FileItem = {
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type,
        context: "",
        lastModified: file.lastModified,
        status: "success", 
        progress: 100
      };

      setSelectedFile(newFile);
      setContext("");
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleContextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const newContext = e.target.value;
    setContext(newContext);
    
    if (selectedFile) {
      const updatedFile = { ...selectedFile, context: newContext };
      setSelectedFile(updatedFile);
      
      onFileSelect?.(updatedFile);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      const event = {
        target: {
          files: droppedFiles
        }
      } as React.ChangeEvent<HTMLInputElement>;
      
      handleFileChange(event);
    }
  };

  return (
    <div 
      className="w-full space-y-3" 
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {selectedFile && (
        <div className="border rounded-lg p-3 bg-zinc-900/50 border-zinc-800 space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <FileIcon className="h-7 w-7 text-primary" />
              <div>
                <div className="flex items-center gap-1">
                  <p className="font-medium text-sm truncate max-w-[160px]">{selectedFile.name}</p>
                </div>
                <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 rounded-full"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSelectedFile(null);
                setContext("");
                onFileSelect?.(null);
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          
          {selectedFile && (
            <div className="space-y-1 mt-2">
              <p className="text-xs font-medium text-zinc-400">Add context about this diagnostic file</p>
              <Textarea
                placeholder="Describe the issue (e.g., 'Kubernetes pod crash logs from API gateway')"
                className="min-h-[60px] resize-none text-sm bg-zinc-900 border-zinc-700"
                value={context}
                onChange={handleContextChange}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              />
            </div>
          )}
        </div>
      )}

      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-4 transition-colors cursor-pointer",
          isDragging 
            ? "border-primary bg-primary/10" 
            : "border-zinc-700 hover:border-primary/50",
          "flex flex-col items-center justify-center gap-2"
        )}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          fileInputRef.current?.click();
        }}
        onMouseDown={(e) => e.stopPropagation()}
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
          onClick={(e) => {
            e.stopPropagation();
          }}
          onKeyDown={(e) => e.stopPropagation()}
        />
        
        <div className="flex flex-col items-center gap-1 text-center">
          <Upload className="h-8 w-8 text-muted-foreground mb-1" />
          <h3 className="text-sm font-medium">Upload diagnostic file</h3>
          <p className="text-xs text-muted-foreground">
            Drag and drop or click to browse (.tgz, .log, .json)
          </p>
        </div>
      </div>
    </div>
  );
};

export default FileUploader;
