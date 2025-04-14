
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import FileUploader, { FileItem } from "@/components/FileUploader";
import { useState } from "react";

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
          File Context Uploader
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Upload files with context and manage them easily. Select existing files, add descriptions, and remove them when needed.
        </p>
      </div>

      <div className="grid md:grid-cols-[2fr_1fr] gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload File</CardTitle>
            <CardDescription>
              Drag and drop or browse to upload a file. Add context to explain what it contains.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUploader 
              onFileSelect={setSelectedFile}
              maxSizeMB={20}
              acceptedFileTypes={["*/*"]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>File Status</CardTitle>
            <CardDescription>
              Current file selection and what to do next
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedFile ? (
              <div className="space-y-4">
                <div>
                  <p className="font-medium">Selected File:</p>
                  <p className="text-sm text-muted-foreground truncate">{selectedFile.name}</p>
                </div>
                {selectedFile.context && (
                  <div>
                    <p className="font-medium">Context:</p>
                    <p className="text-sm text-muted-foreground">{selectedFile.context}</p>
                  </div>
                )}
                <Button className="w-full">
                  Process File
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] text-center space-y-3">
                <div className="rounded-full bg-primary/10 p-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary h-6 w-6"
                  >
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">No file selected</p>
                  <p className="text-sm text-muted-foreground">
                    Upload a file to get started
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
