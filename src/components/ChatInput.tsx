
import React, { useState, useRef } from "react";
import { Paperclip, Send, X } from "lucide-react";
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
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onFileSubmit,
  submittedFiles = [],
  placeholder = "How can I help you today?",
  disabled = false,
  onFileUploadClick,
  isDemo = false,
}) => {
  const [message, setMessage] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [isUploaderOpen, setIsUploaderOpen] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
      setIsUploaderOpen(!isUploaderOpen);
      onFileUploadClick?.();
    }
  };

  return (
    <div 
      className="relative w-full" 
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className={cn(
        "flex items-center gap-1.5 w-full border bg-zinc-900/80 rounded-md px-2 py-1.5",
        selectedFile ? "rounded-t-none border-t-0" : "",
        "border-zinc-800",
        disabled ? "opacity-60" : ""
      )}>
        <Popover 
          open={isUploaderOpen} 
          onOpenChange={(open) => {
            if (!disabled) {
              setIsUploaderOpen(open);
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
          placeholder={placeholder}
          className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 py-0.5 bg-transparent"
          disabled={disabled}
        />

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full shrink-0 text-primary hover:text-primary/80"
          onClick={handleSend}
          onMouseDown={(e) => e.stopPropagation()}
          disabled={disabled || (!message.trim() && !selectedFile)}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default ChatInput;
