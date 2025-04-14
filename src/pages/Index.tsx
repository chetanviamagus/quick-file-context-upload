
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ChatInput from "@/components/ChatInput";
import { useToast } from "@/hooks/use-toast";
import { FileItem } from "@/components/FileUploader";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";

const Index = () => {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

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
      <div className="mb-10 flex flex-col items-center">
        <div className="flex items-center justify-between w-full mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            File Context Uploader
          </h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-full"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
        <p className="text-muted-foreground max-w-md">
          Upload files with context and manage them easily using the chat input below.
        </p>
      </div>

      <Card className="mb-8 border-zinc-800 bg-zinc-950/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Chat Interface</CardTitle>
          <CardDescription>
            Use the input below to send messages with file attachments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] mb-4 rounded-md border border-zinc-800 bg-zinc-900/50 flex items-center justify-center">
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
