import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"
import { browserModule } from "./modules/browser"
import { terminalModule } from "./modules/terminal"
import { fileSystemModule } from "./modules/file-system"

// Define the task plan schema
const TaskPlanSchema = z.object({
  title: z.string(),
  description: z.string(),
  environments: z.array(z.enum(["browser", "terminal", "file system"])),
  steps: z.array(
    z.object({
      id: z.string(),
      description: z.string(),
      environment: z.enum(["browser", "terminal", "file system"]),
      action: z.string(),
      inputs: z.record(z.any()).optional(),
      dependsOn: z.array(z.string()).optional(),
    }),
  ),
})

type TaskPlan = z.infer<typeof TaskPlanSchema>

// Define the report schema
const ReportSchema = z.object({
  title: z.string(),
  summary: z.string(),
  environments: z.array(z.string()),
  data: z.any(),
  timestamp: z.string(),
  filePath: z.string().optional(),
})

type Report = z.infer<typeof ReportSchema>

/**
 * Main function to execute a task based on natural language instruction
 */
export async function executeTask(
  instruction: string,
  logCallback: (message: string, type?: string) => void,
): Promise<Report> {
  // Step 1: Generate a task plan using AI
  logCallback("🧠 Generating task plan...", "system")
  const taskPlan = await generateTaskPlan(instruction)
  logCallback(`📋 Task plan created: ${taskPlan.title}`, "system")
  logCallback(`🔍 Identified environments: ${taskPlan.environments.join(", ")}`, "system")

  // Step 2: Execute each step in the plan
  const results: Record<string, any> = {}
  const completedSteps: Set<string> = new Set()

  // Keep track of steps that are ready to execute (all dependencies satisfied)
  const readySteps = taskPlan.steps.filter((step) => !step.dependsOn || step.dependsOn.length === 0)
  const pendingSteps = taskPlan.steps.filter((step) => step.dependsOn && step.dependsOn.length > 0)

  while (readySteps.length > 0) {
    const currentStep = readySteps.shift()!

    logCallback(`🔄 Executing step: ${currentStep.description}`, currentStep.environment)

    try {
      // Execute the step based on its environment
      let result
      switch (currentStep.environment) {
        case "browser":
          result = await browserModule.execute(currentStep.action, currentStep.inputs || {}, (msg) =>
            logCallback(msg, "browser"),
          )
          break
        case "terminal":
          result = await terminalModule.execute(currentStep.action, currentStep.inputs || {}, (msg) =>
            logCallback(msg, "terminal"),
          )
          break
        case "file system":
          result = await fileSystemModule.execute(currentStep.action, currentStep.inputs || {}, (msg) =>
            logCallback(msg, "file"),
          )
          break
      }

      // Store the result
      results[currentStep.id] = result
      completedSteps.add(currentStep.id)

      logCallback(`✅ Completed step: ${currentStep.description}`, currentStep.environment)

      // Check if any pending steps can now be executed
      const newReadySteps = []
      for (let i = pendingSteps.length - 1; i >= 0; i--) {
        const step = pendingSteps[i]
        const dependencies = step.dependsOn || []

        if (dependencies.every((dep) => completedSteps.has(dep))) {
          // All dependencies are satisfied, move to ready steps
          newReadySteps.push(step)
          pendingSteps.splice(i, 1)
        }
      }

      // Add newly ready steps to the queue
      readySteps.push(...newReadySteps)
    } catch (error) {
      logCallback(
        `❌ Error in step "${currentStep.description}": ${error instanceof Error ? error.message : String(error)}`,
        "error",
      )
      throw new Error(
        `Failed to execute step "${currentStep.description}": ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  // Check if all steps were completed
  if (pendingSteps.length > 0) {
    const unfinishedSteps = pendingSteps.map((step) => step.description).join(", ")
    logCallback(`⚠️ Some steps could not be completed: ${unfinishedSteps}`, "error")
    throw new Error(`Task execution incomplete. Unfinished steps: ${unfinishedSteps}`)
  }

  // Step 3: Generate a report
  logCallback("📊 Generating final report...", "system")
  const report = await generateReport(taskPlan, results)

  return report
}

/**
 * Generate a structured task plan from a natural language instruction
 */
async function generateTaskPlan(instruction: string): Promise<TaskPlan> {
  const { object: taskPlan } = await generateObject({
    model: openai("gpt-4o"),
    schema: TaskPlanSchema,
    system: `You are an AI task planner that breaks down natural language instructions into structured plans.
    Your task is to analyze the user's instruction and create a detailed execution plan that:
    1. Identifies which environments (browser, terminal, file system) are needed
    2. Breaks down the task into sequential steps
    3. Specifies dependencies between steps
    4. Provides clear actions for each step
    
    For browser actions, consider: navigation, search, data extraction
    For terminal actions, consider: running commands, processing data
    For file system actions, consider: reading, writing, organizing files
    
    Be specific about the actions and include any necessary inputs.`,
    prompt: `Create a detailed execution plan for the following instruction: "${instruction}"`,
    maxTokens: 2000,
  })

  return taskPlan
}

/**
 * Generate a final report based on the task plan and execution results
 */
async function generateReport(taskPlan: TaskPlan, results: Record<string, any>): Promise<Report> {
  const { object: report } = await generateObject({
    model: openai("gpt-4o"),
    schema: ReportSchema,
    system: `You are an AI report generator that creates professional summaries of completed tasks.
    Your task is to analyze the execution results and create a concise, well-structured report that:
    1. Summarizes what was accomplished
    2. Highlights key findings or data
    3. Presents the information in a clear, professional manner
    
    Focus on being informative and concise.`,
    prompt: `Create a professional report for the completed task:
    
    Task Title: ${taskPlan.title}
    Task Description: ${taskPlan.description}
    Environments Used: ${taskPlan.environments.join(", ")}
    
    Execution Results:
    ${JSON.stringify(results, null, 2)}`,
    maxTokens: 2000,
  })

  // Add timestamp
  return {
    ...report,
    timestamp: new Date().toISOString(),
  }
}

