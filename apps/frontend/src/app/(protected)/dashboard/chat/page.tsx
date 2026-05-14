"use client";

import { useState, useRef, useEffect } from "react";
import { useChat, ChatMessage } from "@/hooks/useChat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Send, Bot, User, Trash2, Sparkles, Command } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-6 group animate-in slide-in-from-bottom-3 duration-500 ease-out`}>
      <div className={`flex gap-3 max-w-[85%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 shadow-sm ring-1 ring-border/50
          ${isUser ? "bg-primary text-primary-foreground" : "bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/20"}`}>
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </div>
        
        {/* Message Content */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 px-1">
            <span className="text-xs font-medium text-muted-foreground">
              {isUser ? "Anda" : "HR Assistant"}
            </span>
          </div>
          
          <div
            className={`rounded-2xl px-5 py-3.5 shadow-sm border
              ${
                isUser 
                  ? "bg-primary text-primary-foreground border-primary rounded-tr-sm" 
                  : "bg-card text-card-foreground border-border/60 rounded-tl-sm dark:bg-card/40 backdrop-blur-sm"
              }`}
          >
            {isUser ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
            ) : (
              <div className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-border/50">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h3: ({ children }) => <h3 className="text-sm font-bold mt-4 mb-2 text-foreground">{children}</h3>,
                    ul: ({ children }) => <ul className="list-disc pl-4 space-y-1.5 mb-3">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1.5 mb-3">{children}</ol>,
                    li: ({ children }) => <li className="text-sm">{children}</li>,
                    strong: ({ children }) => <span className="font-semibold text-foreground">{children}</span>,
                    p: ({ children }) => <p className="mb-3 last:mb-0 text-sm leading-relaxed">{children}</p>,
                    code: ({ children }) => <code className="bg-muted px-1.5 py-0.5 rounded-md text-[13px] font-mono text-primary">{children}</code>,
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-4 border border-border/50 rounded-lg bg-background/50">
                        <table className="min-w-full divide-y divide-border/50">{children}</table>
                      </div>
                    ),
                    th: ({ children }) => <th className="px-4 py-3 bg-muted/50 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{children}</th>,
                    td: ({ children }) => <td className="px-4 py-3 whitespace-nowrap text-sm border-t border-border/50">{children}</td>,
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
          </div>
          
          {message.processingTimeMs && !isUser && (
            <p className="text-[10px] text-muted-foreground/60 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
              Diproses dalam {(message.processingTimeMs / 1000).toFixed(2)}s
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { messages, send, clear, isLoading, error } = useChat();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    send(input.trim());
    setInput("");
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Asisten HR AI</h1>
            <p className="text-sm text-muted-foreground">
              Tanyakan kebijakan HR, SOP, atau jadwal cuti Anda
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clear} className="text-muted-foreground hover:text-destructive">
            <Trash2 className="w-4 h-4 mr-2" />
            Bersihkan
          </Button>
        )}
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden border-border/50 shadow-md bg-card/50 backdrop-blur-sm">
        <CardContent className="flex-1 overflow-y-auto p-4 sm:p-6 scroll-smooth">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center animate-in fade-in duration-700">
              <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center mb-6 shadow-sm border border-indigo-100 dark:border-indigo-500/20 relative">
                <Bot className="w-10 h-10 text-indigo-500" />
                <div className="absolute top-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-background animate-pulse"></div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Halo! Ada yang bisa dibantu?</h3>
              <p className="text-muted-foreground max-w-sm mb-8 text-sm">
                Asisten AI HR Automation siap membantu Anda menjawab pertanyaan seputar kebijakan perusahaan.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                {[
                  "Bagaimana cara mengajukan cuti tahunan?",
                  "Apa saja persyaratan klaim lembur?",
                  "Jam berapa saya harus check-in?",
                  "Berikan ringkasan SOP absensi."
                ].map((suggestion, i) => (
                  <button 
                    key={i}
                    onClick={() => setInput(suggestion)}
                    className="text-left p-3 rounded-lg border border-border/50 bg-background/50 hover:bg-muted/50 hover:border-primary/30 transition-all text-sm flex items-center gap-3 group"
                  >
                    <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Command className="w-3 h-3" />
                    </div>
                    <span className="truncate">{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-4">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {isLoading && (
                <div className="flex justify-start mb-6 animate-in slide-in-from-bottom-2">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center mt-1">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-card border border-border/60 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </CardContent>

        <div className="p-4 bg-background/80 backdrop-blur-md border-t border-border/50">
          {error && (
            <Alert variant="destructive" className="mb-4 animate-in slide-in-from-bottom-2">
              <AlertDescription className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive"></span>
                {error.message || "Gagal menghubungi server AI. Coba lagi."}
              </AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="relative flex items-center max-w-4xl mx-auto">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tanyakan sesuatu pada Asisten HR..."
              disabled={isLoading}
              maxLength={1000}
              className="pr-14 py-6 rounded-full bg-card shadow-sm border-border/60 focus-visible:ring-primary/30"
            />
            <Button 
              type="submit" 
              size="icon"
              disabled={isLoading || !input.trim()}
              className="absolute right-2 h-9 w-9 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all"
            >
              <Send className="w-4 h-4 ml-0.5" />
              <span className="sr-only">Kirim</span>
            </Button>
          </form>
          <div className="text-center mt-3">
            <span className="text-[10px] text-muted-foreground">
              AI dapat melakukan kesalahan. Harap verifikasi informasi penting dengan HR.
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
