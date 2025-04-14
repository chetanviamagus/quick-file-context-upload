import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ChatInput from "@/components/ChatInput";
import { useToast } from "@/hooks/use-toast";
import { FileItem } from "@/components/FileUploader";
import { Moon, Sun, File, ChevronDown, RefreshCw, Share2, ThumbsUp, ThumbsDown, MoreHorizontal, Eye, Copy, Terminal, Table, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";
import { getSubmittedFiles, submitFile } from "@/services/fileService";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { FileUploadStatus } from "@/components/FileUploader";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

interface ChatMessage {
  id: string;
  content: string;
  timestamp: Date;
  sender: "user" | "assistant";
  file?: FileItem | null;
}

interface DiagnosticResult {
  summary: string;
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
  const [filteredFiles, setFilteredFiles] = useState<FileItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activeFile, setActiveFile] = useState<FileItem | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [diagnosticResults, setDiagnosticResults] = useState<DiagnosticResult | null>(null);
  const [isFileInfoExpanded, setIsFileInfoExpanded] = useState<boolean>(false);
  const [isFileListExpanded, setIsFileListExpanded] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState(1);
  const filesPerPage = 9;

  useEffect(() => {
    const fetchFiles = async () => {
      const files = await getSubmittedFiles();
      setSubmittedFiles(files);
      setFilteredFiles(files);
    };
    
    fetchFiles();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredFiles(submittedFiles);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = submittedFiles.filter(
        file => 
          file.name.toLowerCase().includes(query) || 
          (file.context && file.context.toLowerCase().includes(query))
      );
      setFilteredFiles(filtered);
    }
  }, [searchQuery, submittedFiles]);

  const handleDeleteFile = (fileToDelete: FileItem) => {
    setSubmittedFiles(prev => prev.filter(file => file.id !== fileToDelete.id));
    
    if (activeFile && activeFile.id === fileToDelete.id) {
      setActiveFile(null);
    }
    
    toast({
      title: "File deleted",
      description: `"${fileToDelete.name}" has been deleted.`,
    });
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
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockResults: DiagnosticResult = {
      summary: "The most recent timestamp in the 'metric_aws_apigateway.latency' table is 25/07/24 10:45:00.000000. This indicates the latest recorded data point for API Gateway latency metrics, which can be crucial for performance monitoring.",
      tables: [
        {
          id: "latency-table",
          name: "Latency_Table_NameIsABC",
          columns: ["Timestamp", "Message"],
          data: [
            ["2024-09-26T06:27:35.225000+00:00 Local: Sep 26, 2024, 11:57:35 AM", "Error syncing pod, skipping: failed to \"StartContainer\" for \"alex-bird-..."],
            ["2024-09-26T06:27:35.225000+00:00 Local: Sep 26, 2024, 11:57:35 AM", "Error syncing pod, skipping: failed to \"StartContainer\" for \"alex-bird-..."],
            ["2024-09-26T06:27:35.225000+00:00 Local: Sep 26, 2024, 11:57:35 AM", "Error syncing pod, skipping: failed to \"StartContainer\" for \"alex-bird-..."],
            ["2024-09-26T06:27:35.225000+00:00 Local: Sep 26, 2024, 11:57:35 AM", "Error syncing pod, skipping: failed to \"StartContainer\" for \"alex-bird-..."],
            ["2024-09-26T06:27:35.225000+00:00 Local: Sep 26, 2024, 11:57:35 AM", "Error syncing pod, skipping: failed to \"StartContainer\" for \"alex-bird-..."],
          ]
        }
      ]
    };
    
    setDiagnosticResults(mockResults);
    setIsAnalyzing(false);
    
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
  };

  const handleFileSubmit = async (file: FileItem) => {
    try {
      const submittedFile: FileItem = {
        ...file,
        status: FileUploadStatus.FILE_UPLOAD_STATUS_IN_PROGRESS,
        progress: 0
      };

      setSubmittedFiles(prev => [submittedFile, ...prev]);
      
      await new Promise(resolve => setTimeout(resolve, 1500));

      const uploadedFile: FileItem = {
        ...file,
        status: FileUploadStatus.FILE_UPLOAD_STATUS_COMPLETE,
        progress: 100
      };
      
      setSubmittedFiles(prev => 
        prev.map(f => f.id === submittedFile.id ? uploadedFile : f)
      );
      setActiveFile(uploadedFile);
      
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
    setIsFileListExpanded(false);
  };

  const indexOfLastFile = currentPage * filesPerPage;
  const indexOfFirstFile = indexOfLastFile - filesPerPage;
  const currentFiles = filteredFiles.slice(indexOfFirstFile, indexOfLastFile);
  const totalPages = Math.ceil(filteredFiles.length / filesPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push(totalPages);
      }
    }
    return pages;
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
                    <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
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
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                  {currentFiles.length > 0 ? (
                    currentFiles.map((file) => (
                      <div 
                        key={file.id}
                        className={`flex items-center justify-between p-2 rounded-md cursor-pointer ${activeFile?.id === file.id ? 'bg-zinc-800 border border-blue-500/50' : 'bg-zinc-800/50 hover:bg-zinc-800'}`}
                        onClick={() => setActiveFile(file)}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <File className="h-4 w-4 text-blue-400 flex-shrink-0" />
                          <div className="overflow-hidden">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-zinc-400">
                              {file.size > 1024 * 1024 
                                ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` 
                                : `${(file.size / 1024).toFixed(2)} KB`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFile(file);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-4">
                      {searchQuery ? (
                        <p className="text-sm text-zinc-500">No files matching "{searchQuery}"</p>
                      ) : (
                        <>
                          <p className="text-sm text-zinc-500">No diagnostic files uploaded yet</p>
                          <p className="text-xs text-zinc-600 mt-1">Upload a file using the paperclip icon below</p>
                        </>
                      )}
                    </div>
                  )}
                </div>
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

      {filteredFiles.length > filesPerPage && (
        <Pagination className="mb-3">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(currentPage - 1)}
                className={cn(
                  "cursor-pointer",
                  currentPage === 1 && "pointer-events-none opacity-50"
                )}
              />
            </PaginationItem>
            
            {getPageNumbers().map((page, index, array) => (
              <React.Fragment key={page}>
                {index > 0 && array[index - 1] + 1 !== page && (
                  <PaginationItem>
                    <span className="px-2">...</span>
                  </PaginationItem>
                )}
                <PaginationItem>
                  <PaginationLink
                    onClick={() => handlePageChange(page)}
                    isActive={currentPage === page}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              </React.Fragment>
            ))}
            
            <PaginationItem>
              <PaginationNext
                onClick={() => handlePageChange(currentPage + 1)}
                className={cn(
                  "cursor-pointer",
                  currentPage === totalPages && "pointer-events-none opacity-50"
                )}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default Index;
