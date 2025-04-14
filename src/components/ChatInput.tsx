
import React, { useState, useRef, useEffect } from "react";
import { Paperclip, Send, X, File as FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import FileUploader, { FileItem } from "./FileUploader";

interface ChatInputProps {
  onSend?: (message: string, file?: FileItem | null) => void;
  onFileSubmit?: (file: FileItem) => void;
  submittedFiles?: FileItem[];
  placeholder?: string;
  disabled?: boolean;
  onFileUploadClick?: () => void;
  isDemo?: boolean; // For presentation mode
  activeFile?: FileItem | null; // Add activeFile prop
  collapseFileList?: () => void; // Add new prop to collapse file list
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onFileSubmit,
  submittedFiles = [],
  placeholder = "How can I help you today?",
  disabled = false,
  onFileUploadClick,
  isDemo = false,
  activeFile = null, // Default to null
  collapseFileList,
}) => {
  const [message, setMessage] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [isUploaderOpen, setIsUploaderOpen] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Update selectedFile when activeFile changes
  useEffect(() => {
    if (activeFile) {
      setSelectedFile(activeFile);
    }
  }, [activeFile]);

  const handleSend = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if ((!message.trim() && !selectedFile) || (message.trim().length === 0 && !selectedFile)) {
      toast({
        title: "Nothing to send",
        description: "Please type a message or attach a file.",
        variant: "destructive",
      });
      return;
    }

    onSend?.(message, selectedFile);
    setMessage("");
    setSelectedFile(null);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileSubmit = (file: FileItem) => {
    onFileSubmit?.(file);
    setSelectedFile(file);
    setIsUploaderOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    setMessage(e.target.value);
  };

  const handleFileUploadIconClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!disabled) {
      // Toggle the uploader state
      const newUploaderState = !isUploaderOpen;
      setIsUploaderOpen(newUploaderState);
      
      // If we're opening the uploader, call the onFileUploadClick callback to expand the file list
      if (newUploaderState) {
        onFileUploadClick?.();
      } 
      // If we're closing the uploader, collapse the file list
      else {
        collapseFileList?.();
      }
    }
  };

  const handleRemoveSelectedFile = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedFile(null);
  };

  // Use the active file or selected file for display
  const displayFile = selectedFile;

  return (
    <div 
      className="relative w-full" 
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {displayFile && (
        <div className={cn(
          "flex items-center gap-2 w-full border bg-zinc-900/90 rounded-t-md px-3 py-2",
          "border-zinc-800 border-b-0"
        )}>
          <div className="flex items-center gap-2 flex-1 overflow-hidden">
            <FileIcon className="h-4 w-4 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{displayFile.name}</p>
              <p className="text-xs text-zinc-400">{formatFileSize(displayFile.size)}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full shrink-0"
            onClick={handleRemoveSelectedFile}
            disabled={disabled}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      <div className={cn(
        "flex items-center gap-1.5 w-full border bg-zinc-900/80 px-2 py-1.5",
        displayFile ? "rounded-b-md border-t-0" : "rounded-md",
        "border-zinc-800",
        disabled ? "opacity-60" : ""
      )}>
        <Popover 
          open={isUploaderOpen} 
          onOpenChange={(open) => {
            if (!disabled) {
              setIsUploaderOpen(open);
              // Always collapse file list when the popover is closed
              if (!open) {
                collapseFileList?.();
              }
            }
          }}
        >
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
              onClick={handleFileUploadIconClick}
              onMouseDown={(e) => e.stopPropagation()}
              data-radix-popover-trigger
              disabled={disabled}
            >
              <Paperclip className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-[350px] p-3 bg-zinc-950 border-zinc-800" 
            side="top" 
            align="start"
            sideOffset={5}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <FileUploader
              onFileSelect={(file) => {
                setSelectedFile(file);
              }}
              onSubmit={handleFileSubmit}
              maxSizeMB={20}
              acceptedFileTypes={["*/*"]}
              initialSelectedFile={selectedFile}
              previouslySubmittedFiles={submittedFiles}
              isDemo={isDemo}
            />
          </PopoverContent>
        </Popover>

        <Input
          ref={inputRef}
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          placeholder={displayFile 
            ? `Ask about ${displayFile.name}...` 
            : placeholder}
          className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 py-0.5 bg-transparent"
          disabled={disabled}
        />

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full shrink-0 text-primary hover:text-primary/80"
          onClick={handleSend}
          onMouseDown={(e) => e.stopPropagation()}
          disabled={disabled || (!message.trim() && !displayFile)}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default ChatInput;
