"use client";

import { useState, useRef, useEffect } from "react";
import { useChat, ChatMessage } from "@/hooks/useChat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-3 ${
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-sm">{message.content}</p>
        ) : (
          <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-gray-800 prose-pre:text-gray-100">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h3: ({ children }) => (
                  <h3 className="text-sm font-bold mt-3 mb-1">{children}</h3>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc pl-4 space-y-1 mb-2">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal pl-4 space-y-1 mb-2">
                    {children}
                  </ol>
                ),
                li: ({ children }) => <li className="text-sm">{children}</li>,
                strong: ({ children }) => (
                  <span className="font-bold">{children}</span>
                ),
                p: ({ children }) => (
                  <p className="mb-2 last:mb-0 text-sm">{children}</p>
                ),
                code: ({ children }) => (
                  <code className="bg-black/10 px-1 py-0.5 rounded text-xs font-mono">
                    {children}
                  </code>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto my-2 border rounded-md bg-background">
                    <table className="min-w-full divide-y divide-border">
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="px-3 py-2 bg-muted text-left text-xs font-medium uppercase tracking-wider">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-3 py-2 whitespace-nowrap text-sm border-t border-border">
                    {children}
                  </td>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {message.processingTimeMs && !isUser && (
          <p className="text-[10px] mt-2 opacity-60">
            {(message.processingTimeMs / 1000).toFixed(1)}s
          </p>
        )}
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
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold">Asisten HR</h1>
          <p className="text-muted-foreground">
            Tanyakan tentang kebijakan HR, SOP, dan prosedur perusahaan
          </p>
        </div>
        {messages.length > 0 && (
          <Button variant="outline" onClick={clear}>
            Hapus Chat
          </Button>
        )}
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="py-3 border-b">
          <CardTitle className="text-sm font-medium">Percakapan</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-center">
              <div>
                <p className="text-lg font-medium mb-2">Selamat datang!</p>
                <p className="text-sm">
                  Ajukan pertanyaan tentang dokumen HR Anda.
                </p>
                <p className="text-xs mt-4 opacity-70">
                  Contoh: {"Bagaimana prosedur pengajuan cuti?"}
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {isLoading && (
                <div className="flex justify-start mb-4">
                  <div className="bg-muted rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200" />
                      <span className="text-sm text-muted-foreground ml-2">
                        Mencari jawaban...
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </CardContent>

        <div className="p-4 border-t">
          {error && (
            <Alert variant="destructive" className="mb-3">
              <AlertDescription>
                {error.message || "Terjadi kesalahan. Silakan coba lagi."}
              </AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ketik pertanyaan Anda..."
              disabled={isLoading}
              maxLength={1000}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              {isLoading ? "Mengirim..." : "Kirim"}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
