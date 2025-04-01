import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Terminal, Globe, Calendar, CheckCircle } from "lucide-react"

interface ReportProps {
  report: {
    title: string
    summary: string
    environments: string[]
    data: any
    timestamp: string
    filePath?: string
  }
}

export function ReportViewer({ report }: ReportProps) {
  const getEnvironmentIcon = (env: string) => {
    switch (env.toLowerCase()) {
      case "browser":
        return <Globe className="h-4 w-4" />
      case "terminal":
        return <Terminal className="h-4 w-4" />
      case "file system":
        return <FileText className="h-4 w-4" />
      default:
        return null
    }
  }

  const getEnvironmentClass = (env: string) => {
    switch (env.toLowerCase()) {
      case "browser":
        return "environment-badge-browser"
      case "terminal":
        return "environment-badge-terminal"
      case "file system":
        return "environment-badge-file"
      default:
        return ""
    }
  }

  const renderData = (data: any) => {
    if (Array.isArray(data)) {
      return (
        <ul className="list-disc pl-5 space-y-2">
          {data.map((item, index) => (
            <li key={index} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
              {typeof item === "object" ? renderData(item) : item}
            </li>
          ))}
        </ul>
      )
    } else if (typeof data === "object" && data !== null) {
      return (
        <div className="space-y-4">
          {Object.entries(data).map(([key, value], index) => (
            <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
              <h4 className="font-medium text-blue-700 dark:text-blue-400 mb-2">{key}</h4>
              <div className="pl-4 bg-white dark:bg-slate-800 p-3 rounded-md border border-slate-200 dark:border-slate-700">
                {renderData(value)}
              </div>
            </div>
          ))}
        </div>
      )
    } else {
      return <p>{String(data)}</p>
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="overflow-hidden border-2 border-blue-100 dark:border-blue-900/30 shadow-md">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-2"></div>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl gradient-text">{report.title}</CardTitle>
            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <Calendar className="h-3 w-3" />
              {new Date(report.timestamp).toLocaleString()}
            </div>
          </div>
          <div className="flex gap-2 mt-2 flex-wrap">
            {report.environments.map((env, index) => (
              <Badge key={index} variant="outline" className={`environment-badge ${getEnvironmentClass(env)}`}>
                {getEnvironmentIcon(env)}
                {env}
              </Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800/30">
              <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Summary
              </h3>
              <p className="text-slate-700 dark:text-slate-300">{report.summary}</p>
            </div>

            {report.filePath && (
              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-100 dark:border-amber-800/30">
                <h3 className="font-medium text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Output File
                </h3>
                <p className="text-sm font-mono bg-white dark:bg-slate-800 p-2 rounded border border-amber-200 dark:border-amber-800/50">
                  {report.filePath}
                </p>
              </div>
            )}

            <div>
              <h3 className="font-medium text-slate-800 dark:text-slate-200 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                Results
              </h3>
              <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                {renderData(report.data)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

