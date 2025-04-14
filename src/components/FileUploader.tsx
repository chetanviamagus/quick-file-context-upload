
import React, { useState, useRef } from "react";
import { Upload, X, File, PaperclipIcon, Trash2 } from "lucide-react";
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

      const newFile: FileItem = {
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type,
        context: context,
        lastModified: file.lastModified,
      };

      setFiles(prev => [...prev, newFile]);
      setSelectedFile(newFile);
      onFileSelect?.(newFile);
      setContext("");
      
      toast({
        title: "File uploaded",
        description: `${file.name} has been uploaded successfully`,
      });
    }
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleContextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContext(e.target.value);
    
    if (selectedFile) {
      // Update context for the selected file
      const updatedFile = { ...selectedFile, context: e.target.value };
      setSelectedFile(updatedFile);
      setFiles(prev => prev.map(f => f.id === selectedFile.id ? updatedFile : f));
      onFileSelect?.(updatedFile);
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

  return (
    <div className="w-full space-y-4">
      {/* File uploader area */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer",
          isDragging 
            ? "border-primary bg-primary/5" 
            : "border-muted-foreground/20 hover:border-primary/50",
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
        
        <div className="flex flex-col items-center gap-2 text-center">
          <Upload className="h-10 w-10 text-muted-foreground mb-2" />
          <h3 className="text-lg font-medium">Upload a file</h3>
          <p className="text-sm text-muted-foreground">
            Drag and drop or click to browse
          </p>
          <p className="text-xs text-muted-foreground">
            Max size: {maxSizeMB}MB
          </p>
        </div>
      </div>

      {/* Context textarea */}
      <div className="space-y-2">
        <Textarea
          placeholder="Add context about this file (optional)"
          className="min-h-[80px] resize-none"
          value={context}
          onChange={handleContextChange}
        />
      </div>

      {/* Selected file info */}
      {selectedFile && (
        <div className="border rounded-lg p-4 bg-accent/50">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <File className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium truncate max-w-[200px]">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full"
              onClick={() => {
                setSelectedFile(null);
                setContext("");
                onFileSelect?.(null);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {selectedFile.context && (
            <div className="mt-2 text-sm text-muted-foreground">
              <p className="line-clamp-2">{selectedFile.context}</p>
            </div>
          )}
        </div>
      )}

      {/* Previously uploaded files */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Files ({files.length})</h4>
          <ul className="space-y-2 max-h-[200px] overflow-y-auto">
            {files.map((file) => (
              <li 
                key={file.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-md cursor-pointer hover:bg-accent/50",
                  selectedFile?.id === file.id ? "bg-accent" : "bg-background"
                )}
                onClick={() => selectExistingFile(file)}
              >
                <div className="flex items-center gap-3">
                  <PaperclipIcon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-50 hover:opacity-100 rounded-full"
                  onClick={(e) => removeFile(file.id, e)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
