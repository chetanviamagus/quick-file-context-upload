
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
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onFileSubmit,
  submittedFiles = [],
  placeholder = "Upload a file or type a message...",
}) => {
  const [message, setMessage] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [isUploaderOpen, setIsUploaderOpen] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleSend = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    
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
    setSelectedFile(null);
    setIsUploaderOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    setMessage(e.target.value);
  };

  // Prevent events from bubbling up to parent elements
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="relative w-full" onMouseDown={handleMouseDown} onClick={handleClick}>
      {selectedFile && (
        <div className="absolute -top-14 left-0 right-0 p-2 bg-zinc-900 rounded-t-md border border-zinc-800">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="rounded-md bg-primary/10 p-1.5">
                <Paperclip className="h-4 w-4 text-primary" />
              </div>
              <div className="overflow-hidden">
                <div className="flex items-center">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  {selectedFile.status === "success" && (
                    <span className="text-xs text-green-400 ml-1.5">✓</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(selectedFile.size)}
                  {selectedFile.context && ` • ${selectedFile.context.substring(0, 20)}${selectedFile.context.length > 20 ? '...' : ''}`}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFile(null);
              }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      <div className={cn(
        "flex items-center gap-1.5 w-full border bg-zinc-900 rounded-md px-2 py-1.5",
        selectedFile ? "rounded-t-none border-t-0" : "",
        "border-zinc-800"
      )}>
        <Popover 
          open={isUploaderOpen} 
          onOpenChange={(open) => {
            setIsUploaderOpen(open);
          }}
        >
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
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
          >
            <FileUploader
              onFileSelect={(file) => {
                setSelectedFile(file);
                if (file && file.status === "success") {
                  setIsUploaderOpen(false);
                }
              }}
              onSubmit={handleFileSubmit}
              maxSizeMB={20}
              acceptedFileTypes={["*/*"]}
              initialSelectedFile={selectedFile}
              previouslySubmittedFiles={submittedFiles}
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
        />

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full shrink-0 text-primary hover:text-primary/80"
          onClick={handleSend}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default ChatInput;
