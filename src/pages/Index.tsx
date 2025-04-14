
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ChatInput from "@/components/ChatInput";
import { useToast } from "@/hooks/use-toast";
import { FileItem } from "@/components/FileUploader";

const Index = () => {
  const { toast } = useToast();

  const handleSendMessage = (message: string, file: FileItem | null) => {
    console.log("Message:", message);
    console.log("File:", file);
    
    toast({
      title: "Processing",
      description: file 
        ? `Processing file: ${file.name}${message ? ` with message: ${message}` : ''}`
        : `Sent: ${message}`,
    });
  };

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
          File Context Uploader
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Upload files with context and manage them easily using the chat input below.
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Chat Interface</CardTitle>
          <CardDescription>
            Use the input below to send messages with file attachments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] mb-4 rounded-md border bg-accent/50 flex items-center justify-center">
            <p className="text-muted-foreground">Chat messages will appear here</p>
          </div>
          
          <ChatInput 
            onSend={handleSendMessage}
            placeholder="Upload a file or type a message..."
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
