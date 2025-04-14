
import React, { useState, useRef, useEffect } from "react";
import { Upload, X, File, PaperclipIcon, Trash2, CheckCircle, Send } from "lucide-react";
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
  maxSizeMB?: number;
  acceptedFileTypes?: string[];
  initialSelectedFile?: FileItem | null;
  previouslySubmittedFiles?: FileItem[];
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelect,
  onSubmit,
  maxSizeMB = 10,
  acceptedFileTypes = ["*/*"],
  initialSelectedFile = null,
  previouslySubmittedFiles = [],
}) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(initialSelectedFile);
  const [context, setContext] = useState<string>(initialSelectedFile?.context || "");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Combine any mock files with previously submitted files
    if (files.length === 0 && previouslySubmittedFiles.length > 0) {
      setFiles(previouslySubmittedFiles);
    } else if (files.length === 0) {
      const mockFiles: FileItem[] = [
        {
          id: "1",
          name: "document.pdf",
          size: 2500000,
          type: "application/pdf",
          context: "Project proposal",
          lastModified: Date.now() - 86400000,
          status: "success",
          progress: 100
        },
        {
          id: "2",
          name: "image.jpg",
          size: 1200000,
          type: "image/jpeg",
          context: "Product screenshot",
          lastModified: Date.now() - 172800000,
          status: "success",
          progress: 100
        }
      ];
      setFiles([...previouslySubmittedFiles, ...mockFiles]);
    }
  }, [files.length, previouslySubmittedFiles]);

  useEffect(() => {
    if (initialSelectedFile) {
      setSelectedFile(initialSelectedFile);
      setContext(initialSelectedFile.context || "");
    }
  }, [initialSelectedFile]);

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
        status: "success", // Skip uploading simulation
        progress: 100
      };

      setFiles(prev => [...prev, newFile]);
      setSelectedFile(newFile);
      setContext("");
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleContextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event propagation
    const newContext = e.target.value;
    setContext(newContext);
    
    if (selectedFile) {
      const updatedFile = { ...selectedFile, context: newContext };
      setSelectedFile(updatedFile);
      setFiles(prev => prev.map(f => f.id === selectedFile.id ? updatedFile : f));
      
      onFileSelect?.(updatedFile);
    }
  };

  const selectExistingFile = (file: FileItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedFile(file);
    setContext(file.context || "");
    onFileSelect?.(file);
  };

  const removeFile = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
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

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event propagation
    if (selectedFile && selectedFile.status === "success") {
      if (!selectedFile.context || selectedFile.context.trim() === "") {
        toast({
          title: "Context required",
          description: "Please add context before submitting the file.",
          variant: "destructive",
        });
        return;
      }
      
      onSubmit?.(selectedFile);
    }
  };

  const isSelectedFileSubmittable = selectedFile && 
                                   selectedFile.status === "success" && 
                                   context.trim() !== "";

  return (
    <div 
      className="w-full space-y-3" 
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
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
                onClick={(e) => selectExistingFile(file, e)}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="flex-shrink-0">
                    <PaperclipIcon className="h-3.5 w-3.5 text-muted-foreground" />
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
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {selectedFile && (
        <div className="border rounded-lg p-3 bg-zinc-900/50 border-zinc-800 space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <File className="h-7 w-7 text-primary" />
              <div>
                <div className="flex items-center gap-1">
                  <p className="font-medium text-sm truncate max-w-[160px]">{selectedFile.name}</p>
                  {selectedFile.status === "success" && <CheckCircle className="h-3.5 w-3.5 text-green-400" />}
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
              <p className="text-xs font-medium">Add context about this file</p>
              <Textarea
                placeholder="What's this file about?"
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
          <h3 className="text-sm font-medium">Upload a file</h3>
          <p className="text-xs text-muted-foreground">
            Drag and drop or click to browse
          </p>
        </div>
      </div>

      {isSelectedFileSubmittable && (
        <Button 
          className="w-full gap-2 py-2"
          onClick={handleSubmit}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <Send className="h-4 w-4" />
          Submit File with Context
        </Button>
      )}
    </div>
  );
};

export default FileUploader;
