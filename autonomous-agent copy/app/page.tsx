"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { executeTask } from "@/lib/orchestrator"
import { ReportViewer } from "@/components/report-viewer"
import { Brain, Globe, Terminal, FileText, Sparkles, Loader2 } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Home() {
  const [instruction, setInstruction] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("instruction")
  const [logs, setLogs] = useState<string[]>([])
  const [theme, setTheme] = useState<"light" | "dark">("light")

  useEffect(() => {
    // Check system preference
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark")
      document.documentElement.classList.add("dark")
    }
  }, [])

  const toggleTheme = () => {
    setTheme((prev) => {
      const newTheme = prev === "light" ? "dark" : "light"
      if (newTheme === "dark") {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
      return newTheme
    })
  }

  const handleSubmit = async () => {
    if (!instruction.trim()) return

    setIsProcessing(true)
    setLogs([])
    setActiveTab("logs")
    setResult(null)

    try {
      // Add initial log
      addLog("🤖 Analyzing instruction...", "system")

      const response = await executeTask(instruction, addLog)
      setResult(response)
      addLog("✅ Task completed successfully!", "system")
      setActiveTab("result")
    } catch (error) {
      addLog(`❌ Error: ${error instanceof Error ? error.message : String(error)}`, "error")
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }

  const addLog = (message: string, type: "browser" | "terminal" | "file" | "system" | "error" = "system") => {
    setLogs((prev) => [...prev, `${type}:${message}`])
  }

  const getLogClass = (log: string) => {
    const type = log.split(":", 1)[0]
    switch (type) {
      case "browser":
        return "log-entry-browser"
      case "terminal":
        return "log-entry-terminal"
      case "file":
        return "log-entry-file"
      case "error":
        return "log-entry-error"
      default:
        return "log-entry-system"
    }
  }

  const getLogMessage = (log: string) => {
    const colonIndex = log.indexOf(":")
    return colonIndex > -1 ? log.substring(colonIndex + 1) : log
  }

  const sampleInstructions = [
    "Find the top 5 AI headlines and save to a file",
    "Search for smartphone reviews, extract pros/cons, create summary",
    "Research renewable energy trends and create a report",
  ]

  return (
    <main className="container mx-auto p-4 max-w-5xl">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <Brain className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          <h1 className="text-3xl font-bold gradient-text">Autonomous AI Agent</h1>
        </div>
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
      </div>

      <Card className="mb-8 glass-card shadow-lg border-2 border-blue-100 dark:border-blue-900/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span>What would you like me to do?</span>
          </CardTitle>
          <CardDescription>
            Provide a natural language instruction, and I'll execute it across browser, terminal, and file system
            environments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Enter your instruction (e.g., 'Find the top 5 AI headlines and save them to a file')"
            className="min-h-[100px] text-base border-2 focus:border-blue-400 dark:focus:border-blue-500"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            disabled={isProcessing}
          />

          {!instruction && (
            <div className="mt-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Try one of these examples:</p>
              <div className="flex flex-wrap gap-2">
                {sampleInstructions.map((sample, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setInstruction(sample)}
                    className="text-xs bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    {sample}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between pt-2">
          <div className="flex gap-2">
            <Badge variant="outline" className="environment-badge environment-badge-browser">
              <Globe className="h-3 w-3" />
              Browser
            </Badge>
            <Badge variant="outline" className="environment-badge environment-badge-terminal">
              <Terminal className="h-3 w-3" />
              Terminal
            </Badge>
            <Badge variant="outline" className="environment-badge environment-badge-file">
              <FileText className="h-3 w-3" />
              File System
            </Badge>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={isProcessing || !instruction.trim()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Execute Task"
            )}
          </Button>
        </CardFooter>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-fade-in">
        <TabsList className="grid w-full grid-cols-3 mb-4 bg-blue-50 dark:bg-slate-800">
          <TabsTrigger
            value="instruction"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700"
          >
            Instruction
          </TabsTrigger>
          <TabsTrigger value="logs" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
            Execution Logs
          </TabsTrigger>
          <TabsTrigger value="result" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
            Result
          </TabsTrigger>
        </TabsList>

        <TabsContent value="instruction" className="mt-0">
          <Card className="glass-card shadow-md border-blue-100 dark:border-blue-900/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Task Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{instruction || "No instruction provided yet."}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="mt-0">
          <Card className="glass-card shadow-md border-blue-100 dark:border-blue-900/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Execution Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="log-container">
                {logs.length > 0 ? (
                  logs.map((log, index) => (
                    <div key={index} className={`log-entry ${getLogClass(log)}`}>
                      {getLogMessage(log)}
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground p-4 text-center">No logs yet. Execute a task to see logs.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="result" className="mt-0">
          <Card className="glass-card shadow-md border-blue-100 dark:border-blue-900/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Task Result
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result ? (
                <ReportViewer report={result} />
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <FileText className="h-16 w-16 text-slate-300 dark:text-slate-600 mb-4" />
                  <p className="text-muted-foreground">No results yet. Execute a task to see results.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}

