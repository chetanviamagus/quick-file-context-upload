
import React, { useState, useRef, useEffect } from "react";
import { Upload, X, File as FileIcon, Send, Loader2, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

export enum FileUploadStatus {
  FILE_UPLOAD_STATUS_UNSPECIFIED = "unspecified",
  FILE_UPLOAD_STATUS_IN_PROGRESS = "in_progress",
  FILE_UPLOAD_STATUS_COMPLETE = "complete",
  FILE_UPLOAD_STATUS_FAILED = "failed"
}

export interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  context: string;
  lastModified: number;
  status: FileUploadStatus;
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
  isDemo?: boolean; // For presentation/demo mode
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelect,
  onSubmit,
  onDelete,
  maxSizeMB = 10,
  acceptedFileTypes = ["*/*"],
  initialSelectedFile = null,
  previouslySubmittedFiles = [],
  isDemo = false,
}) => {
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(initialSelectedFile);
  const [context, setContext] = useState<string>(initialSelectedFile?.context || "");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [demoStatus, setDemoStatus] = useState<FileUploadStatus>(FileUploadStatus.FILE_UPLOAD_STATUS_UNSPECIFIED);
  const [demoProgress, setDemoProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // For demo/presentation mode
  useEffect(() => {
    if (isDemo && selectedFile) {
      const simulateProgress = () => {
        setDemoStatus(FileUploadStatus.FILE_UPLOAD_STATUS_IN_PROGRESS);
        
        let progress = 0;
        const interval = setInterval(() => {
          progress += 5;
          setDemoProgress(progress);
          
          if (progress >= 100) {
            clearInterval(interval);
            setDemoStatus(FileUploadStatus.FILE_UPLOAD_STATUS_COMPLETE);
          }
        }, 300);
        
        return () => clearInterval(interval);
      };
      
      simulateProgress();
    }
  }, [isDemo, selectedFile]);

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
        status: FileUploadStatus.FILE_UPLOAD_STATUS_UNSPECIFIED,
        progress: 0
      };

      setSelectedFile(newFile);
      setContext("");
      
      if (isDemo) {
        setDemoStatus(FileUploadStatus.FILE_UPLOAD_STATUS_UNSPECIFIED);
        setDemoProgress(0);
      }
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

  const handleSubmitFile = () => {
    if (selectedFile) {
      if (isDemo) {
        toast({
          title: "File submitted",
          description: `"${selectedFile.name}" is being processed.`,
        });
      } else {
        onSubmit?.(selectedFile);
      }
    }
  };

  // Function to render the file status icon
  const renderStatusIcon = (status: FileUploadStatus, progress: number = 0) => {
    switch (status) {
      case FileUploadStatus.FILE_UPLOAD_STATUS_IN_PROGRESS:
        return <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />;
      case FileUploadStatus.FILE_UPLOAD_STATUS_COMPLETE:
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case FileUploadStatus.FILE_UPLOAD_STATUS_FAILED:
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Demo mode to show all possible states
  const renderAllStates = () => {
    if (!isDemo) return null;
    
    const demoStates = [
      {
        status: FileUploadStatus.FILE_UPLOAD_STATUS_UNSPECIFIED,
        label: "Ready for Upload",
        description: "File selected and ready to be uploaded",
        progress: 0
      },
      {
        status: FileUploadStatus.FILE_UPLOAD_STATUS_IN_PROGRESS,
        label: "Upload in Progress",
        description: "File is currently being uploaded to the server",
        progress: 45
      },
      {
        status: FileUploadStatus.FILE_UPLOAD_STATUS_COMPLETE,
        label: "Upload Complete",
        description: "File has been successfully uploaded",
        progress: 100
      },
      {
        status: FileUploadStatus.FILE_UPLOAD_STATUS_FAILED,
        label: "Upload Failed",
        description: "File upload failed due to network error",
        progress: 35
      }
    ];
    
    return (
      <div className="mt-6 space-y-3 border-t pt-3 border-zinc-700">
        <h3 className="text-sm font-medium text-zinc-400">Status Demonstrations (For Client Presentation)</h3>
        <div className="grid gap-2">
          {demoStates.map((state) => (
            <div 
              key={state.status}
              className={cn(
                "border rounded-lg p-3 bg-zinc-900/50",
                state.status === FileUploadStatus.FILE_UPLOAD_STATUS_COMPLETE && "border-green-800/50",
                state.status === FileUploadStatus.FILE_UPLOAD_STATUS_FAILED && "border-red-800/50",
                state.status === FileUploadStatus.FILE_UPLOAD_STATUS_IN_PROGRESS && "border-amber-800/50",
                state.status === FileUploadStatus.FILE_UPLOAD_STATUS_UNSPECIFIED && "border-zinc-800"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {renderStatusIcon(state.status, state.progress)}
                  <span className="font-medium text-sm">{state.label}</span>
                </div>
                {state.status === FileUploadStatus.FILE_UPLOAD_STATUS_IN_PROGRESS && (
                  <span className="text-xs text-muted-foreground">{state.progress}%</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-2">{state.description}</p>
              {(state.status === FileUploadStatus.FILE_UPLOAD_STATUS_IN_PROGRESS) && (
                <Progress
                  value={state.progress}
                  className="h-1.5 w-full bg-zinc-700"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div 
      className="w-full space-y-3" 
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {selectedFile && (
        <div className={cn(
          "border rounded-lg p-3 bg-zinc-900/50",
          isDemo && demoStatus === FileUploadStatus.FILE_UPLOAD_STATUS_COMPLETE && "border-green-800/50",
          isDemo && demoStatus === FileUploadStatus.FILE_UPLOAD_STATUS_FAILED && "border-red-800/50",
          isDemo && demoStatus === FileUploadStatus.FILE_UPLOAD_STATUS_IN_PROGRESS && "border-amber-800/50",
          isDemo && demoStatus === FileUploadStatus.FILE_UPLOAD_STATUS_UNSPECIFIED && "border-zinc-800"
        )}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <FileIcon className="h-7 w-7 text-primary" />
              <div>
                <div className="flex items-center gap-1">
                  <p className="font-medium text-sm truncate max-w-[160px]">{selectedFile.name}</p>
                  {isDemo && (
                    <div className="ml-2">{renderStatusIcon(demoStatus, demoProgress)}</div>
                  )}
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
          
          {isDemo && demoStatus === FileUploadStatus.FILE_UPLOAD_STATUS_IN_PROGRESS && (
            <div className="my-2">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-zinc-400">Uploading...</span>
                <span className="text-zinc-400">{demoProgress}%</span>
              </div>
              <Progress
                value={demoProgress}
                className="h-1.5 w-full bg-zinc-700"
              />
            </div>
          )}
          
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

      {selectedFile && (
        <Button 
          className="w-full"
          onClick={handleSubmitFile}
          disabled={!selectedFile}
        >
          <Send className="mr-2 h-4 w-4" />
          Submit Diagnostics File
        </Button>
      )}
      
      {isDemo && renderAllStates()}
    </div>
  );
};

export default FileUploader;
