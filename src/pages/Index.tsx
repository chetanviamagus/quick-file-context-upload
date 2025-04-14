
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ChatInput from "@/components/ChatInput";
import { useToast } from "@/hooks/use-toast";
import { FileItem } from "@/components/FileUploader";
import { Moon, Sun, File, ChevronDown, RefreshCw, Share2, ThumbsUp, ThumbsDown, MoreHorizontal, Eye, Copy, Terminal, Table, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";
import { deleteFile, getSubmittedFiles, submitFile, analyzeFile } from "@/services/fileService";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { FileUploadStatus } from "@/components/FileUploader";
import { cn } from "@/lib/utils";
import { FileGrid } from "@/components/FileGrid";

interface ChatMessage {
  id: string;
  content: string;
  timestamp: Date;
  sender: "user" | "assistant";
  file?: FileItem | null;
}

interface DiagnosticResult {
  summary: string;
  insights?: string[];
  recommendations?: string[];
  tables?: Array<{
    id: string;
    name: string;
    columns: string[];
    data: string[][];
  }>;
}

const Index = () => {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [submittedFiles, setSubmittedFiles] = useState<FileItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activeFile, setActiveFile] = useState<FileItem | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [diagnosticResults, setDiagnosticResults] = useState<DiagnosticResult | null>(null);
  const [isFileInfoExpanded, setIsFileInfoExpanded] = useState<boolean>(false);
  const [isFileListExpanded, setIsFileListExpanded] = useState<boolean>(true);

  useEffect(() => {
    const fetchFiles = async () => {
      const files = await getSubmittedFiles();
      setSubmittedFiles(files);
    };
    
    fetchFiles();
  }, []);

  const handleDeleteFile = async (fileToDelete: FileItem) => {
    try {
      const success = await deleteFile(fileToDelete.id || '');
      
      if (success) {
        setSubmittedFiles(prev => prev.filter(file => file.id !== fileToDelete.id));
        
        if (activeFile && activeFile.id === fileToDelete.id) {
          setActiveFile(null);
        }
        
        toast({
          title: "File deleted",
          description: `"${fileToDelete.name}" has been deleted.`,
        });
      }
    } catch (error) {
      toast({
        title: "Error deleting file",
        description: "There was an error deleting the file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async (message: string, file: FileItem | null) => {
    const userMessageId = crypto.randomUUID();
    const userMessage: ChatMessage = {
      id: userMessageId,
      content: message,
      timestamp: new Date(),
      sender: "user",
      file: file || activeFile,
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    
    if (file && !activeFile) {
      setActiveFile(file);
    }
    
    setIsAnalyzing(true);
    
    try {
      let analysisResult;
      
      if (userMessage.file) {
        analysisResult = await analyzeFile(userMessage.file.id || '', message);
      } else {
        // Handle case when no file is selected
        analysisResult = {
          summary: "No diagnostic file was selected for analysis. Please upload or select a file first.",
        };
      }
      
      setDiagnosticResults(analysisResult);
      
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        content: "I've analyzed your diagnostic file. Here's what I found:",
        timestamp: new Date(),
        sender: "assistant",
      };
      
      setChatMessages(prev => [...prev, assistantMessage]);
      
      toast({
        title: "Analysis complete",
        description: "Your diagnostic file has been analyzed.",
      });
    } catch (error) {
      toast({
        title: "Analysis failed",
        description: "There was an error analyzing your file. Please try again.",
        variant: "destructive",
      });
      
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        content: "I encountered an error while analyzing your file. Please try again with a different file or query.",
        timestamp: new Date(),
        sender: "assistant",
      };
      
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileSubmit = async (file: FileItem) => {
    try {
      const submittedFile: FileItem = {
        ...file,
        status: FileUploadStatus.FILE_UPLOAD_STATUS_IN_PROGRESS,
        progress: 0
      };

      setSubmittedFiles(prev => [submittedFile, ...prev]);
      
      // Submit the file
      const uploadedFile = await submitFile(file);

      // Update the file status
      setSubmittedFiles(prev => 
        prev.map(f => f.id === submittedFile.id ? {
          ...uploadedFile,
          status: FileUploadStatus.FILE_UPLOAD_STATUS_COMPLETE,
          progress: 100
        } : f)
      );
      
      setActiveFile({
        ...uploadedFile,
        status: FileUploadStatus.FILE_UPLOAD_STATUS_COMPLETE,
        progress: 100
      });
      
      toast({
        title: "File processed successfully",
        description: `"${file.name}" is ready for analysis.`,
      });
    } catch (error) {
      const failedFile: FileItem = {
        ...file,
        status: FileUploadStatus.FILE_UPLOAD_STATUS_FAILED,
        progress: 0
      };

      setSubmittedFiles(prev => 
        prev.map(f => f.id === file.id ? failedFile : f)
      );

      toast({
        title: "Error processing file",
        description: "There was an error processing your diagnostic file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFileUploadClick = () => {
    setIsFileListExpanded(true);
  };

  const handleRefreshFiles = async () => {
    try {
      toast({
        title: "Refreshing files",
        description: "Fetching the latest files...",
      });
      
      const files = await getSubmittedFiles();
      setSubmittedFiles(files);
    } catch (error) {
      toast({
        title: "Error refreshing files",
        description: "There was an error fetching the files. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full h-screen flex flex-col bg-zinc-950">
      <header className="w-full border-b border-zinc-800 py-3 px-4 bg-zinc-900/80">
        <div className="container mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">
              DevOps Diagnostics
            </h1>
            <div className="hidden md:flex items-center text-sm gap-4 text-zinc-400">
              <span className="hover:text-white cursor-pointer">Home</span>
              <span className="text-zinc-600">›</span>
              <span className="hover:text-white cursor-pointer">Projects</span>
              <span className="text-zinc-600">›</span>
              <span className="hover:text-white cursor-pointer">Project-SRE</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-full"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col h-full">
        <div className="w-full flex-1 flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-4">
            {chatMessages.length > 0 ? (
              <div className="space-y-6">
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender === "user" ? "justify-start" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        message.sender === "user"
                          ? "bg-zinc-800/60 text-white"
                          : "bg-blue-600/10 border border-blue-600/30 text-white"
                      }`}
                    >
                      {message.file && message.sender === "user" && (
                        <div className="mb-2 flex items-center gap-2 text-xs text-zinc-400">
                          <File className="h-3.5 w-3.5" />
                          <span>{message.file.name}</span>
                        </div>
                      )}
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center">
                <div className="text-center max-w-md">
                  <h2 className="text-xl font-bold mb-2">Start by uploading a diagnostic file</h2>
                  <p className="text-sm text-zinc-400 mb-4">
                    Upload log files, system diagnostics, or metrics data from your infrastructure for analysis
                  </p>
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      className="rounded-full gap-2"
                      onClick={() => {
                        setIsFileListExpanded(true);
                        toast({
                          title: "Tip",
                          description: "Use the paperclip icon below to upload diagnostic files",
                        });
                      }}
                    >
                      <File className="h-4 w-4" />
                      <span>Upload diagnostic file</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {diagnosticResults && (
              <div className="mt-6 space-y-6 mb-4">
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg overflow-hidden">
                  <div className="p-4">
                    <h3 className="text-lg font-bold">Summary</h3>
                    <p className="text-sm mt-2 text-zinc-300">{diagnosticResults.summary}</p>
                  </div>

                  {diagnosticResults.insights && diagnosticResults.insights.length > 0 && (
                    <div className="border-t border-zinc-800 p-4">
                      <h3 className="text-sm font-bold mb-2">Key Insights</h3>
                      <ul className="space-y-1">
                        {diagnosticResults.insights.map((insight, index) => (
                          <li key={index} className="text-sm text-zinc-300 flex items-start">
                            <span className="text-blue-400 mr-2">•</span>
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {diagnosticResults.recommendations && diagnosticResults.recommendations.length > 0 && (
                    <div className="border-t border-zinc-800 p-4">
                      <h3 className="text-sm font-bold mb-2">Recommendations</h3>
                      <ul className="space-y-1">
                        {diagnosticResults.recommendations.map((rec, index) => (
                          <li key={index} className="text-sm text-zinc-300 flex items-start">
                            <span className="text-green-400 mr-2">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {diagnosticResults.tables && diagnosticResults.tables.map(table => (
                    <div key={table.id} className="mt-4 border-t border-zinc-800">
                      <div className="flex items-center justify-between p-3 bg-zinc-900">
                        <div className="flex items-center gap-2">
                          <Table className="h-4 w-4 text-zinc-400" />
                          <h4 className="text-sm font-medium">{table.name}</h4>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <RefreshCw className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-zinc-900/80 text-xs uppercase">
                            <tr>
                              {table.columns.map((column, i) => (
                                <th key={i} className="px-4 py-2 text-left font-medium text-zinc-400">
                                  <div className="flex items-center gap-1">
                                    {column}
                                  </div>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {table.data.map((row, i) => (
                              <tr key={i} className="border-t border-zinc-800 hover:bg-zinc-800/40">
                                {row.map((cell, j) => (
                                  <td key={j} className="px-4 py-3 text-xs">
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center justify-between p-3 border-t border-zinc-800">
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <Terminal className="h-3.5 w-3.5" />
                      <span>Analysis completed in 1.2s</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                        <Share2 className="h-3.5 w-3.5" />
                        <span>Share</span>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <ThumbsUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <ThumbsDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-zinc-800 bg-zinc-900/50 px-4 pt-3">
            <Collapsible 
              open={isFileListExpanded}
              onOpenChange={setIsFileListExpanded}
              className="mb-3"
            >
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between mb-2 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold">Diagnostic Files</h3>
                    {submittedFiles.length > 0 && (
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full">
                        {submittedFiles.length}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 gap-1 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRefreshFiles();
                      }}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Refresh</span>
                    </Button>
                    <ChevronDown className={`h-4 w-4 transition-transform ${isFileListExpanded ? 'transform rotate-180' : ''}`} />
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mb-3 relative">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                    <Input
                      type="text"
                      placeholder="Search diagnostic files..."
                      className="pl-9 bg-zinc-800/50 border-zinc-700 w-full text-sm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1 h-7 w-7 hover:bg-zinc-700/50"
                        onClick={() => setSearchQuery("")}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
                
                <FileGrid
                  searchQuery={searchQuery}
                  onFileSelect={setActiveFile}
                  onFileDelete={handleDeleteFile}
                  activeFile={activeFile}
                  className="mb-3"
                />
              </CollapsibleContent>
            </Collapsible>
            
            {activeFile && (
              <Collapsible 
                open={isFileInfoExpanded}
                onOpenChange={setIsFileInfoExpanded}
                className="mb-3"
              >
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between rounded-md bg-zinc-800/50 px-3 py-2 cursor-pointer hover:bg-zinc-800">
                    <div className="flex items-center gap-2">
                      <File className="h-4 w-4 text-blue-400" />
                      <span className="text-sm font-medium">
                        File: {activeFile.name}
                      </span>
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                        Ready
                      </span>
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-transform ${isFileInfoExpanded ? 'transform rotate-180' : ''}`} />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="p-3 text-sm bg-zinc-800/20 rounded-b-md border-x border-b border-zinc-800">
                  <div className="space-y-2">
                    <p><span className="text-zinc-400">Type:</span> {activeFile.type}</p>
                    <p><span className="text-zinc-400">Size:</span> {activeFile.size > 1024 * 1024 
                      ? `${(activeFile.size / (1024 * 1024)).toFixed(2)} MB` 
                      : `${(activeFile.size / 1024).toFixed(2)} KB`}
                    </p>
                    <p><span className="text-zinc-400">Context:</span> {activeFile.context}</p>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
            
            <ChatInput 
              onSend={handleSendMessage}
              onFileSubmit={handleFileSubmit}
              submittedFiles={submittedFiles}
              placeholder={activeFile ? "Ask about the diagnostic file..." : "Upload a diagnostic file or type a message..."}
              disabled={isAnalyzing}
              onFileUploadClick={handleFileUploadClick}
              activeFile={activeFile}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
