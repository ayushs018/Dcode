"use client";
import { useCodeEditorStore } from "@/store/useCodeEditorStore";
import { AlertTriangle, CheckCircle, Clock, Copy, Terminal, Sparkles, X, Bot, Send } from "lucide-react";
import React, { useEffect, useState, useRef } from "react";
import RunningCodeSkeleton from "./RunningCodeSkeleton";
import ReactMarkdown from 'react-markdown';
import language from "react-syntax-highlighter/dist/esm/languages/hljs/accesslog";
import { div } from "framer-motion/client";

function OutputPanel() {
  const { output, error, isRunning } = useCodeEditorStore();
  const [inputText, setInputText] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [userQuestion, setUserQuestion] = useState("");
  const [finalPrompt, setFinalPrompt] = useState("");
  const [activeTab, setActiveTab] = useState<"output" | "ai">("output");
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "ai"; message: string }[]>([]);
  const hasContent = error || output;


  const handleCopy = async () => {
    if (!hasContent) return;
    await navigator.clipboard.writeText(error || output);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleUserInput = (e : React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value ; 
    setInputText (val) ;
    localStorage.setItem("input" , val) ; 
  }

  useEffect(() => {
    const storedChat = sessionStorage.getItem("ai-chat-history");
    if (storedChat) {
      setChatHistory(JSON.parse(storedChat));
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem("ai-chat-history", JSON.stringify(chatHistory));
  }, [chatHistory]);
    

  useEffect(() => {
    const language = localStorage.getItem("editor-language") || "unknown";
    const currentCode = localStorage.getItem(`editor-code-${language}`) || "";
    const isRun = localStorage.getItem (`run-code-${language}`) ;
    
    let generatedPrompt = "";
    let printOutput = "" ; 
    let printError = "" ; 
    if (isRun === "false") {
      printError = "" ; 
      printOutput = "" ; 
    }
    else if (isRun == "true") {
      printError = error || ""; 
      printOutput = output ;
    }

      generatedPrompt = `
      Here is the code:
      _____
      ${currentCode}

      Here is the ${printError ? "error" : "output"}:
      _____
      ${printError || printOutput || "No output generated."}

      User Question:
      _____
      ${userQuestion}
            `.trim();

    setFinalPrompt(generatedPrompt);
  }, [userQuestion, output, error]);

  const handleSendMessage = async () => {
    if (!userQuestion.trim()) return;
    const userMessage = userQuestion.trim();
    const newChat = [...chatHistory, { role: "user", message: userMessage }];
    setChatHistory(newChat);
    setUserQuestion("");

    try {
      const res = await fetch("/api/groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [
            { role: "system", content: "You are a helpful coding assistant." },
            { role: "user", content: finalPrompt },
          ],
        }),
      });

      if (!res.ok) {
        let errorMessage = `Error ${res.status}`;
        if (res.status === 402) errorMessage = "Your free AI quota is exhausted.";
        setChatHistory([...newChat, { role: "ai", message: errorMessage }]);
        return;
      }

      const data = await res.json();
      const aiResponse = data.choices?.[0]?.message?.content || "AI did not return a response.";
      // const aiResponse = "AI did not return a response."; 
      setChatHistory([...newChat, { role: "ai", message: aiResponse }]);
    } catch {
      setChatHistory([...newChat, { role: "ai", message: "Failed to get response. Please try again later." }]);
    }
  };


  return (
    <div className="relative bg-[#181825] rounded-xl p-4 ring-1 ring-gray-800/50">
      {/* Header with Tabs */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-[#1e1e2e] ring-1 ring-gray-800/50">
            <Terminal className="w-4 h-4 text-blue-400" />
          </div>
          <span className="text-sm font-medium text-gray-300">Output Panel</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("output")}
            className={`px-3 py-1.5 text-xs rounded-lg ring-1 ring-gray-700/50 transition-all ${
              activeTab === "output" ? "bg-[#1e1e2e] text-gray-300" : "bg-transparent text-gray-400 hover:text-gray-300"
            }`}
          >
            Output
          </button>
          <button
            onClick={() => setActiveTab("ai")}
            className={`px-3 py-1.5 text-xs rounded-lg ring-1 ring-gray-700/50 transition-all ${
              activeTab === "ai" ? "bg-[#1e1e2e] text-gray-300" : "bg-transparent text-gray-400 hover:text-gray-300"
            }`}
          >
            AI Assistant
          </button>
        </div>
      </div>

      {/* Output Area */}
      {activeTab === "output" && (
      <div className="space-y-4 flex flex-col h-[600px]">    
          {/* Input Area */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Program Input:</label>
              <textarea
                className="w-full p-3 rounded-lg bg-[#1e1e2e] border border-[#313244] text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y max-h-[300px]"
                placeholder="Enter input for your code here..."
                value={inputText}
                onChange={handleUserInput}
                rows={3}
              />
            </div>

        {/* Output area */ }
          <div className="relative flex-1 flex flex-col">
            <div
              className="relative bg-[#1e1e2e]/50 backdrop-blur-sm border border-[#313244] 
            rounded-xl p-4 flex-1 overflow-auto font-mono text-sm"
            >
              {isRunning ? (
                <RunningCodeSkeleton />
              ) : error ? (
                <div className="flex items-start gap-3 text-red-400">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-1" />
                  <div className="space-y-1">
                    <div className="font-medium">Execution Error</div>
                    <pre className="whitespace-pre-wrap text-red-400/80">{error}</pre>
                  </div>
                </div>
              ) : output ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 mb-3">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Execution Successful</span>
                  </div>
                  <pre className="whitespace-pre-wrap text-gray-300">{output}</pre>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gray-800/50 ring-1 ring-gray-700/50 mb-4">
                    <Clock className="w-6 h-6" />
                  </div>
                  <p className="text-center">Run your code to see the output here...</p>
                </div>
              )}
            </div>

            {hasContent && (
              <div className="flex justify-end mt-3">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-400 hover:text-gray-300 bg-[#1e1e2e] 
                  rounded-lg ring-1 ring-gray-800/50 hover:ring-gray-700/50 transition-all"
                >
                  {isCopied ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

        </div>
      )}

      {/* AI Assistant Chat */}
      {activeTab === "ai" && (
        <div className="flex flex-col h-[600px]">
          <div className="flex-1 overflow-auto bg-[#1e1e2e]/50 backdrop-blur-sm border border-[#313244] rounded-xl p-4 mb-4">
            {chatHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gray-800/50 ring-1 ring-gray-700/50 mb-4">
                  <Bot className="w-6 h-6" />
                </div>
                <p className="text-center">Start your conversation with AI here...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {chatHistory.map((chat, index) => (
                  <div
                    key={index}
                    className={`flex ${chat.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        chat.role === "user" ? "bg-blue-500 text-white" : " text-gray-200"
                      }`}
                    >
                      <div className="prose prose-invert max-w-none">
                        <ReactMarkdown>
                          {chat.message}
                        </ReactMarkdown>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="flex items-center gap-3">
            <textarea
              className="flex-1 p-3 rounded-lg bg-[#1e1e2e] border border-[#313244] text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Type your question for AI..."
              value={userQuestion}
              onChange={(e) => setUserQuestion(e.target.value)}
              rows={1}
            />
            <button
              onClick={handleSendMessage}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 bg-[#252535] rounded-lg ring-1 ring-gray-700/50 hover:ring-gray-600/50 transition-all"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default OutputPanel;
